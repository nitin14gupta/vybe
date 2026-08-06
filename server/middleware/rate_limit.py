import os
import time
from collections import deque
from threading import Lock

from fastapi import HTTPException, Request, status

_REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

_redis_client = None
_redis_broken = False


def _get_redis():
    """Lazily connects to Redis; falls back to None (in-process limiting) if
    unreachable, mirroring the resilience pattern already used for chat's
    pub/sub in routes/chat.py."""
    global _redis_client, _redis_broken
    if _redis_broken:
        return None
    if _redis_client is None:
        try:
            import redis as redis_sync
            client = redis_sync.Redis.from_url(
                _REDIS_URL, decode_responses=True,
                socket_connect_timeout=1, socket_timeout=1,
            )
            client.ping()
            _redis_client = client
        except Exception as e:
            print(f"[RATE_LIMIT] Redis unavailable, falling back to in-process limiting: {e!r}", flush=True)
            _redis_broken = True
            return None
    return _redis_client


class _InMemoryWindow:
    """Per-process fixed-window fallback — only used when Redis is unreachable.
    Not shared across workers, same tradeoff chat.py's RateLimiter accepts."""

    def __init__(self):
        self._buckets: dict[str, deque] = {}
        self._lock = Lock()

    def hit(self, key: str, window_seconds: float) -> int:
        now = time.monotonic()
        with self._lock:
            bucket = self._buckets.setdefault(key, deque())
            while bucket and now - bucket[0] > window_seconds:
                bucket.popleft()
            bucket.append(now)
            return len(bucket)


_fallback = _InMemoryWindow()


def _hit_count(key: str, window_seconds: int) -> int:
    """Increments the counter for `key` and returns the count within the window."""
    client = _get_redis()
    if client is not None:
        try:
            count = client.incr(key)
            if count == 1:
                client.expire(key, window_seconds)
            return int(count)
        except Exception as e:
            print(f"[RATE_LIMIT] Redis error on this call, falling back: {e!r}", flush=True)
    return _fallback.hit(key, window_seconds)


def enforce_rate_limit(
    key: str,
    max_events: int,
    window_seconds: int,
    message: str = "Too many requests, please try again later.",
) -> None:
    """Raises 429 once `key` has been hit more than `max_events` times within
    `window_seconds`. Callers pick the key — e.g. a phone number, an admin
    email, a user id, or a client IP — depending on what's being protected."""
    count = _hit_count(key, window_seconds)
    if count > max_events:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=message,
            headers={"Retry-After": str(window_seconds)},
        )


def client_ip(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else "unknown"
