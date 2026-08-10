from datetime import datetime, timedelta

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)
from jwt.exceptions import InvalidTokenError
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.config.config import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    ALGORITHM,
    SECRET_KEY,
)
from app.database.database import get_db
from app.models.user import User

# Password Hashing
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)

# HTTP Bearer Authentication
security = HTTPBearer()


# -------------------------------
# Password Functions
# -------------------------------

def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str,
) -> bool:
    return pwd_context.verify(
        plain_password,
        hashed_password,
    )


# -------------------------------
# JWT Token Creation
# -------------------------------

def create_access_token(
    data: dict,
    expires_delta: timedelta | None = None,
):
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode.update({"exp": expire})

    return jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


# -------------------------------
# Get Current Logged-in User
# -------------------------------

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    token = credentials.credentials

    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
    )

    try:
        payload = jwt.decode(
        token,
        SECRET_KEY,
        algorithms=[ALGORITHM],
        options={"require": ["exp", "sub"]},
    )

        user_id = payload.get("sub")
        token_version = payload.get("token_version")

        if user_id is None or token_version is None:
            raise credentials_exception

        user_id = int(user_id)

    except (InvalidTokenError, ValueError, TypeError) as err:
        raise credentials_exception from err

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if user is None or user.token_version != token_version:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=401,
            detail="Inactive user",
        )

    return user