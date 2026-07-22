from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.models.user import User
from app.models.task import Task

from app.schemas.task import (
    TaskCreate,
    TaskUpdate,
    TaskResponse,
)

from app.core.security import get_current_user
from app.core.permissions import require_manager

from app.services.task_service import (
    create_task,
    get_all_tasks,
    get_task,
    update_task,
    delete_task,
)

router = APIRouter(
    prefix="/tasks",
    tags=["Tasks"],
)


# ----------------------------------
# Create Task (Manager Only)
# ----------------------------------

@router.post("", response_model=TaskResponse)
def create_new_task(
    task: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    return create_task(
        db,
        task,
        current_user.id,
    )


# ----------------------------------
# Get All Tasks
# ----------------------------------

@router.get("", response_model=list[TaskResponse])
def get_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_all_tasks(
        db,
        current_user,
    )


# ----------------------------------
# Team Member Dashboard Summary
# ----------------------------------

@router.get("/my-work")
def my_work_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    tasks = (
        db.query(Task)
        .filter(
            Task.assigned_to == current_user.id
        )
        .all()
    )

    project_ids = {
        task.project_id
        for task in tasks
    }

    total_projects = len(project_ids)

    total_tasks = len(tasks)

    open_tasks = len(
        [
            task
            for task in tasks
            if task.status != "Completed"
        ]
    )

    closed_tasks = len(
        [
            task
            for task in tasks
            if task.status == "Completed"
        ]
    )

    return {
        "total_projects": total_projects,
        "total_tasks": total_tasks,
        "open_tasks": open_tasks,
        "closed_tasks": closed_tasks,
    }


# ----------------------------------
# Get Single Task
# ----------------------------------

@router.get("/{task_id}", response_model=TaskResponse)
def get_single_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = get_task(
    db,
    task_id,
    current_user,
)

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found",
        )

    return task


# ----------------------------------
# Update Task
# ----------------------------------

@router.put("/{task_id}", response_model=TaskResponse)
def edit_task(
    task_id: int,
    task: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updated = update_task(
        db,
        task_id,
        task,
        current_user,
    )

    if not updated:
        raise HTTPException(
            status_code=403,
            detail="Not allowed to update this task",
        )

    return updated


# ----------------------------------
# Delete Task (Manager Only)
# ----------------------------------

@router.delete("/{task_id}")
def remove_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    deleted = delete_task(
        db,
        task_id,
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Task not found",
        )

    return {
        "message": "Task deleted successfully"
    }