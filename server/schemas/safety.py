from pydantic import BaseModel, field_validator
from typing import Optional


class EmergencyContactCreate(BaseModel):
    name: str
    phone: str
    emoji: Optional[str] = None
    source: str = "manual"

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 1:
            raise ValueError("Name is required")
        if len(v) > 100:
            raise ValueError("Name must be under 100 characters")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 6:
            raise ValueError("Enter a valid phone number")
        if len(v) > 20:
            raise ValueError("Phone number is too long")
        return v

    @field_validator("source")
    @classmethod
    def validate_source(cls, v: str) -> str:
        if v not in ("manual", "device"):
            raise ValueError("source must be 'manual' or 'device'")
        return v


class EmergencyContactResponse(BaseModel):
    id: str
    name: str
    phone: str
    emoji: Optional[str] = None
    source: str
    created_at: Optional[str] = None


class SosRequest(BaseModel):
    event_id: Optional[str] = None
    lat: float
    lng: float


class SosResponse(BaseModel):
    ok: bool
    alerted: int
