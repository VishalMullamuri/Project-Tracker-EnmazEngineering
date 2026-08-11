import logging

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.core.permissions import (
    require_admin,
    require_manager,
    require_team_member,
)
from app.core.rate_limit import limiter
from app.core.security import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.database.database import get_db
from app.models.user import User
from app.schemas.user import (
    ChangePassword,
    Token,
    UserCreate,
    UserLogin,
    UserResponse,
)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)

logger = logging.getLogger(__name__)

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)

DUMMY_PASSWORD_HASH = pwd_context.hash("dummy-password-for-timing")


# -----------------------------------
# Register User
# -----------------------------------
@router.post(
    "/register",
    response_model=UserResponse,
)
@limiter.limit("5/minute")
def register_user(
    request: Request,
    response: Response,
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    existing_user = db.query(User).filter(User.email == user.email).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered",
        )

    new_user = User(
        name=user.name,
        email=user.email,
        password=hash_password(user.password),
        role=user.role,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


# -----------------------------------
# Login User
# -----------------------------------
@router.post(
    "/login",
    response_model=Token,
)
@limiter.limit("5/minute")
def login_user(
    request: Request,
    response: Response,
    user: UserLogin,
    db: Session = Depends(get_db),
):
    db_user = db.query(User).filter(User.email == user.email).first()

    if not db_user:
        verify_password(
            user.password,
            DUMMY_PASSWORD_HASH,
        )

        logger.warning(
            "Login failed: reason=invalid_credentials email=%s",
            user.email,
        )

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    if not verify_password(
        user.password,
        db_user.password,
    ):
        logger.warning(
            "Login failed: reason=invalid_credentials target_user_id=%s",
            db_user.id,
        )

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    if not db_user.is_active:
        logger.warning(
            "Login failed: reason=inactive_user target_user_id=%s",
            db_user.id,
        )

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    access_token = create_access_token(
        data={
            "sub": str(db_user.id),
            "role": db_user.role.value,
            "token_version": db_user.token_version,
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": db_user.role,
        "first_login": db_user.first_login,
    }


# -----------------------------------
# Current Logged-in User
# -----------------------------------
@router.get(
    "/me",
    response_model=UserResponse,
)
def get_logged_in_user(
    current_user: User = Depends(get_current_user),
):
    return current_user


# -----------------------------------
# Admin Only Route
# -----------------------------------
@router.get("/admin-only")
def admin_only(
    current_user: User = Depends(require_admin),
):
    return {
        "message": "Welcome Admin!",
        "user": current_user.name,
        "role": current_user.role,
    }


# -----------------------------------
# Manager Only Route
# -----------------------------------
@router.get("/manager-only")
def manager_only(
    current_user: User = Depends(require_manager),
):
    return {
        "message": "Welcome Manager!",
        "user": current_user.name,
        "role": current_user.role,
    }


# -----------------------------------
# Team Member Only Route
# -----------------------------------
@router.get("/team-member-only")
def team_member_only(
    current_user: User = Depends(require_team_member),
):
    return {
        "message": "Welcome Team Member!",
        "user": current_user.name,
        "role": current_user.role,
    }


# -----------------------------------
# Change Password
# -----------------------------------
@router.put("/change-password")
@limiter.limit("5/minute")
def change_password(
    request: Request,
    response: Response,
    data: ChangePassword,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(
        data.current_password,
        current_user.password,
    ):
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect",
        )

    current_user.password = hash_password(data.new_password)

    current_user.first_login = False
    current_user.token_version += 1

    db.commit()

    logger.warning(
        "Password changed: actor_user_id=%s",
        current_user.id,
    )

    access_token = create_access_token(
        data={
            "sub": str(current_user.id),
            "role": current_user.role.value,
            "token_version": current_user.token_version,
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": current_user.role,
        "first_login": False,
    }
