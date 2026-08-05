"""Side-effect module: importing this registers every model on Base.metadata.
Do not delete the imports below — Alembic autogenerate depends on them.
"""

from app.database.database import Base as Base
from app.models.employee import Employee as Employee
from app.models.project import Project as Project
from app.models.project_employee import (
    ProjectEmployee as ProjectEmployee,
)
from app.models.task import Task as Task
from app.models.user import User as User