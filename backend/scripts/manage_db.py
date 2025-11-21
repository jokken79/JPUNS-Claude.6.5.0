#!/usr/bin/env python3
"""Utility CLI for Alembic migrations and database seeding."""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS_DIR = ROOT / "scripts"


def _run(command: list[str]) -> int:
    env = os.environ.copy()
    env.setdefault("PYTHONPATH", str(ROOT))
    process = subprocess.run(command, cwd=ROOT, env=env, check=False)
    return process.returncode


def migrate(revision: str) -> int:
    return _run(["alembic", "upgrade", revision])


def rollback(steps: str) -> int:
    return _run(["alembic", "downgrade", steps])


def seed() -> int:
    commands = [
        [sys.executable, str(SCRIPTS_DIR / "create_admin_user.py")],
        # Intentar importar candidatos reales primero
        [sys.executable, str(SCRIPTS_DIR / "import_candidates_simple.py")],
        # Si no hay candidatos, crear demostración (fallback)
        [sys.executable, str(SCRIPTS_DIR / "import_demo_candidates.py")],
    ]
    for command in commands:
        code = _run(command)
        # No fallar si algún comando falla (algunos son opcionales)
        # Solo continuar con el siguiente
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Database migration helper")
    subparsers = parser.add_subparsers(dest="command", required=True)

    migrate_parser = subparsers.add_parser("migrate", help="Run alembic upgrade")
    migrate_parser.add_argument("revision", nargs="?", default="heads")

    rollback_parser = subparsers.add_parser("rollback", help="Run alembic downgrade")
    rollback_parser.add_argument("steps", nargs="?", default="-1")

    subparsers.add_parser("seed", help="Seed the database with demo data")

    args = parser.parse_args(argv)

    if args.command == "migrate":
        return migrate(args.revision)
    if args.command == "rollback":
        return rollback(args.steps)
    if args.command == "seed":
        return seed()
    parser.error("Unknown command")


def run() -> None:
    sys.exit(main())


if __name__ == "__main__":
    run()
