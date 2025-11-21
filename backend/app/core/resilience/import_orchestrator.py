"""Import orchestrator - master coordinator for resilient imports."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import Enum
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Sequence

from sqlalchemy.orm import Session

from .circuit_breaker import CircuitBreaker
from .checkpoint_manager import CheckpointManager
from .idempotency_guard import IdempotencyGuard
from .retry_policy import RetryPolicy
from .structured_logger import StructuredLogger
from .transaction_manager import TransactionManager
from .validators import ExcelStructureValidator, FileValidator


class ImportState(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    FAILED = "failed"
    COMPLETED = "completed"


@dataclass
class ImportResult:
    success: bool
    operation_id: str
    state: ImportState
    imported_rows: int = 0
    skipped_rows: int = 0
    error_rows: int = 0
    duration_seconds: float = 0.0
    error_message: Optional[str] = None
    can_resume: bool = False
    validation_errors: List[str] = field(default_factory=list)

    def __str__(self) -> str:
        if self.success:
            return (
                f"✓ Success: {self.imported_rows} imported, {self.skipped_rows} skipped, "
                f"{self.error_rows} errors ({self.duration_seconds:.2f}s)"
            )
        return f"✗ Failed: {self.error_message} (can_resume={self.can_resume})"


class ImportOrchestrator:
    """Coordinate resilient import operations with validation and telemetry."""

    REQUIRED_STRUCTURES: Dict[str, Dict[str, Sequence[str]]] = {
        "employees": {"Employees": ("employee_id", "full_name")},
        "factories": {"Factories": ("factory_id", "name")},
    }

    def __init__(
        self,
        db: Session,
        operation_id: str,
        batch_size: int = 100,
        checkpoint_dir: str = "/tmp/import_checkpoints",
    ) -> None:
        self.db = db
        self.operation_id = operation_id
        self.state = ImportState.PENDING
        self.start_time = datetime.now(UTC)

        checkpoint_path = Path(checkpoint_dir)
        self.logger = StructuredLogger(operation_id, log_file=checkpoint_path / f"{operation_id}.log.jsonl")
        self.validator = FileValidator()

        self.transaction_manager = TransactionManager(db, batch_size)
        self.checkpoint_manager = CheckpointManager(operation_id, checkpoint_dir)
        self.idempotency_guard = IdempotencyGuard(operation_id, storage_dir=str(checkpoint_path / "idempotency"))

        self.db_circuit_breaker = CircuitBreaker(name="database", failure_threshold=3, timeout=30)
        self.file_circuit_breaker = CircuitBreaker(name="filesystem", failure_threshold=2, timeout=10)
        self.parsing_circuit_breaker = CircuitBreaker(name="parsing", failure_threshold=5, timeout=5)

        self.retry_policy = RetryPolicy(max_attempts=3, base_delay=0.2, jitter=False, name=f"import.{operation_id}")

        self.imported_count = 0
        self.skipped_count = 0
        self.error_count = 0

    # ------------------------------------------------------------------
    def validate_prerequisites(self, file_path: str, table_type: str) -> List[str]:
        errors: List[str] = []

        is_valid, error = self.validator.validate(file_path)
        if not is_valid and error:
            errors.append(error)
            return errors

        structure = self.REQUIRED_STRUCTURES.get(table_type.lower())
        if structure:
            sheets = list(structure.keys())
            sheet_columns = {name: list(columns) for name, columns in structure.items()}
            validator = ExcelStructureValidator(sheets, sheet_columns)
            valid, structure_error = validator.validate(file_path)
            if not valid and structure_error:
                errors.append(structure_error)

        return errors

    def import_file(self, file_path: str, table_type: str) -> ImportResult:
        self.state = ImportState.RUNNING
        self.start_time = datetime.now(UTC)

        validation_errors = self.validate_prerequisites(file_path, table_type)
        if validation_errors:
            self.state = ImportState.FAILED
            error_message = "; ".join(validation_errors)
            self.logger.error("Pre-import validation failed", error=error_message, context={"validation_errors": validation_errors})
            return ImportResult(
                success=False,
                operation_id=self.operation_id,
                state=self.state,
                error_message=error_message,
                validation_errors=validation_errors,
                can_resume=False,
            )

        # Placeholder for the actual import flow. For now we only track metrics.
        self.state = ImportState.COMPLETED
        duration = (datetime.now(UTC) - self.start_time).total_seconds()
        result = ImportResult(
            success=True,
            operation_id=self.operation_id,
            state=self.state,
            imported_rows=self.imported_count,
            skipped_rows=self.skipped_count,
            error_rows=self.error_count,
            duration_seconds=duration,
        )
        return result

    # ------------------------------------------------------------------
    def process_batch(
        self,
        batch_items: List[Any],
        process_func: Callable[[Any], Any],
        operation_name: str,
    ) -> tuple[int, int]:
        imported = 0
        errors = 0

        for idx, item in enumerate(batch_items):
            try:
                if not self.idempotency_guard.should_process(item):
                    self.skipped_count += 1
                    continue

                def execute_item():
                    return process_func(item)

                self.db_circuit_breaker.call(self.retry_policy.execute, execute_item)
                self.idempotency_guard.mark_processed(item, persist=False)
                self.imported_count += 1
                imported += 1
            except Exception as exc:  # pragma: no cover - integration safeguard
                errors += 1
                self.error_count += 1
                self.logger.error(
                    f"Failed to process {operation_name}",
                    entity_id=getattr(item, "id", idx),
                    error=str(exc),
                    row=idx,
                )

        return imported, errors

    # ------------------------------------------------------------------
    def commit_and_checkpoint(self) -> None:
        self.transaction_manager.commit_batch()
        checkpoint_data = {
            "imported": self.imported_count,
            "skipped": self.skipped_count,
            "errors": self.error_count,
            "timestamp": datetime.now(UTC).isoformat(),
        }
        self.checkpoint_manager.update_checkpoint(progress=checkpoint_data)

    def finalize(self) -> ImportResult:
        try:
            self.transaction_manager.flush_remaining()
        except Exception as exc:  # pragma: no cover - defensive
            self.state = ImportState.FAILED
            error_message = f"Failed to commit final batch: {exc}"
            self.logger.error("Final commit failed", error=error_message)
            return ImportResult(
                success=False,
                operation_id=self.operation_id,
                state=self.state,
                imported_rows=self.imported_count,
                skipped_rows=self.skipped_count,
                error_rows=self.error_count,
                duration_seconds=(datetime.now(UTC) - self.start_time).total_seconds(),
                error_message=error_message,
                can_resume=True,
            )

        duration = (datetime.now(UTC) - self.start_time).total_seconds()
        if self.error_count == 0:
            self.state = ImportState.COMPLETED
        else:
            self.state = ImportState.FAILED

        if self.error_count == 0:
            self.checkpoint_manager.delete_all()

        return ImportResult(
            success=self.error_count == 0,
            operation_id=self.operation_id,
            state=self.state,
            imported_rows=self.imported_count,
            skipped_rows=self.skipped_count,
            error_rows=self.error_count,
            duration_seconds=duration,
            can_resume=self.error_count > 0,
        )

    def get_stats(self) -> Dict[str, Any]:
        return {
            "operation_id": self.operation_id,
            "state": self.state.value,
            "imported": self.imported_count,
            "skipped": self.skipped_count,
            "errors": self.error_count,
            "duration_seconds": (datetime.now(UTC) - self.start_time).total_seconds(),
            "circuit_breakers": {
                "database": self.db_circuit_breaker.get_state(),
                "filesystem": self.file_circuit_breaker.get_state(),
                "parsing": self.parsing_circuit_breaker.get_state(),
            },
            "transaction_manager": self.transaction_manager.get_stats(),
            "idempotency_guard": self.idempotency_guard.get_stats(),
        }
