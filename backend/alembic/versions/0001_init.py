"""初始表结构：users / videos / subtitles / subtitle_sources / subtitle_warnings / learning_progress

Revision ID: 0001_init
Revises:
Create Date: 2026-07-04

"""
from alembic import op

from app.database import Base
from app import models  # noqa: F401

revision = "0001_init"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    Base.metadata.create_all(bind=op.get_bind())


def downgrade() -> None:
    Base.metadata.drop_all(bind=op.get_bind())
