from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import Response
from fastapi.middleware.gzip import GZipMiddleware
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime
from email_service import email_service
from payment_routes import payment_router


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

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

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

@api_router.post("/content/{section_id}", response_model=ContentSection)
async def save_content_section(section_id: str, input: ContentSectionCreate):
    # Check if section already exists
    existing = await db.content_sections.find_one({"section_id": section_id})
    
    content_dict = input.dict()
    content_dict["section_id"] = section_id
    content_obj = ContentSection(**content_dict)
    
    if existing:
        # Update existing section
        await db.content_sections.update_one(
            {"section_id": section_id},
            {"$set": content_obj.dict()}
        )
    else:
        # Insert new section
        await db.content_sections.insert_one(content_obj.dict())
    
    return content_obj

@api_router.get("/content/{section_id}", response_model=ContentSection)
async def get_content_section(section_id: str):
    content = await db.content_sections.find_one({"section_id": section_id})
    if content:
        return ContentSection(**content)
    return None

@api_router.get("/content", response_model=List[ContentSection])
async def get_all_content():
    contents = await db.content_sections.find().to_list(1000)
    return [ContentSection(**content) for content in contents]


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
    source: Optional[str] = 'website'
    subscribed_at: str

# Email Endpoints
@api_router.post("/contact")
async def submit_contact_form(form_data: ContactFormData):
    """Handle contact form submissions and send email notification"""
    try:
        print(f"📨 Contact form submission received from: {form_data.name}")
        print(f"📧 Email: {form_data.email}")
        
        # Save to database
        contact_dict = form_data.dict()
        contact_dict['id'] = str(uuid.uuid4())
        contact_dict['timestamp'] = datetime.utcnow()
        await db.contact_submissions.insert_one(contact_dict)
        print(f"✅ Saved to database")
        
        # Send email notification
        success = email_service.send_contact_form_notification(form_data.dict())
        print(f"📧 Email notification: {'Success' if success else 'Failed'}")
        
        if success:
            return {"status": "success", "message": "Contact form submitted successfully"}
        else:
            return {"status": "warning", "message": "Form submitted but email notification failed"}
    except Exception as e:
        logging.error(f"❌ Error submitting contact form: {str(e)}")
        print(f"❌ Full error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to submit contact form: {str(e)}")

@api_router.post("/orders/notify")
async def notify_order(order_data: OrderData):
    """Send email notification for new orders"""
    try:
        # Save order to database
        order_dict = order_data.dict()
        order_dict['id'] = str(uuid.uuid4())
        order_dict['timestamp'] = datetime.utcnow()
        order_dict['status'] = 'pending'
        await db.orders.insert_one(order_dict)
        
        # Send email notification to business
        business_email_success = email_service.send_order_notification(order_data.dict())
        
        # Send confirmation email to customer
        customer_email_success = email_service.send_customer_confirmation(order_data.dict())
        
        if business_email_success and customer_email_success:
            return {
                "status": "success", 
                "message": "Order saved and emails sent successfully", 
                "order_id": order_data.order_id
            }
        elif business_email_success:
            return {
                "status": "partial_success", 
                "message": "Order saved, business notified, but customer confirmation failed", 
                "order_id": order_data.order_id
            }
        else:
            return {
                "status": "warning", 
                "message": "Order saved but email notifications failed", 
                "order_id": order_data.order_id
            }
    except Exception as e:
        logging.error(f"Error processing order notification: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process order notification")

@api_router.post("/reviews")
async def submit_review(review_data: ReviewData):
    """Handle product review submissions"""
    try:
        # Save to database
        review_dict = review_data.dict()
        review_dict['id'] = str(uuid.uuid4())
        review_dict['status'] = 'approved'  # Auto-approve reviews
        review_dict['helpful'] = 0
        review_dict['verified'] = False
        review_dict['date'] = datetime.now().strftime("%B %d, %Y")
        review_dict['created_at'] = datetime.now().isoformat()
        await db.reviews.insert_one(review_dict)
        
        return {"status": "success", "message": "Thank you for your review!"}
    except Exception as e:
        logging.error(f"Error submitting review: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to submit review")

@api_router.get("/reviews/{product_id}")
async def get_product_reviews(product_id: str):
    """Get reviews for a product"""
    try:
        reviews = await db.reviews.find(
            {"productId": product_id},
            {"_id": 0, "email": 0, "created_at": 0, "timestamp": 0, "status": 0}  # Exclude private fields
        ).sort("created_at", -1).to_list(100)
        
        # Calculate average rating
        if reviews:
            avg_rating = sum(r.get('rating', 0) for r in reviews) / len(reviews)
            return {
                "reviews": reviews,
                "averageRating": round(avg_rating, 1),
                "totalReviews": len(reviews)
            }
        else:
            return {
                "reviews": [],
                "averageRating": 0,
                "totalReviews": 0
            }
    except Exception as e:
        logging.error(f"Error fetching reviews: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch reviews")

@api_router.post("/newsletter/subscribe")
async def subscribe_newsletter(subscription: NewsletterSubscription):
    """Handle newsletter subscriptions"""
    try:
        # Check if already subscribed
        existing = await db.newsletter_subscribers.find_one({"email": subscription.email})
        
        if existing:
            return {"status": "success", "message": "You're already subscribed!", "alreadySubscribed": True}
        
        # Save to database
        sub_dict = subscription.dict()
        sub_dict['id'] = str(uuid.uuid4())
        sub_dict['status'] = 'active'
        await db.newsletter_subscribers.insert_one(sub_dict)
        
        # Send welcome email (optional)
        # email_service.send_welcome_email(subscription.email)
        
        return {"status": "success", "message": "Successfully subscribed to newsletter"}
    except Exception as e:
        logging.error(f"Error subscribing to newsletter: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to subscribe")


# Include the router in the main app
app.include_router(api_router)
app.include_router(payment_router)

# Add GZip compression middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Add CORS middleware - Allow all origins for preview environment
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],  # Allow all origins for Emergent preview
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add caching headers for static assets
@app.middleware("http")
async def add_cache_headers(request, call_next):
    response = await call_next(request)
    
    # Cache static assets for 1 year
    if request.url.path.startswith('/assets/'):
        response.headers['Cache-Control'] = 'public, max-age=31536000, immutable'
    # Cache images for 30 days
    elif any(ext in request.url.path for ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico']):
        response.headers['Cache-Control'] = 'public, max-age=2592000'
    # Cache other static files for 1 week
    elif any(ext in request.url.path for ext in ['.css', '.js', '.woff', '.woff2', '.ttf', '.eot']):
        response.headers['Cache-Control'] = 'public, max-age=604800'
    # Don't cache API responses
    elif request.url.path.startswith('/api/'):
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
    
    return response

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
