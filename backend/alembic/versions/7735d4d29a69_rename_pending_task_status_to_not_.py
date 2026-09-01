"""rename pending task status to not started

Revision ID: 7735d4d29a69
Revises: fa40b814df06
Create Date: 2026-08-24 14:45:28.363992

"""

from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "7735d4d29a69"
down_revision: Union[str, Sequence[str], None] = "fa40b814df06"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute(
        """
        UPDATE tasks
        SET status = 'Not Started'
        WHERE status = 'Pending'
        """
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.execute(
        """
        UPDATE tasks
        SET status = 'Pending'
        WHERE status = 'Not Started'
        """
    )