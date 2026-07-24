from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

from app.config.config import DATABASE_URL
from app.database.database import Base

# Import all models so SQLAlchemy registers them
import app.database.base

config = context.config
config.set_main_option(
    "sqlalchemy.url",
    DATABASE_URL.replace("%", "%%")
)
print("=" * 80)
print("DATABASE_URL =", DATABASE_URL)
print("=" * 80)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    context.configure(
        url=DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
    config.get_section(config.config_ini_section, {}),
    prefix="sqlalchemy.",
    poolclass=pool.NullPool,
    echo=True,
)

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()