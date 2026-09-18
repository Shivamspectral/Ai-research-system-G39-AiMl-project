from logging.config import fileConfig

from sqlalchemy import create_engine
from sqlalchemy import pool

from alembic import context

import sys, os
# env.py lives at backend/alembic/env.py; the importable package root is
# `backend.app.*`, so the repo root (two levels up) needs to be on sys.path -
# one level up (the old code) only reaches backend/, where there's no `app`
# package, just `backend/app`.
sys.path.append(os.path.join(os.path.dirname(__file__), "..", ".."))

from backend.app.core.config import settings
from backend.app.db.base import Base
from backend.app.models import user, company, research_job, source, claim, report  # noqa
import pgvector.sqlalchemy  # noqa

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = settings.DATABASE_URL
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = create_engine(settings.DATABASE_URL, poolclass=pool.NullPool)

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