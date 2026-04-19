"""
Lazy MongoDB connection. Startup doesn't crash if Atlas is temporarily unreachable.
"""
import os
import logging
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import Optional

logger = logging.getLogger(__name__)

_client: Optional[AsyncIOMotorClient] = None
_db: Optional[AsyncIOMotorDatabase] = None


def get_db() -> AsyncIOMotorDatabase:
    """Returns the active database handle. Creates connection lazily on first call."""
    global _client, _db
    if _db is not None:
        return _db

    mongo_url = os.environ.get("MONGO_URL")
    db_name = os.environ.get("DB_NAME")
    if not mongo_url or not db_name:
        raise RuntimeError("MONGO_URL or DB_NAME not set in environment")

    _client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
    _db = _client[db_name]
    logger.info(f"Mongo client initialized for database: {db_name}")
    return _db


def close_db():
    global _client
    if _client is not None:
        _client.close()
        _client = None
