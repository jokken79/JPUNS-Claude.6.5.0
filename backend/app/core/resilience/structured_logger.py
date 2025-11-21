"""Structured logging for import operations."""
from __future__ import annotations

import json
import logging
import time
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import UTC, datetime
from enum import Enum
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional


class LogLevel(str, Enum):
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


@dataclass
class OperationMetrics:
    total_runs: int = 0
    successes: int = 0
    failures: int = 0
    total_duration_ms: float = 0.0

    @property
    def avg_duration_ms(self) -> float:
        if self.total_runs == 0:
            return 0.0
        return self.total_duration_ms / self.total_runs


class StructuredLogger:
    """Structured JSON logger with contextual information and metrics."""

    def __init__(
        self,
        operation_id: Optional[str] = None,
        *,
        log_file: Optional[Path] = None,
        enable_file: bool = True,
        logger_name: Optional[str] = None,
        name: Optional[str] = None,
    ) -> None:
        identifier = operation_id or name
        if not identifier:
            raise ValueError("StructuredLogger requires an operation_id or name.")

        self.operation_id = identifier
        resolved_logger_name = logger_name or f"app.import.{identifier}"
        self.logger = logging.getLogger(resolved_logger_name)
        self._global_context: Dict[str, Any] = {"operation_id": identifier}
        self._context_stack: List[Dict[str, Any]] = []
        self._metrics: Dict[str, OperationMetrics] = {}

        self.enable_file = enable_file
        self.log_path: Optional[Path] = Path(log_file) if log_file else None
        if self.enable_file and self.log_path is not None:
            self.log_path.parent.mkdir(parents=True, exist_ok=True)
            # Ensure file exists for subsequent reads
            self.log_path.touch(exist_ok=True)

    # ------------------------------------------------------------------
    def set_context(self, **kwargs) -> None:
        self._global_context.update(kwargs)

    @contextmanager
    def context(self, **kwargs):
        normalized = self._normalize_context(kwargs)
        self._context_stack.append(normalized)
        try:
            yield
        finally:
            self._context_stack.pop()

    @contextmanager
    def operation(self, name: str):
        start = time.perf_counter()
        succeeded = False
        try:
            yield
            succeeded = True
        finally:
            elapsed_ms = (time.perf_counter() - start) * 1000
            metrics = self._metrics.setdefault(name, OperationMetrics())
            metrics.total_runs += 1
            metrics.total_duration_ms += elapsed_ms
            if succeeded:
                metrics.successes += 1
            else:
                metrics.failures += 1

    # ------------------------------------------------------------------
    def debug(self, message: str, **kwargs) -> None:
        self._log(LogLevel.DEBUG, message, **kwargs)

    def info(self, message: str, **kwargs) -> None:
        self._log(LogLevel.INFO, message, **kwargs)

    def warning(self, message: str, **kwargs) -> None:
        self._log(LogLevel.WARNING, message, **kwargs)

    def error(self, message: str, error: Optional[str] = None, **kwargs) -> None:
        self._log(LogLevel.ERROR, message, error=error, **kwargs)

    def critical(self, message: str, error: Optional[str] = None, **kwargs) -> None:
        self._log(LogLevel.CRITICAL, message, error=error, **kwargs)

    # ------------------------------------------------------------------
    def _log(self, level: LogLevel, message: str, **kwargs) -> None:
        entry: Dict[str, Any] = {
            "timestamp": datetime.now(UTC).isoformat(),
            "level": level.value,
            "message": message,
            "operation_id": self.operation_id,
            "context": self._collect_context(kwargs),
        }

        extra_fields = {k: v for k, v in kwargs.items() if k not in {"batch", "row", "context"}}
        if extra_fields:
            entry.update(extra_fields)

        line = json.dumps(entry, default=str)
        self._emit(level, line)

    def _emit(self, level: LogLevel, payload: str) -> None:
        if level == LogLevel.DEBUG:
            self.logger.debug(payload)
        elif level == LogLevel.INFO:
            self.logger.info(payload)
        elif level == LogLevel.WARNING:
            self.logger.warning(payload)
        elif level == LogLevel.ERROR:
            self.logger.error(payload)
        else:
            self.logger.critical(payload)

        if self.enable_file and self.log_path is not None:
            with self.log_path.open("a", encoding="utf-8") as fp:
                fp.write(payload + "\n")

    def _collect_context(self, runtime_kwargs: Dict[str, Any]) -> Dict[str, Any]:
        combined: Dict[str, Any] = {}
        combined.update(self._global_context)
        for ctx in self._context_stack:
            combined.update(ctx)

        runtime_context = self._normalize_context({k: runtime_kwargs.get(k) for k in ("batch", "row") if k in runtime_kwargs})
        combined.update(runtime_context)
        if "context" in runtime_kwargs and isinstance(runtime_kwargs["context"], dict):
            combined.update(runtime_kwargs["context"])
        return combined

    @staticmethod
    def _normalize_context(values: Dict[str, Any]) -> Dict[str, Any]:
        normalized: Dict[str, Any] = {}
        if "batch" in values and values["batch"] is not None:
            normalized["batch_number"] = values["batch"]
        if "row" in values and values["row"] is not None:
            normalized["row_number"] = values["row"]
        for key, val in values.items():
            if key not in {"batch", "row"} and val is not None:
                normalized[key] = val
        return normalized

    # ------------------------------------------------------------------
    def log_import_started(self, operation: str, total_records: int) -> None:
        self.info("Starting %s" % operation, total_records=total_records)

    def log_import_completed(
        self,
        operation: str,
        *,
        imported: int,
        skipped: int,
        errors: int,
        duration_seconds: float,
    ) -> None:
        self.info(
            f"Completed {operation}",
            imported=imported,
            skipped=skipped,
            errors=errors,
            duration_seconds=duration_seconds,
        )

    def log_record_processed(
        self,
        operation: str,
        record_id: Any,
        *,
        status: str,
        batch_number: int,
        row_number: int,
        error: Optional[str] = None,
    ) -> None:
        self.info(
            f"Processed record in {operation}",
            entity_id=record_id,
            status=status,
            batch=batch_number,
            row=row_number,
            error=error,
        )

    # ------------------------------------------------------------------
    def get_metrics(self) -> Dict[str, Dict[str, Any]]:
        metrics: Dict[str, Dict[str, Any]] = {}
        for name, data in self._metrics.items():
            metrics[name] = {
                "total_runs": data.total_runs,
                "successes": data.successes,
                "failures": data.failures,
                "avg_duration_ms": data.avg_duration_ms,
            }
        return metrics
