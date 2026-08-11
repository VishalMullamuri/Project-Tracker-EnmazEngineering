import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.permissions import (
    require_manager,
    require_manager_or_project_member,
    visible_employee_ids,
)
from app.crud.project_employee import (
    assign_employee,
    get_project_employees,
    remove_employee,
)
from app.database.database import get_db
from app.models.employee import Employee
from app.models.project import Project
from app.models.project_employee import ProjectEmployee
from app.models.user import User, UserRole
from app.schemas.project_employee import (
    ProjectEmployeeCreate,
)

router = APIRouter(
    prefix="/project-employees",
    tags=["Project Employees"],
)

logger = logging.getLogger(__name__)


# ----------------------------------
# Assign Employee to Project
# ----------------------------------


@router.post("")
def assign(
    data: ProjectEmployeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    query = db.query(Project).filter(Project.id == data.project_id)

    if current_user.role != UserRole.ADMIN:
        query = query.filter(Project.created_by == current_user.id)

    project = query.first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    employee = (
        db.query(Employee)
        .filter(
            Employee.id == data.employee_id,
            Employee.is_active.is_(True),
        )
        .first()
    )

    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found",
        )

    user = (
        db.query(User)
        .filter(
            User.id == employee.user_id,
            User.is_active.is_(True),
            User.role == UserRole.TEAM_MEMBER,
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found",
        )

    result = assign_employee(
        db,
        data.project_id,
        data.employee_id,
    )

    logger.info(
        "Project employee assigned: actor_user_id=%s "
        "target_employee_id=%s project_id=%s",
        current_user.id,
        data.employee_id,
        data.project_id,
    )

    return result


# ----------------------------------
# Remove Employee from Project
# ----------------------------------


@router.delete("")
def remove(
    data: ProjectEmployeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    query = db.query(Project).filter(Project.id == data.project_id)

    if current_user.role != UserRole.ADMIN:
        query = query.filter(Project.created_by == current_user.id)

    project = query.first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    remove_employee(
        db,
        data.project_id,
        data.employee_id,
    )

    logger.info(
        "Project employee removed: actor_user_id=%s "
        "target_employee_id=%s project_id=%s",
        current_user.id,
        data.employee_id,
        data.project_id,
    )

    return {"message": "Employee removed successfully"}


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
        query = query.join(
            Project,
            Project.id == ProjectEmployee.project_id,
        ).filter(Project.created_by == current_user.id)

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
    assignments = get_project_employees(
        db,
        project_id,
    )

    if current_user.role == UserRole.TEAM_MEMBER:
        visible_ids = set(
            db.execute(
                visible_employee_ids(
                    db,
                    current_user,
                )
            )
            .scalars()
            .all()
        )

        return [
            assignment
            for assignment in assignments
            if assignment.employee_id in visible_ids
        ]

    return assignments
