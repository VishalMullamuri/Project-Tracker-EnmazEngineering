from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.models.project import Project
from app.models.employee import Employee
from app.models.project_employee import ProjectEmployee
from app.models.user import User, UserRole

from app.schemas.project_employee import (
    ProjectEmployeeCreate,
)

from app.crud.project_employee import (
    assign_employee,
    remove_employee,
    get_project_employees,
)

from app.core.permissions import (
    require_manager,
    require_manager_or_project_member,
)

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
    project = (
        db.query(Project)
        .filter(Project.id == data.project_id)
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    if (
        current_user.role != UserRole.ADMIN
        and project.created_by != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this project",
        )

    employee = (
        db.query(Employee)
        .filter(
            Employee.id == data.employee_id,
            Employee.is_active.is_(True),
        )
    )

    if current_user.role != UserRole.ADMIN:
        employee = employee.filter(
            Employee.created_by == current_user.id
        )

    employee = employee.first()

    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found",
        )

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
    project = (
        db.query(Project)
        .filter(Project.id == data.project_id)
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    if (
        current_user.role != UserRole.ADMIN
        and project.created_by != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this project",
    )

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
    current_user: User = Depends(require_manager),
):
    query = db.query(ProjectEmployee)

    if current_user.role != UserRole.ADMIN:
        query = (
            query.join(
                Project,
                Project.id == ProjectEmployee.project_id,
            )
            .filter(
                Project.created_by == current_user.id
            )
        )

    return query.all()


# ----------------------------------
# Get Members of a Project
# ----------------------------------

@router.get("/{project_id}")
def get_members(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_project_member),
):
    return get_project_employees(
        db,
        project_id,
    )