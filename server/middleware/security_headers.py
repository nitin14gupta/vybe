from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

# Swagger UI / ReDoc load their JS/CSS from a CDN, so a strict CSP would break
# them — exempt the interactive docs paths instead of loosening the policy
# for the whole API.
_CSP_EXEMPT_PREFIXES = ("/docs", "/redoc", "/openapi.json")


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Adds standard defensive response headers. This is a pure JSON API (no
    browser-rendered HTML besides the auto-generated docs), so the CSP can be
    aggressively locked down."""

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
        if not request.url.path.startswith(_CSP_EXEMPT_PREFIXES):
            response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"
        return response
