"""
Pricing rules — global % adjustment + promo codes.
Single settings document stored in `pricing_settings` collection.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone
import logging

from auth import require_admin
from db import get_db

logger = logging.getLogger(__name__)


# ---- Models ----

class PromoCode(BaseModel):
    code: str
    discount_percent: float = Field(ge=0, le=100)
    active: bool = True
    description: Optional[str] = ""


class PricingSettings(BaseModel):
    global_adjustment_percent: float = 0.0  # e.g. +15 or -10
    promos: List[PromoCode] = Field(default_factory=list)
    promo_banner_text: Optional[str] = ""
    promo_banner_active: bool = False


DEFAULT_SETTINGS = {
    "id": "global",
    "global_adjustment_percent": 0.0,
    "promos": [],
    "promo_banner_text": "",
    "promo_banner_active": False,
    "updated_at": None,
}


# ---- Public (read-only) ----

public_pricing_router = APIRouter(prefix="/api/pricing", tags=["pricing"])


@public_pricing_router.get("")
async def get_pricing_public():
    """Public read — storefront needs to know about active promo banner + global % adjustment."""
    db = get_db()
    doc = await db.pricing_settings.find_one({"id": "global"}, {"_id": 0})
    if not doc:
        return DEFAULT_SETTINGS
    # Hide inactive promos from public
    doc["promos"] = [p for p in doc.get("promos", []) if p.get("active")]
    return doc


# ---- Admin ----

admin_pricing_router = APIRouter(
    prefix="/api/admin/pricing", tags=["admin-pricing"], dependencies=[Depends(require_admin)]
)


@admin_pricing_router.get("")
async def get_pricing_admin():
    db = get_db()
    doc = await db.pricing_settings.find_one({"id": "global"}, {"_id": 0})
    if not doc:
        return DEFAULT_SETTINGS
    return doc


@admin_pricing_router.put("")
async def update_pricing(body: PricingSettings):
    db = get_db()
    payload = body.dict()
    payload["id"] = "global"
    payload["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.pricing_settings.update_one({"id": "global"}, {"$set": payload}, upsert=True)
    return payload
