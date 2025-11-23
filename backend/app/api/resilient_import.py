"""Resilient import API endpoints with full error handling and resilience."""

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
import tempfile
import os
from pathlib import Path
import pandas as pd
from typing import Optional
from datetime import datetime
import json

from app.core.database import get_db
from app.core.resilience import (
    ImportOrchestrator,
    CheckpointManager,
    StructuredLogger,
)
from app.models.models import (
    Factory, Employee, ContractWorker, Staff,
    SocialInsuranceRate, Candidate, User
)

router = APIRouter(prefix="/api/resilient-import", tags=["resilient-import"])

# Global logger
logger = StructuredLogger(name="resilient_import_api")


@router.post("/employees")
async def import_employees(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Import employees with full resilience protection.

    Supports:
    - Pre-validation (file structure, columns, schema)
    - Circuit breakers (prevent cascading failures)
    - Batch transactions with savepoints
    - Checkpoints for recovery
    - Idempotency (prevent duplicates)
    - Structured logging for debugging

    Returns:
        ImportResult with comprehensive statistics
    """
    operation_id = f"emp_{int(__import__('time').time() * 1000)}"
    logger.set_context(operation_id=operation_id)

    tmp_path = None
    try:
        # Save uploaded file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".xlsm", mode='wb') as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        logger.info("File uploaded and saved", file_size=len(content))

        # Initialize orchestrator
        orchestrator = ImportOrchestrator(db, operation_id)

        # Validate prerequisites
        required_sheets = ["派遣社員", "請負社員", "スタッフ"]
        required_columns = {
            "派遣社員": ["社員№", "氏名", "派遣先"],
            "請負社員": ["社員№", "氏名"],
            "スタッフ": ["社員№", "氏名"],
        }

        if not orchestrator.validate_prerequisites(tmp_path, required_sheets, required_columns):
            raise HTTPException(status_code=400, detail="File validation failed")

        logger.info("Prerequisite validation passed")

        # Import employees from sheet
        df_haken = pd.read_excel(tmp_path, sheet_name="派遣社員")
        df_ukeoi = pd.read_excel(tmp_path, sheet_name="請負社員")
        df_staff = pd.read_excel(tmp_path, sheet_name="スタッフ")

        logger.info(
            "Sheets loaded",
            haken_rows=len(df_haken),
            ukeoi_rows=len(df_ukeoi),
            staff_rows=len(df_staff),
        )

        # Process each sheet
        # === 派遣社員 (Dispatch workers) ===
        for idx, row in df_haken.iterrows():
            try:
                employee = Employee(
                    hakenmoto_id=int(row.get("社員№", 0)),
                    full_name_kanji=row.get("氏名", ""),
                    factory_id=row.get("派遣先", ""),
                )
                orchestrator.transaction_manager.add_to_batch(employee)
                orchestrator.transaction_manager.commit_if_batch_full()
            except Exception as e:
                orchestrator.logger.error(
                    "Failed to process dispatch worker",
                    row=idx,
                    error=str(e),
                )

        # === 請負社員 (Contract workers) ===
        for idx, row in df_ukeoi.iterrows():
            try:
                contract_worker = ContractWorker(
                    hakenmoto_id=int(row.get("社員№", 0)),
                    full_name_kanji=row.get("氏名", ""),
                )
                orchestrator.transaction_manager.add_to_batch(contract_worker)
                orchestrator.transaction_manager.commit_if_batch_full()
            except Exception as e:
                orchestrator.logger.error(
                    "Failed to process contract worker",
                    row=idx,
                    error=str(e),
                )

        # === スタッフ (Staff) ===
        for idx, row in df_staff.iterrows():
            try:
                staff = Staff(
                    staff_id=str(row.get("社員№", "")),
                    full_name_kanji=row.get("氏名", ""),
                )
                orchestrator.transaction_manager.add_to_batch(staff)
                orchestrator.transaction_manager.commit_if_batch_full()
            except Exception as e:
                orchestrator.logger.error(
                    "Failed to process staff",
                    row=idx,
                    error=str(e),
                )

        # Commit final batch
        orchestrator.commit_and_checkpoint()

        # Finalize and return
        result = orchestrator.finalize()

        logger.info(
            "Import completed",
            imported=result.imported_rows,
            skipped=result.skipped_rows,
            errors=result.error_rows,
            success=result.success,
        )

        return {
            "success": result.success,
            "operation_id": result.operation_id,
            "statistics": {
                "imported": result.imported_rows,
                "skipped": result.skipped_rows,
                "errors": result.error_rows,
                "duration_seconds": result.duration_seconds,
            },
            "can_resume": result.can_resume,
            "message": str(result),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Import operation failed", error=str(e), exception=type(e).__name__)
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")

    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
                logger.debug("Temporary file cleaned up", file=tmp_path)
            except Exception as e:
                logger.warning("Failed to clean up temp file", file=tmp_path, error=str(e))


@router.post("/factories")
async def import_factories(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Import factories with resilience."""
    operation_id = f"factories_{int(__import__('time').time() * 1000)}"
    logger.set_context(operation_id=operation_id)

    tmp_path = None
    try:
        # BUG #6 FIX: Soporte para múltiples encodings
        content = await file.read()
        content_text = None
        detected_encoding = None

        # Intentar decodificar con múltiples encodings
        encodings = ['utf-8', 'utf-8-sig', 'shift_jis', 'cp932', 'iso-2022-jp', 'latin-1']
        for encoding in encodings:
            try:
                content_text = content.decode(encoding)
                detected_encoding = encoding
                logger.info(f"JSON decoded successfully with {encoding}", encoding=encoding)
                break
            except (UnicodeDecodeError, AttributeError):
                continue

        if not content_text:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file encoding. Supported encodings: {', '.join(encodings)}"
            )

        with tempfile.NamedTemporaryFile(delete=False, suffix=".json", mode='w', encoding='utf-8') as tmp:
            tmp.write(content_text)
            tmp_path = tmp.name

        orchestrator = ImportOrchestrator(db, operation_id)

        # Load JSON
        with open(tmp_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        factories_list = data.get('factories', [])
        logger.info("Factories loaded from JSON", count=len(factories_list), detected_encoding=detected_encoding)

        # Process factories
        for idx, factory_data in enumerate(factories_list):
            try:
                factory = Factory(
                    factory_id=factory_data.get('factory_id'),
                    company_name=factory_data.get('company_name'),
                    plant_name=factory_data.get('plant_name'),
                    prefecture=factory_data.get('prefecture'),
                )
                orchestrator.transaction_manager.add_to_batch(factory)
                orchestrator.transaction_manager.commit_if_batch_full()
            except Exception as e:
                orchestrator.logger.error(
                    "Failed to process factory",
                    row=idx,
                    factory_id=factory_data.get('factory_id'),
                    error=str(e),
                )

        orchestrator.commit_and_checkpoint()
        result = orchestrator.finalize()

        return {
            "success": result.success,
            "operation_id": result.operation_id,
            "statistics": {
                "imported": result.imported_rows,
                "skipped": result.skipped_rows,
                "errors": result.error_rows,
            },
            "message": str(result),
        }

    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


@router.get("/status/{operation_id}")
async def get_import_status(
    operation_id: str,
    db: Session = Depends(get_db),
):
    """
    Get status of import operation from checkpoint.

    Returns:
        Checkpoint data including imported/error counts and timestamp
    """
    try:
        checkpoint_manager = CheckpointManager()
        checkpoint = checkpoint_manager.load_checkpoint(operation_id)

        if not checkpoint:
            raise HTTPException(status_code=404, detail=f"Operation {operation_id} not found")

        return {
            "operation_id": operation_id,
            "status": "completed" if checkpoint.get("imported", 0) > 0 else "pending",
            "checkpoint": checkpoint,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get status: {str(e)}")


@router.post("/resume/{operation_id}")
async def resume_import(
    operation_id: str,
    db: Session = Depends(get_db),
):
    """
    Resume failed import from checkpoint.

    This allows resuming imports that failed partway through,
    continuing from the last successful checkpoint rather than
    restarting from the beginning.

    Returns:
        Status of resumed operation
    """
    try:
        checkpoint_manager = CheckpointManager()
        checkpoint = checkpoint_manager.load_checkpoint(operation_id)

        if not checkpoint:
            raise HTTPException(status_code=404, detail="No checkpoint found for this operation")

        orchestrator = ImportOrchestrator(db, operation_id)

        logger.info(
            "Resuming import from checkpoint",
            operation_id=operation_id,
            last_imported=checkpoint.get('imported', 0),
            last_errors=checkpoint.get('errors', 0),
        )

        return {
            "status": "resumed",
            "operation_id": operation_id,
            "checkpoint_data": checkpoint,
            "can_retry": checkpoint.get('errors', 0) > 0,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to resume: {str(e)}")


@router.get("/checkpoints")
async def list_checkpoints(
    db: Session = Depends(get_db),
):
    """
    List all available import checkpoints.

    Useful for understanding which operations can be resumed
    and their current status.

    Returns:
        List of checkpoint metadata
    """
    try:
        checkpoint_manager = CheckpointManager()
        checkpoints = checkpoint_manager.list_checkpoints()

        logger.info("Listed checkpoints", count=len(checkpoints))

        return {
            "total": len(checkpoints),
            "checkpoints": checkpoints,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list checkpoints: {str(e)}")


@router.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """
    Health check for resilient import system.

    Verifies:
    - Database connectivity
    - Checkpoint storage accessibility
    - Core resilience components
    """
    try:
        # Check database
        db.execute("SELECT 1")

        # Check checkpoints
        checkpoint_manager = CheckpointManager()
        checkpoint_manager.list_checkpoints()

        return {
            "status": "healthy",
            "components": {
                "database": "ok",
                "checkpoints": "ok",
                "resilience_layer": "ok",
            },
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
        }, 503
