import logging

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.permissions import require_admin, require_manager, visible_employee_ids
from app.crud.user import (
    activate_user,
    deactivate_user,
)
from app.database.database import get_db
from app.models.employee import Employee
from app.models.user import User, UserRole

router = APIRouter(
    prefix="/users",
    tags=["Users"],
)

logger = logging.getLogger(__name__)


@router.patch("/{user_id}/deactivate")
def deactivate(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    deactivate_user(
        db,
        user_id,
        current_user,
    )

    logger.warning(
        "User deactivated: actor_user_id=%s target_user_id=%s",
        current_user.id,
        user_id,
    )

    return {
        "message": "User deactivated successfully",
    }


@router.patch("/{user_id}/activate")
def activate(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    activate_user(
        db,
        user_id,
    )

    logger.warning(
        "User activated: actor_user_id=%s target_user_id=%s",
        current_user.id,
        user_id,
    )

    return {
        "message": "User activated successfully",
    }


@router.get("")
def get_users(
    include_inactive: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    if current_user.role == UserRole.ADMIN:
        query = db.query(User)

        if not include_inactive:
            query = query.filter(User.is_active.is_(True))

        users = query.all()

    else:
        visible_ids = visible_employee_ids(
            db,
            current_user,
        )

        users = (
            db.query(User)
            .join(
                Employee,
                Employee.user_id == User.id,
            )
            .filter(
                Employee.id.in_(visible_ids),
                Employee.is_active.is_(True),
                User.is_active.is_(True),
            )
            .all()
        )

    if current_user.role == UserRole.MANAGER:
        logger.warning(
            "Users viewed: actor_user_id=%s user_count=%s",
            current_user.id,
            len(users),
        )

    return [
        {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
        }
        for user in users
    ]
