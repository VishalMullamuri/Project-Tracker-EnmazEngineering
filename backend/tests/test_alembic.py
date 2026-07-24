from alembic.config import Config
from alembic import command


def test_alembic_upgrade_head():
    config = Config("alembic.ini")
    command.upgrade(config, "head")