"""add video tags

Revision ID: 0002_video_tags
Revises: 0001_init
Create Date: 2026-07-08

"""
from __future__ import annotations

import hashlib
import re

from alembic import op
import sqlalchemy as sa

revision = "0002_video_tags"
down_revision = "0001_init"
branch_labels = None
depends_on = None


def _slug_for_tag(name: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") or "tag"
    suffix = hashlib.sha1(name.encode("utf-8")).hexdigest()[:8]
    return f"{base[:64]}-{suffix}"


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if not inspector.has_table("tags"):
        op.create_table(
            "tags",
            sa.Column("id", sa.BigInteger().with_variant(sa.Integer(), "sqlite"), autoincrement=True, nullable=False),
            sa.Column("name", sa.String(length=50), nullable=False),
            sa.Column("slug", sa.String(length=80), nullable=False),
            sa.Column("type", sa.String(length=30), nullable=True),
            sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("name", name="uq_tags_name"),
            sa.UniqueConstraint("slug", name="uq_tags_slug"),
            mysql_charset="utf8mb4",
            mysql_collate="utf8mb4_unicode_ci",
        )
        op.create_index("ix_tags_type", "tags", ["type"])

    inspector = sa.inspect(bind)
    if not inspector.has_table("video_tags"):
        op.create_table(
            "video_tags",
            sa.Column("video_id", sa.BigInteger(), nullable=False),
            sa.Column("tag_id", sa.BigInteger(), nullable=False),
            sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
            sa.ForeignKeyConstraint(["tag_id"], ["tags.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["video_id"], ["videos.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("video_id", "tag_id"),
            sa.UniqueConstraint("video_id", "tag_id", name="uq_video_tags_video_tag"),
            mysql_charset="utf8mb4",
            mysql_collate="utf8mb4_unicode_ci",
        )
        op.create_index("ix_video_tags_tag_id", "video_tags", ["tag_id"])

    categories = [
        row[0]
        for row in bind.execute(
            sa.text("SELECT DISTINCT category FROM videos WHERE category IS NOT NULL AND category <> ''")
        )
    ]
    tag_ids: dict[str, int] = {}
    for name in categories:
        existing_id = bind.execute(
            sa.text("SELECT id FROM tags WHERE name = :name"), {"name": name}
        ).scalar()
        if existing_id is None:
            bind.execute(
                sa.text("INSERT INTO tags (name, slug, sort_order) VALUES (:name, :slug, 0)"),
                {"name": name, "slug": _slug_for_tag(name)},
            )
        tag_ids[name] = int(
            bind.execute(sa.text("SELECT id FROM tags WHERE name = :name"), {"name": name}).scalar() or 0
        )

    for video_id, category in bind.execute(
        sa.text("SELECT id, category FROM videos WHERE category IS NOT NULL AND category <> ''")
    ):
        tag_id = tag_ids.get(category)
        if tag_id:
            exists = bind.execute(
                sa.text(
                    "SELECT 1 FROM video_tags WHERE video_id = :video_id AND tag_id = :tag_id"
                ),
                {"video_id": video_id, "tag_id": tag_id},
            ).scalar()
            if not exists:
                bind.execute(
                    sa.text(
                        "INSERT INTO video_tags (video_id, tag_id, sort_order) "
                        "VALUES (:video_id, :tag_id, 0)"
                    ),
                    {"video_id": video_id, "tag_id": tag_id},
                )


def downgrade() -> None:
    op.drop_index("ix_video_tags_tag_id", table_name="video_tags")
    op.drop_table("video_tags")
    op.drop_index("ix_tags_type", table_name="tags")
    op.drop_table("tags")
