from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User
from app.core.permissions import require_manager
from app.core.security import get_current_user

router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


@router.get("")
def get_users(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    users = (
        db.query(User)
        .order_by(User.name)
        .offset(skip)
        .limit(limit)
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