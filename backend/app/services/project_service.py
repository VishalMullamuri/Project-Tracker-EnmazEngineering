from datetime import date

from sqlalchemy.orm import Session

from app.core.enums import UserRole
from app.models.employee import Employee
from app.models.project import Project
from app.models.project_employee import ProjectEmployee
from app.models.task import Task
from app.models.user import User
from app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
)
from app.schemas.task import TaskStatus


def calculate_progress(
    db: Session,
    project_id: int,
):
    project = db.query(Project).filter(Project.id == project_id).first()

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

    progress = round((completed_tasks / total_tasks) * 100)

    project.progress = progress

    return progress


def update_project_status(
    db: Session,
    project_id: int,
):
    project = (
        db.query(Project)
        .filter(Project.id == project_id)
        .first()
    )

    if not project:
        return

    tasks = (
        db.query(Task)
        .filter(Task.project_id == project_id)
        .all()
    )

    if not tasks:
        project.status = "Not Started"
    elif all(task.status == TaskStatus.COMPLETED for task in tasks):
        project.status = "Completed"
    elif any(task.status == TaskStatus.IN_PROGRESS for task in tasks):
        project.status = "In Progress"
    elif date.today() > project.end_date:
        project.status = "Delayed"
    else:
        project.status = "Not Started"

    db.flush()

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
        status="Not Started",
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
    if current_user.role == UserRole.ADMIN:
        projects = db.query(Project).all()

    elif current_user.role == UserRole.MANAGER:
        projects = (
            db.query(Project)
            .filter(Project.created_by == current_user.id)
            .all()
        )

    else:
        projects = (
            db.query(Project)
            .join(
                ProjectEmployee,
                ProjectEmployee.project_id == Project.id,
            )
            .join(
                Employee,
                Employee.id == ProjectEmployee.employee_id,
            )
            .filter(
                Employee.user_id == current_user.id,
                Employee.is_active.is_(True),
            )
            .distinct()
            .all()
        )

    for project in projects:
        update_project_status(
            db,
            project.id,
        )

    return projects


def get_project_by_id(
    db: Session,
    project_id: int,
    current_user: User,
):
    query = db.query(Project).filter(Project.id == project_id)

    if current_user.role == UserRole.ADMIN:
        pass

    elif current_user.role == UserRole.MANAGER:
        query = query.filter(Project.created_by == current_user.id)

    else:
        query = (
            query.join(
                ProjectEmployee,
                ProjectEmployee.project_id == Project.id,
            )
            .join(
                Employee,
                Employee.id == ProjectEmployee.employee_id,
            )
            .filter(
                Employee.user_id == current_user.id,
                Employee.is_active.is_(True),
            )
        )

    project = query.first()

    if project:
        update_project_status(
            db,
            project.id,
        )

    return project


def update_project(
    db: Session,
    project_id: int,
    project: ProjectUpdate,
    current_user: User,
):
    query = db.query(Project).filter(Project.id == project_id)

    if current_user.role != UserRole.ADMIN:
        query = query.filter(Project.created_by == current_user.id)

    db_project = query.first()

    if not db_project:
        return None

    update_data = project.model_dump(exclude_unset=True)

    update_data.pop("status", None)

    for field, value in update_data.items():
        setattr(db_project, field, value)

    calculate_progress(
        db,
        db_project.id,
    )

    update_project_status(
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
    query = db.query(Project).filter(Project.id == project_id)

    if current_user.role != UserRole.ADMIN:
        query = query.filter(Project.created_by == current_user.id)

    db_project = query.first()

    if not db_project:
        return False

    db.delete(db_project)
    db.commit()

    return True