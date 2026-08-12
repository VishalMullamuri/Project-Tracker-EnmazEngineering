import logging

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.permissions import require_admin
from app.crud.user import (
    activate_user,
    deactivate_user,
)
from app.database.database import get_db
from app.models.user import User

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

    logger.info(
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

    logger.info(
        "User activated: actor_user_id=%s target_user_id=%s",
        current_user.id,
        user_id,
    )

    return {
        "message": "User activated successfully",
    }
