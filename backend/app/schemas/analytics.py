"""
Pydantic schemas for analytics endpoints
"""

from typing import Optional, Dict, List, Any
from pydantic import BaseModel, Field
from datetime import datetime


class AnalyticsSummaryResponse(BaseModel):
    """Overall analytics summary"""

    total_api_calls: int = Field(..., description="Total API calls made")
    total_tokens_used: int = Field(..., description="Total tokens consumed")
    total_cost_usd: float = Field(..., description="Total cost in USD")
    average_cost_per_call: float = Field(
        ..., description="Average cost per API call"
    )


class PerformanceMetricsResponse(BaseModel):
    """Performance metrics"""

    cache_hit_rate_percent: float = Field(
        ..., description="Cache hit rate percentage"
    )
    optimization_adoption_percent: float = Field(
        ..., description="Optimization adoption percentage"
    )
    streaming_adoption_percent: float = Field(
        ..., description="Streaming adoption percentage"
    )


class ProviderStatsResponse(BaseModel):
    """Statistics for a provider"""

    total_calls: int = Field(..., description="Total calls to provider")
    total_tokens: int = Field(..., description="Total tokens used")
    total_cost: float = Field(..., description="Total cost")
    avg_response_time_ms: float = Field(..., description="Average response time")
    success_rate: float = Field(..., description="Success rate percentage")
    error_count: int = Field(..., description="Number of errors")


class DailyBreakdown(BaseModel):
    """Daily cost breakdown"""

    date: str = Field(..., description="Date (YYYY-MM-DD)")
    cost: float = Field(..., description="Cost for that day")


class CostTrendsResponse(BaseModel):
    """Cost trends over time"""

    period_days: int = Field(..., description="Number of days analyzed")
    total_period_cost: float = Field(..., description="Total cost for period")
    average_daily_cost: float = Field(..., description="Average daily cost")
    cost_trend: str = Field(
        ..., description="Trend direction: increasing|stable|decreasing"
    )


class OptimizationImpactResponse(BaseModel):
    """Impact of optimization features"""

    total_requests: int = Field(..., description="Total requests")
    optimized_requests: int = Field(..., description="Optimized requests")
    optimization_rate_percent: float = Field(
        ..., description="Optimization rate percentage"
    )
    cached_requests: int = Field(..., description="Cached requests")
    cache_hit_rate_percent: float = Field(
        ..., description="Cache hit rate percentage"
    )
    estimated_savings: float = Field(
        ..., description="Estimated savings in USD"
    )
    combined_impact: float = Field(
        ..., description="Combined optimization impact percentage"
    )


class DashboardResponse(BaseModel):
    """Complete dashboard response"""

    summary: AnalyticsSummaryResponse = Field(
        ..., description="Overall summary metrics"
    )
    performance: PerformanceMetricsResponse = Field(
        ..., description="Performance metrics"
    )
    provider_breakdown: Dict[str, Dict[str, Any]] = Field(
        ..., description="Metrics breakdown by provider"
    )
    cost_trends: Dict[str, Any] = Field(
        ..., description="Cost trend analysis"
    )
    optimization_impact: OptimizationImpactResponse = Field(
        ..., description="Optimization impact analysis"
    )
    timestamp: str = Field(..., description="When report was generated")


class AnalyticsFilterRequest(BaseModel):
    """Request with filters for analytics"""

    provider: Optional[str] = Field(None, description="Filter by provider")
    days: int = Field(default=7, description="Number of days to analyze")
    include_costs: bool = Field(default=True, description="Include cost analysis")
    include_trends: bool = Field(default=True, description="Include trends")


class CustomReportRequest(BaseModel):
    """Request for custom report generation"""

    report_type: str = Field(
        ...,
        description="Type of report: summary|detailed|performance|comparison"
    )
    providers: List[str] = Field(
        default=["all"], description="Providers to include"
    )
    days: int = Field(default=30, description="Number of days to analyze")
    format: str = Field(
        default="json", description="Output format: json|csv|pdf"
    )


class AlertThresholdConfig(BaseModel):
    """Configuration for analytics alerts"""

    daily_cost_limit: Optional[float] = Field(
        None, description="Daily cost limit in USD"
    )
    monthly_cost_limit: Optional[float] = Field(
        None, description="Monthly cost limit in USD"
    )
    error_rate_threshold: Optional[float] = Field(
        None, description="Error rate threshold %"
    )
    alert_email: Optional[str] = Field(None, description="Email for alerts")


class AlertResponse(BaseModel):
    """Alert response"""

    alert_type: str = Field(
        ..., description="Type: cost|performance|error"
    )
    severity: str = Field(..., description="Severity: info|warning|critical")
    message: str = Field(..., description="Alert message")
    value: float = Field(..., description="Current value that triggered alert")
    threshold: float = Field(..., description="Configured threshold")
    timestamp: str = Field(..., description="When alert was triggered")
