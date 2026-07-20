from sqlalchemy.orm import Session

from app.models.project_member import ProjectMember


def assign_member(
    db: Session,
    project_id: int,
    user_id: int,
):
    existing = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id,
        )
        .first()
    )

    if existing:
        return None

    member = ProjectMember(
        project_id=project_id,
        user_id=user_id,
    )

    db.add(member)
    db.commit()
    db.refresh(member)

    return member


def get_project_members(
    db: Session,
    project_id: int,
):
    return (
        db.query(ProjectMember)
        .filter(ProjectMember.project_id == project_id)
        .all()
    )


def remove_member(
    db: Session,
    project_id: int,
    user_id: int,
):
    member = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id,
        )
        .first()
    )

    if not member:
        return False

    db.delete(member)
    db.commit()

    return True