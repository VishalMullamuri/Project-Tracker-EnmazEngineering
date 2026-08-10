from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.employee import Employee
from app.models.user import User, UserRole


def deactivate_user(
    db: Session,
    user_id: int,
    current_user: User,
):
    if user_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot deactivate your own account",
        )

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    if not user.is_active:
        return user

    if user.role == UserRole.ADMIN:
        remaining = (
            db.query(User)
            .filter(
                User.role == UserRole.ADMIN,
                User.is_active.is_(True),
                User.id != user_id,
            )
            .count()
        )

        if remaining == 0:
            raise HTTPException(
                status_code=409,
                detail="Cannot deactivate the last active admin",
            )

    user.is_active = False
    user.token_version += 1
    employee = db.query(Employee).filter(Employee.user_id == user.id).first()

    if employee:
        employee.is_active = False

    db.commit()
    db.refresh(user)

    return user


def activate_user(
    db: Session,
    user_id: int,
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    if user.is_active:
        return user

    user.is_active = True
    employee = db.query(Employee).filter(Employee.user_id == user.id).first()

    if employee:
        employee.is_active = True
    user.token_version += 1
    employee = db.query(Employee).filter(Employee.user_id == user.id).first()

    if employee:
        employee.is_active = True

    db.commit()
    db.refresh(user)

    return user
