from fastapi import APIRouter, Depends
from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database.database import get_db
from app.models.project import Project
from app.models.task import Task
from app.models.user import User, UserRole

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


@router.get("/stats")
def dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    if current_user.role == UserRole.ADMIN:

        projects = db.query(Project)

    elif current_user.role == UserRole.MANAGER:

        projects = (
            db.query(Project)
            .filter(Project.created_by == current_user.id)
        )

    else:

        assigned_project_ids = (
            db.query(Task.project_id)
            .filter(
                Task.assigned_to == current_user.id
            )
            .distinct()
            .subquery()
        )

        projects = (
            db.query(Project)
            .filter(Project.id.in_(assigned_project_ids))
        )

    total_projects = projects.count()

    completed_projects = (
        projects.filter(
            Project.progress == 100
        ).count()
    )

    delayed_projects = (
        projects.filter(
            and_(
                Project.progress < 100,
                Project.end_date < func.current_date(),
            )
        ).count()
    )

    not_started_projects = (
        projects.filter(
            and_(
                Project.progress == 0,
                Project.end_date >= func.current_date(),
            )
        ).count()
    )

    active_projects = (
        projects.filter(
            and_(
                Project.progress > 0,
                Project.progress < 100,
                Project.end_date >= func.current_date(),
            )
        ).count()
    )

    return {
        "total_projects": total_projects,
        "active_projects": active_projects,
        "completed_projects": completed_projects,
        "delayed_projects": delayed_projects,
        "not_started_projects": not_started_projects,
    }