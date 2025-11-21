"""
AI Usage Tracking Service

Tracks API calls to AI providers for cost control, analytics, and audit purposes.
Supports per-user usage limits, cost estimation, and usage statistics.
"""

import logging
from typing import Optional, Dict, List, Any
from datetime import datetime, timedelta
from decimal import Decimal

from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_

from app.models.models import AIUsageLog, AIProvider, User

logger = logging.getLogger(__name__)


# Pricing per 1K tokens (approximate pricing as of Nov 2024)
PROVIDER_PRICING = {
    "gemini": {
        "gemini-pro": {"input": 0.0005, "output": 0.0015},  # $0.50/$1.50 per 1M tokens
        "gemini-pro-vision": {"input": 0.0005, "output": 0.0015},
    },
    "openai": {
        "gpt-4": {"input": 0.03, "output": 0.06},  # $30/$60 per 1M tokens
        "gpt-4-turbo": {"input": 0.01, "output": 0.03},  # $10/$30 per 1M tokens
        "gpt-3.5-turbo": {"input": 0.0005, "output": 0.0015},  # $0.50/$1.50 per 1M tokens
    },
    "claude_api": {
        "claude-3-opus": {"input": 0.015, "output": 0.075},  # $15/$75 per 1M tokens
        "claude-3-sonnet": {"input": 0.003, "output": 0.015},  # $3/$15 per 1M tokens
        "claude-3-haiku": {"input": 0.00025, "output": 0.00125},  # $0.25/$1.25 per 1M tokens
    },
    "local_cli": {
        "ollama": {"input": 0.0, "output": 0.0},  # Free
        "any": {"input": 0.0, "output": 0.0},
    },
}


class AIUsageService:
    """Service for tracking and managing AI API usage"""

    def __init__(self, db: Session):
        """Initialize service with database session"""
        self.db = db

    def record_usage(
        self,
        user_id: int,
        provider: str,
        model: str,
        prompt_tokens: int = 0,
        completion_tokens: int = 0,
        status: str = "success",
        error_message: Optional[str] = None,
        response_time_ms: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> AIUsageLog:
        """
        Record an API call to the usage log.

        Args:
            user_id: ID of user making the request
            provider: AI provider (gemini, openai, claude_api, local_cli)
            model: Model name (e.g., "gpt-4", "claude-3-opus")
            prompt_tokens: Number of input tokens
            completion_tokens: Number of output tokens
            status: Request status (success, error, rate_limited, timeout)
            error_message: Error details if failed
            response_time_ms: Time to complete request
            metadata: Additional metadata (temperature, max_tokens, etc.)

        Returns:
            AIUsageLog: The created usage log record
        """
        total_tokens = prompt_tokens + completion_tokens
        estimated_cost = self._calculate_cost(provider, model, prompt_tokens, completion_tokens)

        log = AIUsageLog(
            user_id=user_id,
            provider=AIProvider(provider),
            model=model,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
            estimated_cost=estimated_cost,
            status=status,
            error_message=error_message,
            response_time_ms=response_time_ms,
            metadata=metadata or {},
        )

        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)

        logger.info(
            f"AI Usage logged: user={user_id}, provider={provider}, tokens={total_tokens}, cost=${estimated_cost}"
        )

        return log

    def get_usage_stats(
        self,
        user_id: int,
        days: int = 1,
        provider: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Get usage statistics for a user.

        Args:
            user_id: User ID
            days: Number of days to look back
            provider: Filter by provider (optional)

        Returns:
            Dict with usage statistics
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days)

        query = self.db.query(AIUsageLog).filter(
            AIUsageLog.user_id == user_id,
            AIUsageLog.created_at >= cutoff_date,
        )

        if provider:
            query = query.filter(AIUsageLog.provider == AIProvider(provider))

        logs = query.all()

        total_calls = len(logs)
        successful_calls = len([l for l in logs if l.status == "success"])
        failed_calls = len([l for l in logs if l.status == "error"])

        total_tokens = sum(l.total_tokens for l in logs)
        total_cost = sum(float(l.estimated_cost) for l in logs)
        avg_response_time = (
            sum(l.response_time_ms for l in logs if l.response_time_ms) / len([l for l in logs if l.response_time_ms])
            if any(l.response_time_ms for l in logs)
            else 0
        )

        # Group by provider
        by_provider = {}
        for log in logs:
            provider_key = log.provider.value
            if provider_key not in by_provider:
                by_provider[provider_key] = {
                    "calls": 0,
                    "tokens": 0,
                    "cost": 0.0,
                }
            by_provider[provider_key]["calls"] += 1
            by_provider[provider_key]["tokens"] += log.total_tokens
            by_provider[provider_key]["cost"] += float(log.estimated_cost)

        return {
            "user_id": user_id,
            "period_days": days,
            "cutoff_date": cutoff_date.isoformat(),
            "total_calls": total_calls,
            "successful_calls": successful_calls,
            "failed_calls": failed_calls,
            "success_rate": (successful_calls / total_calls * 100) if total_calls > 0 else 0,
            "total_tokens": total_tokens,
            "total_cost": round(total_cost, 4),
            "average_response_time_ms": round(avg_response_time, 2),
            "by_provider": by_provider,
        }

    def get_daily_usage(
        self,
        user_id: int,
        days: int = 7,
    ) -> List[Dict[str, Any]]:
        """
        Get daily usage breakdown for a user.

        Args:
            user_id: User ID
            days: Number of days to retrieve

        Returns:
            List of daily usage dictionaries
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days)

        logs = (
            self.db.query(AIUsageLog)
            .filter(
                AIUsageLog.user_id == user_id,
                AIUsageLog.created_at >= cutoff_date,
            )
            .order_by(AIUsageLog.created_at)
            .all()
        )

        # Group by date
        daily_stats = {}
        for log in logs:
            date_key = log.created_at.date().isoformat()
            if date_key not in daily_stats:
                daily_stats[date_key] = {
                    "date": date_key,
                    "calls": 0,
                    "tokens": 0,
                    "cost": 0.0,
                    "by_provider": {},
                }

            daily_stats[date_key]["calls"] += 1
            daily_stats[date_key]["tokens"] += log.total_tokens
            daily_stats[date_key]["cost"] += float(log.estimated_cost)

            provider_key = log.provider.value
            if provider_key not in daily_stats[date_key]["by_provider"]:
                daily_stats[date_key]["by_provider"][provider_key] = {"calls": 0, "tokens": 0, "cost": 0.0}

            daily_stats[date_key]["by_provider"][provider_key]["calls"] += 1
            daily_stats[date_key]["by_provider"][provider_key]["tokens"] += log.total_tokens
            daily_stats[date_key]["by_provider"][provider_key]["cost"] += float(log.estimated_cost)

        return sorted(daily_stats.values(), key=lambda x: x["date"])

    def get_all_logs(
        self,
        user_id: int,
        limit: int = 100,
        offset: int = 0,
        provider: Optional[str] = None,
        status: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Get paginated usage logs for a user.

        Args:
            user_id: User ID
            limit: Number of records to return
            offset: Number of records to skip
            provider: Filter by provider (optional)
            status: Filter by status (optional)

        Returns:
            Dict with paginated logs and total count
        """
        query = self.db.query(AIUsageLog).filter(AIUsageLog.user_id == user_id)

        if provider:
            query = query.filter(AIUsageLog.provider == AIProvider(provider))

        if status:
            query = query.filter(AIUsageLog.status == status)

        total_count = query.count()

        logs = query.order_by(AIUsageLog.created_at.desc()).offset(offset).limit(limit).all()

        return {
            "total": total_count,
            "limit": limit,
            "offset": offset,
            "logs": [
                {
                    "id": log.id,
                    "provider": log.provider.value,
                    "model": log.model,
                    "prompt_tokens": log.prompt_tokens,
                    "completion_tokens": log.completion_tokens,
                    "total_tokens": log.total_tokens,
                    "estimated_cost": float(log.estimated_cost),
                    "status": log.status,
                    "error_message": log.error_message,
                    "response_time_ms": log.response_time_ms,
                    "created_at": log.created_at.isoformat(),
                }
                for log in logs
            ],
        }

    def get_user_total_cost(
        self,
        user_id: int,
        days: int = 30,
    ) -> Dict[str, Any]:
        """
        Get total cost for a user over a period.

        Args:
            user_id: User ID
            days: Number of days to consider (default: 30)

        Returns:
            Dict with cost breakdown
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days)

        logs = (
            self.db.query(AIUsageLog)
            .filter(
                AIUsageLog.user_id == user_id,
                AIUsageLog.created_at >= cutoff_date,
            )
            .all()
        )

        total_cost = sum(float(log.estimated_cost) for log in logs)
        by_provider = {}

        for log in logs:
            provider_key = log.provider.value
            if provider_key not in by_provider:
                by_provider[provider_key] = 0.0
            by_provider[provider_key] += float(log.estimated_cost)

        return {
            "user_id": user_id,
            "period_days": days,
            "total_cost": round(total_cost, 4),
            "by_provider": {k: round(v, 4) for k, v in by_provider.items()},
        }

    def _calculate_cost(
        self,
        provider: str,
        model: str,
        prompt_tokens: int,
        completion_tokens: int,
    ) -> Decimal:
        """
        Calculate estimated cost for API call.

        Args:
            provider: AI provider
            model: Model name
            prompt_tokens: Input tokens
            completion_tokens: Output tokens

        Returns:
            Estimated cost in USD
        """
        try:
            provider_pricing = PROVIDER_PRICING.get(provider, {})
            model_pricing = provider_pricing.get(model) or provider_pricing.get("any")

            if not model_pricing:
                logger.warning(f"Unknown pricing for {provider}/{model}")
                return Decimal("0.0000")

            input_cost = (prompt_tokens / 1000) * model_pricing.get("input", 0)
            output_cost = (completion_tokens / 1000) * model_pricing.get("output", 0)
            total_cost = input_cost + output_cost

            return Decimal(str(round(total_cost, 4)))
        except Exception as e:
            logger.error(f"Error calculating cost: {e}")
            return Decimal("0.0000")

    def delete_old_logs(self, days: int = 90) -> int:
        """
        Delete usage logs older than specified days.

        Args:
            days: Delete logs older than this many days

        Returns:
            Number of deleted records
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days)

        deleted = self.db.query(AIUsageLog).filter(AIUsageLog.created_at < cutoff_date).delete()

        self.db.commit()

        logger.info(f"Deleted {deleted} old AI usage logs (older than {days} days)")

        return deleted
