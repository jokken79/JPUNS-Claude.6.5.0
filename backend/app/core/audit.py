"""Database auditing utilities."""
from __future__ import annotations

from contextvars import ContextVar
from datetime import date, datetime
from decimal import Decimal
from typing import Any, Dict, Iterable, List, Optional

from sqlalchemy import event
from sqlalchemy.inspection import inspect
from sqlalchemy.orm import Session


_AUDIT_CONTEXT: ContextVar[Optional[Dict[str, Any]]] = ContextVar("audit_context", default=None)
_AUDIT_ENTRY_KEY = "_audit_entries"

# Tables that must be audited. The list covers all business entities defined in the models.
AUDITED_TABLES: set[str] = {
    "users",
    "candidates",
    "employees",
    "factories",
    "apartments",
    "timer_cards",
    "salary_calculations",
    "requests",
    "contracts",
    "documents",
    "staff",
    "contract_workers",
    "system_settings",
    "page_visibility",
    "social_insurance_rates",
}

SENSITIVE_FIELD_PATTERNS: tuple[str, ...] = (
    "password",
    "token",
    "secret",
    "hash",
)

MAX_STRING_LENGTH = 500


def get_audit_context() -> Dict[str, Any]:
    """Return the per-request audit context, creating it if necessary."""
    context = _AUDIT_CONTEXT.get()
    if context is None:
        context = {}
        _AUDIT_CONTEXT.set(context)
    return context


def update_audit_context(**values: Any) -> Dict[str, Any]:
    """Update the current audit context with non-null values."""
    context = get_audit_context()
    for key, value in values.items():
        if value is not None:
            context[key] = value
    return context


def clear_audit_context() -> None:
    """Reset the audit context."""
    _AUDIT_CONTEXT.set({})


def _is_auditable(obj: Any) -> bool:
    table_name = getattr(obj, "__tablename__", None)
    return bool(table_name and table_name in AUDITED_TABLES)


def _serialize_value(value: Any) -> Any:
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="ignore")
    if isinstance(value, str) and len(value) > MAX_STRING_LENGTH:
        return value[: MAX_STRING_LENGTH - 3] + "..."
    # Handle lists and collections (relationships) - convert to string representation
    if isinstance(value, (list, tuple, set)):
        return f"<collection with {len(value)} items>"
    # Handle SQLAlchemy model instances (relationships) - just return their repr
    if hasattr(value, '__tablename__'):
        return f"<{value.__class__.__name__} object>"
    return value


def _sanitize_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    sanitized: Dict[str, Any] = {}
    for key, value in payload.items():
        if any(pattern in key.lower() for pattern in SENSITIVE_FIELD_PATTERNS):
            sanitized[key] = "***"
        else:
            sanitized[key] = _serialize_value(value)
    return sanitized


def _snapshot_instance(instance: Any) -> Dict[str, Any]:
    mapper = inspect(instance.__class__)
    data: Dict[str, Any] = {}
    for column in mapper.column_attrs:
        data[column.key] = getattr(instance, column.key)
    return _sanitize_payload(data)


def _collect_updates(instance: Any) -> Optional[Dict[str, Dict[str, Any]]]:
    state = inspect(instance)
    mapper = state.mapper
    old_values: Dict[str, Any] = {}
    new_values: Dict[str, Any] = {}

    for column in mapper.column_attrs:
        attr = state.attrs[column.key]
        if not attr.history.has_changes():
            continue

        previous = attr.history.deleted[0] if attr.history.deleted else attr.history.unchanged[0] if attr.history.unchanged else None
        current = attr.history.added[0] if attr.history.added else getattr(instance, column.key)

        key_lower = column.key.lower()
        if any(pattern in key_lower for pattern in SENSITIVE_FIELD_PATTERNS):
            old_values[column.key] = "***"
            new_values[column.key] = "***"
        else:
            old_values[column.key] = _serialize_value(previous)
            new_values[column.key] = _serialize_value(current)

    if not new_values:
        return None

    return {"old": old_values, "new": new_values}


def _get_pk_key(instance: Any) -> Optional[str]:
    mapper = inspect(instance.__class__)
    if len(mapper.primary_key) != 1:
        return None
    return mapper.primary_key[0].key


def _before_flush(session: Session, flush_context: Any, instances: Iterable[Any]) -> None:
    entries: List[Dict[str, Any]] = session.info.setdefault(_AUDIT_ENTRY_KEY, [])

    for obj in session.new:
        if not _is_auditable(obj):
            continue
        entries.append(
            {
                "action": "CREATE",
                "table_name": obj.__tablename__,
                "pk_attr": _get_pk_key(obj),
                "instance": obj,
                "old_values": None,
                "new_values": _snapshot_instance(obj),
            }
        )

    for obj in session.dirty:
        if not _is_auditable(obj) or session.is_modified(obj, include_collections=False) is False:
            continue
        changes = _collect_updates(obj)
        if not changes:
            continue
        entries.append(
            {
                "action": "UPDATE",
                "table_name": obj.__tablename__,
                "pk_attr": _get_pk_key(obj),
                "instance": obj,
                "old_values": changes["old"],
                "new_values": changes["new"],
            }
        )

    for obj in session.deleted:
        if not _is_auditable(obj):
            continue
        entries.append(
            {
                "action": "DELETE",
                "table_name": obj.__tablename__,
                "pk_attr": _get_pk_key(obj),
                "instance": obj,
                "old_values": _snapshot_instance(obj),
                "new_values": None,
            }
        )


def _after_flush(session: Session, flush_context: Any) -> None:
    entries: List[Dict[str, Any]] = session.info.pop(_AUDIT_ENTRY_KEY, [])
    if not entries:
        return

    context = session.info.get("audit_context") or get_audit_context()

    try:
        from app.models.models import AuditLog  # Local import to avoid circular dependency
    except Exception:  # pragma: no cover - defensive import fallback
        return

    audit_table = AuditLog.__table__
    rows = []

    for entry in entries:
        pk_attr = entry.get("pk_attr")
        instance = entry.get("instance")
        record_id = None
        if instance is not None and pk_attr:
            record_id = getattr(instance, pk_attr, None)
        if record_id is None and entry.get("old_values") and pk_attr:
            record_id = entry["old_values"].get(pk_attr)

        rows.append(
            {
                "user_id": context.get("user_id"),
                "action": entry["action"],
                "table_name": entry["table_name"],
                "record_id": record_id,
                "old_values": entry.get("old_values"),
                "new_values": entry.get("new_values"),
                "ip_address": context.get("ip_address"),
                "user_agent": context.get("user_agent"),
            }
        )

    if rows:
        session.execute(audit_table.insert(), rows)


def register_audit_listeners() -> None:
    """Register SQLAlchemy listeners once."""
    if getattr(register_audit_listeners, "_registered", False):  # type: ignore[attr-defined]
        return

    event.listen(Session, "before_flush", _before_flush)
    event.listen(Session, "after_flush", _after_flush)

    register_audit_listeners._registered = True  # type: ignore[attr-defined]


__all__ = [
    "AUDITED_TABLES",
    "clear_audit_context",
    "get_audit_context",
    "register_audit_listeners",
    "update_audit_context",
]
