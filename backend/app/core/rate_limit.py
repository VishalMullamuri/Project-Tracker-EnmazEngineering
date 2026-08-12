import os

from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address


def _client_ip(request: Request) -> str:
    """
    Trust forwarded headers only when explicitly enabled and the ASGI server
    has already validated the proxy chain.
    """
    trust_proxy = os.getenv("TRUST_PROXY", "false").lower() in {
        "1",
        "true",
        "yes",
        "on",
    }

    if trust_proxy:
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            parts = [ip.strip() for ip in forwarded.split(",") if ip.strip()]
            if parts:
                # Rightmost untrusted client after trusted proxies have been
                # stripped by the ASGI server.
                return parts[-1]

    return get_remote_address(request)


limiter = Limiter(
    key_func=_client_ip,
    storage_uri=os.getenv("RATE_LIMIT_STORAGE_URI", "memory://"),
    headers_enabled=True,
)
