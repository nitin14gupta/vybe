from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.auth import router as auth_router
from routes.users import router as users_router
from routes.upload import router as upload_router
from routes.places import router as places_router
from routes.discover import router as discover_router
from routes.vibes import router as vibes_router
from routes.events import router as events_router
from routes.chat import router as chat_router
from routes.notifications import router as notifications_router
from routes.devices import router as devices_router

app = FastAPI(title="Vybe API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8081", "http://localhost:19006", "vybe://"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(upload_router)
app.include_router(places_router)
app.include_router(discover_router)
app.include_router(vibes_router)
app.include_router(events_router)
app.include_router(chat_router)
app.include_router(notifications_router)
app.include_router(devices_router)


@app.get("/health")
def health():
    return {"status": "ok"}
