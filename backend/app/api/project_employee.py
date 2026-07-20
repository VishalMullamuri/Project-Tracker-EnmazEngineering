from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.project_employee import ProjectEmployee
from app.schemas.project_employee import (
    ProjectEmployeeCreate,
)

from app.crud.project_employee import (
    assign_employee,
    remove_employee,
    get_project_employees,
)

router = APIRouter(
    prefix="/project-employees",
    tags=["Project Employees"],
)


@router.post("/")
def assign(
    data: ProjectEmployeeCreate,
    db: Session = Depends(get_db),
):
    return assign_employee(
        db,
        data.project_id,
        data.employee_id,
    )


@router.delete("/")
def remove(
    data: ProjectEmployeeCreate,
    db: Session = Depends(get_db),
):
    remove_employee(
        db,
        data.project_id,
        data.employee_id,
    )

    return {
        "message": "Employee removed successfully"
    }

@router.get("/all")
def get_all_assignments(
    db: Session = Depends(get_db),
):

    return (
        db.query(ProjectEmployee)
        .all()
    )


@router.get("/{project_id}")
def get_members(
    project_id: int,
    db: Session = Depends(get_db),
):
    return get_project_employees(
        db,
        project_id,
    )