import logging

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.enums import UserRole
from app.models.employee import Employee
from app.models.project import Project
from app.models.project_employee import ProjectEmployee
from app.models.user import User
from app.models.weekly_planner import WeeklyPlanner
from app.schemas.weekly_planner import (
    WeeklyPlannerCreate,
    WeeklyPlannerUpdate,
)

logger = logging.getLogger(__name__)


def _get_employee(
    db: Session,
    employee_id: int,
):
    employee = (
        db.query(Employee)
        .join(
            User,
            User.id == Employee.user_id,
        )
        .filter(
            Employee.id == employee_id,
            Employee.is_active.is_(True),
            User.is_active.is_(True),
            User.role == UserRole.TEAM_MEMBER,
        )
        .first()
    )

    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found",
        )

    return employee


def _ensure_manager_employee_access(
    db: Session,
    current_user: User,
    employee_id: int,
):
    if current_user.role != UserRole.MANAGER:
        return

    assignment = (
        db.query(ProjectEmployee)
        .join(
            Project,
            Project.id == ProjectEmployee.project_id,
        )
        .join(
            Employee,
            Employee.id == ProjectEmployee.employee_id,
        )
        .filter(
            Project.created_by == current_user.id,
            ProjectEmployee.employee_id == employee_id,
            Employee.is_active.is_(True),
        )
        .first()
    )

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )


def _get_weekly_task(
    db: Session,
    task_id: int,
):
    return (
        db.query(WeeklyPlanner)
        .filter(WeeklyPlanner.id == task_id)
        .first()
    )


def _build_response(
    db: Session,
    planner_task: WeeklyPlanner,
):
    employee = (
        db.query(Employee)
        .filter(
            Employee.id == planner_task.employee_id
        )
        .first()
    )

    planner_task.employee_name = (
        employee.name if employee else None
    )

    return planner_task


def create_weekly_task(
    db: Session,
    planner: WeeklyPlannerCreate,
    current_user: User,
):
    _get_employee(
        db,
        planner.employee_id,
    )

    _ensure_manager_employee_access(
        db,
        current_user,
        planner.employee_id,
    )

    db_task = WeeklyPlanner(
        task=planner.task.strip(),
        employee_id=planner.employee_id,
        week_start=planner.week_start,
        status=planner.status.value,
        remarks=(
            planner.remarks.strip()
            if planner.remarks
            else None
        ),
        created_by=current_user.id,
    )

    db.add(db_task)
    db.commit()
    db.refresh(db_task)

    logger.info(
        "Weekly planner task created: "
        "actor_user_id=%s target_task_id=%s "
        "target_employee_id=%s",
        current_user.id,
        db_task.id,
        db_task.employee_id,
    )

    return _build_response(
        db,
        db_task,
    )


def get_weekly_tasks(
    db: Session,
    current_user: User,
    week_start=None,
    status_filter=None,
    employee_id=None,
):
    query = db.query(WeeklyPlanner)

    if week_start is not None:
        query = query.filter(
            WeeklyPlanner.week_start == week_start
        )

    if status_filter is not None:
        query = query.filter(
            WeeklyPlanner.status
            == status_filter.value
        )

    if employee_id is not None:
        query = query.filter(
            WeeklyPlanner.employee_id
            == employee_id
        )

    if current_user.role == UserRole.TEAM_MEMBER:
        employee = (
            db.query(Employee)
            .filter(
                Employee.user_id == current_user.id,
                Employee.is_active.is_(True),
            )
            .first()
        )

        if not employee:
            return []

        query = query.filter(
            WeeklyPlanner.employee_id
            == employee.id
        )

    elif current_user.role == UserRole.MANAGER:
        query = query.filter(
            WeeklyPlanner.created_by
            == current_user.id
        )

    tasks = (
        query
        .order_by(WeeklyPlanner.id.asc())
        .all()
    )

    return [
        _build_response(db, task)
        for task in tasks
    ]


def get_weekly_task(
    db: Session,
    task_id: int,
    current_user: User,
):
    planner_task = _get_weekly_task(
        db,
        task_id,
    )

    if not planner_task:
        return None

    if current_user.role == UserRole.TEAM_MEMBER:
        employee = (
            db.query(Employee)
            .filter(
                Employee.id
                == planner_task.employee_id,
                Employee.user_id
                == current_user.id,
                Employee.is_active.is_(True),
            )
            .first()
        )

        if not employee:
            return None

    elif current_user.role == UserRole.MANAGER:
        if planner_task.created_by != current_user.id:
            return None

    return _build_response(
        db,
        planner_task,
    )


def update_weekly_task(
    db: Session,
    task_id: int,
    planner: WeeklyPlannerUpdate,
    current_user: User,
):
    db_task = _get_weekly_task(
        db,
        task_id,
    )

    if not db_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Weekly planner task not found",
        )

    if current_user.role == UserRole.TEAM_MEMBER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Team members can only view "
                "weekly planner tasks"
            ),
        )

    if current_user.role == UserRole.MANAGER:
        if db_task.created_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied",
            )

    update_data = planner.model_dump(
        exclude_unset=True
    )

    if "employee_id" in update_data:
        _get_employee(
            db,
            update_data["employee_id"],
        )

        _ensure_manager_employee_access(
            db,
            current_user,
            update_data["employee_id"],
        )

    if "status" in update_data:
        update_data["status"] = (
            update_data["status"].value
        )

    if (
        "task" in update_data
        and update_data["task"] is not None
    ):
        update_data["task"] = (
            update_data["task"].strip()
        )

    if (
        "remarks" in update_data
        and update_data["remarks"] is not None
    ):
        update_data["remarks"] = (
            update_data["remarks"].strip()
        )

    for field, value in update_data.items():
        setattr(
            db_task,
            field,
            value,
        )

    db.commit()
    db.refresh(db_task)

    logger.info(
        "Weekly planner task updated: "
        "actor_user_id=%s target_task_id=%s "
        "target_employee_id=%s",
        current_user.id,
        db_task.id,
        db_task.employee_id,
    )

    return _build_response(
        db,
        db_task,
    )


def delete_weekly_task(
    db: Session,
    task_id: int,
    current_user: User,
):
    db_task = _get_weekly_task(
        db,
        task_id,
    )

    if not db_task:
        return False

    if current_user.role == UserRole.TEAM_MEMBER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Team members cannot delete "
                "weekly planner tasks"
            ),
        )

    if current_user.role == UserRole.MANAGER:
        if db_task.created_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied",
            )

    logger.info(
        "Weekly planner task deleted: "
        "actor_user_id=%s target_task_id=%s "
        "target_employee_id=%s",
        current_user.id,
        db_task.id,
        db_task.employee_id,
    )

    db.delete(db_task)
    db.commit()

    return True