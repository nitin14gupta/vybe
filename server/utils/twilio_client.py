import os
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()

_account_sid = os.getenv("TWILIO_ACCOUNT_SID")
_auth_token = os.getenv("TWILIO_AUTH_TOKEN")
_verify_sid = os.getenv("TWILIO_VERIFY_SERVICE_SID")
_sms_from = os.getenv("TWILIO_PHONE_NUMBER") or os.getenv("TWILIO_MESSAGING_SERVICE_SID")

_client = Client(_account_sid, _auth_token)

# DEV bypass: real Twilio key not configured yet.
# send_otp always succeeds; verify_otp accepts "000000" for any number.
_DEV_OTP_BYPASS = True
_DEV_MAGIC_CODE = "000000"

# No TWILIO_PHONE_NUMBER/TWILIO_MESSAGING_SERVICE_SID configured yet (only
# the Verify service, for OTP) — send_sms logs instead of calling Twilio
# until one is added to .env. Set _DEV_SMS_BYPASS = False once it is.
_DEV_SMS_BYPASS = True


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


def send_sms(to: str, body: str) -> bool:
    """Send a plain SMS (SOS alerts, etc — anything outside the OTP Verify flow). Returns True on success."""
    if _DEV_SMS_BYPASS or not _sms_from:
        print(f"[DEV SMS BYPASS] to={to} body={body!r}")
        return True
    message = _client.messages.create(body=body, from_=_sms_from, to=to)
    return message.sid is not None


#remove lnie 32,33, 21,22,13,14,15,16