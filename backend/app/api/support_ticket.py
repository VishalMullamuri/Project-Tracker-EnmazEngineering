
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.enums import TicketStatus, UserRole
from app.core.security import get_current_user
from app.database.database import get_db
from app.models.department import Department
from app.models.employee import Employee
from app.models.employee_department import EmployeeDepartment
from app.models.support_ticket import SupportTicket
from app.models.ticket_activity import TicketActivity
from app.models.ticket_comment import TicketComment
from app.models.user import User
from app.schemas.support_ticket import (
    DepartmentEmployeeResponse,
    DepartmentResponse,
    SupportTicketAssignment,
    SupportTicketCreate,
    SupportTicketResponse,
    SupportTicketStatusUpdate,
    TicketActivityResponse,
    TicketCommentCreate,
    TicketCommentResponse,
)

router = APIRouter(tags=["Support Tickets"])


def get_employee(db: Session, user: User) -> Employee:
    employee = (
        db.query(Employee)
        .filter(
            Employee.user_id == user.id,
            Employee.is_active.is_(True),
        )
        .first()
    )

    if not employee:
        raise HTTPException(
            status_code=403,
            detail="An active employee profile is required",
        )

    return employee


def is_admin(user: User) -> bool:
    return user.role == UserRole.ADMIN


def is_department_member(
    db: Session,
    employee_id: int,
    department_id: int,
) -> bool:
    return (
        db.query(EmployeeDepartment.id)
        .join(
            Employee,
            Employee.id == EmployeeDepartment.employee_id,
        )
        .filter(
            EmployeeDepartment.employee_id == employee_id,
            EmployeeDepartment.department_id == department_id,
            Employee.is_active.is_(True),
        )
        .first()
        is not None
    )


def log_activity(
    db: Session,
    ticket: SupportTicket,
    employee_id: int,
    action: str,
    details: str | None = None,
) -> None:
    db.add(
        TicketActivity(
            ticket_id=ticket.id,
            employee_id=employee_id,
            action=action,
            details=details,
        )
    )


def get_ticket_or_404(
    db: Session,
    ticket_id: int,
) -> SupportTicket:
    ticket = (
        db.query(SupportTicket)
        .filter(
            SupportTicket.id == ticket_id,
            SupportTicket.deleted_at.is_(None),
        )
        .first()
    )

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Support ticket not found",
        )

    return ticket


def check_ticket_access(
    db: Session,
    ticket: SupportTicket,
    user: User,
    employee: Employee,
) -> None:
    if is_admin(user):
        return

    if ticket.created_by == employee.id:
        return

    if is_department_member(
        db,
        employee.id,
        ticket.department_id,
    ):
        return

    raise HTTPException(
        status_code=403,
        detail="You do not have access to this ticket",
    )


@router.get(
    "/departments",
    response_model=list[DepartmentResponse],
)
def list_departments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Department)
        .filter(Department.is_active.is_(True))
        .order_by(Department.name)
        .all()
    )


@router.get(
    "/departments/{department_id}/employees",
    response_model=list[DepartmentEmployeeResponse],
)
def list_department_employees(
    department_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    department = (
        db.query(Department)
        .filter(
            Department.id == department_id,
            Department.is_active.is_(True),
        )
        .first()
    )

    if not department:
        raise HTTPException(
            status_code=404,
            detail="Department not found",
        )

    return (
        db.query(Employee)
        .join(
            EmployeeDepartment,
            EmployeeDepartment.employee_id == Employee.id,
        )
        .filter(
            EmployeeDepartment.department_id == department_id,
            Employee.is_active.is_(True),
        )
        .order_by(Employee.name)
        .all()
    )


@router.post(
    "/support-tickets",
    response_model=SupportTicketResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_support_ticket(
    data: SupportTicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = get_employee(db, current_user)

    department = (
        db.query(Department)
        .filter(
            Department.id == data.department_id,
            Department.is_active.is_(True),
        )
        .first()
    )

    if not department:
        raise HTTPException(
            status_code=404,
            detail="Department not found or inactive",
        )

    ticket = SupportTicket(
        ticket_number=f"ST-{uuid4().hex[:10].upper()}",
        title=data.title,
        description=data.description,
        category=data.category,
        priority=data.priority,
        status=TicketStatus.OPEN,
        created_by=employee.id,
        department_id=department.id,
    )

    try:
        db.add(ticket)
        db.flush()

        log_activity(
            db,
            ticket,
            employee.id,
            "CREATED",
            f"Ticket created for department {department.name}",
        )

        db.commit()
        db.refresh(ticket)
        return ticket

    except Exception:
        db.rollback()
        raise


@router.get(
    "/support-tickets",
    response_model=list[SupportTicketResponse],
)
def list_support_tickets(
    ticket_status: TicketStatus | None = Query(
        default=None,
        alias="status",
    ),
    department_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = get_employee(db, current_user)

    query = db.query(SupportTicket).filter(
        SupportTicket.deleted_at.is_(None)
    )

    if not is_admin(current_user):
        department_ids = (
            db.query(EmployeeDepartment.department_id)
            .filter(EmployeeDepartment.employee_id == employee.id)
        )

        query = query.filter(
            (SupportTicket.created_by == employee.id)
            | (SupportTicket.department_id.in_(department_ids))
        )

    if department_id is not None:
        query = query.filter(
            SupportTicket.department_id == department_id
        )

    if ticket_status is not None:
        query = query.filter(
            SupportTicket.status == ticket_status
        )

    return query.order_by(SupportTicket.created_at.desc()).all()


@router.get(
    "/support-tickets/{ticket_id}",
    response_model=SupportTicketResponse,
)
def get_support_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = get_employee(db, current_user)
    ticket = get_ticket_or_404(db, ticket_id)

    check_ticket_access(
        db,
        ticket,
        current_user,
        employee,
    )

    return ticket


@router.patch(
    "/support-tickets/{ticket_id}/assignment",
    response_model=SupportTicketResponse,
)
def assign_support_ticket(
    ticket_id: int,
    data: SupportTicketAssignment,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = get_employee(db, current_user)
    ticket = get_ticket_or_404(db, ticket_id)

    if not is_admin(current_user) and not is_department_member(
        db,
        employee.id,
        ticket.department_id,
    ):
        raise HTTPException(
            status_code=403,
            detail="Only department members or admins can assign this ticket",
        )

    assignee = None

    if data.assigned_to is not None:
        assignee = (
            db.query(Employee)
            .filter(
                Employee.id == data.assigned_to,
                Employee.is_active.is_(True),
            )
            .first()
        )

        if not assignee:
            raise HTTPException(
                status_code=404,
                detail="Assignee not found or inactive",
            )

        if not is_department_member(
            db,
            assignee.id,
            ticket.department_id,
        ):
            raise HTTPException(
                status_code=400,
                detail="Assignee must belong to the ticket's department",
            )

    old_assignee_id = ticket.assigned_to
    ticket.assigned_to = data.assigned_to

    log_activity(
        db,
        ticket,
        employee.id,
        "ASSIGNED",
        f"Assignee changed from {old_assignee_id} to {data.assigned_to}",
    )

    try:
        db.commit()
        db.refresh(ticket)
        return ticket
    except Exception:
        db.rollback()
        raise


@router.patch(
    "/support-tickets/{ticket_id}/status",
    response_model=SupportTicketResponse,
)
def update_support_ticket_status(
    ticket_id: int,
    data: SupportTicketStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = get_employee(db, current_user)
    ticket = get_ticket_or_404(db, ticket_id)

    if not is_admin(current_user) and not is_department_member(
        db,
        employee.id,
        ticket.department_id,
    ):
        raise HTTPException(
            status_code=403,
            detail="Only department members or admins can change ticket status",
        )

    old_status = ticket.status

    if old_status == TicketStatus.CLOSED and data.status != TicketStatus.CLOSED:
        if data.status not in (
            TicketStatus.OPEN,
            TicketStatus.IN_PROGRESS,
            TicketStatus.RESOLVED,
        ):
            raise HTTPException(
                status_code=400,
                detail="Invalid status transition",
            )

    if data.status == TicketStatus.RESOLVED:
        ticket.resolved_at = datetime.now(timezone.utc)
        ticket.closed_at = None
        if data.resolution_note is not None:
            ticket.resolution_note = data.resolution_note

    elif data.status == TicketStatus.CLOSED:
        if old_status not in (
            TicketStatus.RESOLVED,
            TicketStatus.CLOSED,
        ):
            raise HTTPException(
                status_code=400,
                detail="Only resolved tickets can be closed",
            )
        ticket.closed_at = datetime.now(timezone.utc)

    elif data.status in (
        TicketStatus.OPEN,
        TicketStatus.IN_PROGRESS,
    ):
        if old_status in (
            TicketStatus.RESOLVED,
            TicketStatus.CLOSED,
        ):
            ticket.resolved_at = None
            ticket.closed_at = None
            ticket.resolution_note = None

    ticket.status = data.status

    log_activity(
        db,
        ticket,
        employee.id,
        "STATUS_CHANGED",
        f"Status changed from {old_status.value} to {data.status.value}",
    )

    try:
        db.commit()
        db.refresh(ticket)
        return ticket
    except Exception:
        db.rollback()
        raise


@router.post(
    "/support-tickets/{ticket_id}/comments",
    response_model=TicketCommentResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_ticket_comment(
    ticket_id: int,
    data: TicketCommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = get_employee(db, current_user)
    ticket = get_ticket_or_404(db, ticket_id)

    check_ticket_access(
        db,
        ticket,
        current_user,
        employee,
    )

    comment = TicketComment(
        ticket_id=ticket.id,
        employee_id=employee.id,
        comment=data.comment.strip(),
    )

    if not comment.comment:
        raise HTTPException(
            status_code=422,
            detail="Comment cannot be empty",
        )

    try:
        db.add(comment)
        db.flush()

        log_activity(
            db,
            ticket,
            employee.id,
            "COMMENTED",
            "Added a comment",
        )

        db.commit()
        db.refresh(comment)
        return comment
    except Exception:
        db.rollback()
        raise


@router.get(
    "/support-tickets/{ticket_id}/history",
    response_model=list[TicketActivityResponse],
)
def get_ticket_history(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = get_employee(db, current_user)
    ticket = get_ticket_or_404(db, ticket_id)

    check_ticket_access(
        db,
        ticket,
        current_user,
        employee,
    )

    return (
        db.query(TicketActivity)
        .filter(TicketActivity.ticket_id == ticket.id)
        .order_by(TicketActivity.created_at.asc())
        .all()
    )


@router.get(
    "/support-tickets/{ticket_id}/comments",
    response_model=list[TicketCommentResponse],
)
def get_ticket_comments(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = get_employee(db, current_user)
    ticket = get_ticket_or_404(db, ticket_id)

    check_ticket_access(
        db,
        ticket,
        current_user,
        employee,
    )

    return (
        db.query(TicketComment)
        .filter(TicketComment.ticket_id == ticket.id)
        .order_by(TicketComment.created_at.asc())
        .all()
    )


@router.delete(
    "/support-tickets/{ticket_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_support_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = get_employee(db, current_user)
    ticket = get_ticket_or_404(db, ticket_id)

    if (
        not is_admin(current_user)
        and ticket.created_by != employee.id
    ):
        raise HTTPException(
            status_code=403,
            detail="Only the ticket creator or an admin can delete this ticket",
        )

    now = datetime.now(timezone.utc)
    ticket.deleted_at = now
    ticket.deleted_by = employee.id

    log_activity(
        db,
        ticket,
        employee.id,
        "DELETED",
        "Ticket soft-deleted",
    )

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    return None
