from fastapi import HTTPException, status
from sqlalchemy.orm import Session, aliased

from app.core.enums import UserRole
from app.models.employee import Employee
from app.models.project import Project
from app.models.project_employee import ProjectEmployee
from app.models.task import Task
from app.models.user import User
from app.schemas.task import (
    TaskCreate,
    TaskUpdate,
)
from app.services.project_service import (
    calculate_progress,
    update_project_status,
)


def _resolve_project_member(
    db,
    project_id: int,
    assigned_to: int,
) -> Employee:
    employee = (
        db.query(Employee)
        .join(User, User.id == Employee.user_id)
        .join(
            ProjectEmployee,
            ProjectEmployee.employee_id == Employee.id,
        )
        .filter(
            Employee.user_id == assigned_to,
            Employee.is_active.is_(True),
            User.is_active.is_(True),
            User.role == UserRole.TEAM_MEMBER,
            ProjectEmployee.project_id == project_id,
        )
        .first()
    )

    if not employee:
        raise HTTPException(
            status_code=400,
            detail="Assigned employee is not a member of this project",
        )

    return employee


def create_task(
    db: Session,
    task: TaskCreate,
    current_user: User,
):
    query = db.query(Project).filter(Project.id == task.project_id)

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
                ProjectEmployee.employee_id == Employee.id,
            )
        )

    project = query.first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    assigned_to = task.assigned_to

    if current_user.role == UserRole.TEAM_MEMBER:
        if task.assigned_to != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Team members can only assign tasks to themselves",
            )

        assigned_to = current_user.id

    _resolve_project_member(
        db,
        task.project_id,
        assigned_to,
    )

    db_task = Task(
        project_id=task.project_id,
        assigned_to=assigned_to,
        title=task.title,
        description=task.description,
        priority=task.priority,
        start_date=task.start_date,
        due_date=task.due_date,
        status="Not Started",
        created_by=current_user.id,
    )

    db.add(db_task)
    db.flush()

    calculate_progress(
        db,
        db_task.project_id,
    )

    update_project_status(
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
        query = query.filter(Project.created_by == current_user.id)

    else:
        member_employee = aliased(Employee)

        query = (
            query.join(
                ProjectEmployee,
                ProjectEmployee.project_id == Project.id,
            )
            .join(
                member_employee,
                member_employee.id == ProjectEmployee.employee_id,
            )
            .filter(
                Task.assigned_to == current_user.id,
                member_employee.user_id == current_user.id,
                member_employee.is_active.is_(True),
            )
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
        query = query.filter(Project.created_by == current_user.id)

    else:
        member_employee = aliased(Employee)

        query = (
            query.join(
                ProjectEmployee,
                ProjectEmployee.project_id == Project.id,
            )
            .join(
                member_employee,
                member_employee.id == ProjectEmployee.employee_id,
            )
            .filter(
                Task.assigned_to == current_user.id,
                member_employee.user_id == current_user.id,
                member_employee.is_active.is_(True),
            )
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
    role = (
        current_user.role.value
        if isinstance(current_user.role, UserRole)
        else current_user.role
    )

    query = (
        db.query(Task)
        .join(Project, Task.project_id == Project.id)
        .filter(Task.id == task_id)
    )

    if role == "TEAM_MEMBER":
        member_employee = aliased(Employee)

        query = (
            query.join(
                ProjectEmployee,
                ProjectEmployee.project_id == Project.id,
            )
            .join(
                member_employee,
                member_employee.id == ProjectEmployee.employee_id,
            )
            .filter(
                Task.assigned_to == current_user.id,
                member_employee.user_id == current_user.id,
                member_employee.is_active.is_(True),
            )
        )

    elif role == "MANAGER":
        query = query.filter(Project.created_by == current_user.id)

    db_task = query.first()

    if not db_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    update_data = task.model_dump(exclude_unset=True)

    if role == "TEAM_MEMBER":
        allowed_fields = {"status", "remarks"}

        forbidden_fields = sorted(
            set(update_data.keys()) - allowed_fields
        )

        if forbidden_fields:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Team members cannot modify: "
                    + ", ".join(forbidden_fields)
                ),
            )

        update_data = {
            key: value
            for key, value in update_data.items()
            if key in allowed_fields
        }

    if "assigned_to" in update_data:
        _resolve_project_member(
            db,
            db_task.project_id,
            update_data["assigned_to"],
        )

    for field, value in update_data.items():
        setattr(db_task, field, value)

    db.flush()

    calculate_progress(
        db,
        db_task.project_id,
    )

    update_project_status(
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
    query = (
        db.query(Task)
        .join(Project, Task.project_id == Project.id)
        .filter(Task.id == task_id)
    )

    if current_user.role == UserRole.MANAGER:
        query = query.filter(Project.created_by == current_user.id)

    db_task = query.first()

    if not db_task:
        return False

    project_id = db_task.project_id

    db.delete(db_task)

    db.flush()

    calculate_progress(
        db,
        project_id,
    )

    update_project_status(
        db,
        project_id,
    )

    db.commit()

    return True