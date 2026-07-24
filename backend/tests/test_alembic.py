from alembic.config import Config
from alembic import command
from sqlalchemy import create_engine, text
import os

def test_alembic_upgrade_head():
    engine = create_engine(os.environ["DATABASE_URL"])

    with engine.connect() as conn:
        print("BEFORE:", conn.execute(text(
            "SELECT table_name FROM information_schema.tables "
            "WHERE table_schema='public'"
        )).fetchall())

    config = Config("alembic.ini")
    command.upgrade(config, "head")