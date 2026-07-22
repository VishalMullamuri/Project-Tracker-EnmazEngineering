from sqlalchemy.orm import Session
from app.models.employee import Employee
from app.models.user import User
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

    project = (
        db.query(Project)
        .filter(Project.id == db_task.project_id)
        .first()
    )

    if project:
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

    if current_user.role.value not in ["MANAGER", "ADMIN"]:

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

    if current_user.role.value not in ["MANAGER", "ADMIN"]:
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
        return None

    if current_user.role.value == "TEAM_MEMBER":
        if db_task.assigned_to != current_user.id:
            return None

    if current_user.role.value in ["MANAGER", "ADMIN"]:

        db_task.title = task.title
        db_task.description = task.description
        db_task.assigned_to = task.assigned_to
        db_task.status = task.status
        db_task.priority = task.priority
        db_task.remarks = task.remarks
        db_task.start_date = task.start_date
        db_task.due_date = task.due_date

    else:

        db_task.status = task.status
        db_task.remarks = task.remarks

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
):
    db_task = (
        db.query(Task)
        .filter(Task.id == task_id)
        .first()
    )

    if not db_task:
        return False

    project_id = db_task.project_id

    db.delete(db_task)

    db.flush()

    calculate_progress(
        db,
        project_id,
    )

    db.commit()

    return True