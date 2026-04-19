from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import Response
from fastapi.middleware.gzip import GZipMiddleware
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from starlette.middleware.cors import CORSMiddleware
import os
import logging
import asyncio
from pydantic import BaseModel, Field, EmailStr
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime

from email_service import email_service
from db import get_db, close_db
from payment_routes import payment_router
from auth_routes import auth_router, seed_admin
from admin_routes import admin_router
from product_routes import public_product_router, admin_product_router
from media_routes import public_media_router, admin_media_router, init_storage
from pricing_routes import public_pricing_router, admin_pricing_router


# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class StatusCheckCreate(BaseModel):
    client_name: str


class ContentSection(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    section_id: str
    content: str
    font_size: str
    font_family: str
    plain_text: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ContentSectionCreate(BaseModel):
    section_id: str
    content: str
    font_size: str
    font_family: str
    plain_text: str


@api_router.get("/")
async def root():
    return {"message": "Hello World"}


@api_router.get("/health")
async def health():
    """Health check endpoint — pings Mongo and returns status."""
    try:
        db = get_db()
        await db.command("ping")
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "degraded", "database": "disconnected", "error": str(e)}


@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    db = get_db()
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    await db.status_checks.insert_one(status_obj.dict())
    return status_obj


@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    db = get_db()
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**s) for s in status_checks]


@api_router.post("/content/{section_id}", response_model=ContentSection)
async def save_content_section(section_id: str, input: ContentSectionCreate):
    """PUBLIC legacy write — kept for backward compatibility. Prefer PUT /api/admin/content/{id}."""
    db = get_db()
    existing = await db.content_sections.find_one({"section_id": section_id})
    content_dict = input.dict()
    content_dict["section_id"] = section_id
    content_obj = ContentSection(**content_dict)
    if existing:
        await db.content_sections.update_one(
            {"section_id": section_id}, {"$set": content_obj.dict()}
        )
    else:
        await db.content_sections.insert_one(content_obj.dict())
    return content_obj


@api_router.get("/content/{section_id}")
async def get_content_section(section_id: str):
    db = get_db()
    content = await db.content_sections.find_one({"section_id": section_id}, {"_id": 0})
    return content  # may be None


@api_router.get("/content")
async def get_all_content():
    db = get_db()
    contents = await db.content_sections.find({}, {"_id": 0}).to_list(1000)
    return contents


# Email Models
class ContactFormData(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    subject: Optional[str] = None
    message: str
    company: Optional[str] = None
    urgency: Optional[str] = None
    budget: Optional[str] = None
    source: Optional[str] = None


class OrderItem(BaseModel):
    name: str
    quantity: int
    price: str
    specifications: Optional[Dict[str, Any]] = None


class ShippingAddress(BaseModel):
    address: str
    city: str
    state: str
    zip: str
    country: str


class OrderData(BaseModel):
    order_id: str
    customer_name: str
    customer_email: EmailStr
    customer_phone: Optional[str] = None
    shipping_address: ShippingAddress
    items: List[OrderItem]
    subtotal: str
    shipping: str
    tax: str
    total: str
    notes: Optional[str] = None


class ReviewData(BaseModel):
    productId: str
    productName: str
    rating: int
    title: str
    content: str
    author: str
    email: EmailStr
    timestamp: Optional[str] = None


class NewsletterSubscription(BaseModel):
    email: EmailStr
    source: Optional[str] = "website"
    subscribed_at: str


@api_router.post("/contact")
async def submit_contact_form(form_data: ContactFormData):
    db = get_db()
    try:
        contact_dict = form_data.dict()
        contact_dict["id"] = str(uuid.uuid4())
        contact_dict["timestamp"] = datetime.utcnow()
        await db.contact_submissions.insert_one(contact_dict)
        success = email_service.send_contact_form_notification(form_data.dict())
        if success:
            return {"status": "success", "message": "Contact form submitted successfully"}
        return {"status": "warning", "message": "Form submitted but email notification failed"}
    except Exception as e:
        logging.error(f"Error submitting contact form: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to submit contact form: {e}")


@api_router.post("/orders/notify")
async def notify_order(order_data: OrderData):
    db = get_db()
    try:
        order_dict = order_data.dict()
        order_dict["id"] = str(uuid.uuid4())
        order_dict["timestamp"] = datetime.utcnow()
        order_dict["status"] = "pending"
        await db.orders.insert_one(order_dict)
        business_email_success = email_service.send_order_notification(order_data.dict())
        customer_email_success = email_service.send_customer_confirmation(order_data.dict())
        if business_email_success and customer_email_success:
            return {
                "status": "success",
                "message": "Order saved and emails sent successfully",
                "order_id": order_data.order_id,
            }
        elif business_email_success:
            return {
                "status": "partial_success",
                "message": "Order saved, business notified, but customer confirmation failed",
                "order_id": order_data.order_id,
            }
        return {
            "status": "warning",
            "message": "Order saved but email notifications failed",
            "order_id": order_data.order_id,
        }
    except Exception as e:
        logging.error(f"Error processing order notification: {e}")
        raise HTTPException(status_code=500, detail="Failed to process order notification")


@api_router.post("/reviews")
async def submit_review(review_data: ReviewData):
    db = get_db()
    try:
        review_dict = review_data.dict()
        review_dict["id"] = str(uuid.uuid4())
        review_dict["status"] = "pending"  # requires admin approval before showing publicly
        review_dict["helpful"] = 0
        review_dict["verified"] = False
        review_dict["featured"] = False
        review_dict["date"] = datetime.now().strftime("%B %d, %Y")
        review_dict["created_at"] = datetime.now().isoformat()
        await db.reviews.insert_one(review_dict)
        return {"status": "success", "message": "Thank you for your review!"}
    except Exception as e:
        logging.error(f"Error submitting review: {e}")
        raise HTTPException(status_code=500, detail="Failed to submit review")


@api_router.get("/reviews/{product_id}")
async def get_product_reviews(product_id: str):
    db = get_db()
    try:
        reviews = await db.reviews.find(
            {"productId": product_id, "status": "approved"},
            {"_id": 0, "email": 0, "created_at": 0, "timestamp": 0, "status": 0},
        ).sort("created_at", -1).to_list(100)
        if reviews:
            avg = sum(r.get("rating", 0) for r in reviews) / len(reviews)
            return {"reviews": reviews, "averageRating": round(avg, 1), "totalReviews": len(reviews)}
        return {"reviews": [], "averageRating": 0, "totalReviews": 0}
    except Exception as e:
        logging.error(f"Error fetching reviews: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch reviews")


@api_router.post("/newsletter/subscribe")
async def subscribe_newsletter(subscription: NewsletterSubscription):
    db = get_db()
    try:
        existing = await db.newsletter_subscribers.find_one({"email": subscription.email})
        if existing:
            return {"status": "success", "message": "You're already subscribed!", "alreadySubscribed": True}
        sub_dict = subscription.dict()
        sub_dict["id"] = str(uuid.uuid4())
        sub_dict["status"] = "active"
        await db.newsletter_subscribers.insert_one(sub_dict)
        return {"status": "success", "message": "Successfully subscribed to newsletter"}
    except Exception as e:
        logging.error(f"Error subscribing to newsletter: {e}")
        raise HTTPException(status_code=500, detail="Failed to subscribe")


# Include all routers
app.include_router(api_router)
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(public_product_router)
app.include_router(admin_product_router)
app.include_router(public_media_router)
app.include_router(admin_media_router)
app.include_router(public_pricing_router)
app.include_router(admin_pricing_router)
app.include_router(payment_router)

# GZip
app.add_middleware(GZipMiddleware, minimum_size=1000)

# CORS — allow all origins (Netlify + preview environments)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=False,  # Bearer tokens, no cookies
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_cache_headers(request, call_next):
    response = await call_next(request)
    if request.url.path.startswith("/assets/"):
        response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
    elif any(ext in request.url.path for ext in [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".ico"]):
        response.headers["Cache-Control"] = "public, max-age=2592000"
    elif any(ext in request.url.path for ext in [".css", ".js", ".woff", ".woff2", ".ttf", ".eot"]):
        response.headers["Cache-Control"] = "public, max-age=604800"
    elif request.url.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    return response


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def on_startup():
    """Seed admin + indexes. Runs in background; failures don't block the app."""

    async def _bootstrap():
        try:
            db = get_db()
            await db.users.create_index("email", unique=True)
            await db.products.create_index("id", unique=True)
            await db.content_sections.create_index("section_id", unique=True)
            await db.media_files.create_index("id", unique=True)
            await db.stripe_events.create_index("id", unique=True)
            # Performance indexes for commerce + content collections
            await db.orders.create_index("order_id")
            await db.orders.create_index([("timestamp", -1)])
            await db.reviews.create_index([("productId", 1), ("status", 1)])
            await db.reviews.create_index([("created_at", -1)])
            await db.newsletter_subscribers.create_index("email", unique=True)
            await db.contact_submissions.create_index([("timestamp", -1)])
            await db.status_checks.create_index([("timestamp", -1)])
            await seed_admin()
            # Initialize Emergent object storage (non-blocking — media endpoints handle failure)
            init_storage()
            logger.info("Startup bootstrap complete")
        except Exception as e:
            logger.error(f"Startup bootstrap failed (app will still run): {e}")

    asyncio.create_task(_bootstrap())


@app.on_event("shutdown")
async def on_shutdown():
    close_db()
