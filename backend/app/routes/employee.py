from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.permissions import require_admin
from app.core.security import get_current_user
from app.crud.employee import (
    create_employee,
    delete_employee,
    get_all_employees,
    get_employee,
    update_employee,
)
from app.database.database import get_db
from app.models.user import User
from app.schemas.employee import (
    EmployeeCreate,
    EmployeeResponse,
    EmployeeUpdate,
)

router = APIRouter(
    prefix="/employees",
    tags=["Employees"],
)


# ----------------------------------
# Create Employee (Admin Only)
# ----------------------------------

@router.post(
    "",
    response_model=EmployeeResponse,
)
def create(
    employee: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
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
    current_user: User = Depends(get_current_user),
):
    return get_all_employees(
        db,
        current_user,
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
    current_user: User = Depends(get_current_user),
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

    return employee


# ----------------------------------
# Update Employee
# ----------------------------------

@router.put(
    "/{employee_id}",
    response_model=EmployeeResponse,
)
def update(
    employee_id: int,
    employee: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
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
# Delete Employee (Admin Only)
# ----------------------------------

@router.delete(
    "/{employee_id}",
)
def delete(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
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