import asyncio
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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
from utils.account_purge import purge_expired_deleted_accounts
from app_config import APP_SCHEME

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
    allow_origins=["http://localhost:8081", "http://localhost:19006", f"{APP_SCHEME}://", *ADMIN_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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


@app.get("/health")
def health():
    return {"status": "ok"}
