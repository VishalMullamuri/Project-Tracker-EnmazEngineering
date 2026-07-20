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
from app.schemas.employee import EmployeeCreate
from app.core.permissions import (
    require_admin,
    require_manager,
)
from app.models.user import User, UserRole

print(EmployeeCreate.model_json_schema())

router = APIRouter(
    prefix="/employees",
    tags=["Employees"],
)

@router.post(
    "/",
    response_model=EmployeeResponse,
)
def create(
    employee: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    if (
        current_user.role == UserRole.MANAGER
        and employee.role != UserRole.TEAM_MEMBER
    ):
        raise HTTPException(
            status_code=403,
            detail="Managers can only create Team Members",
        )
    
    print("Received role:", employee.role)

    return create_employee(
        db,
        employee,
    )


@router.get(
    "/",
    response_model=list[EmployeeResponse],
)
def get_all(
    db: Session = Depends(get_db),
):
    return get_all_employees(db)


@router.get(
    "/{employee_id}",
    response_model=EmployeeResponse,
)
def get(
    employee_id: int,
    db: Session = Depends(get_db),
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