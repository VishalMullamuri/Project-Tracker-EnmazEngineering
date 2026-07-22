from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.models.project import Project
from app.models.employee import Employee
from app.models.project_employee import ProjectEmployee
from app.models.user import User
from app.schemas.project_employee import ProjectEmployeesUpdate
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

@router.put("/{project_id}")
def replace_project_members(
    project_id: int,
    data: ProjectEmployeesUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    project = (
        db.query(Project)
        .filter(Project.id == project_id)
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    employees = (
        db.query(Employee)
        .filter(Employee.id.in_(data.employee_ids))
        .all()
    )

    if len(employees) != len(data.employee_ids):
        raise HTTPException(
            status_code=404,
            detail="One or more employees not found",
        )

    try:
        db.query(ProjectEmployee).filter(
            ProjectEmployee.project_id == project_id
        ).delete()

        for employee_id in data.employee_ids:
            db.add(
                ProjectEmployee(
                    project_id=project_id,
                    employee_id=employee_id,
                )
            )

        db.commit()

    except Exception:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise

    return {
        "message": "Team updated successfully"
    }

@router.post(
    "/",
    status_code=201,
)
def assign(
    data: ProjectEmployeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):

    project = (
        db.query(Project)
        .filter(Project.id == data.project_id)
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    employee = (
        db.query(Employee)
        .filter(Employee.id == data.employee_id)
        .first()
    )

    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Employee not found",
        )

    return assign_employee(
        db,
        data.project_id,
        data.employee_id,
    )


@router.delete("/")
def remove(
    data: ProjectEmployeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):

    project = (
        db.query(Project)
        .filter(Project.id == data.project_id)
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    employee = (
        db.query(Employee)
        .filter(Employee.id == data.employee_id)
        .first()
    )

    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Employee not found",
        )

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
    current_user: User = Depends(get_current_user),
):

    return (
        db.query(ProjectEmployee)
        .all()
    )


@router.get("/{project_id}")
def get_members(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    project = (
        db.query(Project)
        .filter(Project.id == project_id)
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    return get_project_employees(
        db,
        project_id,
    )