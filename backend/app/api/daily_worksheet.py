from datetime import date

from fastapi import (
    APIRouter,
    Depends,
    Query,
)
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database.database import get_db
from app.models.user import User
from app.schemas.daily_worksheet import (
    DailyWorksheetCreate,
    DailyWorksheetResponse,
    DailyWorksheetUpdate,
)
from app.services.daily_worksheet_service import (
    create_daily_worksheet,
    delete_daily_worksheet_task,
    get_daily_worksheet,
    update_daily_worksheet,
)

router = APIRouter(
    prefix="/daily-worksheets",
    tags=["Daily Worksheets"],
)


@router.get(
    "",
    response_model=DailyWorksheetResponse | None,
)
def get_worksheet(
    worksheet_date: date = Query(..., alias="date"),
    employee_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_daily_worksheet(
        db=db,
        current_user=current_user,
        worksheet_date=worksheet_date,
        employee_id=employee_id,
    )


@router.post(
    "",
    response_model=DailyWorksheetResponse,
)
def create_worksheet(
    worksheet: DailyWorksheetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_daily_worksheet(
        db=db,
        current_user=current_user,
        worksheet_date=worksheet.worksheet_date,
        data=worksheet,
    )


@router.put(
    "",
    response_model=DailyWorksheetResponse,
)
def update_worksheet(
    worksheet: DailyWorksheetUpdate,
    worksheet_date: date = Query(..., alias="date"),
    employee_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return update_daily_worksheet(
        db=db,
        current_user=current_user,
        worksheet_date=worksheet_date,
        data=worksheet,
        employee_id=employee_id,
    )


@router.delete("/tasks/{task_id}")
def delete_worksheet_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return delete_daily_worksheet_task(
        db=db,
        current_user=current_user,
        task_id=task_id,
    )