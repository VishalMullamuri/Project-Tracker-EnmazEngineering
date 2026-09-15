import logging
from datetime import date

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.enums import UserRole
from app.core.permissions import visible_employee_ids
from app.models.daily_worksheet import (
    DailyWorksheet,
    DailyWorksheetTask,
)
from app.models.employee import Employee
from app.models.user import User
from app.schemas.daily_worksheet import DailyWorksheetUpdate

logger = logging.getLogger(__name__)


def get_daily_worksheet(
    db: Session,
    current_user: User,
    worksheet_date: date,
    employee_id: int | None = None,
):
    current_employee = (
        db.query(Employee)
        .filter(
            Employee.user_id == current_user.id,
            Employee.is_active.is_(True),
        )
        .first()
    )

    if not current_employee:
        raise HTTPException(
            status_code=404,
            detail="Employee not found",
        )

    target_employee_id = (
        employee_id
        if employee_id is not None
        else current_employee.id
    )

    if target_employee_id != current_employee.id:
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
            employee = (
                db.query(Employee)
                .filter(
                    Employee.id == target_employee_id,
                    Employee.is_active.is_(True),
                    Employee.id.in_(
                        visible_employee_ids(
                            db,
                            current_user,
                        )
                    ),
                )
                .first()
            )

            if not employee:
                raise HTTPException(
                    status_code=404,
                    detail="Employee not found",
                )

        elif current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=404,
                detail="Employee not found",
            )

    worksheet = (
        db.query(DailyWorksheet)
        .filter(
            DailyWorksheet.employee_id == target_employee_id,
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
):
    current_employee = (
        db.query(Employee)
        .filter(
            Employee.user_id == current_user.id,
            Employee.is_active.is_(True),
        )
        .first()
    )

    if not current_employee:
        raise HTTPException(
            status_code=404,
            detail="Employee not found",
        )

    target_employee_id = (
        employee_id
        if employee_id is not None
        else current_employee.id
    )

    if target_employee_id != current_employee.id:
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
            employee = (
                db.query(Employee)
                .filter(
                    Employee.id == target_employee_id,
                    Employee.is_active.is_(True),
                    Employee.id.in_(
                        visible_employee_ids(
                            db,
                            current_user,
                        )
                    ),
                )
                .first()
            )

            if not employee:
                raise HTTPException(
                    status_code=404,
                    detail="Employee not found",
                )

        elif current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=404,
                detail="Employee not found",
            )

    worksheet = (
        db.query(DailyWorksheet)
        .filter(
            DailyWorksheet.employee_id == target_employee_id,
            DailyWorksheet.worksheet_date == worksheet_date,
        )
        .first()
    )

    if not worksheet:
        worksheet = DailyWorksheet(
            employee_id=target_employee_id,
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
            task.status = task_data.status
            task.remarks = task_data.remarks

        else:
            task = DailyWorksheetTask(
                worksheet_id=worksheet.id,
                title=task_data.title,
                description=task_data.description,
                status=task_data.status,
                remarks=task_data.remarks,
            )
            db.add(task)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Daily worksheet already exists for this date",
        ) from None

    db.refresh(worksheet)

    logger.info(
        "Daily worksheet updated: "
        "actor_user_id=%s target_worksheet_id=%s "
        "target_employee_id=%s",
        current_user.id,
        worksheet.id,
        worksheet.employee_id,
    )

    return worksheet


def delete_daily_worksheet_task(
    db: Session,
    current_user: User,
    task_id: int,
):
    current_employee = (
        db.query(Employee)
        .filter(
            Employee.user_id == current_user.id,
            Employee.is_active.is_(True),
        )
        .first()
    )

    if not current_employee:
        raise HTTPException(
            status_code=404,
            detail="Employee not found",
        )

    task = (
        db.query(DailyWorksheetTask)
        .join(
            DailyWorksheet,
            DailyWorksheet.id == DailyWorksheetTask.worksheet_id,
        )
        .filter(
            DailyWorksheetTask.id == task_id,
        )
        .first()
    )

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Daily worksheet task not found",
        )

    worksheet = (
        db.query(DailyWorksheet)
        .filter(
            DailyWorksheet.id == task.worksheet_id,
        )
        .first()
    )

    if worksheet.employee_id != current_employee.id:
        if current_user.role == UserRole.MANAGER:
            employee = (
                db.query(Employee)
                .filter(
                    Employee.id == worksheet.employee_id,
                    Employee.is_active.is_(True),
                    Employee.id.in_(
                        visible_employee_ids(
                            db,
                            current_user,
                        )
                    ),
                )
                .first()
            )

            if not employee:
                raise HTTPException(
                    status_code=404,
                    detail="Daily worksheet task not found",
                )

        elif current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=404,
                detail="Daily worksheet task not found",
            )

    logger.info(
        "Daily worksheet task deleted: "
        "actor_user_id=%s target_task_id=%s "
        "target_worksheet_id=%s target_employee_id=%s",
        current_user.id,
        task.id,
        worksheet.id,
        worksheet.employee_id,
    )

    db.delete(task)
    db.commit()

    return {
        "message": "Daily worksheet task deleted successfully"
    }