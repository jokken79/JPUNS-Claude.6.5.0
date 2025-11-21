"""Database configuration for UNS-ClaudeJP 5.2."""

from __future__ import annotations

import logging
import os
from typing import Any, Dict

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.engine.url import make_url
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from fastapi import Request

logger = logging.getLogger(__name__)

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    if os.getenv("ENVIRONMENT") == "production":
        raise ValueError("DATABASE_URL must be set in production environment")
    logger.warning("DATABASE_URL not set, using SQLite in-memory (development only)")
    DATABASE_URL = "sqlite:///:memory:"


def _build_engine_kwargs(database_url: str) -> Dict[str, Any]:
    """Build engine configuration depending on the target backend."""

    try:
        url: URL = make_url(database_url)
    except Exception as exc:  # pragma: no cover - invalid configuration
        raise ValueError(f"Invalid DATABASE_URL '{database_url}': {exc}") from exc
    kwargs: Dict[str, Any] = {"echo": False}

    if url.get_backend_name() == "sqlite":
        kwargs["connect_args"] = {"check_same_thread": False}
        if not url.database or url.database == ":memory:":
            kwargs["poolclass"] = StaticPool
    else:
        kwargs.update(
            pool_size=20,
            max_overflow=10,
            pool_pre_ping=True,
            pool_recycle=3600,
        )

    return kwargs


engine = create_engine(
    DATABASE_URL,
    **_build_engine_kwargs(DATABASE_URL),
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


from app.core.audit import get_audit_context, register_audit_listeners, update_audit_context
from sqlalchemy import event
from sqlalchemy.orm import Query


register_audit_listeners()


def register_soft_delete_filters():
    """
    Register automatic soft delete filters for all queries.

    This ensures that queries automatically exclude soft-deleted records
    (where deleted_at IS NOT NULL) unless explicitly requested otherwise.

    To include soft-deleted records in a query, use:
        session.query(Model).enable_eagerloads(False).filter(...).all()
    Or create a new session with the filter disabled.
    """

    @event.listens_for(Query, "before_compile", retval=True)
    def apply_soft_delete_filter(query):
        """
        Automatically filter out soft-deleted records from queries.

        This event listener runs before every query is compiled and adds
        a WHERE clause to exclude records with deleted_at IS NOT NULL.
        """
        # Get the model being queried
        for desc in query.column_descriptions:
            entity = desc['entity']
            if entity is None:
                continue

            # Check if the model has the deleted_at column (SoftDeleteMixin)
            if hasattr(entity, 'deleted_at'):
                # Check if filter is already applied (avoid duplicate filters)
                already_filtered = False
                for clause in query.whereclause.clauses if hasattr(query.whereclause, 'clauses') else [query.whereclause] if query.whereclause is not None else []:
                    clause_str = str(clause)
                    if 'deleted_at' in clause_str:
                        already_filtered = True
                        break

                # Apply filter only if not already present
                if not already_filtered:
                    query = query.filter(entity.deleted_at.is_(None))

        return query


# Register the soft delete filters
# NOTE: Commented out by default as it may cause issues with some queries
# To enable globally, uncomment the line below:
# register_soft_delete_filters()


def get_db(request: Request = None):
    """
    Dependency to get database session
    """
    db = SessionLocal()
    if request is not None:
        client = getattr(request, "client", None)
        update_audit_context(
            ip_address=getattr(client, "host", None),
            user_agent=request.headers.get("User-Agent") if hasattr(request, "headers") else None,
        )
    db.info["audit_context"] = get_audit_context()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Initialize database tables
    """
    import app.models.models  # noqa
    Base.metadata.create_all(bind=engine)
