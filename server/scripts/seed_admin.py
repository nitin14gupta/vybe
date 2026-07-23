"""One-off script to create (or update) an admin panel login.

Usage (from server/, with the venv active so imports resolve):
    python scripts/seed_admin.py you@gorave.com "your-password" "Your Name"

There is no admin signup endpoint on purpose — admin accounts are seeded by
whoever already has DB access, not created through the API.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.password import hash_password
from db.config import get_db


def seed_admin(email: str, password: str, name: str | None = None):
    password_hash = hash_password(password)
    with get_db() as (cur, conn):
        cur.execute(
            """
            INSERT INTO admin_users (email, password_hash, name)
            VALUES (%s, %s, %s)
            ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, name = EXCLUDED.name
            RETURNING id::text
            """,
            (email.lower(), password_hash, name),
        )
        admin_id = cur.fetchone()["id"]
        conn.commit()
    print(f"Admin ready: {email} (id={admin_id})")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    seed_admin(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else None)
