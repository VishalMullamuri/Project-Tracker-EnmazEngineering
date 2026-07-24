from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.schemas.employee import (
    EmployeeCreate,
    EmployeeUpdate,
    EmployeeResponse,
)

from app.crud.employee import (
    create_employee,
    get_all_employees,
    get_employee,
    update_employee,
    delete_employee,
)

from app.models.user import User, UserRole
from app.models.employee import Employee
from app.core.permissions import require_manager

router = APIRouter(
    prefix="/employees",
    tags=["Employees"],
)


# ----------------------------------
# Create Employee (Manager Only)
# ----------------------------------

@router.post(
    "",
    response_model=EmployeeResponse,
)
def create(
    employee: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    return create_employee(
        db,
        employee,
        current_user,
    )


# ----------------------------------
# Get All Employees
# ----------------------------------

@router.get(
    "",
    response_model=list[EmployeeResponse],
)
def get_all(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    if current_user.role == UserRole.ADMIN:
        return get_all_employees(db)

    return (
        db.query(Employee)
        .filter(
            Employee.created_by == current_user.id,
            Employee.is_active.is_(True),
        )
        .all()
    )


# ----------------------------------
# Get Single Employee
# ----------------------------------

@router.get(
    "/{employee_id}",
    response_model=EmployeeResponse,
)
def get(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    employee = get_employee(
        db,
        employee_id,
    )

    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Employee not found",
        )

    if (
        current_user.role != UserRole.ADMIN
        and employee.created_by != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="Not authorized",
        )

    return employee


# ----------------------------------
# Update Employee (Manager Only)
# ----------------------------------

@router.put(
    "/{employee_id}",
    response_model=EmployeeResponse,
)
def update(
    employee_id: int,
    employee: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    updated = update_employee(
        db,
        employee_id,
        employee,
        current_user,
    )

    if not updated:
        raise HTTPException(
            status_code=404,
            detail="Employee not found",
        )

    return updated


# ----------------------------------
# Delete Employee (Manager Only)
# ----------------------------------

@router.delete(
    "/{employee_id}",
)
def delete(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    success = delete_employee(
        db,
        employee_id,
        current_user,
    )

    if not success:
        raise HTTPException(
            status_code=404,
            detail="Employee not found",
        )

    return {
        "message": "Employee deleted successfully",
    }