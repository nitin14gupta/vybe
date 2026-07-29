"""
Dump the ENTIRE database (schema + data) into one plain .sql file.

Unlike dump_schema.py (schema only, used to keep queries.sql in sync), this
is for handing the whole DB to someone else: they just run
    psql "$DATABASE_URL" -f full_dump.sql
against an empty database and get identical tables + rows.

Usage:
    python scripts/dump_full.py [output_path]
"""
import os
import sys
from pathlib import Path

import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

SCRIPT_DIR = Path(__file__).parent
SERVER_DIR = SCRIPT_DIR.parent
OUT_PATH = Path(sys.argv[1]) if len(sys.argv) > 1 else SERVER_DIR / "full_dump.sql"

load_dotenv(SERVER_DIR / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    sys.exit("ERROR: DATABASE_URL is not set in .env or environment.")


def fetch(cur, sql, params=None):
    cur.execute(sql, params or ())
    return cur.fetchall()


def dump_enums(cur, out):
    enums = fetch(
        cur,
        """
        SELECT t.typname AS name,
               array_agg(e.enumlabel ORDER BY e.enumsortorder) AS labels
        FROM   pg_type t
        JOIN   pg_enum e ON e.enumtypid = t.oid
        JOIN   pg_namespace n ON n.oid = t.typnamespace
        WHERE  n.nspname = 'public'
        GROUP  BY t.typname
        ORDER  BY t.typname
        """,
    )
    if not enums:
        return
    out.write("\n-- ── Enums ────────────────────────────────────────────────────────\n")
    for e in enums:
        vals = ", ".join(f"'{v}'" for v in e["labels"])
        out.write(f"CREATE TYPE public.{e['name']} AS ENUM ({vals});\n")


def dump_sequences(cur, out):
    sequences = fetch(
        cur,
        """
        SELECT sequence_name
        FROM   information_schema.sequences
        WHERE  sequence_schema = 'public'
        ORDER  BY sequence_name
        """,
    )
    if not sequences:
        return
    out.write("\n-- ── Sequences ────────────────────────────────────────────────────\n")
    for s in sequences:
        out.write(f"CREATE SEQUENCE IF NOT EXISTS public.{s['sequence_name']};\n")


def table_names(cur):
    return [
        r["tablename"]
        for r in fetch(
            cur,
            """
            SELECT tablename FROM pg_tables
            WHERE schemaname = 'public'
            ORDER BY tablename
            """,
        )
    ]


def dump_tables(cur, out, tables):
    """CREATE TABLE with inline PK/UNIQUE/CHECK. FKs are collected and
    returned so they can be added after data load (avoids insert-order
    problems from cross-table foreign keys)."""
    fk_statements = []
    out.write("\n-- ── Tables ───────────────────────────────────────────────────────\n")

    for tname in tables:
        out.write(f"\nCREATE TABLE IF NOT EXISTS public.{tname} (\n")

        cols = fetch(
            cur,
            """
            SELECT a.attname                                        AS col,
                   pg_catalog.format_type(a.atttypid, a.atttypmod)   AS dtype,
                   a.attnotnull                                       AS notnull,
                   pg_get_expr(d.adbin, d.adrelid)                   AS default_val
            FROM   pg_attribute a
            LEFT   JOIN pg_attrdef d
                   ON  d.adrelid = a.attrelid AND d.adnum = a.attnum
            WHERE  a.attrelid = %s::regclass
              AND  a.attnum   > 0
              AND  NOT a.attisdropped
            ORDER  BY a.attnum
            """,
            (f"public.{tname}",),
        )

        col_defs = []
        for c in cols:
            parts = [f"  {c['col']} {c['dtype']}"]
            if c["default_val"]:
                parts.append(f"DEFAULT {c['default_val']}")
            if c["notnull"]:
                parts.append("NOT NULL")
            col_defs.append(" ".join(parts))

        constraints = fetch(
            cur,
            """
            SELECT conname, contype, pg_get_constraintdef(oid, true) AS def
            FROM   pg_constraint
            WHERE  conrelid = %s::regclass
              AND  contype  IN ('p','u','f','c')
            ORDER  BY contype, conname
            """,
            (f"public.{tname}",),
        )
        for con in constraints:
            if con["contype"] == "f":
                fk_statements.append(
                    f"ALTER TABLE public.{tname} "
                    f"ADD CONSTRAINT {con['conname']} {con['def']};\n"
                )
            else:
                col_defs.append(f"  CONSTRAINT {con['conname']} {con['def']}")

        out.write(",\n".join(col_defs) + "\n")
        out.write(");\n")

    return fk_statements


def dump_data(cur, out, tables):
    out.write("\n-- ── Data ─────────────────────────────────────────────────────────\n")
    for tname in tables:
        cur.execute(f'SELECT count(*) AS n FROM public."{tname}"')
        n = cur.fetchone()["n"]
        if n == 0:
            continue
        out.write(f"\nCOPY public.{tname} FROM stdin;\n")
        cur.copy_expert(f'COPY public."{tname}" TO STDOUT', out)
        out.write("\\.\n")
        print(f"  {tname}: {n} rows")


def dump_fks(out, fk_statements):
    if not fk_statements:
        return
    out.write("\n-- ── Foreign Keys ─────────────────────────────────────────────────\n")
    for stmt in fk_statements:
        out.write(stmt)


def dump_indexes(cur, out):
    indexes = fetch(
        cur,
        """
        SELECT indexname, indexdef
        FROM   pg_indexes
        WHERE  schemaname = 'public'
          AND  indexname NOT IN (
               SELECT conname FROM pg_constraint WHERE contype IN ('p','u')
          )
        ORDER  BY tablename, indexname
        """,
    )
    if not indexes:
        return
    out.write("\n-- ── Indexes ───────────────────────────────────────────────────────\n")
    for idx in indexes:
        out.write(f"{idx['indexdef']};\n")


def dump_sequence_resets(cur, out):
    """After loading data with explicit PK values, sequences are still at 1
    — reset each to match its column's current max so future inserts don't
    collide."""
    cols = fetch(
        cur,
        """
        SELECT c.relname AS table_name, a.attname AS col
        FROM   pg_depend d
        JOIN   pg_class c ON c.oid = d.refobjid
        JOIN   pg_attribute a ON a.attrelid = d.refobjid AND a.attnum = d.refobjsubid
        JOIN   pg_class s ON s.oid = d.objid AND s.relkind = 'S'
        JOIN   pg_namespace n ON n.oid = c.relnamespace
        WHERE  n.nspname = 'public'
        """,
    )
    if not cols:
        return
    out.write("\n-- ── Sequence resets ──────────────────────────────────────────────\n")
    for c in cols:
        out.write(
            f"SELECT setval(pg_get_serial_sequence('public.{c['table_name']}', '{c['col']}'), "
            f"COALESCE((SELECT MAX({c['col']}) FROM public.{c['table_name']}), 1), "
            f"(SELECT MAX({c['col']}) FROM public.{c['table_name']}) IS NOT NULL);\n"
        )


def main():
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    print("Connected. Dumping schema + data...")

    with open(OUT_PATH, "w", encoding="utf-8", newline="\n") as out:
        out.write(
            "-- ============================================================\n"
            "-- Gorave — Full database dump (schema + data)\n"
            "-- Generated by scripts/dump_full.py\n"
            "-- Restore with: psql \"$DATABASE_URL\" -f full_dump.sql\n"
            "-- ============================================================\n"
        )

        dump_enums(cur, out)
        dump_sequences(cur, out)

        tables = table_names(cur)
        fk_statements = dump_tables(cur, out, tables)
        dump_data(cur, out, tables)
        dump_fks(out, fk_statements)
        dump_indexes(cur, out)
        dump_sequence_resets(cur, out)

    cur.close()
    conn.close()

    size = OUT_PATH.stat().st_size
    print(f"Written: {OUT_PATH} ({size:,} bytes)")


if __name__ == "__main__":
    main()
