from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User

from app.schemas.user import (
    UserCreate,
    UserLogin,
    UserResponse,
    Token,
    ChangePassword,
)

from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    validate_password,
)

from app.core.permissions import (
    require_admin,
)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)

DUMMY_PASSWORD_HASH = (
    "$2b$12$C6UzMDM.H6dfI/f/IKcEe."
    "DCq7YPn5Rq63x1Lad4cllYQ8Q4hG2Ga"
)


# -----------------------------------
# Register User
# -----------------------------------
@router.post(
    "/register",
    response_model=UserResponse,
    status_code=201,
)
def register_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    existing_user = (
        db.query(User)
        .filter(User.email == user.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered",
        )
    
    if not validate_password(user.password):
        raise HTTPException(
            status_code=400,
            detail=(
                "Password must be at least 8 characters long and contain "
                "an uppercase letter, lowercase letter, number, and special character."
            ),
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
def login_user(
    login: UserLogin,
    db: Session = Depends(get_db),
):
    db_user = (
        db.query(User)
        .filter(User.email == login.email)
        .first()
    )

    password_hash = (
        db_user.password
        if db_user
        else DUMMY_PASSWORD_HASH
    )

    password_valid = verify_password(
        login.password,
        password_hash,
    )

    if (
        not db_user
        or not password_valid
        or not db_user.is_active
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    access_token = create_access_token(
    data={
        "sub": db_user.email,
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
# Change Password
# -----------------------------------
@router.put("/change-password")
def change_password(
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
    
    if not validate_password(data.new_password):
        raise HTTPException(
            status_code=400,
            detail=(
                "Password must be at least 8 characters long and contain "
                "an uppercase letter, lowercase letter, number, and special character."
            ),
        )

    current_user.password = hash_password(
        data.new_password
    )
    current_user.token_version += 1

    current_user.first_login = False

    db.commit()

    return {
        "message": "Password changed successfully"
    }