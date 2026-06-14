import os
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()

_account_sid = os.getenv("TWILIO_ACCOUNT_SID")
_auth_token = os.getenv("TWILIO_AUTH_TOKEN")
_verify_sid = os.getenv("TWILIO_VERIFY_SERVICE_SID")

_client = Client(_account_sid, _auth_token)


def send_otp(phone: str) -> bool:
    """Send OTP via Twilio Verify. Returns True on success."""
    verification = _client.verify.v2.services(_verify_sid).verifications.create(
        to=phone,
        channel="sms",
    )
    return verification.status == "pending"


def verify_otp(phone: str, code: str) -> bool:
    """Check OTP code via Twilio Verify. Returns True if approved."""
    check = _client.verify.v2.services(_verify_sid).verification_checks.create(
        to=phone,
        code=code,
    )
    return check.status == "approved"
