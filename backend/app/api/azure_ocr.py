"""
Azure Computer Vision OCR API endpoints - UNS-ClaudeJP 2.0
OCR processing using Azure Computer Vision API
"""
from __future__ import annotations

import asyncio
import base64
import tempfile
from pathlib import Path
from typing import Any, Dict
from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from fastapi import Request
from app.core.cache import cache, CacheKey, CacheTTL
from app.core.response import success_response, created_response, paginated_response, no_content_response
from app.core.logging import app_logger
from app.core.background_tasks import background_manager, JobStatus
from app.schemas.responses import CacheStatsResponse, ErrorResponse, OCRResponse
from app.schemas.job import JobResponse, JobStatusResponse, OCRJobRequest
from app.services.auth_service import AuthService
from app.services.hybrid_ocr_service import HybridOCRService
from app.core.rate_limiter import limiter

router = APIRouter()
ocr_service = HybridOCRService()  # Consolidated OCR service (Azure primary, with fallbacks)
UPLOAD_DIR = Path(settings.UPLOAD_DIR) / "azure_ocr_temp"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def process_ocr_sync(image_path: str, document_type: str) -> Dict[str, Any]:
    """Función auxiliar para procesar OCR (se ejecuta en background)"""
    try:
        result = ocr_service.process_document(image_path, document_type)
        result["document_type"] = document_type
        return {"success": True, "data": result}
    except Exception as e:
        app_logger.exception("OCR processing failed in background", document_type=document_type)
        raise
    finally:
        # Limpiar archivo temporal después de procesar
        Path(image_path).unlink(missing_ok=True)


@router.options("/process")
async def process_options(
    request: Request,
    ):
    """Handle OPTIONS request for CORS preflight."""
    return {"success": True}


@router.options("/process-from-base64")
async def process_base64_options(
    request: Request,
    ):
    """Handle OPTIONS request for CORS preflight."""
    return {"success": True}


@router.post(
    "/process",
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
@limiter.limit("20/hour")
async def process_ocr_document(
    file: UploadFile = File(..., description="Imagen a procesar"),
    document_type: str = Form("zairyu_card", description="Tipo de documento"),
    db: Session = Depends(get_db),
    current_user = Depends(AuthService.get_current_active_user)
) -> Dict[str, Any]:
    """
    Process document with OCR

    Supports various document types:
    - zairyu_card: Residence Card (在留カード)

    Requires authentication.
    - rirekisho: Resume/CV (履歴書)
    - license: Driver's License (免許証)

    Returns:
        JSON with extracted data including personal info
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are supported")
    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds limit")

    # Get file extension safely
    file_suffix = ".jpg"  # Default extension
    if file.filename:
        file_suffix = Path(file.filename).suffix or ".jpg"

    app_logger.info(f"Processing OCR for document type: {document_type}, file: {file.filename}")

    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=file_suffix, dir=UPLOAD_DIR)
    temp_file.write(content)
    temp_file.close()

    try:
        # Process with Azure OCR service
        result = ocr_service.process_document(temp_file.name, document_type)

        # Add document type to result
        result["document_type"] = document_type

        app_logger.info(f"OCR processing completed successfully for {document_type}")

        return {"success": True, "data": result, "message": "Document processed successfully"}
    except Exception as exc:  # pragma: no cover - fallback
        app_logger.exception("OCR processing failed", document_type=document_type)
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    finally:
        Path(temp_file.name).unlink(missing_ok=True)


@router.post(
    "/process-from-base64",
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
@limiter.limit("20/hour")
async def process_ocr_from_base64(
    image_base64: str = Form(..., description="Imagen en base64"),
    mime_type: str = Form(..., description="Tipo MIME"),
    document_type: str = Form("zairyu_card"),
    db: Session = Depends(get_db),
    current_user = Depends(AuthService.get_current_active_user)
) -> Dict[str, Any]:
    """Process OCR from Base64 image. Requires authentication."""
    if not image_base64:
        raise HTTPException(status_code=400, detail="image_base64 is required")
    try:
        # Create temporary file from base64
        extension = mime_type.split("/")[-1]
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=f".{extension}", dir=UPLOAD_DIR)
        temp_file.write(base64.b64decode(image_base64))
        temp_file.close()

        try:
            result = ocr_service.process_document(temp_file.name, document_type)
            return {"success": True, "data": result, "message": "Document processed successfully"}
        finally:
            Path(temp_file.name).unlink(missing_ok=True)
    except Exception as exc:  # pragma: no cover
        app_logger.exception("OCR base64 failed", document_type=document_type)
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/process-async", response_model=JobResponse)
@limiter.limit("20/hour")
async def process_ocr_document_async(
    file: UploadFile = File(..., description="Imagen a procesar"),
    document_type: str = Form("zairyu_card", description="Tipo de documento"),
    db: Session = Depends(get_db),
    current_user = Depends(AuthService.get_current_active_user)
) -> JobResponse:
    """
    Process document with OCR asynchronously (NO BLOQUEANTE).

    Retorna job_id inmediatamente. Usa GET /jobs/{job_id} para ver el estado.

    Supports: zairyu_card, rirekisho, license, timer_card
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are supported")

    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds limit")

    # Guardar archivo temporalmente
    file_suffix = Path(file.filename).suffix or ".jpg" if file.filename else ".jpg"
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=file_suffix, dir=UPLOAD_DIR)
    temp_file.write(content)
    temp_file.close()

    # Crear job
    job_id = background_manager.create_job(
        job_type="ocr_processing",
        params={
            "document_type": document_type,
            "filename": file.filename,
            "temp_path": temp_file.name
        }
    )

    # Iniciar procesamiento en background
    background_manager.start_job_async(
        job_id,
        process_ocr_sync,
        temp_file.name,
        document_type
    )

    app_logger.info(f"📋 OCR job creado: {job_id} ({document_type})")

    return JobResponse(
        job_id=job_id,
        job_type="ocr_processing",
        status="pending",
        message=f"OCR job created. Check status at /api/azure_ocr/jobs/{job_id}"
    )


@router.get("/jobs/{job_id}", response_model=JobStatusResponse)
@cache.cached(ttl=CacheTTL.MEDIUM)
@limiter.limit("20/hour")
async def get_job_status(
    job_id: str,
    current_user = Depends(AuthService.get_current_active_user)
) -> JobStatusResponse:
    """
    Obtiene el estado de un job de OCR.

    Estados posibles:
    - pending: Esperando procesamiento
    - processing: Procesando OCR
    - completed: Completado exitosamente
    - failed: Falló el procesamiento
    """
    job = background_manager.get_job(job_id)

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Calcular porcentaje de progreso estimado
    progress = 0
    if job.status == JobStatus.PENDING:
        progress = 0
    elif job.status == JobStatus.PROCESSING:
        # Estimado: OCR típicamente toma 5-20 segundos
        if job.started_at:
            elapsed = (datetime.now() - job.started_at).total_seconds()
            progress = min(int((elapsed / 15) * 100), 99)  # Max 99% hasta completar
    elif job.status == JobStatus.COMPLETED:
        progress = 100
    elif job.status == JobStatus.FAILED:
        progress = 0

    return JobStatusResponse(
        job_id=job.job_id,
        job_type=job.job_type,
        status=job.status.value,
        result=job.result,
        error=job.error,
        created_at=job.created_at,
        started_at=job.started_at,
        finished_at=job.finished_at,
        progress_percentage=progress
    )


@router.get("/health")
@cache.cached(ttl=CacheTTL.MEDIUM)
@limiter.limit("20/hour")
async def health_check(
    request: Request,
    ):
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "azure_ocr",
        "provider": "Azure Computer Vision",
        "api_version": ocr_service.api_version
    }


@router.post("/warm-up")
@limiter.limit("20/hour")
async def warm_up_ocr_service(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user = Depends(AuthService.require_role("admin"))
) -> Dict[str, Any]:
    """Warm up OCR service with a dummy image. Requires admin role."""
    def _warm_up() -> None:
        try:
            app_logger.info("Azure OCR warm-up started")
            # Create tiny blank image for pipeline warm-up
            import io
            from PIL import Image

            image = Image.new("RGB", (10, 10), color="white")
            buffer = io.BytesIO()
            image.save(buffer, format="PNG")
            encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")

            # Create temp file for warm-up
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".png", dir=UPLOAD_DIR)
            temp_file.write(base64.b64decode(encoded))
            temp_file.close()

            try:
                ocr_service.process_document(temp_file.name, "warmup")
            finally:
                Path(temp_file.name).unlink(missing_ok=True)

            app_logger.info("Azure OCR warm-up completed")
        except Exception as exc:  # pragma: no cover
            app_logger.warning("Warm up failed", error=str(exc))

    background_tasks.add_task(_warm_up)
    return {"success": True, "message": "Azure OCR warm-up started"}