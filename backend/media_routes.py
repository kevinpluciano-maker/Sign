"""
Media library — upload/list/soft-delete files via Emergent object storage.
Public download endpoint supports both Bearer JWT (for admin pages) and unsigned
public access when `is_public=True` was set on upload (for product images on the
storefront).
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Request, Response, Query
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import uuid
import os
import requests
import logging

from auth import require_admin
from db import get_db

logger = logging.getLogger(__name__)

STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "bsign"

_storage_key: Optional[str] = None

ALLOWED_MIME = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
}
MAX_BYTES = 10 * 1024 * 1024  # 10MB


def init_storage() -> Optional[str]:
    """Call once; returns session-scoped storage_key. Tolerant of failures."""
    global _storage_key
    if _storage_key:
        return _storage_key
    if not EMERGENT_KEY:
        logger.warning("EMERGENT_LLM_KEY not set — media uploads will fail")
        return None
    try:
        resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
        resp.raise_for_status()
        _storage_key = resp.json()["storage_key"]
        logger.info("Emergent object storage initialized")
        return _storage_key
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
        return None


def _put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    if not key:
        raise HTTPException(status_code=503, detail="Storage not available")
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data,
        timeout=120,
    )
    resp.raise_for_status()
    return resp.json()


def _get_object(path: str) -> tuple[bytes, str]:
    key = init_storage()
    if not key:
        raise HTTPException(status_code=503, detail="Storage not available")
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key},
        timeout=60,
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


# Public download — streams file content from storage.
public_media_router = APIRouter(prefix="/api/media", tags=["media"])


@public_media_router.get("/{file_id}")
async def serve_file(file_id: str):
    db = get_db()
    record = await db.media_files.find_one({"id": file_id, "is_deleted": False}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    try:
        data, _ = _get_object(record["storage_path"])
    except Exception as e:
        logger.error(f"Fetch failed for {file_id}: {e}")
        raise HTTPException(status_code=502, detail="Unable to fetch file")
    return Response(
        content=data,
        media_type=record.get("content_type", "application/octet-stream"),
        headers={"Cache-Control": "public, max-age=2592000"},
    )


# Admin media operations
admin_media_router = APIRouter(
    prefix="/api/admin/media", tags=["admin-media"], dependencies=[Depends(require_admin)]
)


class MediaMeta(BaseModel):
    id: str
    filename: str
    content_type: str
    size: int
    url: str
    created_at: str


@admin_media_router.post("/upload")
async def upload_file(request: Request, file: UploadFile = File(...)):
    db = get_db()
    content_type = file.content_type or "application/octet-stream"
    if content_type not in ALLOWED_MIME:
        raise HTTPException(status_code=400, detail=f"Unsupported type: {content_type}")
    data = await file.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="File too large (max 10MB)")

    ext = ALLOWED_MIME[content_type]
    file_id = str(uuid.uuid4())
    storage_path = f"{APP_NAME}/media/{file_id}.{ext}"
    result = _put_object(storage_path, data, content_type)

    record = {
        "id": file_id,
        "filename": file.filename or f"{file_id}.{ext}",
        "storage_path": result["path"],
        "content_type": content_type,
        "size": result.get("size", len(data)),
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.media_files.insert_one(record)

    # Public URL (no auth needed for <img src>)
    base = str(request.base_url).rstrip("/")
    return {
        "id": file_id,
        "filename": record["filename"],
        "content_type": content_type,
        "size": record["size"],
        "url": f"{base}/api/media/{file_id}",
        "created_at": record["created_at"],
    }


@admin_media_router.get("")
async def list_media(request: Request, limit: int = 200):
    db = get_db()
    items = (
        await db.media_files.find({"is_deleted": False}, {"_id": 0, "storage_path": 0})
        .sort("created_at", -1)
        .limit(limit)
        .to_list(limit)
    )
    base = str(request.base_url).rstrip("/")
    for it in items:
        it["url"] = f"{base}/api/media/{it['id']}"
    return {"files": items, "total": len(items)}


@admin_media_router.delete("/{file_id}")
async def delete_file(file_id: str):
    db = get_db()
    result = await db.media_files.update_one(
        {"id": file_id, "is_deleted": False}, {"$set": {"is_deleted": True}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="File not found")
    return {"status": "success", "id": file_id}


# ---- Rename ----

class MediaRename(BaseModel):
    filename: str


@admin_media_router.put("/{file_id}")
async def rename_file(file_id: str, body: MediaRename):
    """Rename a media file's display name. Storage path is unchanged so any
    embedded URLs keep working — only the filename users see is updated."""
    db = get_db()
    new_name = (body.filename or "").strip()
    if not new_name:
        raise HTTPException(status_code=400, detail="Filename required")
    # Simple safety: strip any path components
    new_name = new_name.replace("/", "").replace("\\", "")[:200]

    result = await db.media_files.update_one(
        {"id": file_id, "is_deleted": False},
        {"$set": {"filename": new_name, "updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="File not found")
    record = await db.media_files.find_one({"id": file_id}, {"_id": 0, "storage_path": 0})
    return {"status": "success", "file": record}


# ---- Replace (re-upload while keeping the same public URL / file_id) ----

@admin_media_router.post("/{file_id}/replace")
async def replace_file(file_id: str, request: Request, file: UploadFile = File(...)):
    """Swap the binary content of an existing media record. The file_id and the
    public URL (/api/media/{file_id}) stay the same, so everywhere it's used on
    the site updates automatically. Great for fixing a bad image without having
    to re-edit every product."""
    db = get_db()
    record = await db.media_files.find_one({"id": file_id, "is_deleted": False}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="File not found")

    content_type = file.content_type or "application/octet-stream"
    if content_type not in ALLOWED_MIME:
        raise HTTPException(status_code=400, detail=f"Unsupported type: {content_type}")
    data = await file.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="File too large (max 10MB)")

    ext = ALLOWED_MIME[content_type]
    storage_path = f"{APP_NAME}/media/{file_id}.{ext}"
    result = _put_object(storage_path, data, content_type)

    now = datetime.now(timezone.utc).isoformat()
    await db.media_files.update_one(
        {"id": file_id},
        {
            "$set": {
                "filename": file.filename or record.get("filename") or f"{file_id}.{ext}",
                "storage_path": result["path"],
                "content_type": content_type,
                "size": result.get("size", len(data)),
                "updated_at": now,
            }
        },
    )
    base = str(request.base_url).rstrip("/")
    return {
        "id": file_id,
        "filename": file.filename or record.get("filename"),
        "content_type": content_type,
        "size": result.get("size", len(data)),
        "url": f"{base}/api/media/{file_id}",
        "updated_at": now,
    }
