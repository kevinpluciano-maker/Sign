"""
Auth endpoints: login, me.
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, EmailStr
from datetime import datetime, timezone
import os
import logging

from auth import (
    hash_password,
    verify_password,
    create_access_token,
    require_admin,
)
from db import get_db

logger = logging.getLogger(__name__)

auth_router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    token: str
    user: dict


@auth_router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest):
    db = get_db()
    email = body.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(
        user_id=user["id"], email=user["email"], role=user.get("role", "user")
    )
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user.get("name", ""),
            "role": user.get("role", "user"),
        },
    }


@auth_router.get("/me")
async def me(payload: dict = Depends(require_admin)):
    """Return current admin user details from token."""
    db = get_db()
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


async def seed_admin():
    """Idempotently seed admin user from env on startup."""
    db = get_db()
    admin_email = os.environ.get("ADMIN_EMAIL", "").lower().strip()
    admin_password = os.environ.get("ADMIN_PASSWORD", "")
    if not admin_email or not admin_password:
        logger.warning("ADMIN_EMAIL or ADMIN_PASSWORD not set — skipping seed")
        return

    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        import uuid
        await db.users.insert_one(
            {
                "id": str(uuid.uuid4()),
                "email": admin_email,
                "password_hash": hash_password(admin_password),
                "name": "Admin",
                "role": "admin",
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        logger.info(f"Seeded admin user: {admin_email}")
    else:
        # Update password if it changed in env (and ensure role=admin)
        updates = {}
        if not verify_password(admin_password, existing.get("password_hash", "")):
            updates["password_hash"] = hash_password(admin_password)
        if existing.get("role") != "admin":
            updates["role"] = "admin"
        if updates:
            await db.users.update_one({"email": admin_email}, {"$set": updates})
            logger.info(f"Updated admin user: {admin_email}")
