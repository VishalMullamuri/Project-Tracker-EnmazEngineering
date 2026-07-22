from sqlalchemy.orm import Session

from app.models.employee import Employee
from app.models.user import User, UserRole

from app.schemas.employee import (
    EmployeeCreate,
    EmployeeUpdate,
)

from app.core.security import hash_password


def create_employee(
    db: Session,
    employee: EmployeeCreate,
):

    existing_user = (
        db.query(User)
        .filter(
            User.email == employee.email
        )
        .first()
    )

    if existing_user:
        raise Exception(
            "User already exists."
        )

    db_user = User(
        name=employee.name,
        email=employee.email,
        password=hash_password(employee.password),
        role=UserRole.TEAM_MEMBER,
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    db_employee = Employee(
        name=employee.name,
        email=employee.email,
        phone=employee.phone,
        user_id=db_user.id,
    )

    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)

    return db_employee


def get_all_employees(
    db: Session,
):
    return db.query(Employee).all()


def get_employee(
    db: Session,
    employee_id: int,
):
    return (
        db.query(Employee)
        .filter(
            Employee.id == employee_id
        )
        .first()
    )


def update_employee(
    db: Session,
    employee_id: int,
    employee: EmployeeUpdate,
):
    db_employee = get_employee(
        db,
        employee_id,
    )

    if not db_employee:
        return None

    db_employee.name = employee.name
    db_employee.email = employee.email
    db_employee.phone = employee.phone

    if db_employee.user_id:

        db_user = (
            db.query(User)
            .filter(
                User.id == db_employee.user_id
            )
            .first()
        )

        if db_user:
            db_user.name = employee.name
            db_user.email = employee.email

    db.commit()
    db.refresh(db_employee)

    return db_employee


def delete_employee(
    db: Session,
    employee_id: int,
):
    db_employee = get_employee(
        db,
        employee_id,
    )

    if not db_employee:
        return False

    if db_employee.user_id:

        db_user = (
            db.query(User)
            .filter(
                User.id == db_employee.user_id
            )
            .first()
        )

        if db_user:
            db.delete(db_user)

    db.delete(db_employee)

    db.commit()

    return True