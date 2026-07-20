from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.models.project import Project
from app.models.task import Task
from app.models.user import User

from app.core.security import get_current_user

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


@router.get("/stats")
def dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    # ==========================
    # MANAGER
    # ==========================

    if current_user.role.value == "MANAGER":

        total_projects = db.query(Project).count()

        completed_projects = (
            db.query(Project)
            .filter(Project.status == "Completed")
            .count()
        )

        active_projects = (
            db.query(Project)
            .filter(Project.status == "In Progress")
            .count()
        )

        delayed_projects = (
            db.query(Project)
            .filter(Project.status == "Delayed")
            .count()
        )

    # ==========================
    # TEAM MEMBER
    # ==========================

    else:

        assigned_project_ids = (
            db.query(Task.project_id)
            .filter(
                Task.assigned_to == current_user.id
            )
            .distinct()
            .subquery()
        )

        total_projects = (
            db.query(Project)
            .filter(
                Project.id.in_(assigned_project_ids)
            )
            .count()
        )

        completed_projects = (
            db.query(Project)
            .filter(
                Project.id.in_(assigned_project_ids),
                Project.status == "Completed",
            )
            .count()
        )

        active_projects = (
            db.query(Project)
            .filter(
                Project.id.in_(assigned_project_ids),
                Project.status == "In Progress",
            )
            .count()
        )

        delayed_projects = (
            db.query(Project)
            .filter(
                Project.id.in_(assigned_project_ids),
                Project.status == "Delayed",
            )
            .count()
        )

    return {
        "total_projects": total_projects,
        "active_projects": active_projects,
        "completed_projects": completed_projects,
        "delayed_projects": delayed_projects,
    }