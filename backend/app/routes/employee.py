import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.enums import UserRole
from app.core.permissions import require_admin, require_manager
from app.core.security import get_current_user
from app.crud.employee import (
    create_employee,
    delete_employee,
    get_all_employees,
    get_assignable_employees,
    get_employee_for_user,
    update_employee,
)
from app.database.database import get_db
from app.models.user import User
from app.schemas.employee import (
    AssignableEmployeeResponse,
    EmployeeCreate,
    EmployeeResponse,
    EmployeeUpdate,
    TeamMemberEmployeeResponse,
)

router = APIRouter(
    prefix="/employees",
    tags=["Employees"],
)

logger = logging.getLogger(__name__)


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
    result = create_employee(
        db,
        employee,
        current_user,
    )

    logger.info(
        "Employee created: actor_user_id=%s target_employee_id=%s",
        current_user.id,
        result.id,
    )

    return result


# ----------------------------------
# Get All Employees
# ----------------------------------


@router.get(
    "",
    response_model=None,
    responses={200: {"model": list[EmployeeResponse]}},
)
def get_all(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[EmployeeResponse] | list[TeamMemberEmployeeResponse]:
    employees = get_all_employees(
        db,
        current_user,
    )

    if current_user.role == UserRole.MANAGER:
        logger.info(
            "Employees viewed: actor_user_id=%s employee_count=%s",
            current_user.id,
            len(employees),
        )

    if current_user.role == UserRole.TEAM_MEMBER:
        return [
            TeamMemberEmployeeResponse(
                id=employee.id,
                name=employee.name,
            )
            for employee in employees
        ]

    return [
    EmployeeResponse(
        id=employee.id,
        user_id=employee.user_id,
        name=employee.name,
        email=employee.email,
        phone=employee.phone,
        role=employee.user.role,
    )
    for employee in employees
]


# ----------------------------------
# Get Assignable Employees
# ----------------------------------


@router.get(
    "/assignable",
    response_model=list[AssignableEmployeeResponse],
)
def get_assignable(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    return get_assignable_employees(
        db,
        current_user,
        skip,
        limit,
    )


# ----------------------------------
# Get Single Employee
# ----------------------------------


@router.get(
    "/{employee_id}",
    response_model=None,
    responses={200: {"model": EmployeeResponse}},
)
def get(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> EmployeeResponse | TeamMemberEmployeeResponse:
    employee = get_employee_for_user(
        db,
        employee_id,
        current_user,
    )

    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Employee not found",
        )

    if current_user.role == UserRole.TEAM_MEMBER:
        return TeamMemberEmployeeResponse(
            id=employee.id,
            name=employee.name,
        )

    return EmployeeResponse.model_validate(employee)


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

    logger.info(
        "Employee updated: actor_user_id=%s target_employee_id=%s",
        current_user.id,
        employee_id,
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

    logger.info(
        "Employee deleted: actor_user_id=%s target_employee_id=%s",
        current_user.id,
        employee_id,
    )

    return {
        "message": "Employee deleted successfully",
    }
