from datetime import date

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
)
from sqlalchemy.orm import Session

from app.core.enums import UserRole
from app.core.security import get_current_user
from app.database.database import get_db
from app.models.user import User
from app.schemas.weekly_planner import (
    WeeklyPlannerCreate,
    WeeklyPlannerResponse,
    WeeklyPlannerStatus,
    WeeklyPlannerUpdate,
)
from app.services.weekly_planner_service import (
    create_weekly_task,
    delete_weekly_task,
    get_weekly_task,
    get_weekly_tasks,
    update_weekly_task,
)

router = APIRouter(
    prefix="/weekly-planner",
    tags=["Weekly Planner"],
)


def require_planner_manager(
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in (
        UserRole.ADMIN,
        UserRole.MANAGER,
    ):
        raise HTTPException(
            status_code=403,
            detail="Only admins and managers can modify the weekly planner",
        )

    return current_user


@router.get(
    "",
    response_model=list[WeeklyPlannerResponse],
)
def get_planner(
    week_start: date | None = Query(default=None),
    status_filter: WeeklyPlannerStatus | None = Query(
        default=None,
        alias="status",
    ),
    employee_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_planner_manager),
):
    return get_weekly_tasks(
        db=db,
        current_user=current_user,
        week_start=week_start,
        status_filter=status_filter,
        employee_id=employee_id,
    )


@router.get(
    "/{task_id}",
    response_model=WeeklyPlannerResponse,
)
def get_single_planner_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_planner_manager),
):
    task = get_weekly_task(
        db,
        task_id,
        current_user,
    )

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Weekly planner task not found",
        )

    return task


@router.post(
    "",
    response_model=WeeklyPlannerResponse,
)
def create_planner_task(
    planner: WeeklyPlannerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_planner_manager),
):
    return create_weekly_task(
        db,
        planner,
        current_user,
    )


@router.put(
    "/{task_id}",
    response_model=WeeklyPlannerResponse,
)
def edit_planner_task(
    task_id: int,
    planner: WeeklyPlannerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_planner_manager),
):
    return update_weekly_task(
        db,
        task_id,
        planner,
        current_user,
    )


@router.delete("/{task_id}")
def remove_planner_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_planner_manager),
):
    deleted = delete_weekly_task(
        db,
        task_id,
        current_user,
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Weekly planner task not found",
        )

    return {
        "message": "Weekly planner task deleted successfully"
    }