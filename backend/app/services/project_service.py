from sqlalchemy.orm import Session

from app.models.project import Project
from app.models.task import Task
from app.models.user import User

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
    skip: int = 0,
    limit: int = 20,
):
    if current_user.role.value in ["MANAGER", "ADMIN"]:
        projects = (
            db.query(Project)
            .offset(skip)
            .limit(limit)
            .all()
        )
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
            .offset(skip)
            .limit(limit)
            .all()
        )

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
        current_user.role.value == "MANAGER"
        and db_project.created_by != current_user.id
    ):
        return None

    if project.project_name is not None:
        db_project.project_name = project.project_name

    if project.description is not None:
        db_project.description = project.description

    if project.start_date is not None:
        db_project.start_date = project.start_date

    if project.end_date is not None:
        db_project.end_date = project.end_date

    if project.status is not None:
        db_project.status = project.status

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
        current_user.role.value == "MANAGER"
        and db_project.created_by != current_user.id
    ):
        return False

    db.delete(db_project)
    db.commit()

    return True