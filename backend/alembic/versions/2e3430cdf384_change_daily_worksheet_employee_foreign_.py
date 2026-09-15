"""change daily worksheet employee foreign key

Revision ID: 2e3430cdf384
Revises: 1748d17de4f2
Create Date: 2026-09-15 12:40:48.075951

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "2e3430cdf384"
down_revision: Union[str, Sequence[str], None] = "1748d17de4f2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_constraint(
        op.f("fk_daily_worksheets_employee_id_users"),
        "daily_worksheets",
        type_="foreignkey",
    )

    op.execute(
        sa.text(
            """
            UPDATE daily_worksheets AS dw
            SET employee_id = e.id
            FROM employees AS e
            WHERE e.user_id = dw.employee_id
            """
        )
    )

    op.create_foreign_key(
        op.f("fk_daily_worksheets_employee_id_employees"),
        "daily_worksheets",
        "employees",
        ["employee_id"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint(
        op.f("fk_daily_worksheets_employee_id_employees"),
        "daily_worksheets",
        type_="foreignkey",
    )

    op.execute(
        sa.text(
            """
            UPDATE daily_worksheets AS dw
            SET employee_id = e.user_id
            FROM employees AS e
            WHERE e.id = dw.employee_id
            """
        )
    )

    op.create_foreign_key(
        op.f("fk_daily_worksheets_employee_id_users"),
        "daily_worksheets",
        "users",
        ["employee_id"],
        ["id"],
        ondelete="CASCADE",
    )