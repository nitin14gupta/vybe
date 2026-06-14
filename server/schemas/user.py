from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import date


class ProfileCreate(BaseModel):
    name: str
    dob: date
    gender: str

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Name must be at least 2 characters")
        if len(v) > 100:
            raise ValueError("Name must be under 100 characters")
        return v

    @field_validator("gender")
    @classmethod
    def validate_gender(cls, v: str) -> str:
        allowed = {"Man", "Woman", "Non-binary", "Prefer not to say"}
        if v not in allowed:
            raise ValueError(f"Gender must be one of: {', '.join(allowed)}")
        return v


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    gender: Optional[str] = None
    city: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    interests: Optional[List[str]] = None


class LocationUpdate(BaseModel):
    city: str
    lat: Optional[float] = None
    lng: Optional[float] = None


class InterestsUpdate(BaseModel):
    interests: List[str]

    @field_validator("interests")
    @classmethod
    def validate_interests(cls, v: List[str]) -> List[str]:
        if len(v) < 3:
            raise ValueError("Must select at least 3 interests")
        return v


class UserResponse(BaseModel):
    id: str
    phone: str
    name: Optional[str]
    gender: Optional[str]
    city: Optional[str]
    interests: List[str]
    profile_complete: bool
    voice_url: Optional[str]
