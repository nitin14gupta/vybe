from pydantic import BaseModel, field_validator, model_validator
from typing import Optional, List
from datetime import date


DEFAULT_BADGES = ['🔥 Vibe Starter', '✨ Early Adopter', '🎙️ Voice Ready', '🌟 Main Character']


class ProfileCreate(BaseModel):
    name: str
    dob: date
    gender: str
    bio: Optional[str] = None

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
        allowed = {"Male", "Female", "Non-binary", "Prefer not to say"}
        if v not in allowed:
            raise ValueError(f"Gender must be one of: {', '.join(allowed)}")
        return v


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    username: Optional[str] = None
    gender: Optional[str] = None
    bio: Optional[str] = None
    badges: Optional[List[str]] = None
    city: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    interests: Optional[List[str]] = None

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        import re
        v = v.strip().lower()
        if not re.match(r'^[a-z0-9_]{3,30}$', v):
            raise ValueError("3–30 chars: letters, numbers, underscore only")
        return v

    @field_validator("badges")
    @classmethod
    def validate_badges(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        if v is not None and len(v) > 4:
            raise ValueError("Cannot select more than 4 badges")
        return v


class LocationUpdate(BaseModel):
    city: str
    lat: Optional[float] = None
    lng: Optional[float] = None


class LivePingUpdate(BaseModel):
    lat: float
    lng: float


class InterestsUpdate(BaseModel):
    interests: List[str]

    @field_validator("interests")
    @classmethod
    def validate_interests(cls, v: List[str]) -> List[str]:
        if len(v) < 3:
            raise ValueError("Must select at least 3 interests")
        if len(v) > 4:
            raise ValueError("Cannot select more than 4 interests")
        return v


class PayoutDetailsCreate(BaseModel):
    payout_method: str = "upi"
    upi_id: Optional[str] = None
    account_holder_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    bank_name: Optional[str] = None

    @field_validator("payout_method")
    @classmethod
    def validate_payout_method(cls, v: str) -> str:
        if v not in ("upi", "bank"):
            raise ValueError("payout_method must be 'upi' or 'bank'")
        return v

    @field_validator("upi_id")
    @classmethod
    def validate_upi_id(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        import re
        v = v.strip().lower()
        if not re.match(r'^[a-z0-9.\-]{2,256}@[a-z]{2,64}$', v):
            raise ValueError("Invalid UPI ID")
        return v

    @field_validator("account_holder_name")
    @classmethod
    def validate_account_holder_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Account holder name must be at least 2 characters")
        if len(v) > 100:
            raise ValueError("Account holder name must be under 100 characters")
        return v

    @field_validator("account_number")
    @classmethod
    def validate_account_number(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        import re
        v = v.strip()
        if not re.match(r'^\d{9,18}$', v):
            raise ValueError("Account number must be 9-18 digits")
        return v

    @field_validator("ifsc_code")
    @classmethod
    def validate_ifsc_code(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        import re
        v = v.strip().upper()
        if not re.match(r'^[A-Z]{4}0[A-Z0-9]{6}$', v):
            raise ValueError("Invalid IFSC code")
        return v

    @field_validator("bank_name")
    @classmethod
    def validate_bank_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Bank name must be at least 2 characters")
        if len(v) > 100:
            raise ValueError("Bank name must be under 100 characters")
        return v

    @model_validator(mode="after")
    def validate_method_fields(self):
        if self.payout_method == "upi" and not self.upi_id:
            raise ValueError("upi_id is required for the UPI payout method")
        if self.payout_method == "bank" and not all(
            [self.account_holder_name, self.account_number, self.ifsc_code, self.bank_name]
        ):
            raise ValueError("All bank fields are required for the bank payout method")
        return self


class PhotoResponse(BaseModel):
    id: str
    url: str
    position: int


class UserResponse(BaseModel):
    id: str
    phone: str
    name: Optional[str] = None
    username: Optional[str] = None
    gender: Optional[str] = None
    bio: Optional[str] = None
    city: Optional[str] = None
    interests: List[str] = []
    badges: List[str] = []
    profile_complete: bool = False
    is_host_onboarding_finished: bool = False
    voice_url: Optional[str] = None
    photos: List[PhotoResponse] = []
    vibers_count: int = 0
    vibing_count: int = 0
    name_changed_at: Optional[str] = None


class ProfileResponse(UserResponse):
    is_following: bool = False
    is_blocked_by_me: bool = False
    is_blocked_by_them: bool = False
