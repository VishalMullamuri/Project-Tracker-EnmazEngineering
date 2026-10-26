"""Side-effect module: importing this registers every model on Base.metadata.
Do not delete the imports below — Alembic autogenerate depends on them.
"""

from app.database.database import Base as Base
from app.models.daily_worksheet import (
    DailyWorksheet as DailyWorksheet,
)
from app.models.daily_worksheet import (
    DailyWorksheetTask as DailyWorksheetTask,
)
from app.models.employee import Employee as Employee
from app.models.project import Project as Project
from app.models.project_employee import (
    ProjectEmployee as ProjectEmployee,
)
from app.models.task import Task as Task
from app.models.user import User as User
from app.models.weekly_planner import WeeklyPlanner as WeeklyPlanner

from app.models.department import Department as Department
from app.models.employee_department import (
    EmployeeDepartment as EmployeeDepartment,
)

from app.models.support_ticket import SupportTicket as SupportTicket
from app.models.ticket_comment import TicketComment as TicketComment
from app.models.ticket_activity import TicketActivity as TicketActivity