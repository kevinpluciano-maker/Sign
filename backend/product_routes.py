"""
Product routes — public (GET) + admin-protected (POST/PUT/DELETE).
Products are stored in MongoDB with flexible schema to support variations, galleries, etc.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid
import logging

from auth import require_admin
from db import get_db

logger = logging.getLogger(__name__)

public_product_router = APIRouter(prefix="/api/products", tags=["products"])
admin_product_router = APIRouter(
    prefix="/api/admin/products", tags=["admin-products"], dependencies=[Depends(require_admin)]
)


# ---- Models ----

class SizeOption(BaseModel):
    size: str
    price: str


class ProductBase(BaseModel):
    name: str
    price: str  # e.g. "from $58.00" or "$58.00"
    category: str
    description: str = ""
    image: str = ""
    images: List[str] = Field(default_factory=list)
    materials: List[str] = Field(default_factory=list)
    features: List[str] = Field(default_factory=list)
    size_options: List[SizeOption] = Field(default_factory=list)
    color_options: List[str] = Field(default_factory=list)
    braille_options: List[str] = Field(default_factory=list)
    badges: List[str] = Field(default_factory=list)
    rating: float = 5.0
    review_count: int = 0
    in_stock: bool = True
    published: bool = True
    featured: bool = False
    slug: Optional[str] = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None
    images: Optional[List[str]] = None
    materials: Optional[List[str]] = None
    features: Optional[List[str]] = None
    size_options: Optional[List[SizeOption]] = None
    color_options: Optional[List[str]] = None
    braille_options: Optional[List[str]] = None
    badges: Optional[List[str]] = None
    rating: Optional[float] = None
    review_count: Optional[int] = None
    in_stock: Optional[bool] = None
    published: Optional[bool] = None
    featured: Optional[bool] = None
    slug: Optional[str] = None


def _slugify(name: str) -> str:
    return "-".join(name.lower().split())[:80]


# ---- Public endpoints ----

@public_product_router.get("")
async def list_products(
    category: Optional[str] = None,
    featured_only: bool = False,
    limit: int = 500,
):
    """Public: returns all published products (optionally filtered by category)."""
    db = get_db()
    query: Dict[str, Any] = {"published": True}
    if category:
        query["category"] = category
    if featured_only:
        query["featured"] = True
    cursor = db.products.find(query, {"_id": 0}).sort("created_at", -1).limit(limit)
    items = await cursor.to_list(limit)
    return {"products": items, "total": len(items)}


@public_product_router.get("/{product_id}")
async def get_product(product_id: str):
    db = get_db()
    product = await db.products.find_one({"id": product_id, "published": True}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


# ---- Admin endpoints ----

@admin_product_router.get("")
async def admin_list_products():
    """Admin: lists ALL products including unpublished."""
    db = get_db()
    items = await db.products.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return {"products": items, "total": len(items)}


@admin_product_router.post("", status_code=201)
async def create_product(body: ProductCreate):
    db = get_db()
    now = datetime.now(timezone.utc).isoformat()
    doc = body.dict()
    doc["id"] = str(uuid.uuid4())
    doc["slug"] = doc.get("slug") or _slugify(doc["name"])
    doc["created_at"] = now
    doc["updated_at"] = now
    await db.products.insert_one(doc)
    doc.pop("_id", None)
    return doc


@admin_product_router.put("/{product_id}")
async def update_product(product_id: str, body: ProductUpdate):
    db = get_db()
    updates = {k: v for k, v in body.dict().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No updates provided")
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.products.update_one({"id": product_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    return product


@admin_product_router.delete("/{product_id}")
async def delete_product(product_id: str):
    db = get_db()
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"status": "success", "message": "Product deleted"}
