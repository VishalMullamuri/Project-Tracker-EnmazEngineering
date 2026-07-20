from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.schemas.project_member import (
    ProjectMemberCreate,
    ProjectMemberResponse,
)

from app.core.permissions import require_manager

from app.services.project_member_service import (
    assign_member,
    get_project_members,
    remove_member,
)

router = APIRouter(
    prefix="/project-members",
    tags=["Project Members"],
)


@router.post(
    "",
    response_model=ProjectMemberResponse,
)
def assign_project_member(
    data: ProjectMemberCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_manager),
):
    member = assign_member(
        db,
        data.project_id,
        data.user_id,
    )

    if not member:
        raise HTTPException(
            status_code=400,
            detail="User already assigned",
        )

    return member


@router.get("/{project_id}")
def view_project_members(
    project_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_manager),
):
    return get_project_members(
        db,
        project_id,
    )


@router.delete("/{project_id}/{user_id}")
def delete_project_member(
    project_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_manager),
):
    deleted = remove_member(
        db,
        project_id,
        user_id,
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Member not found",
        )

    return {
        "message": "Member removed successfully"
    }