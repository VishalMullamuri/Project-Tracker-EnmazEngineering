"""add daily worksheets

Revision ID: b7ea2b630ed5
"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b7ea2b630ed5"

# KEEP THE EXISTING down_revision FROM THE CURRENT b7ea2b630ed5 MIGRATION
down_revision: Union[str, Sequence[str], None] = '7735d4d29a69'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "daily_worksheets",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column(
            "employee_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "worksheet_date",
            sa.Date(),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(
            ["employee_id"],
            ["employees.id"],
            name="fk_daily_worksheets_employee_id_employees",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "employee_id",
            "worksheet_date",
            name="uq_daily_worksheets_employee_date",
        ),
    )

    op.create_index(
        "ix_daily_worksheets_employee_date",
        "daily_worksheets",
        ["employee_id", "worksheet_date"],
        unique=False,
    )

    op.create_table(
        "daily_worksheet_tasks",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column(
            "worksheet_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "title",
            sa.String(length=200),
            nullable=False,
        ),
        sa.Column(
            "description",
            sa.Text(),
            nullable=True,
        ),
        sa.Column(
            "status",
            sa.String(length=50),
            nullable=False,
        ),
        sa.Column(
            "remarks",
            sa.Text(),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(
            ["worksheet_id"],
            ["daily_worksheets.id"],
            name="fk_daily_worksheet_tasks_worksheet_id_daily_worksheets",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("daily_worksheet_tasks")

    op.drop_index(
        "ix_daily_worksheets_employee_date",
        table_name="daily_worksheets",
    )

    op.drop_table("daily_worksheets")