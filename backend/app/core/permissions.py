from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.project_employee import ProjectEmployee
from app.core.security import get_current_user
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
    print("Current User:", current_user.email)
    print("Current Role:", current_user.role)
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
    db=Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role in (
        UserRole.ADMIN,
        UserRole.MANAGER,
    ):
        return current_user

    assignment = (
        db.query(ProjectEmployee)
        .filter(
            ProjectEmployee.project_id == project_id,
            ProjectEmployee.employee_id == current_user.id,
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