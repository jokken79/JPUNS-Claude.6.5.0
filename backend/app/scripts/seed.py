"""Placeholder database seed script.

This module provides a structured entry-point that can be extended with
real seed data. It is intentionally lightweight so that the CI healthchecks
and docker-compose samples have a canonical script they can call.
"""
from __future__ import annotations

from contextlib import contextmanager

from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.logging import app_logger


@contextmanager
def get_session() -> Session:
    """Provide a short-lived SQLAlchemy session."""
    session: Session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:  # pragma: no cover - defensive safety net
        session.rollback()
        raise
    finally:
        session.close()


def seed(session: Session) -> None:
    """Insert baseline records. Extend this function with real data."""
    app_logger.info("Running placeholder seed", extra={"module": __name__})
    # Example placeholder for future seed logic
    # session.add(Model(name="Example"))


def run() -> None:
    """Entry-point used by automation scripts."""
    with get_session() as session:
        seed(session)
        app_logger.info("Seed script completed", extra={"module": __name__})


if __name__ == "__main__":  # pragma: no cover
    run()
