"""
AI Budget Service

Manages user budgets, validates spending, sends alerts, and prevents overspending.
"""

import logging
import httpx
from typing import Optional, Dict, Any
from datetime import datetime, date, timedelta
from decimal import Decimal

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.models import AIBudget, User
from app.core.config import settings

logger = logging.getLogger(__name__)


class BudgetExceededException(Exception):
    """Raised when user tries to spend beyond their budget"""
    pass


class AIBudgetService:
    """Service for managing AI API budgets per user"""

    def __init__(self, db: Session):
        """Initialize budget service with database session"""
        self.db = db

    def get_or_create_budget(
        self,
        user_id: int,
        monthly_budget_usd: Decimal = Decimal("100.00"),
        daily_budget_usd: Optional[Decimal] = None,
    ) -> AIBudget:
        """
        Get existing budget or create new one for user.

        Args:
            user_id: User ID
            monthly_budget_usd: Monthly spending limit (default: $100)
            daily_budget_usd: Optional daily spending limit

        Returns:
            AIBudget model instance
        """
        budget = self.db.query(AIBudget).filter(AIBudget.user_id == user_id).first()

        if budget:
            return budget

        # Calculate next reset dates
        today = date.today()
        month_reset = date(today.year, today.month, 1) + timedelta(days=32)
        month_reset = date(month_reset.year, month_reset.month, 1)  # First day of next month

        day_reset = today + timedelta(days=1)

        budget = AIBudget(
            user_id=user_id,
            monthly_budget_usd=Decimal(str(monthly_budget_usd)),
            daily_budget_usd=Decimal(str(daily_budget_usd)) if daily_budget_usd else None,
            spent_this_month=Decimal("0"),
            spent_today=Decimal("0"),
            month_reset_date=month_reset,
            day_reset_date=day_reset,
            alert_threshold=80,
            is_active=True,
        )

        self.db.add(budget)
        self.db.commit()
        self.db.refresh(budget)

        logger.info(f"Created budget for user {user_id}: ${monthly_budget_usd}/month")

        return budget

    def validate_spending(
        self,
        user_id: int,
        estimated_cost: Decimal,
    ) -> Dict[str, Any]:
        """
        Validate if user can afford an API call.

        Args:
            user_id: User ID
            estimated_cost: Estimated cost of the call

        Returns:
            Dict with validation result and details

        Raises:
            BudgetExceededException: If budget would be exceeded
        """
        budget = self.get_or_create_budget(user_id)

        # Check if budget is active
        if not budget.is_active:
            return {
                "allowed": True,
                "reason": "Budget enforcement disabled",
                "monthly_remaining": float(budget.monthly_remaining),
            }

        # Reset monthly if needed
        self._reset_monthly_if_needed(budget)

        # Reset daily if needed
        self._reset_daily_if_needed(budget)

        # Check monthly limit
        if budget.spent_this_month + estimated_cost > Decimal(str(budget.monthly_budget_usd)):
            raise BudgetExceededException(
                f"Monthly budget exceeded. "
                f"Current: ${budget.spent_this_month}, "
                f"Requested: ${estimated_cost}, "
                f"Limit: ${budget.monthly_budget_usd}"
            )

        # Check daily limit if set
        if budget.daily_budget_usd:
            if budget.spent_today + estimated_cost > Decimal(str(budget.daily_budget_usd)):
                raise BudgetExceededException(
                    f"Daily budget exceeded. "
                    f"Current: ${budget.spent_today}, "
                    f"Requested: ${estimated_cost}, "
                    f"Limit: ${budget.daily_budget_usd}"
                )

        return {
            "allowed": True,
            "monthly_remaining": float(budget.monthly_remaining),
            "daily_remaining": float(budget.daily_remaining) if budget.daily_budget_usd else None,
            "monthly_percentage_used": budget.monthly_percentage_used,
        }

    def record_spending(
        self,
        user_id: int,
        cost: Decimal,
    ) -> AIBudget:
        """
        Record an API call cost against user's budget.

        Args:
            user_id: User ID
            cost: Cost in USD

        Returns:
            Updated AIBudget
        """
        budget = self.get_or_create_budget(user_id)

        # Reset if needed
        self._reset_monthly_if_needed(budget)
        self._reset_daily_if_needed(budget)

        # Update spending
        budget.spent_this_month = budget.spent_this_month + cost
        budget.spent_today = budget.spent_today + cost

        self.db.commit()
        self.db.refresh(budget)

        logger.info(f"Recorded spending for user {user_id}: ${cost} (month total: ${budget.spent_this_month})")

        # Check if alert should be sent
        if budget.should_alert_monthly or budget.should_alert_daily:
            self._send_alert(budget, cost)

        return budget

    def get_budget_status(self, user_id: int) -> Dict[str, Any]:
        """
        Get current budget status for a user.

        Args:
            user_id: User ID

        Returns:
            Dict with budget information
        """
        budget = self.get_or_create_budget(user_id)

        # Reset if needed
        self._reset_monthly_if_needed(budget)
        self._reset_daily_if_needed(budget)

        return {
            "user_id": user_id,
            "monthly_budget": float(budget.monthly_budget_usd),
            "monthly_spent": float(budget.spent_this_month),
            "monthly_remaining": float(budget.monthly_remaining),
            "monthly_percentage_used": budget.monthly_percentage_used,
            "daily_budget": float(budget.daily_budget_usd) if budget.daily_budget_usd else None,
            "daily_spent": float(budget.spent_today),
            "daily_remaining": float(budget.daily_remaining) if budget.daily_budget_usd else None,
            "daily_percentage_used": budget.daily_percentage_used if budget.daily_budget_usd else None,
            "alert_threshold": budget.alert_threshold,
            "is_active": budget.is_active,
            "should_alert_monthly": budget.should_alert_monthly,
            "should_alert_daily": budget.should_alert_daily,
            "month_reset_date": budget.month_reset_date.isoformat(),
            "day_reset_date": budget.day_reset_date.isoformat(),
        }

    def update_budget(
        self,
        user_id: int,
        monthly_budget_usd: Optional[Decimal] = None,
        daily_budget_usd: Optional[Decimal] = None,
        alert_threshold: Optional[int] = None,
        webhook_url: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> AIBudget:
        """
        Update budget settings for a user.

        Args:
            user_id: User ID
            monthly_budget_usd: New monthly limit
            daily_budget_usd: New daily limit
            alert_threshold: New alert threshold percentage
            webhook_url: New webhook URL for alerts
            is_active: Enable/disable budget enforcement

        Returns:
            Updated AIBudget
        """
        budget = self.get_or_create_budget(user_id)

        if monthly_budget_usd is not None:
            budget.monthly_budget_usd = Decimal(str(monthly_budget_usd))

        if daily_budget_usd is not None:
            budget.daily_budget_usd = Decimal(str(daily_budget_usd))

        if alert_threshold is not None:
            if not (0 <= alert_threshold <= 100):
                raise ValueError("Alert threshold must be between 0 and 100")
            budget.alert_threshold = alert_threshold

        if webhook_url is not None:
            budget.webhook_url = webhook_url

        if is_active is not None:
            budget.is_active = is_active

        budget.updated_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(budget)

        logger.info(f"Updated budget for user {user_id}")

        return budget

    def reset_monthly_spending(self, user_id: int) -> AIBudget:
        """
        Reset monthly spending counter (admin function).

        Args:
            user_id: User ID

        Returns:
            Updated AIBudget
        """
        budget = self.get_or_create_budget(user_id)

        budget.spent_this_month = Decimal("0")
        today = date.today()
        budget.month_reset_date = date(today.year, today.month, 1) + timedelta(days=32)
        budget.month_reset_date = date(budget.month_reset_date.year, budget.month_reset_date.month, 1)

        self.db.commit()
        self.db.refresh(budget)

        logger.info(f"Reset monthly spending for user {user_id}")

        return budget

    def reset_daily_spending(self, user_id: int) -> AIBudget:
        """
        Reset daily spending counter (admin function).

        Args:
            user_id: User ID

        Returns:
            Updated AIBudget
        """
        budget = self.get_or_create_budget(user_id)

        budget.spent_today = Decimal("0")
        budget.day_reset_date = date.today() + timedelta(days=1)

        self.db.commit()
        self.db.refresh(budget)

        logger.info(f"Reset daily spending for user {user_id}")

        return budget

    def _reset_monthly_if_needed(self, budget: AIBudget) -> None:
        """Reset monthly spending if reset date has passed"""
        if date.today() >= budget.month_reset_date:
            budget.spent_this_month = Decimal("0")

            # Calculate next month reset date
            today = date.today()
            next_month = date(today.year, today.month, 1) + timedelta(days=32)
            budget.month_reset_date = date(next_month.year, next_month.month, 1)

            self.db.commit()
            logger.info(f"Reset monthly budget for user {budget.user_id}")

    def _reset_daily_if_needed(self, budget: AIBudget) -> None:
        """Reset daily spending if reset date has passed"""
        if date.today() >= budget.day_reset_date:
            budget.spent_today = Decimal("0")
            budget.day_reset_date = date.today() + timedelta(days=1)

            self.db.commit()
            logger.info(f"Reset daily budget for user {budget.user_id}")

    def _send_alert(self, budget: AIBudget, recent_cost: Decimal) -> None:
        """
        Send webhook alert when budget threshold reached.

        Args:
            budget: AIBudget instance
            recent_cost: Recent cost that triggered the alert
        """
        if not budget.webhook_url:
            logger.debug(f"No webhook URL configured for user {budget.user_id}")
            return

        try:
            payload = {
                "user_id": budget.user_id,
                "event_type": "budget_alert",
                "recent_cost": float(recent_cost),
                "monthly_budget": float(budget.monthly_budget_usd),
                "monthly_spent": float(budget.spent_this_month),
                "monthly_percentage": budget.monthly_percentage_used,
                "daily_budget": float(budget.daily_budget_usd) if budget.daily_budget_usd else None,
                "daily_spent": float(budget.spent_today),
                "daily_percentage": budget.daily_percentage_used if budget.daily_budget_usd else None,
                "alert_threshold": budget.alert_threshold,
                "timestamp": datetime.utcnow().isoformat(),
                "should_alert_monthly": budget.should_alert_monthly,
                "should_alert_daily": budget.should_alert_daily,
            }

            # Send webhook with 5 second timeout
            with httpx.Client(timeout=5.0) as client:
                response = client.post(budget.webhook_url, json=payload)
                response.raise_for_status()

            logger.info(f"Sent budget alert webhook for user {budget.user_id}")

        except httpx.HTTPError as e:
            logger.error(f"Failed to send budget alert webhook for user {budget.user_id}: {e}")
        except Exception as e:
            logger.error(f"Error sending budget alert: {e}")

    def delete_old_budgets(self, days_inactive: int = 180) -> int:
        """
        Delete budgets for users with no activity in specified days.

        Args:
            days_inactive: Delete budgets inactive for this many days

        Returns:
            Number of deleted records
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days_inactive)

        deleted = self.db.query(AIBudget).filter(AIBudget.updated_at < cutoff_date).delete()

        self.db.commit()

        logger.info(f"Deleted {deleted} inactive budgets (inactive for {days_inactive} days)")

        return deleted
