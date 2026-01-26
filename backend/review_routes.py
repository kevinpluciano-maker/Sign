from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone
from uuid import uuid4
import os
from motor.motor_asyncio import AsyncIOMotorClient

router = APIRouter(prefix="/api/reviews", tags=["reviews"])

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "bsign_store")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

class ReviewCreate(BaseModel):
    product_id: str = Field(..., alias="productId")
    product_name: str = Field(..., alias="productName")
    author: str
    email: str
    rating: int = Field(..., ge=1, le=5)
    title: str
    content: str
    
    class Config:
        populate_by_name = True

class ReviewResponse(BaseModel):
    id: str
    product_id: str
    product_name: str
    author: str
    rating: int
    title: str
    content: str
    date: str
    verified: bool
    helpful: int

class ReviewStats(BaseModel):
    average_rating: float
    total_reviews: int
    reviews: List[ReviewResponse]

@router.post("", response_model=dict)
async def create_review(review: ReviewCreate):
    """Submit a new product review"""
    try:
        review_doc = {
            "id": str(uuid4()),
            "product_id": review.product_id,
            "product_name": review.product_name,
            "author": review.author,
            "email": review.email,  # Store but don't return publicly
            "rating": review.rating,
            "title": review.title,
            "content": review.content,
            "date": datetime.now(timezone.utc).strftime("%B %d, %Y"),
            "verified": False,  # Can be set to True after purchase verification
            "helpful": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.reviews.insert_one(review_doc)
        
        return {
            "success": True,
            "message": "Review submitted successfully! Thank you for your feedback."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{product_id}", response_model=ReviewStats)
async def get_product_reviews(product_id: str):
    """Get all reviews for a product"""
    try:
        # Fetch reviews for this product, excluding email and _id
        reviews_cursor = db.reviews.find(
            {"product_id": product_id},
            {"_id": 0, "email": 0, "created_at": 0}
        ).sort("created_at", -1)
        
        reviews = await reviews_cursor.to_list(100)
        
        # Calculate average rating
        if reviews:
            total_rating = sum(r["rating"] for r in reviews)
            average_rating = total_rating / len(reviews)
        else:
            average_rating = 0
        
        # Format reviews for response
        formatted_reviews = [
            ReviewResponse(
                id=r["id"],
                product_id=r["product_id"],
                product_name=r["product_name"],
                author=r["author"],
                rating=r["rating"],
                title=r["title"],
                content=r["content"],
                date=r["date"],
                verified=r.get("verified", False),
                helpful=r.get("helpful", 0)
            )
            for r in reviews
        ]
        
        return ReviewStats(
            average_rating=round(average_rating, 1),
            total_reviews=len(reviews),
            reviews=formatted_reviews
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{review_id}/helpful")
async def mark_helpful(review_id: str):
    """Mark a review as helpful"""
    try:
        result = await db.reviews.update_one(
            {"id": review_id},
            {"$inc": {"helpful": 1}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Review not found")
        
        return {"success": True, "message": "Marked as helpful"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
