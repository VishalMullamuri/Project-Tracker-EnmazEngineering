from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.security import get_current_user
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
from app.schemas.employee import EmployeeCreate
from app.core.permissions import (
    require_admin,
    require_manager,
)
from app.models.user import User



router = APIRouter(
    prefix="/employees",
    tags=["Employees"],
)

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
    )


@router.post(
    "",
    response_model=EmployeeResponse,
    status_code=201,
)
def get_all(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_all_employees(
        db,
        skip,
        limit,
    )


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
    )

    if not updated:
        raise HTTPException(
            status_code=404,
            detail="Employee not found",
        )

    return updated


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
    )

    if not success:
        raise HTTPException(
            status_code=404,
            detail="Employee not found",
        )

    return {
        "message": "Employee deleted successfully"
    }