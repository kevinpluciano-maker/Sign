"""
Admin-protected routes: review moderation, content editing, settings.
All endpoints require Bearer JWT with role=admin.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import logging

from auth import require_admin
from db import get_db

logger = logging.getLogger(__name__)

admin_router = APIRouter(
    prefix="/api/admin", tags=["admin"], dependencies=[Depends(require_admin)]
)


# ---- Reviews ----

class ReviewCreate(BaseModel):
    product_id: str
    author: str
    rating: int = 5
    title: str = ""
    content: str
    status: str = "approved"   # admin-created reviews default to approved
    featured: bool = False
    verified: bool = False


class ReviewUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    rating: Optional[int] = None
    author: Optional[str] = None
    featured: Optional[bool] = None
    status: Optional[str] = None  # approved | pending | hidden


@admin_router.get("/reviews")
async def list_reviews():
    db = get_db()
    reviews = await db.reviews.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return {"reviews": reviews, "total": len(reviews)}


@admin_router.post("/reviews", status_code=201)
async def create_review_admin(body: ReviewCreate):
    """Admin-only manual review creation.
    Unlike the public endpoint, these default to `approved` and can be featured
    immediately — mirrors Shopify's 'add testimonial' flow."""
    import uuid as _uuid
    db = get_db()
    now = datetime.now(timezone.utc).isoformat()
    # Clamp rating
    rating = max(1, min(5, int(body.rating if body.rating is not None else 5)))
    status = body.status if body.status in ("approved", "pending", "hidden") else "approved"
    doc = {
        "id": str(_uuid.uuid4()),
        "productId": body.product_id,
        "author": (body.author or "Anonymous").strip() or "Anonymous",
        "rating": rating,
        "title": (body.title or "").strip(),
        "content": (body.content or "").strip(),
        "status": status,
        "featured": bool(body.featured),
        "verified": bool(body.verified),
        "helpful": 0,
        "created_at": now,
        "date": now,
    }
    await db.reviews.insert_one(doc)
    doc.pop("_id", None)
    return doc


@admin_router.put("/reviews/{review_id}")
async def update_review(review_id: str, body: ReviewUpdate):
    db = get_db()
    updates = {k: v for k, v in body.dict().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No updates provided")
    result = await db.reviews.update_one({"id": review_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Review not found")
    return {"status": "success"}


@admin_router.delete("/reviews/{review_id}")
async def delete_review(review_id: str):
    db = get_db()
    result = await db.reviews.delete_one({"id": review_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Review not found")
    return {"status": "success"}


# ---- Content (protected write) ----

class ContentUpdate(BaseModel):
    content: str
    font_size: Optional[str] = "16px"
    font_family: Optional[str] = "Inter"
    plain_text: Optional[str] = ""


@admin_router.put("/content/{section_id}")
async def save_content(section_id: str, body: ContentUpdate):
    db = get_db()
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "section_id": section_id,
        "content": body.content,
        "font_size": body.font_size,
        "font_family": body.font_family,
        "plain_text": body.plain_text,
        "updated_at": now,
    }
    await db.content_sections.update_one(
        {"section_id": section_id}, {"$set": doc, "$setOnInsert": {"created_at": now}}, upsert=True
    )
    return {"status": "success", "section_id": section_id}


@admin_router.get("/content")
async def list_all_content():
    db = get_db()
    items = await db.content_sections.find({}, {"_id": 0}).to_list(500)
    return {"sections": items, "total": len(items)}


@admin_router.delete("/content/{section_id}")
async def delete_content_section(section_id: str):
    """Remove a CMS section entirely. Used by the dynamic section manager
    so admins can delete sections they previously added."""
    db = get_db()
    result = await db.content_sections.delete_one({"section_id": section_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Section not found")
    return {"status": "success", "section_id": section_id}


# ---- Orders read-only dashboard ----

@admin_router.get("/orders")
async def list_orders(limit: int = 100):
    db = get_db()
    items = (
        await db.orders.find({}, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(limit)
    )
    return {"orders": items, "total": len(items)}


# ---- Stats overview ----

@admin_router.get("/stats")
async def get_stats():
    db = get_db()
    stats = {
        "products": await db.products.count_documents({}),
        "reviews": await db.reviews.count_documents({}),
        "orders": await db.orders.count_documents({}),
        "newsletter_subscribers": await db.newsletter_subscribers.count_documents({}),
        "contact_submissions": await db.contact_submissions.count_documents({}),
    }
    return stats
