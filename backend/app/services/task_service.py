from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.employee import Employee
from app.models.user import User, UserRole
from app.models.task import Task
from app.models.project import Project
from app.services.project_service import calculate_progress

from app.schemas.task import (
    TaskCreate,
    TaskUpdate,
)


def create_task(
    db: Session,
    task: TaskCreate,
    user_id: int,
):
    project = (
        db.query(Project)
        .filter(Project.id == task.project_id)
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if (
        user.role != UserRole.ADMIN
        and project.created_by != user_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create tasks for this project",
        )

    employee = (
        db.query(Employee)
        .filter(
            Employee.user_id == task.assigned_to,
            Employee.is_active.is_(True),
        )
        .first()
    )

    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assigned employee not found",
        )
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assigned employee not found",
        )

    db_task = Task(
        project_id=task.project_id,
        assigned_to=task.assigned_to,
        title=task.title,
        description=task.description,
        priority=task.priority,
        start_date=task.start_date,
        due_date=task.due_date,
        status="Pending",
        created_by=user_id,
    )

    db.add(db_task)
    db.flush()

    calculate_progress(
        db,
        db_task.project_id,
    )

    db.commit()
    db.refresh(db_task)

    db_task.project_name = project.project_name

    return db_task


def get_all_tasks(
    db: Session,
    current_user: User,
):
    query = (
        db.query(
            Task,
            Project.project_name,
            Employee.name.label("employee_name"),
        )
        .join(
            Project,
            Task.project_id == Project.id,
        )
        .outerjoin(
            Employee,
            Employee.user_id == Task.assigned_to,
        )
    )

    if current_user.role == UserRole.ADMIN:
        pass

    elif current_user.role == UserRole.MANAGER:
        query = query.filter(
            Project.created_by == current_user.id
        )

    else:
        query = query.filter(
            Task.assigned_to == current_user.id
        )

    tasks = query.all()

    result = []

    for task, project_name, employee_name in tasks:
        task.project_name = project_name
        task.assigned_to_name = employee_name
        result.append(task)

    return result


def get_task(
    db: Session,
    task_id: int,
    current_user: User,
):
    query = (
        db.query(
            Task,
            Project.project_name,
            Employee.name.label("employee_name"),
        )
        .join(
            Project,
            Task.project_id == Project.id,
        )
        .outerjoin(
            Employee,
            Employee.user_id == Task.assigned_to,
        )
        .filter(Task.id == task_id)
    )

    if current_user.role == UserRole.ADMIN:
        pass

    elif current_user.role == UserRole.MANAGER:
        query = query.filter(
            Project.created_by == current_user.id
        )

    else:
        query = query.filter(
            Task.assigned_to == current_user.id
        )

    result = query.first()

    if not result:
        return None

    task, project_name, employee_name = result

    task.project_name = project_name
    task.assigned_to_name = employee_name

    return task


def update_task(
    db: Session,
    task_id: int,
    task: TaskUpdate,
    current_user: User,
):
    db_task = (
        db.query(Task)
        .filter(Task.id == task_id)
        .first()
    )

    if not db_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    role = (
        current_user.role.value
        if isinstance(current_user.role, UserRole)
        else current_user.role
    )

    if role == "TEAM_MEMBER":

        if db_task.assigned_to != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to modify this task",
            )

    elif role == "MANAGER":

        if db_task.created_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to modify this task",
            )

    update_data = task.model_dump(exclude_unset=True)

    if role == "TEAM_MEMBER":
        update_data = {
            key: value
            for key, value in update_data.items()
            if key in {"status", "remarks"}
        }

    if "assigned_to" in update_data:
        employee = (
            db.query(Employee)
            .filter(
                Employee.user_id == update_data["assigned_to"],
                Employee.is_active.is_(True),
            )
            .first()
        )

        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assigned employee not found",
            )

    for field, value in update_data.items():
        setattr(db_task, field, value)

    db.flush()

    calculate_progress(
        db,
        db_task.project_id,
    )

    db.commit()
    db.refresh(db_task)

    project = (
        db.query(Project)
        .filter(Project.id == db_task.project_id)
        .first()
    )

    if project:
        db_task.project_name = project.project_name

    return db_task


def delete_task(
    db: Session,
    task_id: int,
    current_user: User,
):
    db_task = (
        db.query(Task)
        .filter(Task.id == task_id)
        .first()
    )

    if not db_task:
        return False

    if (
        current_user.role == UserRole.MANAGER
        and db_task.created_by != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this task",
        )

    project_id = db_task.project_id

    db.delete(db_task)

    db.flush()

    calculate_progress(
        db,
        project_id,
    )

    db.commit()

    return True