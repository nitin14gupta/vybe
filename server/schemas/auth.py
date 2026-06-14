from pydantic import BaseModel, field_validator
import re


class PhoneSendRequest(BaseModel):
    phone: str
    country_code: str = "+91"

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        digits = re.sub(r"\D", "", v)
        if len(digits) != 10:
            raise ValueError("Phone number must be exactly 10 digits")
        return digits


class OTPVerifyRequest(BaseModel):
    phone: str
    code: str
    country_code: str = "+91"

    @field_validator("code")
    @classmethod
    def validate_code(cls, v: str) -> str:
        if not re.fullmatch(r"\d{6}", v):
            raise ValueError("OTP must be exactly 6 digits")
        return v


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: str
    profile_complete: bool


class RefreshRequest(BaseModel):
    refresh_token: str
