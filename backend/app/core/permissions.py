from fastapi import Depends, HTTPException

from app.core.security import get_current_user
from app.models.user import User, UserRole

def is_privileged(user: User) -> bool:
    return user.role in (
        UserRole.ADMIN,
        UserRole.MANAGER,
    )


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

    if not is_privileged(current_user):
        raise HTTPException(
            status_code=403,
            detail="Manager/Admin access required",
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