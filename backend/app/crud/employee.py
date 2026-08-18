import logging

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.enums import UserRole
from app.core.permissions import visible_employee_ids
from app.core.security import hash_password
from app.crud.user import deactivate_user
from app.models.employee import Employee
from app.models.user import User
from app.schemas.employee import (
    EmployeeCreate,
    EmployeeUpdate,
    TeamMemberEmployeeResponse,
)

logger = logging.getLogger(__name__)


def create_employee(
    db: Session,
    employee: EmployeeCreate,
    current_user: User,
):
    existing_user = db.query(User).filter(User.email == employee.email).first()

    if existing_user and existing_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already exists.",
        )

    try:
        if existing_user and not existing_user.is_active:
            existing_employee = (
                db.query(Employee)
                .filter(
                    Employee.user_id == existing_user.id,
                    Employee.is_active.is_(False),
                )
                .first()
            )

            tombstone_email = f"deleted-{existing_user.id}@invalid"

            existing_user.email = tombstone_email

            logger.info(
                "Employee account tombstoned: actor_user_id=%s target_user_id=%s",
                current_user.id,
                existing_user.id,
            )

            if existing_employee:
                existing_employee.email = tombstone_email

        db_user = User(
            name=employee.name,
            email=employee.email,
            password=hash_password(employee.password),
            role=employee.role,
            is_active=True,
            first_login=True,
        )

        db.add(db_user)
        db.flush()

        db_employee = Employee(
            name=employee.name,
            email=employee.email,
            phone=employee.phone,
            user_id=db_user.id,
            created_by=current_user.id,
            is_active=True,
        )

        db.add(db_employee)

        db.commit()
        db.refresh(db_employee)

        return db_employee

    except IntegrityError as err:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already exists.",
        ) from err

    except Exception:
        db.rollback()
        raise


def get_all_employees(
    db: Session,
    current_user: User,
):
    if current_user.role == UserRole.ADMIN:
        return db.query(Employee).filter(Employee.is_active.is_(True)).all()

    employees = (
        db.query(Employee)
        .filter(
            Employee.id.in_(
                visible_employee_ids(
                    db,
                    current_user,
                )
            )
        )
        .all()
    )

    if current_user.role == UserRole.TEAM_MEMBER:
        return [
            TeamMemberEmployeeResponse(
                id=employee.id,
                name=employee.name,
            )
            for employee in employees
        ]

    return employees


def get_employee(
    db: Session,
    employee_id: int,
):
    return (
        db.query(Employee)
        .filter(
            Employee.id == employee_id,
            Employee.is_active.is_(True),
        )
        .first()
    )


def get_employee_for_user(
    db: Session,
    employee_id: int,
    current_user: User,
):
    query = db.query(Employee).filter(
        Employee.id == employee_id,
        Employee.is_active.is_(True),
    )

    if current_user.role == UserRole.ADMIN:
        return query.first()

    employee = query.filter(
        Employee.id.in_(
            visible_employee_ids(
                db,
                current_user,
            )
        )
    ).first()

    if not employee:
        return None

    if current_user.role == UserRole.TEAM_MEMBER:
        return TeamMemberEmployeeResponse(
            id=employee.id,
            name=employee.name,
        )

    return employee


def update_employee(
    db: Session,
    employee_id: int,
    employee: EmployeeUpdate,
    current_user: User,
):
    db_employee = get_employee(
        db,
        employee_id,
    )

    if not db_employee:
        return None

    update_data = employee.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(db_employee, field, value)

    if db_employee.user_id:
        db_user = db.query(User).filter(User.id == db_employee.user_id).first()

        if db_user:
            if "name" in update_data:
                db_user.name = update_data["name"]

            if "email" in update_data:
                db_user.email = update_data["email"]

    try:
        db.commit()
        db.refresh(db_employee)
        return db_employee

    except IntegrityError as err:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already exists.",
        ) from err

    except Exception:
        db.rollback()
        raise


def delete_employee(
    db: Session,
    employee_id: int,
    current_user: User,
):
    db_employee = get_employee(
        db,
        employee_id,
    )

    if not db_employee:
        return False

    if (
        current_user.role != UserRole.ADMIN
        and db_employee.created_by != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this employee",
        )

    if db_employee.user_id:
        deactivate_user(
            db,
            db_employee.user_id,
            current_user,
        )

        if db_employee.is_active:
            db_employee.is_active = False

            try:
                db.commit()
            except Exception:
                db.rollback()
                raise
    else:
        db_employee.is_active = False

        try:
            db.commit()
        except Exception:
            db.rollback()
            raise

    return True


def get_assignable_employees(
    db: Session,
    current_user: User,
    skip: int = 0,
    limit: int = 100,
):
    query = (
        db.query(Employee)
        .join(
            User,
            User.id == Employee.user_id,
        )
        .filter(
            Employee.is_active.is_(True),
            User.is_active.is_(True),
            User.role == UserRole.TEAM_MEMBER,
        )
        .offset(skip)
        .limit(limit)
    )

    return query.all()
