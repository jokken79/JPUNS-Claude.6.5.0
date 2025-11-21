"""
Background Tasks System - Procesamiento asíncrono de OCR
Usa diccionario en memoria para jobs (simple, sin dependencias externas)
"""
import logging
import uuid
import asyncio
from datetime import datetime
from typing import Dict, Any, Optional, Callable
from enum import Enum

logger = logging.getLogger(__name__)


class JobStatus(str, Enum):
    """Estados posibles de un job"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class BackgroundJob:
    """Representa un job en background"""

    def __init__(self, job_id: str, job_type: str, params: Dict[str, Any]):
        self.job_id = job_id
        self.job_type = job_type
        self.params = params
        self.status = JobStatus.PENDING
        self.result: Optional[Any] = None
        self.error: Optional[str] = None
        self.created_at = datetime.now()
        self.started_at: Optional[datetime] = None
        self.finished_at: Optional[datetime] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convierte job a diccionario"""
        return {
            "job_id": self.job_id,
            "job_type": self.job_type,
            "status": self.status.value,
            "result": self.result,
            "error": self.error,
            "created_at": self.created_at.isoformat(),
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "finished_at": self.finished_at.isoformat() if self.finished_at else None,
        }


class BackgroundTaskManager:
    """
    Gestor de tareas en background usando asyncio.

    Almacena jobs en memoria (si necesitas persistencia, usa Redis o DB).
    """

    def __init__(self):
        self.jobs: Dict[str, BackgroundJob] = {}
        self.max_jobs_in_memory = 1000  # Limitar memoria

    def create_job(self, job_type: str, params: Dict[str, Any]) -> str:
        """Crea un nuevo job y retorna su ID"""
        job_id = str(uuid.uuid4())
        job = BackgroundJob(job_id, job_type, params)
        self.jobs[job_id] = job

        # Limitar memoria eliminando jobs antiguos completados
        self._cleanup_old_jobs()

        logger.info(f"📋 Job creado: {job_id} ({job_type})")
        return job_id

    def get_job(self, job_id: str) -> Optional[BackgroundJob]:
        """Obtiene un job por su ID"""
        return self.jobs.get(job_id)

    def _cleanup_old_jobs(self):
        """Elimina jobs antiguos completados/fallidos para liberar memoria"""
        if len(self.jobs) <= self.max_jobs_in_memory:
            return

        # Ordenar por fecha de creación
        sorted_jobs = sorted(
            [(jid, job) for jid, job in self.jobs.items()],
            key=lambda x: x[1].created_at
        )

        # Eliminar los más antiguos que estén completados o fallidos
        for job_id, job in sorted_jobs:
            if job.status in [JobStatus.COMPLETED, JobStatus.FAILED]:
                del self.jobs[job_id]
                logger.debug(f"🗑️  Job antiguo eliminado: {job_id}")

            if len(self.jobs) <= self.max_jobs_in_memory:
                break

    async def execute_job(
        self,
        job_id: str,
        func: Callable,
        *args,
        **kwargs
    ):
        """
        Ejecuta un job en background.

        Args:
            job_id: ID del job
            func: Función a ejecutar (puede ser sync o async)
            *args, **kwargs: Argumentos para la función
        """
        job = self.get_job(job_id)
        if not job:
            logger.error(f"❌ Job no encontrado: {job_id}")
            return

        try:
            # Marcar como procesando
            job.status = JobStatus.PROCESSING
            job.started_at = datetime.now()
            logger.info(f"⚙️  Procesando job: {job_id}")

            # Ejecutar función (soporta sync y async)
            import inspect
            if inspect.iscoroutinefunction(func):
                result = await func(*args, **kwargs)
            else:
                result = func(*args, **kwargs)

            # Marcar como completado
            job.status = JobStatus.COMPLETED
            job.result = result
            job.finished_at = datetime.now()

            elapsed = (job.finished_at - job.started_at).total_seconds()
            logger.info(f"✅ Job completado: {job_id} ({elapsed:.2f}s)")

        except Exception as e:
            # Marcar como fallido
            job.status = JobStatus.FAILED
            job.error = str(e)
            job.finished_at = datetime.now()

            logger.error(f"❌ Job fallido: {job_id} - {e}", exc_info=True)

    def start_job_async(
        self,
        job_id: str,
        func: Callable,
        *args,
        **kwargs
    ):
        """
        Inicia un job asíncrono sin bloquear.

        Crea una tarea asyncio que se ejecuta en background.
        """
        asyncio.create_task(
            self.execute_job(job_id, func, *args, **kwargs)
        )


# Instancia global
background_manager = BackgroundTaskManager()
