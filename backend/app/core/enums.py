from enum import Enum


class UserRole(str, Enum):
    ADMIN = "ADMIN"
    MANAGER = "MANAGER"
    TEAM_MEMBER = "TEAM_MEMBER"
