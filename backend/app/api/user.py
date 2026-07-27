from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User, UserRole

from app.core.permissions import require_manager

router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


@router.get("")
def get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    if current_user.role == UserRole.ADMIN:
        users = db.query(User).all()
    else:
        users = (
            db.query(User)
            .filter(User.id == current_user.id)
            .all()
        )

    return [
        {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
        }
        for user in users
    ]