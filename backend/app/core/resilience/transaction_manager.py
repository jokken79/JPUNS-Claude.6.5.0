"""Transaction management utilities with retry support."""

from __future__ import annotations

import logging
from contextlib import contextmanager
from dataclasses import dataclass
from typing import Any, Callable, Dict, Optional

from sqlalchemy.exc import OperationalError, SQLAlchemyError
from sqlalchemy.orm import Session

from .retry_policy import MaxRetriesExceededError, RetryPolicy

logger = logging.getLogger(__name__)


class DeadlockError(RuntimeError):
    """Raised when a database deadlock cannot be recovered."""


@dataclass
class TransactionStats:
    """Aggregated statistics for transaction activity."""

    committed_records: int = 0
    batches_committed: int = 0
    transactions_committed: int = 0
    transactions_rolled_back: int = 0
    total_retries: int = 0
    last_error: Optional[str] = None


class _TransactionScope:
    """Helper object exposed within ``TransactionManager.transaction``."""

    def __init__(self, manager: "TransactionManager") -> None:
        self._manager = manager
        self._session = manager.db
        self._savepoints: Dict[str, Any] = {}

    # Savepoint helpers -------------------------------------------------
    def savepoint(self, name: str):
        nested = self._session.begin_nested()
        self._savepoints[name] = nested
        logger.debug("Savepoint '%s' created", name)
        return nested

    def rollback_to_savepoint(self, name: str) -> None:
        savepoint = self._savepoints.get(name)
        if not savepoint:
            raise KeyError(f"Unknown savepoint '{name}'")
        savepoint.rollback()
        logger.debug("Rolled back to savepoint '%s'", name)

    def release_savepoint(self, name: str) -> None:
        savepoint = self._savepoints.pop(name, None)
        if savepoint:
            savepoint.commit()
            logger.debug("Savepoint '%s' released", name)


class TransactionManager:
    """Coordinate batched commits, savepoints and retry semantics."""

    def __init__(self, db: Session, batch_size: int = 100) -> None:
        self.db = db
        self.batch_size = batch_size
        self.batch: list[Any] = []
        self.stats = TransactionStats()

    # ------------------------------------------------------------------
    # Batch operations
    # ------------------------------------------------------------------
    def add_to_batch(self, entity: Any) -> None:
        self.batch.append(entity)

    def commit_batch(self) -> int:
        if not self.batch:
            return 0

        try:
            self.db.add_all(self.batch)
            self.db.commit()
            count = len(self.batch)
            self.batch.clear()
            self.stats.batches_committed += 1
            self.stats.committed_records += count
            logger.info(
                "✓ Committed batch of %s records (total committed: %s)",
                count,
                self.stats.committed_records,
            )
            return count
        except SQLAlchemyError as exc:  # pragma: no cover - defensive
            self.db.rollback()
            self.stats.last_error = str(exc)
            logger.error("✗ Batch commit failed: %s", exc)
            raise

    def commit_if_batch_full(self) -> int:
        if len(self.batch) >= self.batch_size:
            return self.commit_batch()
        return 0

    def flush_remaining(self) -> int:
        return self.commit_batch()

    # ------------------------------------------------------------------
    # Transaction context helpers
    # ------------------------------------------------------------------
    @contextmanager
    def transaction(self):
        scope = _TransactionScope(self)
        try:
            yield scope
            self.db.commit()
            self.stats.transactions_committed += 1
        except Exception as exc:
            self.db.rollback()
            self.stats.transactions_rolled_back += 1
            self.stats.last_error = str(exc)
            logger.warning("Transaction rolled back: %s", exc)
            raise

    # ------------------------------------------------------------------
    # Retry helpers
    # ------------------------------------------------------------------
    def execute_with_retry(
        self,
        func: Callable[[], Any],
        *,
        max_retries: int = 3,
        base_delay: float = 0.1,
    ) -> Any:
        """Execute ``func`` retrying on SQL deadlocks."""

        retry_policy = RetryPolicy(
            max_attempts=max_retries,
            base_delay=base_delay,
            jitter=False,
            retryable_exceptions=(DeadlockError,),
            name="transaction.deadlock",
        )

        def wrapped() -> Any:
            try:
                return func()
            except OperationalError as exc:
                message = str(exc).lower()
                if "deadlock" in message:
                    raise DeadlockError("Database deadlock detected") from exc
                raise

        try:
            result = retry_policy.execute(wrapped)
            self.stats.total_retries += retry_policy.stats.total_retries
            return result
        except MaxRetriesExceededError as exc:
            self.stats.total_retries += retry_policy.stats.total_retries
            self.stats.last_error = str(exc)
            raise DeadlockError("Exceeded maximum retries due to deadlock") from exc

    # ------------------------------------------------------------------
    def rollback_all(self) -> None:
        try:
            self.db.rollback()
            self.stats.transactions_rolled_back += 1
            logger.warning("Transaction rolled back")
        except Exception as exc:  # pragma: no cover - defensive
            logger.error("Error during rollback: %s", exc)

    def get_stats(self) -> dict[str, Any]:
        return {
            "committed_records": self.stats.committed_records,
            "batches_committed": self.stats.batches_committed,
            "batch_pending": len(self.batch),
            "batch_size": self.batch_size,
            "transactions_committed": self.stats.transactions_committed,
            "transactions_rolled_back": self.stats.transactions_rolled_back,
            "total_retries": self.stats.total_retries,
            "last_error": self.stats.last_error,
        }
