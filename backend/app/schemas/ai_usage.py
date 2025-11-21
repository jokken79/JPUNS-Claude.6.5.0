"""
Pydantic schemas for AI usage tracking and statistics
"""

from typing import Optional, Dict, Any, List
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field


class AIUsageLogCreate(BaseModel):
    """Schema for creating a usage log entry"""

    provider: str = Field(..., description="AI provider: gemini, openai, claude_api, local_cli")
    model: str = Field(..., description="Model name, e.g., gpt-4, claude-3-opus")
    prompt_tokens: int = Field(default=0, description="Number of input tokens")
    completion_tokens: int = Field(default=0, description="Number of output tokens")
    status: str = Field(default="success", description="Request status")
    error_message: Optional[str] = Field(None, description="Error details if status is error")
    response_time_ms: Optional[int] = Field(None, description="Time to complete in milliseconds")
    metadata: Optional[Dict[str, Any]] = Field(default={}, description="Additional metadata")


class AIUsageLogResponse(BaseModel):
    """Schema for usage log response"""

    id: int
    user_id: int
    provider: str
    model: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    estimated_cost: Decimal
    status: str
    error_message: Optional[str]
    response_time_ms: Optional[int]
    metadata: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True


class ProviderStats(BaseModel):
    """Statistics for a single provider"""

    calls: int = Field(..., description="Number of API calls")
    tokens: int = Field(..., description="Total tokens used")
    cost: float = Field(..., description="Total cost in USD")


class UsageStatsResponse(BaseModel):
    """Response for usage statistics endpoint"""

    user_id: int
    period_days: int
    cutoff_date: str
    total_calls: int = Field(..., description="Total API calls")
    successful_calls: int = Field(..., description="Successful API calls")
    failed_calls: int = Field(..., description="Failed API calls")
    success_rate: float = Field(..., description="Success rate percentage")
    total_tokens: int = Field(..., description="Total tokens used")
    total_cost: float = Field(..., description="Total cost in USD")
    average_response_time_ms: float = Field(..., description="Average response time")
    by_provider: Dict[str, ProviderStats] = Field(..., description="Stats grouped by provider")


class DailyStats(BaseModel):
    """Daily usage statistics"""

    date: str
    calls: int
    tokens: int
    cost: float
    by_provider: Dict[str, ProviderStats]


class DailyUsageResponse(BaseModel):
    """Response for daily usage endpoint"""

    user_id: int
    data: List[DailyStats] = Field(..., description="Daily usage data")


class UsageLogEntry(BaseModel):
    """Single usage log entry in list response"""

    id: int
    provider: str
    model: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    estimated_cost: float
    status: str
    error_message: Optional[str]
    response_time_ms: Optional[int]
    created_at: str


class UsageLogsResponse(BaseModel):
    """Response for paginated logs endpoint"""

    total: int = Field(..., description="Total number of records")
    limit: int = Field(..., description="Limit used in query")
    offset: int = Field(..., description="Offset used in query")
    logs: List[UsageLogEntry] = Field(..., description="Usage log entries")


class TotalCostResponse(BaseModel):
    """Response for total cost endpoint"""

    user_id: int
    period_days: int
    total_cost: float = Field(..., description="Total cost in USD")
    by_provider: Dict[str, float] = Field(..., description="Cost breakdown by provider")
