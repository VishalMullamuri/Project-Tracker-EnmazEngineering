from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.project import Project
from app.models.task import Task
from app.models.user import User, UserRole

from app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
)


def calculate_progress(
    db: Session,
    project_id: int,
):
    project = (
        db.query(Project)
        .filter(Project.id == project_id)
        .first()
    )

    if not project:
        return 0

    total_tasks = (
        db.query(Task)
        .filter(Task.project_id == project_id)
        .count()
    )

    if total_tasks == 0:
        project.progress = 0
        return 0

    completed_tasks = (
        db.query(Task)
        .filter(
            Task.project_id == project_id,
            Task.status == "Completed",
        )
        .count()
    )

    progress = round(
        (completed_tasks / total_tasks) * 100
    )

    project.progress = progress

    if progress == 100:
        project.status = "Completed"
    elif project.status == "Completed":
        project.status = "In Progress"

    return progress


def create_project(
    db: Session,
    project: ProjectCreate,
    user_id: int,
):
    new_project = Project(
        project_name=project.project_name,
        description=project.description,
        start_date=project.start_date,
        end_date=project.end_date,
        status=project.status,
        progress=0,
        created_by=user_id,
    )

    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    return new_project


def get_all_projects(
    db: Session,
    current_user: User,
):
    if current_user.role.value in ["MANAGER", "ADMIN"]:
        projects = db.query(Project).all()
    else:
        projects = (
            db.query(Project)
            .join(
                Task,
                Project.id == Task.project_id,
            )
            .filter(
                Task.assigned_to == current_user.id
            )
            .distinct()
            .all()
        )

    for project in projects:
        calculate_progress(
            db,
            project.id,
        )
        db.refresh(project)

    return projects


def get_project_by_id(
    db: Session,
    project_id: int,
    current_user: User,
):
    query = (
        db.query(Project)
        .filter(Project.id == project_id)
    )

    if current_user.role.value not in ["MANAGER", "ADMIN"]:
        query = (
            query.join(
                Task,
                Project.id == Task.project_id,
            )
            .filter(
                Task.assigned_to == current_user.id
            )
        )

    project = query.first()

    if not project:
        return None

    calculate_progress(
        db,
        project.id,
    )

    db.refresh(project)

    return project


def update_project(
    db: Session,
    project_id: int,
    project: ProjectUpdate,
    current_user: User,
):
    db_project = (
        db.query(Project)
        .filter(Project.id == project_id)
        .first()
    )

    if not db_project:
        return None

    if (
        current_user.role != UserRole.ADMIN
        and db_project.created_by != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this project",
        )

    for field, value in project.model_dump(exclude_unset=True).items():
        setattr(db_project, field, value)

    calculate_progress(
        db,
        db_project.id,
    )

    db.commit()
    db.refresh(db_project)

    return db_project


def delete_project(
    db: Session,
    project_id: int,
    current_user: User,
):
    db_project = (
        db.query(Project)
        .filter(Project.id == project_id)
        .first()
    )

    if not db_project:
        return False

    if (
        current_user.role != UserRole.ADMIN
        and db_project.created_by != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this project",
        )

    db.delete(db_project)
    db.commit()

    return True