from collections import defaultdict
from datetime import datetime, timezone
import asyncio
from fastapi import HTTPException, Request
from app.core.config import settings

# Simple in-memory rate limiter
_request_counts: dict = defaultdict(list)
_lock = asyncio.Lock()


async def check_rate_limit(user_id: str):
    async with _lock:
        now = datetime.now(timezone.utc).timestamp()
        window_start = now - settings.RATE_LIMIT_WINDOW
        # Clean old requests
        _request_counts[user_id] = [
            t for t in _request_counts[user_id] if t > window_start
        ]
        if len(_request_counts[user_id]) >= settings.RATE_LIMIT_REQUESTS:
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded. Max {settings.RATE_LIMIT_REQUESTS} requests per {settings.RATE_LIMIT_WINDOW}s.",
            )
        _request_counts[user_id].append(now)
