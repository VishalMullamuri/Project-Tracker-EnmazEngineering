from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User, UserRole
from app.models.employee import Employee
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
        users = (
            db.query(User)
            .filter(User.is_active.is_(True))
            .all()
        )
    else:
        users = (
            db.query(User)
            .join(Employee, Employee.user_id == User.id)
            .filter(
                Employee.is_active.is_(True),
                User.is_active.is_(True),
            )
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