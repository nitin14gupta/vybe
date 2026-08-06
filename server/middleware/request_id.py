import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

_HEADER = "X-Request-ID"


class RequestIDMiddleware(BaseHTTPMiddleware):
    """Attaches a request id (reused from the caller's X-Request-ID header if
    present, otherwise generated) to request.state and the response headers,
    so a single request can be traced across log lines."""

    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get(_HEADER) or uuid.uuid4().hex
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers[_HEADER] = request_id
        return response
