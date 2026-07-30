import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from fastapi.responses import Response
from starlette.middleware.trustedhost import TrustedHostMiddleware

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

# -----------------------------------
# FastAPI App
# -----------------------------------

app = FastAPI(
    title="Project Tracker API",
    description="Backend API for Project Tracker",
    version="1.0.0",
    docs_url=None if os.getenv("ENV", "production") == "production" else "/docs",
    redoc_url=None if os.getenv("ENV", "production") == "production" else "/redoc",
    openapi_url=None if os.getenv("ENV", "production") == "production" else "/openapi.json",
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

origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------------
# Security Middleware
# -----------------------------------

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=os.getenv(
    "ALLOWED_HOSTS",
    "localhost,127.0.0.1,testserver",
).split(","),
)

if os.getenv("ENV") == "production":
    app.add_middleware(
        HTTPSRedirectMiddleware
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
    response.headers["X-XSS-Protection"] = "1; mode=block"

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
    return {
        "status": "healthy",
        "database": "connected"
    }