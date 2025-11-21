"""
Pydantic schemas for AI budget management
"""

from typing import Optional
from datetime import date
from decimal import Decimal
from pydantic import BaseModel, Field, field_validator


class AIBudgetCreate(BaseModel):
    """Schema for creating a new budget"""

    monthly_budget_usd: Decimal = Field(..., description="Monthly spending limit", decimal_places=2)
    daily_budget_usd: Optional[Decimal] = Field(None, description="Optional daily spending limit", decimal_places=2)
    alert_threshold: int = Field(default=80, description="Alert threshold percentage (0-100)")
    webhook_url: Optional[str] = Field(None, description="URL to POST budget alerts to")

    @field_validator("monthly_budget_usd", "daily_budget_usd")
    @classmethod
    def validate_budget_positive(cls, v):
        if v is not None and v <= 0:
            raise ValueError("Budget must be positive")
        return v

    @field_validator("alert_threshold")
    @classmethod
    def validate_alert_threshold(cls, v):
        if not (0 <= v <= 100):
            raise ValueError("Alert threshold must be between 0 and 100")
        return v


class AIBudgetUpdate(BaseModel):
    """Schema for updating budget settings"""

    monthly_budget_usd: Optional[Decimal] = Field(None, description="Monthly spending limit", decimal_places=2)
    daily_budget_usd: Optional[Decimal] = Field(None, description="Optional daily spending limit", decimal_places=2)
    alert_threshold: Optional[int] = Field(None, description="Alert threshold percentage (0-100)")
    webhook_url: Optional[str] = Field(None, description="URL to POST budget alerts to")
    is_active: Optional[bool] = Field(None, description="Enable/disable budget enforcement")

    @field_validator("monthly_budget_usd", "daily_budget_usd")
    @classmethod
    def validate_budget_positive(cls, v):
        if v is not None and v <= 0:
            raise ValueError("Budget must be positive")
        return v

    @field_validator("alert_threshold")
    @classmethod
    def validate_alert_threshold(cls, v):
        if v is not None and not (0 <= v <= 100):
            raise ValueError("Alert threshold must be between 0 and 100")
        return v


class AIBudgetResponse(BaseModel):
    """Response schema for budget information"""

    user_id: int
    monthly_budget: float = Field(..., description="Monthly spending limit in USD")
    monthly_spent: float = Field(..., description="Amount spent this month in USD")
    monthly_remaining: float = Field(..., description="Remaining budget for this month in USD")
    monthly_percentage_used: float = Field(..., description="Percentage of monthly budget used")
    daily_budget: Optional[float] = Field(None, description="Daily spending limit in USD")
    daily_spent: float = Field(..., description="Amount spent today in USD")
    daily_remaining: Optional[float] = Field(None, description="Remaining budget for today in USD")
    daily_percentage_used: Optional[float] = Field(None, description="Percentage of daily budget used")
    alert_threshold: int = Field(..., description="Alert threshold percentage")
    is_active: bool = Field(..., description="Whether budget enforcement is active")
    should_alert_monthly: bool = Field(..., description="Should monthly alert be sent")
    should_alert_daily: bool = Field(..., description="Should daily alert be sent")
    month_reset_date: str = Field(..., description="Date when monthly budget resets")
    day_reset_date: str = Field(..., description="Date when daily budget resets")


class BudgetValidationResponse(BaseModel):
    """Response for budget validation before API call"""

    allowed: bool = Field(..., description="Whether the API call is allowed")
    reason: Optional[str] = Field(None, description="Reason if not allowed")
    monthly_remaining: float = Field(..., description="Remaining monthly budget")
    daily_remaining: Optional[float] = Field(None, description="Remaining daily budget")
    monthly_percentage_used: float = Field(..., description="Percentage of monthly budget used")


class BudgetAlertWebhook(BaseModel):
    """Webhook payload sent when budget threshold reached"""

    user_id: int
    event_type: str = Field(..., description="Event type (always 'budget_alert')")
    recent_cost: float = Field(..., description="Cost of recent call that triggered alert")
    monthly_budget: float
    monthly_spent: float
    monthly_percentage: float
    daily_budget: Optional[float]
    daily_spent: float
    daily_percentage: Optional[float]
    alert_threshold: int
    timestamp: str
    should_alert_monthly: bool
    should_alert_daily: bool
