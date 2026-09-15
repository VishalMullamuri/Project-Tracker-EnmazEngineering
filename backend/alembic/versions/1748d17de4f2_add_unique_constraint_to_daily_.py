"""add unique constraint to daily worksheets

Revision ID: 1748d17de4f2
Revises: b7ea2b630ed5
Create Date: 2026-09-15 12:12:23.778812

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "1748d17de4f2"
down_revision: Union[str, Sequence[str], None] = "b7ea2b630ed5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()

    duplicates = bind.execute(
        sa.text(
            """
            SELECT employee_id, worksheet_date
            FROM daily_worksheets
            GROUP BY employee_id, worksheet_date
            HAVING COUNT(*) > 1
            LIMIT 1
            """
        )
    ).first()

    if duplicates:
        raise RuntimeError(
            "Cannot add unique constraint "
            "uq_daily_worksheets_employee_date: "
            "duplicate daily worksheets already exist."
        )

    op.create_unique_constraint(
        "uq_daily_worksheets_employee_date",
        "daily_worksheets",
        ["employee_id", "worksheet_date"],
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint(
        "uq_daily_worksheets_employee_date",
        "daily_worksheets",
        type_="unique",
    )