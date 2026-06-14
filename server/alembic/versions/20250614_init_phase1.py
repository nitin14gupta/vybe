"""init phase 1 schema

Revision ID: 001
Revises:
Create Date: 2025-06-14
"""

from alembic import op
import sqlalchemy as sa

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')

    op.execute("""
        CREATE TABLE users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            phone VARCHAR(15) UNIQUE NOT NULL,
            country_code VARCHAR(5) NOT NULL DEFAULT '+91',
            name VARCHAR(100),
            dob DATE,
            gender VARCHAR(30),
            city VARCHAR(100),
            lat DECIMAL(9, 6),
            lng DECIMAL(9, 6),
            voice_url TEXT,
            voice_r2_path TEXT,
            interests TEXT[] DEFAULT '{}',
            profile_complete BOOLEAN DEFAULT FALSE,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX idx_users_phone ON users (phone)")

    op.execute("""
        CREATE TABLE user_photos (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            url TEXT NOT NULL,
            r2_path TEXT NOT NULL,
            position SMALLINT NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX idx_user_photos_user_id ON user_photos (user_id, position)")

    op.execute("""
        CREATE TABLE refresh_tokens (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            token_hash VARCHAR(255) NOT NULL UNIQUE,
            expires_at TIMESTAMPTZ NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id)")

    op.execute("""
        CREATE OR REPLACE FUNCTION update_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
    """)
    op.execute("""
        CREATE TRIGGER users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION update_updated_at()
    """)


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS users_updated_at ON users")
    op.execute("DROP FUNCTION IF EXISTS update_updated_at")
    op.execute("DROP TABLE IF EXISTS refresh_tokens")
    op.execute("DROP TABLE IF EXISTS user_photos")
    op.execute("DROP TABLE IF EXISTS users")
