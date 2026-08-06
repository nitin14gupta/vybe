import asyncio
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from middleware.security_headers import SecurityHeadersMiddleware
from middleware.request_id import RequestIDMiddleware
from routes.auth import router as auth_router
from routes.users import router as users_router
from routes.upload import router as upload_router
from routes.places import router as places_router
from routes.vibes import router as vibes_router
from routes.events import router as events_router
from routes.chat import router as chat_router
from routes.notifications import router as notifications_router
from routes.devices import router as devices_router
from routes.wallet import router as wallet_router
from routes.payments import router as payments_router
from routes.misc import router as misc_router
from routes.wellknown import router as wellknown_router
from routes.admin_auth import router as admin_auth_router
from routes.admin_users import router as admin_users_router
from routes.admin_feedback import router as admin_feedback_router
from routes.admin_wallet import router as admin_wallet_router
from routes.admin_events import router as admin_events_router
from routes.admin_reports import router as admin_reports_router
from routes.admin_dashboard import router as admin_dashboard_router
from routes.admin_revenue import router as admin_revenue_router
from routes.admin_audit_log import router as admin_audit_log_router
from utils.account_purge import purge_expired_deleted_accounts

# Comma-separated list of extra origins allowed to call this API — the admin
# web panel's dev/prod origin(s), e.g. "http://localhost:3000,https://admin.gorave.com"
ADMIN_ORIGINS = [o.strip() for o in os.getenv("ADMIN_ORIGINS", "").split(",") if o.strip()]

PURGE_INTERVAL_SECONDS = 24 * 60 * 60


async def _account_purge_loop():
    """Runs once at startup, then every 24h — hard-deletes accounts whose
    30-day soft-delete recovery window has elapsed. See utils/account_purge.py."""
    while True:
        try:
            count = await asyncio.to_thread(purge_expired_deleted_accounts)
            if count:
                print(f"[PURGE] Purged {count} expired deleted account(s)", flush=True)
        except Exception as e:
            print(f"[PURGE] Account purge run failed: {e}", flush=True)
        await asyncio.sleep(PURGE_INTERVAL_SECONDS)


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(_account_purge_loop())
    yield
    task.cancel()


app = FastAPI(title="Gorave API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8081", "http://localhost:19006", *ADMIN_ORIGINS],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestIDMiddleware)

_ALLOWED_HOSTS = [h.strip() for h in os.getenv("API_ALLOWED_HOSTS", "").split(",") if h.strip()]
if _ALLOWED_HOSTS:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=_ALLOWED_HOSTS)
else:
    print("[STARTUP] API_ALLOWED_HOSTS not set — TrustedHostMiddleware is disabled, "
          "the app will respond to any Host header. Set it to your prod domain(s) before launch.",
          flush=True)

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Catches anything that isn't already an HTTPException (those get FastAPI's
    own handler, which preserves the `detail` clients already parse) — logs
    the real exception server-side and returns a generic message instead of
    letting a raw stack trace/exception string reach the client."""
    request_id = getattr(request.state, "request_id", None) or "unknown"
    print(f"[UNHANDLED] request_id={request_id} {request.method} {request.url.path} — {exc!r}", flush=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
        headers={"X-Request-ID": request_id},
    )


_MAINTENANCE_EXEMPT_PREFIXES = ("/admin", "/health", "/docs", "/openapi.json", "/redoc")


@app.middleware("http")
async def maintenance_mode(request: Request, call_next):
    # Read fresh each request (not cached at import) so restarting the
    # process after editing MAINTENANCE_MODE in .env takes effect immediately.
    if os.getenv("MAINTENANCE_MODE", "false").lower() == "true" and not request.url.path.startswith(_MAINTENANCE_EXEMPT_PREFIXES):
        return JSONResponse(
            status_code=503,
            content={"detail": {"code": "MAINTENANCE", "message": os.getenv("MAINTENANCE_MESSAGE") or "Gorave is undergoing scheduled maintenance. We'll be back shortly."}},
        )
    return await call_next(request)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(upload_router)
app.include_router(places_router)
app.include_router(vibes_router)
app.include_router(events_router)
app.include_router(chat_router)
app.include_router(notifications_router)
app.include_router(devices_router)
app.include_router(wallet_router)
app.include_router(payments_router)
app.include_router(misc_router)
app.include_router(wellknown_router)
app.include_router(admin_auth_router)
app.include_router(admin_users_router)
app.include_router(admin_feedback_router)
app.include_router(admin_wallet_router)
app.include_router(admin_events_router)
app.include_router(admin_reports_router)
app.include_router(admin_dashboard_router)
app.include_router(admin_revenue_router)
app.include_router(admin_audit_log_router)


@app.get("/health")
def health():
    return {"status": "ok"}
