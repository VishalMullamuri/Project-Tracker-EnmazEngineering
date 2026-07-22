from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from sqlalchemy.orm import Session
from app.services import project_service
from app.database.database import get_db

from app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
)

from app.models.user import User

from app.core.security import get_current_user
from app.core.permissions import require_manager

from app.services.project_service import (
    create_project,
    get_all_projects,
    get_project_by_id,
    update_project,
    delete_project,
)

router = APIRouter(
    prefix="/projects",
    tags=["Projects"],
)


# ------------------------------------
# Create Project
# ------------------------------------

@router.post(
    "",
    response_model=ProjectResponse,
    status_code=201,
)
def create_new_project(
    project: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    return create_project(
        db,
        project,
        current_user.id,
    )


# ------------------------------------
# Get All Projects
# ------------------------------------

@router.get(
    "",
    response_model=list[ProjectResponse],
)
def get_projects(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return project_service.get_all_projects(
        db,
        current_user,
        skip,
        limit,
    )


# ------------------------------------
# Get Project By ID
# ------------------------------------

@router.get(
    "/{project_id}",
    response_model=ProjectResponse,
)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = get_project_by_id(
        db,
        project_id,
        current_user,
    )

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    return project


# ------------------------------------
# Update Project
# ------------------------------------

@router.put(
    "/{project_id}",
    response_model=ProjectResponse,
)
def edit_project(
    project_id: int,
    project: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    updated_project = update_project(
    db,
    project_id,
    project,
    current_user,
)

    if not updated_project:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    return updated_project


# ------------------------------------
# Delete Project
# ------------------------------------

@router.delete(
    "/{project_id}"
)
def remove_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    deleted = delete_project(
    db,
    project_id,
    current_user,
)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    return {
        "message": "Project deleted successfully"
    }