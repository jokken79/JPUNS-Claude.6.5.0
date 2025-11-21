"""Monitoring and health-check endpoints."""
from __future__ import annotations

import platform
import time
from typing import Any, Dict

import psutil
from fastapi import APIRouter, Depends, HTTPException

from app.core.config import settings
from app.core.logging import app_logger
from app.core.observability import get_runtime_metrics
from app.services.auth_service import AuthService

router = APIRouter()


@router.get("/health", summary="Detailed health information")
async def detailed_health() -> Dict[str, Any]:
    try:
        # OCR service removed - using Azure OCR service instead
        process = psutil.Process()
        cpu_percent = psutil.cpu_percent(interval=None)
        memory = psutil.virtual_memory()
        runtime_metrics = get_runtime_metrics()

        return {
            "status": "ok",
            "timestamp": time.time(),
            "system": {
                "platform": platform.platform(),
                "python": platform.python_version(),
                "cpu_percent": cpu_percent,
                "memory_percent": memory.percent,
                "uptime_seconds": time.time() - psutil.boot_time(),
            },
            "process": {
                "rss": process.memory_info().rss,
                "threads": process.num_threads(),
            },
            "ocr": runtime_metrics,
            "application": {
                "version": settings.APP_VERSION,
                "environment": settings.ENVIRONMENT,
            },
        }
    except Exception as exc:  # pragma: no cover - defensive
        app_logger.exception("Health endpoint failed")
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/metrics", summary="Application metrics (Admin only)")
async def metrics(
    current_user = Depends(AuthService.require_role("admin"))
) -> Dict[str, Any]:
    """
    Get application metrics - REQUIRES ADMIN ROLE.

    Returns OCR processing statistics and performance metrics.
    """
    metrics_snapshot = get_runtime_metrics()
    return {
        "ocr_total_requests": metrics_snapshot.get("requests", 0),
        "ocr_total_failures": metrics_snapshot.get("failures", 0),
        "ocr_average_processing_time": metrics_snapshot.get("average_duration", 0.0),
    }


@router.delete("/cache", summary="Clear OCR cache (Admin only)")
async def clear_cache(
    current_user = Depends(AuthService.require_role("admin"))
) -> Dict[str, Any]:
    """
    Clear OCR cache - REQUIRES ADMIN ROLE.

    Note: Azure OCR service doesn't use cache, but endpoint is kept for compatibility.
    """
    # OCR service removed - using Azure OCR service instead
    result = {"success": True, "message": "Cache cleared successfully (Azure OCR doesn't use cache)"}
    return result
