from fastapi import Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, aliased
from sqlalchemy.sql import Select

from app.core.security import get_current_user
from app.database.database import get_db
from app.models.employee import Employee
from app.models.project import Project
from app.models.project_employee import ProjectEmployee
from app.models.user import User, UserRole


def require_admin(
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Admin access required",
        )

    return current_user


def require_manager(
    current_user: User = Depends(get_current_user),
):

    if current_user.role not in (
        UserRole.ADMIN,
        UserRole.MANAGER,
    ):
        raise HTTPException(
            status_code=403,
            detail="Manager/Admin access required",
        )

    return current_user


def require_manager_or_project_member(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == UserRole.ADMIN:
        return current_user

    if current_user.role == UserRole.MANAGER:
        project = (
            db.query(Project)
            .filter(
                Project.id == project_id,
                Project.created_by == current_user.id,
            )
            .first()
        )

        if not project:
            raise HTTPException(
                status_code=403,
                detail="Access denied",
            )

        return current_user

    employee = db.query(Employee).filter(Employee.user_id == current_user.id).first()

    if not employee:
        raise HTTPException(
            status_code=403,
            detail="Access denied",
        )

    assignment = (
        db.query(ProjectEmployee)
        .filter(
            ProjectEmployee.project_id == project_id,
            ProjectEmployee.employee_id == employee.id,
        )
        .first()
    )

    if not assignment:
        raise HTTPException(
            status_code=403,
            detail="Access denied",
        )

    return current_user


def require_team_member(
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.TEAM_MEMBER:
        raise HTTPException(
            status_code=403,
            detail="Team Member access required",
        )

    return current_user


def visible_employee_ids(
    db: Session,
    current_user: User,
) -> Select:
    if current_user.role == UserRole.ADMIN:
        return select(Employee.id).filter(
            Employee.is_active.is_(True),
        )

    if current_user.role == UserRole.MANAGER:
        return (
            select(Employee.id)
            .join(
                ProjectEmployee,
                ProjectEmployee.employee_id == Employee.id,
            )
            .join(
                Project,
                Project.id == ProjectEmployee.project_id,
            )
            .join(
                User,
                User.id == Employee.user_id,
            )
            .filter(
                Project.created_by == current_user.id,
                Employee.is_active.is_(True),
                User.is_active.is_(True),
                User.role == UserRole.TEAM_MEMBER,
            )
            .distinct()
        )

    my_link = aliased(ProjectEmployee)
    me = aliased(Employee)

    own = select(Employee.id).filter(
        Employee.user_id == current_user.id,
        Employee.is_active.is_(True),
    )

    peers = (
        select(Employee.id)
        .join(
            ProjectEmployee,
            ProjectEmployee.employee_id == Employee.id,
        )
        .join(
            User,
            User.id == Employee.user_id,
        )
        .join(
            my_link,
            my_link.project_id == ProjectEmployee.project_id,
        )
        .join(
            me,
            me.id == my_link.employee_id,
        )
        .filter(
            me.user_id == current_user.id,
            me.is_active.is_(True),
            Employee.is_active.is_(True),
            User.is_active.is_(True),
            User.role == UserRole.TEAM_MEMBER,
        )
        .distinct()
    )

    return own.union(peers)
