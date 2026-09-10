# backend/app/services/daily_worksheet_service.py

from datetime import date

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.enums import UserRole
from app.models.daily_worksheet import (
    DailyWorksheet,
    DailyWorksheetTask,
)
from app.models.user import User
from app.schemas.daily_worksheet import (
    DailyWorksheetCreate,
    DailyWorksheetUpdate,
)


def get_daily_worksheet(
    db: Session,
    current_user: User,
    worksheet_date: date,
    employee_id: int | None = None,
):
    target_employee_id = (
        employee_id
        if employee_id is not None
        else current_user.id
    )

    if target_employee_id != current_user.id:
        if current_user.role not in (
            UserRole.ADMIN,
            UserRole.MANAGER,
        ):
            raise HTTPException(
                status_code=403,
                detail=(
                    "Only admins and managers can view "
                    "another employee's worksheet"
                ),
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


def create_daily_worksheet(
    db: Session,
    current_user: User,
    worksheet_date: date,
    data: DailyWorksheetCreate,
):
    worksheet = get_daily_worksheet(
        db=db,
        current_user=current_user,
        worksheet_date=worksheet_date,
    )

    if worksheet:
        raise HTTPException(
            status_code=409,
            detail="Daily worksheet already exists for this date",
        )

    worksheet = DailyWorksheet(
        employee_id=current_user.id,
        worksheet_date=worksheet_date,
    )

    db.add(worksheet)
    db.flush()

    for task_data in data.tasks:
        task = DailyWorksheetTask(
            worksheet_id=worksheet.id,
            title=task_data.title,
            description=task_data.description,
            status=task_data.status,
            remarks=task_data.remarks,
        )
        db.add(task)

    db.commit()
    db.refresh(worksheet)

    return worksheet


def update_daily_worksheet(
    db: Session,
    current_user: User,
    worksheet_date: date,
    data: DailyWorksheetUpdate,
    employee_id: int | None = None,
):
    target_employee_id = (
        employee_id
        if employee_id is not None
        else current_user.id
    )

    if target_employee_id != current_user.id:
        if current_user.role not in (
            UserRole.ADMIN,
            UserRole.MANAGER,
        ):
            raise HTTPException(
                status_code=403,
                detail=(
                    "Only admins and managers can update another "
                    "employee's worksheet"
                ),
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

    db.commit()
    db.refresh(worksheet)

    return worksheet


def delete_daily_worksheet_task(
    db: Session,
    current_user: User,
    task_id: int,
):
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

    if worksheet.employee_id != current_user.id:
        if current_user.role not in (
            UserRole.ADMIN,
            UserRole.MANAGER,
        ):
            raise HTTPException(
                status_code=403,
                detail=(
                    "You do not have permission to delete "
                    "this worksheet task"
                ),
            )

    db.delete(task)
    db.commit()

    return {
        "message": "Daily worksheet task deleted successfully"
    }