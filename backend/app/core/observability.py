"""OpenTelemetry and Prometheus instrumentation helpers."""

from __future__ import annotations

import logging
from collections import defaultdict
from contextlib import contextmanager
from threading import Lock
from typing import Dict, Iterator

from fastapi import FastAPI
from opentelemetry import metrics, trace
from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import OTLPMetricExporter
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.logging import LoggingInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from prometheus_fastapi_instrumentator import Instrumentator

from app.core.config import settings
from app.core.database import engine

logger = logging.getLogger(__name__)

_telemetry_configured = False
_meter = metrics.get_meter("uns_claudejp.backend")
_metrics_lock = Lock()
_ocr_runtime_state: Dict[str, float] = defaultdict(float)

_ocr_requests = _meter.create_counter(
    name="ocr_requests_total",
    unit="1",
    description="Number of OCR requests processed",
)
_ocr_failures = _meter.create_counter(
    name="ocr_failures_total",
    unit="1",
    description="Number of OCR requests that failed",
)
_ocr_durations = _meter.create_histogram(
    name="ocr_processing_seconds",
    unit="s",
    description="OCR processing duration in seconds",
)


def _build_resource() -> Resource:
    return Resource.create(
        {
            "service.name": settings.OTEL_SERVICE_NAME,
            "service.version": settings.APP_VERSION,
            "deployment.environment": settings.ENVIRONMENT,
            "service.namespace": "uns-claudejp",
        }
    )


def configure_observability(app: FastAPI) -> None:
    """Configure OpenTelemetry and Prometheus instrumentation once."""

    global _telemetry_configured

    if _telemetry_configured or not settings.ENABLE_TELEMETRY:
        return

    resource = _build_resource()

    span_exporter = OTLPSpanExporter(
        endpoint=settings.OTEL_EXPORTER_OTLP_ENDPOINT,
        insecure=settings.OTEL_EXPORTER_OTLP_ENDPOINT.startswith("http://"),
    )
    tracer_provider = TracerProvider(resource=resource)
    tracer_provider.add_span_processor(BatchSpanProcessor(span_exporter))
    trace.set_tracer_provider(tracer_provider)

    FastAPIInstrumentor.instrument_app(app, tracer_provider=tracer_provider)
    RequestsInstrumentor().instrument()
    LoggingInstrumentor().instrument(set_logging_format=True)

    try:
        SQLAlchemyInstrumentor().instrument(engine=engine)
    except Exception as exc:  # pragma: no cover - defensive logging
        logger.warning("SQLAlchemy instrumentation failed: %s", exc)

    metric_exporter = OTLPMetricExporter(
        endpoint=settings.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT,
        insecure=settings.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT.startswith("http://"),
    )
    reader = PeriodicExportingMetricReader(
        metric_exporter,
        export_interval_millis=settings.OTEL_METRICS_EXPORT_INTERVAL_MS,
    )
    meter_provider = MeterProvider(resource=resource, metric_readers=[reader])
    metrics.set_meter_provider(meter_provider)

    Instrumentator().instrument(app).expose(
        app,
        endpoint=settings.PROMETHEUS_METRICS_PATH,
        include_in_schema=False,
        tags=["Monitoring"],
    )

    _telemetry_configured = True
    logger.info("OpenTelemetry instrumentation initialised", extra={"service": settings.OTEL_SERVICE_NAME})


@contextmanager
def trace_ocr_operation(name: str, document_type: str, method: str) -> Iterator[None]:
    """Context manager that records OCR spans and metrics."""

    attributes = {
        "ocr.document_type": document_type,
        "ocr.method": method,
    }

    tracer = trace.get_tracer("uns_claudejp.backend.ocr")
    with tracer.start_as_current_span(name, attributes=attributes) as span:
        try:
            yield
        except Exception as exc:
            span.record_exception(exc)
            record_ocr_failure(document_type=document_type, method=method)
            raise


def record_ocr_request(*, document_type: str, method: str, duration_seconds: float | None = None) -> None:
    if not settings.ENABLE_TELEMETRY:
        return

    attributes = {"ocr.document_type": document_type, "ocr.method": method}
    _ocr_requests.add(1, attributes)
    if duration_seconds is not None:
        _ocr_durations.record(duration_seconds, attributes)
    with _metrics_lock:
        _ocr_runtime_state["requests"] += 1
        if duration_seconds is not None:
            _ocr_runtime_state["total_duration"] += duration_seconds


def record_ocr_failure(*, document_type: str, method: str) -> None:
    if not settings.ENABLE_TELEMETRY:
        return
    attributes = {"ocr.document_type": document_type, "ocr.method": method}
    _ocr_failures.add(1, attributes)
    with _metrics_lock:
        _ocr_runtime_state["failures"] += 1


def get_runtime_metrics() -> Dict[str, float]:
    """Expose lightweight counters for FastAPI monitoring endpoints."""

    with _metrics_lock:
        snapshot = dict(_ocr_runtime_state)
    if snapshot.get("requests", 0) and snapshot.get("total_duration"):
        snapshot["average_duration"] = snapshot["total_duration"] / snapshot["requests"]
    else:
        snapshot.setdefault("average_duration", 0.0)
    snapshot.setdefault("requests", 0.0)
    snapshot.setdefault("failures", 0.0)
    snapshot.setdefault("total_duration", 0.0)
    return snapshot


__all__ = [
    "configure_observability",
    "trace_ocr_operation",
    "record_ocr_request",
    "record_ocr_failure",
    "get_runtime_metrics",
]
