from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User


def deactivate_user(
    db: Session,
    user_id: int,
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    user.is_active = False
    user.token_version += 1

    db.commit()
    db.refresh(user)

    return user