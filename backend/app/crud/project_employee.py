from sqlalchemy.orm import Session

from app.models.project_employee import ProjectEmployee


def assign_employee(
    db: Session,
    project_id: int,
    employee_id: int,
):

    existing = (
        db.query(ProjectEmployee)
        .filter(
            ProjectEmployee.project_id == project_id,
            ProjectEmployee.employee_id == employee_id,
        )
        .first()
    )

    if existing:
        return existing

    assignment = ProjectEmployee(
        project_id=project_id,
        employee_id=employee_id,
    )

    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    return assignment


def remove_employee(
    db: Session,
    project_id: int,
    employee_id: int,
):
    (
        db.query(ProjectEmployee)
        .filter(
            ProjectEmployee.project_id == project_id,
            ProjectEmployee.employee_id == employee_id,
        )
        .delete(synchronize_session=False)
    )

    db.commit()


def get_project_employees(
    db: Session,
    project_id: int,
):

    return (
        db.query(ProjectEmployee).filter(ProjectEmployee.project_id == project_id).all()
    )
