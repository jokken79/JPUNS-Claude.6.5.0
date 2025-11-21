"""
Scheduler for Background Jobs
Handles scheduled tasks like yukyu expiration, data cleanup, etc.
"""

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime
from loguru import logger
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.services.yukyu_service import YukyuService


# Global scheduler instance
scheduler = AsyncIOScheduler()


async def expire_yukyus_job():
    """
    Job que expira yukyus antiguos (> 2 años).
    Ejecuta diariamente a las 2:00 AM JST.
    """
    logger.info("🕐 Starting yukyu expiration job...")

    db: Session = SessionLocal()
    try:
        yukyu_service = YukyuService(db)
        result = await yukyu_service.expire_old_yukyus()

        logger.info(
            f"✅ Yukyu expiration job completed: "
            f"{result['expired_count']} balances expired, "
            f"{result['days_expired']} days marked as expired"
        )

        return result

    except Exception as e:
        logger.error(f"❌ Error in yukyu expiration job: {str(e)}")
        raise

    finally:
        db.close()


def start_scheduler():
    """
    Inicia el scheduler con todos los jobs configurados.
    """

    # Job 1: Expirar yukyus antiguos - Diariamente a las 2:00 AM JST
    scheduler.add_job(
        expire_yukyus_job,
        trigger=CronTrigger(hour=2, minute=0, timezone="Asia/Tokyo"),
        id="expire_yukyus",
        name="Expire Old Yukyus (> 2 years)",
        replace_existing=True,
        misfire_grace_time=3600,  # 1 hour grace period
    )

    logger.info("✅ Scheduler configured with jobs:")
    logger.info("  - expire_yukyus: Daily at 2:00 AM JST")

    scheduler.start()
    logger.info("🚀 Scheduler started successfully")


def stop_scheduler():
    """
    Detiene el scheduler gracefully.
    """
    if scheduler.running:
        scheduler.shutdown(wait=True)
        logger.info("🛑 Scheduler stopped")


def get_scheduler_status():
    """
    Retorna el estado actual del scheduler y sus jobs.
    """
    jobs = []
    for job in scheduler.get_jobs():
        jobs.append({
            "id": job.id,
            "name": job.name,
            "next_run": job.next_run_time.isoformat() if job.next_run_time else None,
            "trigger": str(job.trigger),
        })

    return {
        "running": scheduler.running,
        "jobs": jobs,
    }
