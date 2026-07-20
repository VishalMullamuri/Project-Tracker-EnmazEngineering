from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.project import router as project_router
from app.api.project_member import router as project_member_router
from app.database.database import engine
from app.database.base import Base
from app.api.auth import router as auth_router
from app.api.task import router as task_router
from app.api.dashboard import router as dashboard_router
from app.api import user
from app.models.employee import Employee
from app.routes.employee import router as employee_router
from app.api.project_employee import router as project_employee_router
# Create all database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Project Tracker API",
    description="Backend API for Project Tracker",
    version="1.0.0",
)

# CORS Configuration
origins = [
    "http://localhost:5173",  # React (Vite)
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth_router)
app.include_router(project_router)
app.include_router(project_member_router)
app.include_router(task_router)
app.include_router(dashboard_router)
app.include_router(user.router)
app.include_router(employee_router)
app.include_router(project_employee_router)
@app.get("/")
def root():
    return {
        "message": "Project Tracker Backend is Running 🚀"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "database": "connected"
    }