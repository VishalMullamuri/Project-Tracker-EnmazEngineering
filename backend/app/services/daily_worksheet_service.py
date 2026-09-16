import logging
from datetime import date

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.enums import UserRole
from app.core.permissions import visible_employee_ids
from app.models.daily_worksheet import DailyWorksheet, DailyWorksheetTask
from app.models.employee import Employee
from app.models.user import User
from app.schemas.daily_worksheet import DailyWorksheetUpdate

logger = logging.getLogger(__name__)


def _resolve_target_employee(
    db: Session,
    current_user: User,
    employee_id: int | None,
) -> Employee:
    current_employee = (
        db.query(Employee)
        .filter(
            Employee.user_id == current_user.id,
            Employee.is_active.is_(True),
        )
        .first()
    )

    if employee_id is None:
        if not current_employee:
            raise HTTPException(
                status_code=404,
                detail="Employee not found",
            )

        target_employee_id = current_employee.id
    else:
        target_employee_id = employee_id


    if current_employee is not None and target_employee_id == current_employee.id:
        return current_employee

    target_employee = (
        db.query(Employee)
        .filter(
            Employee.id == target_employee_id,
            Employee.is_active.is_(True),
        )
        .first()
    )

    if not target_employee:
        raise HTTPException(
            status_code=404,
            detail="Employee not found",
        )

    target_user = (
        db.query(User)
        .filter(
            User.id == target_employee.user_id,
            User.is_active.is_(True),
            User.role == UserRole.TEAM_MEMBER,
        )
        .first()
    )

    if not target_user:
        raise HTTPException(
            status_code=404,
            detail="Employee not found",
        )

    if current_user.role == UserRole.MANAGER:
        visible_employee = (
            db.query(Employee.id)
            .filter(
                Employee.id == target_employee.id,
                Employee.id.in_(visible_employee_ids(db, current_user)),
            )
            .first()
        )

        if not visible_employee:
            raise HTTPException(
                status_code=404,
                detail="Employee not found",
            )
    elif current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=404,
            detail="Employee not found",
        )

    return target_employee


def get_daily_worksheet(
    db: Session,
    current_user: User,
    worksheet_date: date,
    employee_id: int | None = None,
) -> DailyWorksheet | None:
    target_employee = _resolve_target_employee(
        db,
        current_user,
        employee_id,
    )

    worksheet = (
        db.query(DailyWorksheet)
        .filter(
            DailyWorksheet.employee_id == target_employee.id,
            DailyWorksheet.worksheet_date == worksheet_date,
        )
        .first()
    )

    return worksheet


def update_daily_worksheet(
    db: Session,
    current_user: User,
    worksheet_date: date,
    data: DailyWorksheetUpdate,
    employee_id: int | None = None,
) -> DailyWorksheet:
    target_employee = _resolve_target_employee(
        db,
        current_user,
        employee_id,
    )

    worksheet = (
        db.query(DailyWorksheet)
        .filter(
            DailyWorksheet.employee_id == target_employee.id,
            DailyWorksheet.worksheet_date == worksheet_date,
        )
        .first()
    )

    if not worksheet:
        worksheet = DailyWorksheet(
            employee_id=target_employee.id,
            worksheet_date=worksheet_date,
        )
        db.add(worksheet)
        db.flush()

    for task_data in data.tasks:
        if task_data.id is not None:
            task = (
                db.query(DailyWorksheetTask)
                .filter(
                    DailyWorksheetTask.id == task_data.id,
                    DailyWorksheetTask.worksheet_id == worksheet.id,
                )
                .first()
            )

            if not task:
                raise HTTPException(
                    status_code=404,
                    detail="Daily worksheet task not found",
                )

            task.title = task_data.title
            task.description = task_data.description
            task.status = task_data.status.value
            task.remarks = task_data.remarks
        else:
            task = DailyWorksheetTask(
                worksheet_id=worksheet.id,
                title=task_data.title,
                description=task_data.description,
                status=task_data.status.value,
                remarks=task_data.remarks,
            )
            db.add(task)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Daily worksheet already exists",
        ) from None

    db.refresh(worksheet)

    logger.info(
        "Daily worksheet updated: actor_user_id=%s target_worksheet_id=%s "
        "target_employee_id=%s",
        current_user.id,
        worksheet.id,
        target_employee.id,
    )

    return worksheet


def delete_daily_worksheet_task(
    db: Session,
    current_user: User,
    task_id: int,
) -> dict:
    task = (
        db.query(DailyWorksheetTask)
        .filter(DailyWorksheetTask.id == task_id)
        .first()
    )

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Daily worksheet task not found",
        )

    worksheet = (
        db.query(DailyWorksheet)
        .filter(DailyWorksheet.id == task.worksheet_id)
        .first()
    )

    if not worksheet:
        raise HTTPException(
            status_code=404,
            detail="Daily worksheet not found",
        )

    target_employee = _resolve_target_employee(
        db,
        current_user,
        worksheet.employee_id,
    )

    logger.info(
        "Daily worksheet task deleted: actor_user_id=%s target_task_id=%s "
        "target_worksheet_id=%s target_employee_id=%s",
        current_user.id,
        task.id,
        worksheet.id,
        target_employee.id,
    )

    db.delete(task)
    db.commit()

    return {"message": "Daily worksheet task deleted successfully"}