import os
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()

_account_sid = os.getenv("TWILIO_ACCOUNT_SID")
_auth_token = os.getenv("TWILIO_AUTH_TOKEN")
_verify_sid = os.getenv("TWILIO_VERIFY_SERVICE_SID")

_client = Client(_account_sid, _auth_token)

# DEV bypass: real Twilio key not configured yet.
# send_otp always succeeds; verify_otp accepts "000000" for any number.
_DEV_OTP_BYPASS = True
_DEV_MAGIC_CODE = "000000"


def send_otp(phone: str) -> bool:
    """Send OTP via Twilio Verify. Returns True on success."""
    if _DEV_OTP_BYPASS:
        return True
    verification = _client.verify.v2.services(_verify_sid).verifications.create(
        to=phone,
        channel="sms",
    )
    return verification.status == "pending"


def verify_otp(phone: str, code: str) -> bool:
    """Check OTP code via Twilio Verify. Returns True if approved."""
    if _DEV_OTP_BYPASS and code == _DEV_MAGIC_CODE:
        return True
    check = _client.verify.v2.services(_verify_sid).verification_checks.create(
        to=phone,
        code=code,
    )
    return check.status == "approved"


#remove lnie 32,33, 21,22,13,14,15,16