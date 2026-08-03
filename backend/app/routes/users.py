from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.core.permissions import require_admin
from app.models.user import User

from app.crud.user import (
    deactivate_user,
    activate_user,
)

router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


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

    return {
        "message": "User activated successfully",
    }