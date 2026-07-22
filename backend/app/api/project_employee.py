from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.models.project_employee import ProjectEmployee
from app.models.user import User

from app.schemas.project_employee import (
    ProjectEmployeeCreate,
)

from app.crud.project_employee import (
    assign_employee,
    remove_employee,
    get_project_employees,
)

from app.core.security import get_current_user
from app.core.permissions import require_manager

router = APIRouter(
    prefix="/project-employees",
    tags=["Project Employees"],
)


# ----------------------------------
# Assign Employee to Project
# ----------------------------------

@router.post("")
def assign(
    data: ProjectEmployeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    return assign_employee(
        db,
        data.project_id,
        data.employee_id,
    )


# ----------------------------------
# Remove Employee from Project
# ----------------------------------

@router.delete("")
def remove(
    data: ProjectEmployeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    remove_employee(
        db,
        data.project_id,
        data.employee_id,
    )

    return {
        "message": "Employee removed successfully"
    }


# ----------------------------------
# Get All Assignments
# ----------------------------------

@router.get("/all")
def get_all_assignments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(ProjectEmployee)
        .all()
    )


# ----------------------------------
# Get Members of a Project
# ----------------------------------

@router.get("/{project_id}")
def get_members(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_project_employees(
        db,
        project_id,
    )