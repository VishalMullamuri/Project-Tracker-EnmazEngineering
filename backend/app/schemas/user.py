from pydantic import BaseModel, EmailStr
from app.models.user import UserRole


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.TEAM_MEMBER


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class ChangePassword(BaseModel):
    current_password: str
    new_password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    role: UserRole
    first_login: bool


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: UserRole
    is_active: bool
    first_login: bool

    class Config:
        from_attributes = True