import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from starlette.middleware.trustedhost import TrustedHostMiddleware
from sqlalchemy import text
from app.database.database import SessionLocal
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.core.rate_limit import limiter

from app.api.project import router as project_router
from app.api.auth import router as auth_router
from app.api.task import router as task_router
from app.api.dashboard import router as dashboard_router
from app.api import user
from app.routes.employee import router as employee_router
from app.api.project_employee import router as project_employee_router
from app.routes.users import router as users_router

ENV = os.getenv("ENV", "production")

# -----------------------------------
# FastAPI App
# -----------------------------------

app = FastAPI(
    title="Project Tracker API",
    description="Backend API for Project Tracker",
    version="1.0.0",
    docs_url=None if ENV == "production" else "/docs",
    redoc_url=None if ENV == "production" else "/redoc",
    openapi_url=None if ENV == "production" else "/openapi.json",
)

# -----------------------------------
# Attach Rate Limiter
# -----------------------------------

app.state.limiter = limiter
app.add_exception_handler(
    RateLimitExceeded,
    _rate_limit_exceeded_handler,
)
app.add_middleware(SlowAPIMiddleware)

# -----------------------------------
# CORS Configuration
# -----------------------------------

origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
]

if "*" in origins:
    raise RuntimeError(
        "CORS_ORIGINS cannot contain '*' when allow_credentials=True."
    )
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=[
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
],
allow_headers=[
    "Authorization",
    "Content-Type",
],
)

# -----------------------------------
# Security Middleware
# -----------------------------------

allowed_hosts = os.getenv("ALLOWED_HOSTS")

if allowed_hosts:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=[
            host.strip()
            for host in allowed_hosts.split(",")
        ],
    )



@app.middleware("http")
async def security_headers(
    request: Request,
    call_next,
):
    response: Response = await call_next(request)

    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

    if ENV == "production":
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains"
        )

    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data:; "
        "font-src 'self'; "
        "connect-src 'self'; "
        "object-src 'none'; "
        "base-uri 'self'; "
        "frame-ancestors 'none';"
    )

    return response


# -----------------------------------
# Register API Routers
# -----------------------------------

app.include_router(auth_router)
app.include_router(project_router)
app.include_router(task_router)
app.include_router(dashboard_router)
app.include_router(user.router)
app.include_router(employee_router)
app.include_router(project_employee_router)
app.include_router(users_router)
# -----------------------------------
# Root
# -----------------------------------

@app.get("/")
def root():
    return {
        "message": "Project Tracker Backend is Running 🚀"
    }


# -----------------------------------
# Health Check
# -----------------------------------

@app.get("/health")
def health_check():
    db = SessionLocal()

    try:
        db.execute(text("SELECT 1"))

        return {
            "status": "healthy",
            "database": "connected",
        }

    except Exception:
        return Response(
            content='{"status":"unhealthy","database":"disconnected"}',
            status_code=503,
            media_type="application/json",
        )

    finally:
        db.close()