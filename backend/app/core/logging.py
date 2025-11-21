"""Structured logging setup using Loguru."""
from __future__ import annotations

from pathlib import Path
from typing import Any

from loguru import logger

from app.core.config import settings

LOG_SINK = Path(settings.LOG_FILE)
LOG_SINK.parent.mkdir(parents=True, exist_ok=True)

logger.remove()
logger.add(
    LOG_SINK,
    rotation="10 MB",
    retention="14 days",
    compression="zip",
    serialize=True,
    backtrace=True,
    diagnose=settings.DEBUG,
    level=settings.LOG_LEVEL,
)
logger.add(
    lambda msg: print(msg, end=""),
    level=settings.LOG_LEVEL,
    colorize=True,
    backtrace=True,
    diagnose=settings.DEBUG,
)

app_logger = logger.bind(app=settings.APP_NAME)


def log_audit_event(**payload: Any) -> None:
    app_logger.bind(event="audit").info(payload)


def log_security_event(**payload: Any) -> None:
    app_logger.bind(event="security").warning(payload)


def log_performance_metric(metric: str, value: float, **extra: Any) -> None:
    app_logger.bind(event="performance", metric=metric).info({"value": value, **extra})


def log_ocr_operation(**payload: Any) -> None:
    app_logger.bind(event="ocr").info(payload)


__all__ = [
    "app_logger",
    "log_audit_event",
    "log_security_event",
    "log_performance_metric",
    "log_ocr_operation",
]
