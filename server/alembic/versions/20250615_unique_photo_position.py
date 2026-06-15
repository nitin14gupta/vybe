"""add unique constraint on user_photos(user_id, position)

Revision ID: 002
Revises: 001
Create Date: 2025-06-15
"""

from alembic import op

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Remove the plain index first, replace with a unique one
    op.execute("DROP INDEX IF EXISTS idx_user_photos_user_id")
    op.execute(
        "ALTER TABLE user_photos ADD CONSTRAINT uq_user_photos_position UNIQUE (user_id, position)"
    )


def downgrade() -> None:
    op.execute("ALTER TABLE user_photos DROP CONSTRAINT IF EXISTS uq_user_photos_position")
    op.execute("CREATE INDEX idx_user_photos_user_id ON user_photos (user_id, position)")
