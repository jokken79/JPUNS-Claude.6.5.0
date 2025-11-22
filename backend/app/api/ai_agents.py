"""
AI Agents API - Multi-AI Integration Endpoints

Provides REST API endpoints for invoking multiple AI systems.

Endpoints:
- POST /api/ai/gemini - Invoke Google Gemini
- POST /api/ai/openai - Invoke OpenAI (ChatGPT)
- POST /api/ai/claude - Invoke Anthropic Claude API
- POST /api/ai/cli - Invoke local CLI tools
- POST /api/ai/batch - Invoke multiple AIs in batch
- GET /api/ai/health - Health check of all AI providers

Usage:
    # Generate code with Gemini
    POST /api/ai/gemini
    {
        "prompt": "Generate FastAPI endpoint for candidates..."
    }

    # Review code with OpenAI
    POST /api/ai/openai
    {
        "prompt": "Review this code...",
        "system_message": "You are a code reviewer..."
    }

    # Batch invoke multiple AIs
    POST /api/ai/batch
    {
        "tasks": [
            {"provider": "gemini", "prompt": "..."},
            {"provider": "openai", "prompt": "..."}
        ]
    }
"""

import logging
from typing import Optional, Dict, Any, List, AsyncGenerator
from pydantic import BaseModel, Field
import uuid
import json

from fastapi import APIRouter, Depends, HTTPException, status, StreamingResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import SessionLocal
from fastapi import Request
from app.core.cache import cache, CacheKey, CacheTTL
from app.core.response import success_response, created_response, paginated_response, no_content_response
from app.core.rate_limiter import limiter, RateLimitConfig
from app.core.error_handlers import handle_errors
from app.core.app_exceptions import ExternalServiceError, ValidationError
from app.services.ai_gateway import AIGateway, AIGatewayError
from app.services.ai_usage_service import AIUsageService
from app.services.ai_budget_service import AIBudgetService, BudgetExceededException
from app.services.cache_service import CacheService
from app.models.models import User
from app.schemas.ai_usage import (
    UsageStatsResponse,
    DailyUsageResponse,
    UsageLogsResponse,
    TotalCostResponse,
)
from app.schemas.ai_budget import (
    AIBudgetCreate,
    AIBudgetUpdate,
    AIBudgetResponse,
    BudgetValidationResponse,
)
from app.schemas.cache import (
    CacheStatsResponse,
    CacheMemoryResponse,
    CacheHealthResponse,
    CacheInvalidationResponse,
)
from app.services.prompt_optimizer import PromptOptimizer
from app.schemas.prompt_optimization import (
    OptimizationRequest,
    OptimizedPromptResponse,
    OptimizationRecommendationsResponse,
    OptimizationEstimateResponse,
    OptimizationStatsResponse,
)
from app.services.batch_optimizer import BatchOptimizer
from app.schemas.batch_optimization import (
    BatchOptimizationRequest,
    BatchOptimizedResponse,
    BatchSavingsEstimate,
    PromptSimilarityRequest,
    PromptSimilarityResponse,
    PromptSimilarityResult,
)
from app.services.streaming_service import StreamingService, StreamChunk
from app.schemas.streaming import (
    StreamingRequest,
    StreamChunkResponse,
    StreamingSessionResponse,
    StreamingStatisticsResponse,
)
from app.services.additional_providers import (
    ProviderFactory,
    PROVIDER_DEFAULTS,
    AnthropicClaudeProvider,
    CohereProvider,
    HuggingFaceProvider,
    OllamaLocalProvider,
    ZhipuGLMProvider,
)
from app.schemas.additional_providers import (
    AnthropicRequest,
    CohereRequest,
    HuggingFaceRequest,
    OllamaRequest,
    ZhipuRequest,
    ProviderResponse,
    ProviderListResponse,
    ProviderHealthCheck,
    MultiProviderRequest,
    MultiProviderResponse,
)
from app.services.analytics_service import AnalyticsService
from app.schemas.analytics import (
    DashboardResponse,
    AnalyticsSummaryResponse,
    PerformanceMetricsResponse,
    OptimizationImpactResponse,
    AnalyticsFilterRequest,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["ai-agents"])


# Request/Response schemas
class GeminiRequest(BaseModel):
    """Request schema for Gemini invocation"""
    prompt: str = Field(..., description="User prompt/instruction")
    max_tokens: int = Field(4096, description="Maximum tokens in response")
    temperature: float = Field(0.7, ge=0.0, le=2.0, description="Model temperature")
    system_instruction: Optional[str] = Field(None, description="System instruction")


class OpenAIRequest(BaseModel):
    """Request schema for OpenAI invocation"""
    prompt: str = Field(..., description="User prompt/instruction")
    model: str = Field("gpt-4-turbo-preview", description="Model name")
    max_tokens: int = Field(4096, description="Maximum tokens in response")
    temperature: float = Field(0.7, ge=0.0, le=2.0, description="Model temperature")
    system_message: Optional[str] = Field(None, description="System message")


class ClaudeAPIRequest(BaseModel):
    """Request schema for Claude API invocation"""
    prompt: str = Field(..., description="User prompt/instruction")
    model: str = Field("claude-3-5-sonnet-20241022", description="Model name")
    max_tokens: int = Field(4096, description="Maximum tokens in response")
    system_prompt: Optional[str] = Field(None, description="System prompt")


class LocalCLIRequest(BaseModel):
    """Request schema for local CLI tool invocation"""
    tool: str = Field(..., description="Tool name (e.g., 'gemini-cli')")
    args: Dict[str, Any] = Field(default_factory=dict, description="Tool arguments")
    timeout: int = Field(60, description="Process timeout in seconds")


class BatchTask(BaseModel):
    """Task for batch invocation"""
    provider: str = Field(..., description="AI provider: gemini|openai|claude_api|local_cli")
    prompt: Optional[str] = Field(None, description="User prompt")
    tool: Optional[str] = Field(None, description="Tool name (for local_cli)")
    args: Optional[Dict[str, Any]] = Field(None, description="Arguments")
    max_tokens: Optional[int] = Field(4096, description="Max tokens")
    temperature: Optional[float] = Field(0.7, description="Temperature")
    model: Optional[str] = Field(None, description="Model name")
    system_instruction: Optional[str] = Field(None, description="System instruction")
    system_message: Optional[str] = Field(None, description="System message")
    system_prompt: Optional[str] = Field(None, description="System prompt")
    timeout: Optional[int] = Field(60, description="Timeout (CLI tools)")


class BatchRequest(BaseModel):
    """Request schema for batch invocation"""
    tasks: List[BatchTask] = Field(..., description="List of AI tasks")
    parallel: bool = Field(True, description="Execute in parallel")


class AIResponse(BaseModel):
    """Response schema for AI invocations"""
    status: str = Field(..., description="Response status: success|error")
    provider: str = Field(..., description="AI provider used")
    response: Optional[str] = Field(None, description="AI response")
    error: Optional[str] = Field(None, description="Error message (if failed)")
    tokens_used: Optional[int] = Field(None, description="Tokens used (if applicable)")


class BatchResponse(BaseModel):
    """Response schema for batch invocation"""
    status: str = Field(..., description="Overall status: success|partial|error")
    results: List[Dict[str, Any]] = Field(..., description="Results from each task")
    total_tasks: int = Field(..., description="Total tasks executed")
    successful: int = Field(..., description="Number of successful tasks")
    failed: int = Field(..., description="Number of failed tasks")


class HealthResponse(BaseModel):
    """Health check response"""
    status: str = Field(..., description="Overall status: healthy|degraded|unhealthy")
    providers: Dict[str, str] = Field(..., description="Status of each provider")


# Dependency to get AI Gateway
async def get_ai_gateway() -> AIGateway:
    """Get AI Gateway instance"""
    return AIGateway()


# Dependency to get AI Usage Service
def get_ai_usage_service(db: Session = Depends(SessionLocal)) -> AIUsageService:
    """Get AI usage service with database session"""
    return AIUsageService(db)


# Dependency to get AI Budget Service
def get_ai_budget_service(db: Session = Depends(SessionLocal)) -> AIBudgetService:
    """Get AI budget service with database session"""
    return AIBudgetService(db)


# Dependency to get Cache Service
def get_cache_service() -> CacheService:
    """Get cache service"""
    return CacheService()


# Dependency to get Prompt Optimizer
def get_prompt_optimizer(aggressive: bool = False) -> PromptOptimizer:
    """Get prompt optimizer service"""
    return PromptOptimizer(aggressive=aggressive)


# Dependency to get Batch Optimizer
def get_batch_optimizer(similarity_threshold: float = 0.85) -> BatchOptimizer:
    """Get batch optimizer service"""
    return BatchOptimizer(similarity_threshold=similarity_threshold)


# Dependency to get Streaming Service
def get_streaming_service() -> StreamingService:
    """Get streaming service"""
    return StreamingService()


# Dependency to get Analytics Service
def get_analytics_service() -> AnalyticsService:
    """Get analytics service"""
    return AnalyticsService()


# Endpoints
@router.post("/gemini", response_model=AIResponse)
@limiter.limit(RateLimitConfig.GEMINI_LIMIT)
@limiter.limit(RateLimitConfig.GEMINI_BURST)
@handle_errors(default_detail="Gemini invocation failed")
async def invoke_gemini(
    request: GeminiRequest,
    gateway: AIGateway = Depends(get_ai_gateway),
    current_user: User = Depends(get_current_user),
) -> AIResponse:
    """
    Invoke Google Gemini for code generation or analysis.

    Requires authentication. Limited by rate limits and quota.

    Args:
        request: Gemini request parameters
        gateway: AI Gateway instance
        current_user: Current authenticated user

    Returns:
        AIResponse with Gemini's generated text

    Raises:
        HTTPException: If invocation fails
    """
    logger.info(f"User {current_user.username} invoking Gemini")

    response = await gateway.invoke_gemini(
        prompt=request.prompt,
        max_tokens=request.max_tokens,
        temperature=request.temperature,
        system_instruction=request.system_instruction,
    )

    return AIResponse(
        status="success",
        provider="gemini",
        response=response,
    )


@router.post("/openai", response_model=AIResponse)
@limiter.limit(RateLimitConfig.OPENAI_LIMIT)
@limiter.limit(RateLimitConfig.OPENAI_BURST)
@handle_errors(default_detail="OpenAI invocation failed")
async def invoke_openai(
    request: OpenAIRequest,
    gateway: AIGateway = Depends(get_ai_gateway),
    current_user: User = Depends(get_current_user),
) -> AIResponse:
    """
    Invoke OpenAI (ChatGPT) for analysis, review, or architecture.

    Requires authentication. Limited by API quota and rate limits.

    Args:
        request: OpenAI request parameters
        gateway: AI Gateway instance
        current_user: Current authenticated user

    Returns:
        AIResponse with OpenAI's response

    Raises:
        HTTPException: If invocation fails
    """
    logger.info(f"User {current_user.username} invoking OpenAI")

    response = await gateway.invoke_openai(
        prompt=request.prompt,
        model=request.model,
        max_tokens=request.max_tokens,
        temperature=request.temperature,
        system_message=request.system_message,
    )

    return AIResponse(
        status="success",
        provider="openai",
        response=response,
    )


@router.post("/claude", response_model=AIResponse)
@limiter.limit(RateLimitConfig.CLAUDE_API_LIMIT)
@limiter.limit(RateLimitConfig.CLAUDE_API_BURST)
async def invoke_claude_api(
    request: ClaudeAPIRequest,
    gateway: AIGateway = Depends(get_ai_gateway),
    current_user: User = Depends(get_current_user),
) -> AIResponse:
    """
    Invoke Anthropic Claude API (external).

    Note: This is the external Claude API service, not Claude Code.
    Requires authentication and API quota.

    Args:
        request: Claude API request parameters
        gateway: AI Gateway instance
        current_user: Current authenticated user

    Returns:
        AIResponse with Claude's response

    Raises:
        HTTPException: If invocation fails
    """
    try:
        logger.info(f"User {current_user.username} invoking Claude API")

        response = await gateway.invoke_claude_api(
            prompt=request.prompt,
            model=request.model,
            max_tokens=request.max_tokens,
            system_prompt=request.system_prompt,
        )

        return AIResponse(
            status="success",
            provider="claude_api",
            response=response,
        )

    except AIGatewayError as e:
        logger.error(f"Claude API invocation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Claude API invocation failed: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error invoking Claude API: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/cli", response_model=AIResponse)
@limiter.limit(RateLimitConfig.LOCAL_CLI_LIMIT)
@limiter.limit(RateLimitConfig.LOCAL_CLI_BURST)
async def invoke_local_cli(
    request: LocalCLIRequest,
    gateway: AIGateway = Depends(get_ai_gateway),
    current_user: User = Depends(get_current_user),
) -> AIResponse:
    """
    Invoke local CLI tool (gemini-cli, custom tools, etc.).

    Useful for integrating local development tools with the API.

    Args:
        request: CLI request parameters
        gateway: AI Gateway instance
        current_user: Current authenticated user

    Returns:
        AIResponse with CLI tool output

    Raises:
        HTTPException: If tool execution fails
    """
    try:
        logger.info(f"User {current_user.username} invoking local CLI: {request.tool}")

        response = await gateway.invoke_local_cli(
            tool=request.tool,
            args=request.args,
            timeout=request.timeout,
        )

        return AIResponse(
            status="success",
            provider="local_cli",
            response=response,
        )

    except AIGatewayError as e:
        logger.error(f"CLI invocation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"CLI invocation failed: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error invoking CLI: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/batch", response_model=BatchResponse)
@limiter.limit(RateLimitConfig.BATCH_LIMIT)
async def batch_invoke(
    request: BatchRequest,
    gateway: AIGateway = Depends(get_ai_gateway),
    current_user: User = Depends(get_current_user),
) -> BatchResponse:
    """
    Invoke multiple AI systems in parallel or sequence.

    Useful for coordinating responses from multiple AI providers.

    Args:
        request: Batch request with list of tasks
        gateway: AI Gateway instance
        current_user: Current authenticated user

    Returns:
        BatchResponse with results from all tasks

    Example:
        {
            "tasks": [
                {
                    "provider": "gemini",
                    "prompt": "Generate FastAPI endpoint..."
                },
                {
                    "provider": "openai",
                    "prompt": "Review the generated code..."
                }
            ]
        }
    """
    try:
        logger.info(
            f"User {current_user.username} invoking batch with {len(request.tasks)} tasks"
        )

        results = await gateway.batch_invoke(
            tasks=[task.dict() for task in request.tasks],
            parallel=request.parallel,
        )

        # Count successes and failures
        successful = sum(1 for r in results if r.get("status") == "success")
        failed = sum(1 for r in results if r.get("status") == "error")

        # Determine overall status
        if failed == 0:
            overall_status = "success"
        elif successful == 0:
            overall_status = "error"
        else:
            overall_status = "partial"

        return BatchResponse(
            status=overall_status,
            results=results,
            total_tasks=len(results),
            successful=successful,
            failed=failed,
        )

    except Exception as e:
        logger.error(f"Batch invocation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Batch invocation failed"
        )


@router.get("/health", response_model=HealthResponse)
@cache.cached(ttl=CacheTTL.MEDIUM)
async def health_check(
    gateway: AIGateway = Depends(get_ai_gateway),
) -> HealthResponse:
    """
    Check health status of all AI providers.

    Returns:
        HealthResponse with status of each configured provider

    Example response:
        {
            "status": "healthy",
            "providers": {
                "gemini": "healthy",
                "openai": "healthy",
                "claude_api": "not_configured",
                "local_cli": "available"
            }
        }
    """
    try:
        health = await gateway.health_check()

        # Determine overall health
        provider_statuses = list(health.get("providers", {}).values())
        unhealthy_count = sum(
            1 for s in provider_statuses if "unhealthy" in s.lower() or "error" in s.lower()
        )

        if unhealthy_count == 0:
            overall_status = "healthy"
        elif unhealthy_count < len(provider_statuses):
            overall_status = "degraded"
        else:
            overall_status = "unhealthy"

        return HealthResponse(
            status=overall_status,
            providers=health.get("providers", {}),
        )

    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Health check failed"
        )


# ============================================
# BUDGET MANAGEMENT ENDPOINTS (FASE 2.3)
# ============================================

@router.get("/budget", response_model=AIBudgetResponse)
@cache.cached(ttl=CacheTTL.MEDIUM)
async def get_budget(
    service: AIBudgetService = Depends(get_ai_budget_service),
    current_user: User = Depends(get_current_user),
) -> AIBudgetResponse:
    """
    Get budget status for the current user.

    Returns current spending limits, spent amounts, and remaining budget.

    Returns:
        AIBudgetResponse with budget information

    Example:
        GET /api/ai/budget
    """
    try:
        budget_status = service.get_budget_status(current_user.id)
        return AIBudgetResponse(**budget_status)
    except Exception as e:
        logger.error(f"Error fetching budget: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching budget"
        )


@router.post("/budget", response_model=AIBudgetResponse)
async def create_or_update_budget(
    request: AIBudgetCreate,
    service: AIBudgetService = Depends(get_ai_budget_service),
    current_user: User = Depends(get_current_user),
) -> AIBudgetResponse:
    """
    Create or update budget for the current user.

    Args:
        request: Budget settings
        service: Budget service
        current_user: Current authenticated user

    Returns:
        AIBudgetResponse with updated budget information

    Example:
        POST /api/ai/budget
        {
            "monthly_budget_usd": "500.00",
            "daily_budget_usd": "50.00",
            "alert_threshold": 75,
            "webhook_url": "https://example.com/alerts"
        }
    """
    try:
        budget = service.get_or_create_budget(
            current_user.id,
            monthly_budget_usd=request.monthly_budget_usd,
            daily_budget_usd=request.daily_budget_usd,
        )

        # Update other settings if provided
        if request.alert_threshold is not None or request.webhook_url is not None:
            budget = service.update_budget(
                current_user.id,
                alert_threshold=request.alert_threshold,
                webhook_url=request.webhook_url,
            )

        budget_status = service.get_budget_status(current_user.id)
        return AIBudgetResponse(**budget_status)
    except Exception as e:
        logger.error(f"Error creating/updating budget: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating/updating budget"
        )


@router.put("/budget", response_model=AIBudgetResponse)
async def update_budget(
    request: AIBudgetUpdate,
    service: AIBudgetService = Depends(get_ai_budget_service),
    current_user: User = Depends(get_current_user),
) -> AIBudgetResponse:
    """
    Update budget settings for the current user.

    Args:
        request: Fields to update
        service: Budget service
        current_user: Current authenticated user

    Returns:
        AIBudgetResponse with updated budget information

    Example:
        PUT /api/ai/budget
        {
            "monthly_budget_usd": "200.00",
            "is_active": true
        }
    """
    try:
        budget = service.update_budget(
            current_user.id,
            monthly_budget_usd=request.monthly_budget_usd,
            daily_budget_usd=request.daily_budget_usd,
            alert_threshold=request.alert_threshold,
            webhook_url=request.webhook_url,
            is_active=request.is_active,
        )

        budget_status = service.get_budget_status(current_user.id)
        return AIBudgetResponse(**budget_status)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error updating budget: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating budget"
        )


@router.get("/budget/validate", response_model=BudgetValidationResponse)
@cache.cached(ttl=CacheTTL.MEDIUM)
async def validate_budget(
    cost: float = 0.0,
    service: AIBudgetService = Depends(get_ai_budget_service),
    current_user: User = Depends(get_current_user),
) -> BudgetValidationResponse:
    """
    Check if user can afford an API call before making it.

    Args:
        cost: Estimated cost of the API call in USD
        service: Budget service
        current_user: Current authenticated user

    Returns:
        BudgetValidationResponse indicating if call is allowed

    Example:
        GET /api/ai/budget/validate?cost=10.50
    """
    try:
        from decimal import Decimal
        validation = service.validate_spending(current_user.id, Decimal(str(cost)))
        return BudgetValidationResponse(**validation)
    except BudgetExceededException as e:
        return BudgetValidationResponse(
            allowed=False,
            reason=str(e),
            monthly_remaining=0.0,
            monthly_percentage_used=100.0,
        )
    except Exception as e:
        logger.error(f"Error validating budget: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error validating budget"
        )


# ============================================
# USAGE TRACKING ENDPOINTS (FASE 2.2)
# ============================================

@router.get("/usage/stats", response_model=UsageStatsResponse)
@cache.cached(ttl=CacheTTL.MEDIUM)
async def get_usage_stats(
    days: int = 1,
    provider: Optional[str] = None,
    service: AIUsageService = Depends(get_ai_usage_service),
    current_user: User = Depends(get_current_user),
) -> UsageStatsResponse:
    """
    Get usage statistics for the current user.

    Args:
        days: Number of days to look back (default: 1)
        provider: Filter by provider (optional)
        service: AI usage service
        current_user: Current authenticated user

    Returns:
        UsageStatsResponse with statistics

    Example:
        GET /api/ai/usage/stats?days=7&provider=gemini
    """
    try:
        stats = service.get_usage_stats(current_user.id, days=days, provider=provider)
        return UsageStatsResponse(**stats)
    except Exception as e:
        logger.error(f"Error fetching usage stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching usage stats"
        )


@router.get("/usage/daily", response_model=DailyUsageResponse)
@cache.cached(ttl=CacheTTL.MEDIUM)
async def get_daily_usage(
    days: int = 7,
    service: AIUsageService = Depends(get_ai_usage_service),
    current_user: User = Depends(get_current_user),
) -> DailyUsageResponse:
    """
    Get daily usage breakdown for the current user.

    Args:
        days: Number of days to retrieve (default: 7)
        service: AI usage service
        current_user: Current authenticated user

    Returns:
        DailyUsageResponse with daily statistics

    Example:
        GET /api/ai/usage/daily?days=30
    """
    try:
        daily_stats = service.get_daily_usage(current_user.id, days=days)
        return DailyUsageResponse(user_id=current_user.id, data=daily_stats)
    except Exception as e:
        logger.error(f"Error fetching daily usage: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching daily usage"
        )


@router.get("/usage/logs", response_model=UsageLogsResponse)
@cache.cached(ttl=CacheTTL.MEDIUM)
async def get_usage_logs(
    limit: int = 100,
    offset: int = 0,
    provider: Optional[str] = None,
    status_filter: Optional[str] = None,
    service: AIUsageService = Depends(get_ai_usage_service),
    current_user: User = Depends(get_current_user),
) -> UsageLogsResponse:
    """
    Get paginated usage logs for the current user.

    Args:
        limit: Number of records to return (default: 100, max: 1000)
        offset: Number of records to skip (default: 0)
        provider: Filter by provider (optional)
        status_filter: Filter by status (optional)
        service: AI usage service
        current_user: Current authenticated user

    Returns:
        UsageLogsResponse with paginated logs

    Example:
        GET /api/ai/usage/logs?limit=50&offset=0&provider=gemini
    """
    try:
        if limit > 1000:
            limit = 1000

        logs = service.get_all_logs(
            current_user.id,
            limit=limit,
            offset=offset,
            provider=provider,
            status=status_filter,
        )
        return UsageLogsResponse(**logs)
    except Exception as e:
        logger.error(f"Error fetching usage logs: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching usage logs"
        )


@router.get("/usage/cost", response_model=TotalCostResponse)
@cache.cached(ttl=CacheTTL.MEDIUM)
async def get_total_cost(
    days: int = 30,
    service: AIUsageService = Depends(get_ai_usage_service),
    current_user: User = Depends(get_current_user),
) -> TotalCostResponse:
    """
    Get total cost for the current user.

    Args:
        days: Number of days to consider (default: 30)
        service: AI usage service
        current_user: Current authenticated user

    Returns:
        TotalCostResponse with cost breakdown

    Example:
        GET /api/ai/usage/cost?days=30
    """
    try:
        cost = service.get_user_total_cost(current_user.id, days=days)
        return TotalCostResponse(**cost)
    except Exception as e:
        logger.error(f"Error fetching total cost: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching total cost"
        )


# ============================================
# CACHE MANAGEMENT ENDPOINTS (FASE 3.1)
# ============================================

@router.get("/cache/stats", response_model=CacheStatsResponse)
@cache.cached(ttl=CacheTTL.MEDIUM)
async def get_cache_stats(
    service: CacheService = Depends(get_cache_service),
    current_user: User = Depends(get_current_user),
) -> CacheStatsResponse:
    """
    Get cache statistics.

    Returns information about cached responses, memory usage, and hits.

    Returns:
        CacheStatsResponse with cache information

    Example:
        GET /api/ai/cache/stats
    """
    try:
        stats = service.get_stats()
        return CacheStatsResponse(**stats)
    except Exception as e:
        logger.error(f"Error fetching cache stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching cache stats"
        )


@router.get("/cache/memory", response_model=CacheMemoryResponse)
@cache.cached(ttl=CacheTTL.MEDIUM)
async def get_cache_memory(
    service: CacheService = Depends(get_cache_service),
    current_user: User = Depends(get_current_user),
) -> CacheMemoryResponse:
    """
    Get detailed cache memory usage information.

    Returns Redis memory statistics and configuration.

    Returns:
        CacheMemoryResponse with memory information

    Example:
        GET /api/ai/cache/memory
    """
    try:
        memory = service.get_memory_usage()
        return CacheMemoryResponse(**memory)
    except Exception as e:
        logger.error(f"Error fetching cache memory: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching cache memory"
        )


@router.get("/cache/health", response_model=CacheHealthResponse)
@cache.cached(ttl=CacheTTL.MEDIUM)
async def get_cache_health(
    service: CacheService = Depends(get_cache_service),
    current_user: User = Depends(get_current_user),
) -> CacheHealthResponse:
    """
    Check cache health and responsiveness.

    Performs connectivity and performance tests.

    Returns:
        CacheHealthResponse with health status

    Example:
        GET /api/ai/cache/health
    """
    try:
        health = service.health_check()
        return CacheHealthResponse(**health)
    except Exception as e:
        logger.error(f"Error checking cache health: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error checking cache health"
        )


@router.delete("/cache", response_model=CacheInvalidationResponse)
async def flush_cache(
    service: CacheService = Depends(get_cache_service),
    current_user: User = Depends(get_current_user),
) -> CacheInvalidationResponse:
    """
    Delete all cached AI responses (DANGEROUS).

    Clears entire AI response cache. This cannot be undone.
    Use with caution.

    Returns:
        CacheInvalidationResponse with operation result

    Example:
        DELETE /api/ai/cache
    """
    try:
        service.flush_all()
        return CacheInvalidationResponse(
            success=True,
            deleted_count=0,  # We don't count in flush_all
            message="All AI cache entries have been flushed"
        )
    except Exception as e:
        logger.error(f"Error flushing cache: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error flushing cache"
        )


@router.delete("/cache/provider/{provider}", response_model=CacheInvalidationResponse)
async def invalidate_cache_by_provider(
    provider: str,
    service: CacheService = Depends(get_cache_service),
    current_user: User = Depends(get_current_user),
) -> CacheInvalidationResponse:
    """
    Delete cached responses from a specific provider.

    Clears all cached responses from the specified AI provider
    (gemini, openai, claude_api, local_cli).

    Args:
        provider: AI provider name

    Returns:
        CacheInvalidationResponse with number of deleted entries

    Example:
        DELETE /api/ai/cache/provider/gemini
    """
    try:
        valid_providers = ["gemini", "openai", "claude_api", "local_cli"]
        if provider not in valid_providers:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid provider. Must be one of: {', '.join(valid_providers)}"
            )

        deleted = service.invalidate_by_provider(provider)
        return CacheInvalidationResponse(
            success=True,
            deleted_count=deleted,
            message=f"Deleted {deleted} cached responses from {provider}"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error invalidating cache by provider: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error invalidating cache"
        )


@router.delete("/cache/model/{provider}/{model}", response_model=CacheInvalidationResponse)
async def invalidate_cache_by_model(
    provider: str,
    model: str,
    service: CacheService = Depends(get_cache_service),
    current_user: User = Depends(get_current_user),
) -> CacheInvalidationResponse:
    """
    Delete cached responses for a specific model.

    Clears all cached responses from a specific AI model.

    Args:
        provider: AI provider name (gemini, openai, claude_api, local_cli)
        model: Model name (e.g., gpt-4, claude-3-opus)

    Returns:
        CacheInvalidationResponse with number of deleted entries

    Example:
        DELETE /api/ai/cache/model/openai/gpt-4
    """
    try:
        valid_providers = ["gemini", "openai", "claude_api", "local_cli"]
        if provider not in valid_providers:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid provider. Must be one of: {', '.join(valid_providers)}"
            )

        deleted = service.invalidate_by_model(provider, model)
        return CacheInvalidationResponse(
            success=True,
            deleted_count=deleted,
            message=f"Deleted {deleted} cached responses from {provider}/{model}"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error invalidating cache by model: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error invalidating cache"
        )


# ============================================
# PROMPT OPTIMIZATION ENDPOINTS (FASE 3.2)
# ============================================

@router.post("/optimize", response_model=OptimizedPromptResponse)
async def optimize_prompt(
    request: OptimizationRequest,
    optimizer: PromptOptimizer = Depends(get_prompt_optimizer),
    current_user: User = Depends(get_current_user),
) -> OptimizedPromptResponse:
    """
    Optimize a prompt to reduce token count.

    Applies text normalization, redundancy removal, and condensation strategies.

    Args:
        request: Optimization request with prompt and system message
        optimizer: Prompt optimizer service
        current_user: Current authenticated user

    Returns:
        OptimizedPromptResponse with optimized text and statistics

    Example:
        POST /api/ai/optimize
        {
            "prompt": "Can you please generate FastAPI endpoint code for me?",
            "system_message": "You are a helpful code generation assistant.",
            "aggressive": false
        }
    """
    try:
        optimized_prompt, optimized_system_message, stats = optimizer.optimize(
            request.prompt,
            request.system_message,
        )

        return OptimizedPromptResponse(
            optimized_prompt=optimized_prompt,
            optimized_system_message=optimized_system_message,
            stats=OptimizationStatsResponse(
                original_length=stats.original_length,
                optimized_length=stats.optimized_length,
                tokens_saved=stats.tokens_saved,
                reduction_percentage=stats.reduction_percentage,
                strategies_applied=stats.strategies_applied,
            ),
        )
    except Exception as e:
        logger.error(f"Error optimizing prompt: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error optimizing prompt"
        )


@router.post("/optimize/recommendations", response_model=OptimizationRecommendationsResponse)
async def get_optimization_recommendations(
    request: OptimizationRequest,
    optimizer: PromptOptimizer = Depends(get_prompt_optimizer),
    current_user: User = Depends(get_current_user),
) -> OptimizationRecommendationsResponse:
    """
    Get specific recommendations for optimizing a prompt.

    Analyzes prompt and returns targeted improvement suggestions.

    Args:
        request: Request with prompt to analyze
        optimizer: Prompt optimizer service
        current_user: Current authenticated user

    Returns:
        OptimizationRecommendationsResponse with recommendations

    Example:
        POST /api/ai/optimize/recommendations
        {
            "prompt": "Can you please please generate code?"
        }
    """
    try:
        recommendations = optimizer.get_optimization_recommendations(request.prompt)

        return OptimizationRecommendationsResponse(
            prompt=request.prompt,
            recommendations=recommendations,
            has_optimization_opportunities=len(recommendations) > 0,
        )
    except Exception as e:
        logger.error(f"Error getting recommendations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error getting recommendations"
        )


@router.post("/optimize/estimate", response_model=OptimizationEstimateResponse)
async def estimate_savings(
    request: OptimizationRequest,
    optimizer: PromptOptimizer = Depends(get_prompt_optimizer),
    current_user: User = Depends(get_current_user),
) -> OptimizationEstimateResponse:
    """
    Estimate token savings without actually optimizing.

    Returns predicted improvements for analysis purposes.

    Args:
        request: Request with prompt to analyze
        optimizer: Prompt optimizer service
        current_user: Current authenticated user

    Returns:
        OptimizationEstimateResponse with estimated savings

    Example:
        POST /api/ai/optimize/estimate
        {
            "prompt": "Your prompt here",
            "aggressive": false
        }
    """
    try:
        estimate = optimizer.estimate_savings(
            request.prompt,
            request.system_message,
        )

        return OptimizationEstimateResponse(**estimate)
    except Exception as e:
        logger.error(f"Error estimating savings: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error estimating savings"
        )


# ============================================================================
# BATCH OPTIMIZATION ENDPOINTS (FASE 3.3)
# ============================================================================


@router.post("/batch/optimize", response_model=BatchOptimizedResponse)
async def batch_optimize(
    request: BatchOptimizationRequest,
    optimizer: BatchOptimizer = Depends(get_batch_optimizer),
    current_user: User = Depends(get_current_user),
) -> BatchOptimizedResponse:
    """
    Optimize a batch of prompts by detecting and grouping duplicates/similar prompts.

    Detects exact duplicates and similar prompts (based on threshold) to reduce
    the number of API calls needed.

    Args:
        request: Request with list of prompts to optimize
        optimizer: Batch optimizer service
        current_user: Current authenticated user

    Returns:
        BatchOptimizedResponse with grouping information and statistics

    Example:
        POST /api/ai/batch/optimize
        {
            "prompts": [
                "Write a Python function to sort data",
                "Write a Python function to sort data",
                "Create a Python function that sorts data",
                "Write a C++ function"
            ],
            "detect_similar": true
        }

        Response:
        {
            "optimization_map": {0: "hash1", 1: "hash1", 2: "hash1", 3: "hash2"},
            "grouped_prompts": {
                "hash1": [0, 1, 2],
                "hash2": [3]
            },
            "representative_prompts": {
                "hash1": "Write a Python function to sort data",
                "hash2": "Write a C++ function"
            },
            "stats": {
                "original_prompts": 4,
                "grouped_prompts": 2,
                "duplicates_detected": 2,
                "api_calls_saved": 2,
                "cost_savings_percentage": 50.0
            }
        }
    """
    try:
        result = optimizer.optimize_batch(
            request.prompts,
            system_message=request.system_message,
            detect_similar=request.detect_similar,
        )

        stats_dict = {
            "original_prompts": result.stats.original_prompts_count,
            "grouped_prompts": result.stats.grouped_prompts_count,
            "duplicates_detected": result.stats.duplicate_prompts_detected,
            "api_calls_saved": result.stats.api_calls_saved,
            "cost_savings_percentage": result.stats.cost_savings_percentage,
            "processing_time_ms": result.stats.processing_time_ms,
            "groups_count": result.stats.grouped_prompts_count,
            "group_details": result.stats.groups,
        }

        logger.info(
            f"Batch optimization: {result.stats.original_prompts_count} prompts → "
            f"{result.stats.grouped_prompts_count} groups "
            f"(saved {result.stats.api_calls_saved} calls)"
        )

        return BatchOptimizedResponse(
            optimization_map=result.optimization_map,
            grouped_prompts=result.grouped_prompts,
            representative_prompts=result.representative_prompts,
            stats=stats_dict,
        )
    except Exception as e:
        logger.error(f"Error optimizing batch: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error optimizing batch"
        )


@router.post("/batch/estimate", response_model=BatchSavingsEstimate)
async def estimate_batch_savings(
    request: BatchOptimizationRequest,
    optimizer: BatchOptimizer = Depends(get_batch_optimizer),
    current_user: User = Depends(get_current_user),
) -> BatchSavingsEstimate:
    """
    Estimate potential cost savings for a batch without performing optimization.

    Useful for analyzing large batches before committing to optimization.

    Args:
        request: Request with list of prompts to analyze
        optimizer: Batch optimizer service
        current_user: Current authenticated user

    Returns:
        BatchSavingsEstimate with projected savings

    Example:
        POST /api/ai/batch/estimate
        {
            "prompts": [
                "Write code",
                "Write code",
                "Generate documentation"
            ]
        }
    """
    try:
        savings = optimizer.calculate_batch_savings(request.prompts)

        logger.info(
            f"Estimated batch savings: {savings['cost_savings_percentage']:.1f}% "
            f"({savings['api_calls_saved']} calls saved)"
        )

        return BatchSavingsEstimate(**savings)
    except Exception as e:
        logger.error(f"Error estimating batch savings: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error estimating batch savings"
        )


@router.post("/batch/similarity", response_model=PromptSimilarityResponse)
async def analyze_similarity(
    request: PromptSimilarityRequest,
    optimizer: BatchOptimizer = Depends(get_batch_optimizer),
    current_user: User = Depends(get_current_user),
) -> PromptSimilarityResponse:
    """
    Analyze similarity between prompts in a batch.

    Identifies which prompts are similar based on the similarity threshold.
    Useful for understanding prompt diversity and optimization potential.

    Args:
        request: Request with prompts and similarity threshold
        optimizer: Batch optimizer service
        current_user: Current authenticated user

    Returns:
        PromptSimilarityResponse with similarity analysis

    Example:
        POST /api/ai/batch/similarity
        {
            "prompts": [
                "Write a Python function",
                "Generate a Python function",
                "Write a JavaScript function"
            ],
            "similarity_threshold": 0.8
        }
    """
    try:
        matches: List[PromptSimilarityResult] = []

        # Compare all pairs of prompts
        for i in range(len(request.prompts)):
            for j in range(i + 1, len(request.prompts)):
                similarity = optimizer._calculate_similarity(
                    request.prompts[i],
                    request.prompts[j]
                )
                is_match = similarity >= request.similarity_threshold

                matches.append(
                    PromptSimilarityResult(
                        prompt1_index=i,
                        prompt2_index=j,
                        similarity_score=round(similarity, 2),
                        is_match=is_match,
                    )
                )

        total_matches = sum(1 for m in matches if m.is_match)

        logger.info(
            f"Similarity analysis: {len(request.prompts)} prompts, "
            f"{total_matches} matches above {request.similarity_threshold:.0%}"
        )

        return PromptSimilarityResponse(
            similarity_threshold=request.similarity_threshold,
            prompt_count=len(request.prompts),
            matches=matches,
            total_matches=total_matches,
        )
    except Exception as e:
        logger.error(f"Error analyzing similarity: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error analyzing similarity"
        )


# ============================================================================
# STREAMING ENDPOINTS (FASE 4)
# ============================================================================


async def _stream_generator(
    request: StreamingRequest,
    streaming_service: StreamingService,
    gateway: AIGateway,
) -> AsyncGenerator[str, None]:
    """
    Internal async generator for streaming responses.

    Yields SSE-formatted chunks from the AI provider.
    """
    try:
        # Invoke AI provider with streaming
        if request.provider == "gemini":
            response_generator = await gateway.invoke_gemini_streaming(
                request.prompt,
                system_instruction=request.system_message,
                max_tokens=request.max_tokens,
                temperature=request.temperature,
                model=request.model,
            )
        elif request.provider == "openai":
            response_generator = await gateway.invoke_openai_streaming(
                request.prompt,
                system_message=request.system_message,
                max_tokens=request.max_tokens,
                temperature=request.temperature,
                model=request.model,
            )
        else:
            raise ValueError(f"Provider {request.provider} does not support streaming")

        # Stream chunks
        async for chunk in streaming_service.stream_response(
            response_generator,
            chunk_size=request.chunk_size,
            provider=request.provider,
            model=request.model or "default",
        ):
            yield chunk.to_event_format()

    except Exception as e:
        logger.error(f"Error in streaming generator: {str(e)}")
        error_event = {
            "error": str(e),
            "timestamp": __import__("time").time(),
        }
        yield f"data: {json.dumps(error_event)}\n\n"


@router.post("/stream", response_class=StreamingResponse)
async def stream_response(
    request: StreamingRequest,
    streaming_service: StreamingService = Depends(get_streaming_service),
    gateway: AIGateway = Depends(get_ai_gateway),
    current_user: User = Depends(get_current_user),
) -> StreamingResponse:
    """
    Stream an AI response in real-time using Server-Sent Events (SSE).

    Returns a streaming response with chunks of the AI's response as they are generated.
    Connect to this endpoint to receive SSE events with response chunks.

    Args:
        request: StreamingRequest with prompt and configuration
        streaming_service: Streaming service
        gateway: AI Gateway service
        current_user: Current authenticated user

    Returns:
        StreamingResponse with Server-Sent Events

    Example:
        POST /api/ai/stream
        {
            "prompt": "Write a long essay about AI...",
            "provider": "gemini",
            "chunk_size": 50
        }

        Response: Server-Sent Events with chunks
        data: {"chunk_id": 0, "content": "AI is...", ...}
        data: {"chunk_id": 1, "content": " a revolutionary", ...}
        data: {"chunk_id": 999, "is_complete": true}
    """
    try:
        # Validate provider supports streaming
        if request.provider not in ["gemini", "openai"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Provider '{request.provider}' does not support streaming"
            )

        logger.info(
            f"Starting stream: {request.provider}/{request.model}, "
            f"chunk_size={request.chunk_size}"
        )

        return StreamingResponse(
            _stream_generator(request, streaming_service, gateway),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
                "Connection": "keep-alive",
            },
        )
    except Exception as e:
        logger.error(f"Error starting stream: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error starting stream"
        )


@router.post("/stream/session", response_model=StreamingSessionResponse)
async def create_streaming_session(
    request: StreamingRequest,
    gateway: AIGateway = Depends(get_ai_gateway),
    current_user: User = Depends(get_current_user),
) -> StreamingSessionResponse:
    """
    Create a streaming session and get the endpoint to connect to.

    Returns session information and streaming endpoint URL.

    Args:
        request: StreamingRequest with prompt and configuration
        gateway: AI Gateway service
        current_user: Current authenticated user

    Returns:
        StreamingSessionResponse with session details

    Example:
        POST /api/ai/stream/session
        {
            "prompt": "Generate code...",
            "provider": "gemini"
        }

        Response:
        {
            "session_id": "uuid",
            "streaming_url": "/api/ai/stream?session_id=uuid",
            "expected_duration_ms": 5000
        }
    """
    try:
        session_id = str(uuid.uuid4())

        # Estimate duration based on prompt length (rough estimate)
        estimated_duration = max(1000, len(request.prompt) * 10)

        logger.info(f"Created streaming session: {session_id}")

        return StreamingSessionResponse(
            session_id=session_id,
            prompt=request.prompt,
            provider=request.provider,
            model=request.model or "default",
            streaming_url=f"/api/ai/stream?session_id={session_id}",
            expected_duration_ms=estimated_duration,
        )
    except Exception as e:
        logger.error(f"Error creating streaming session: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating streaming session"
        )


@router.get("/stream/health", response_model=Dict[str, Any])
@cache.cached(ttl=CacheTTL.MEDIUM)
async def streaming_health_check(
    streaming_service: StreamingService = Depends(get_streaming_service),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Check streaming service health and capabilities.

    Returns:
        Dict with streaming health status and information

    Example:
        GET /api/ai/stream/health

        Response:
        {
            "streaming_available": true,
            "supported_providers": ["gemini", "openai"],
            "max_concurrent_streams": 100,
            "active_streams": 5
        }
    """
    return {
        "streaming_available": True,
        "supported_providers": ["gemini", "openai"],
        "max_concurrent_streams": 100,
        "active_streams": 0,  # Would track in production
        "message": "Streaming service is operational",
    }


# ============================================================================
# ADDITIONAL PROVIDERS ENDPOINTS (FASE 5)
# ============================================================================


@router.post("/anthropic", response_model=ProviderResponse)
async def invoke_anthropic(
    request: AnthropicRequest,
    current_user: User = Depends(get_current_user),
) -> ProviderResponse:
    """
    Invoke Anthropic Claude.

    Args:
        request: AnthropicRequest with prompt and configuration
        current_user: Current authenticated user

    Returns:
        ProviderResponse with Claude's response

    Example:
        POST /api/ai/anthropic
        {
            "prompt": "Explain quantum computing",
            "model": "claude-3-5-sonnet-20241022"
        }
    """
    try:
        provider = AnthropicClaudeProvider()
        response = await provider.invoke(
            request.prompt,
            system_message=request.system_message,
            model=request.model,
            max_tokens=request.max_tokens,
            temperature=request.temperature,
        )

        cost = provider.get_cost(
            len(response) // 4,  # Rough token estimate
            model=request.model
        )

        logger.info(f"Anthropic response: {len(response)} chars")
        return ProviderResponse(
            status="success",
            provider="anthropic",
            model=request.model,
            response=response,
            tokens_used=len(response) // 4,
            estimated_cost=float(cost),
        )
    except Exception as e:
        logger.error(f"Error invoking Anthropic: {str(e)}")
        return ProviderResponse(
            status="error",
            provider="anthropic",
            model=request.model,
            error=str(e),
        )


@router.post("/cohere", response_model=ProviderResponse)
async def invoke_cohere(
    request: CohereRequest,
    current_user: User = Depends(get_current_user),
) -> ProviderResponse:
    """
    Invoke Cohere.

    Args:
        request: CohereRequest with prompt and configuration
        current_user: Current authenticated user

    Returns:
        ProviderResponse with Cohere's response

    Example:
        POST /api/ai/cohere
        {
            "prompt": "Generate a poem about coding",
            "model": "command"
        }
    """
    try:
        provider = CohereProvider()
        response = await provider.invoke(
            request.prompt,
            model=request.model,
            max_tokens=request.max_tokens,
            temperature=request.temperature,
        )

        cost = provider.get_cost(
            len(response) // 4,
            model=request.model
        )

        logger.info(f"Cohere response: {len(response)} chars")
        return ProviderResponse(
            status="success",
            provider="cohere",
            model=request.model,
            response=response,
            tokens_used=len(response) // 4,
            estimated_cost=float(cost),
        )
    except Exception as e:
        logger.error(f"Error invoking Cohere: {str(e)}")
        return ProviderResponse(
            status="error",
            provider="cohere",
            model=request.model,
            error=str(e),
        )


@router.post("/huggingface", response_model=ProviderResponse)
async def invoke_huggingface(
    request: HuggingFaceRequest,
    current_user: User = Depends(get_current_user),
) -> ProviderResponse:
    """
    Invoke Hugging Face model.

    Args:
        request: HuggingFaceRequest with prompt and configuration
        current_user: Current authenticated user

    Returns:
        ProviderResponse with model's response

    Example:
        POST /api/ai/huggingface
        {
            "prompt": "Translate to Spanish: Hello world",
            "model": "meta-llama/Llama-2-7b-chat-hf"
        }
    """
    try:
        provider = HuggingFaceProvider()
        response = await provider.invoke(
            request.prompt,
            model=request.model,
            max_tokens=request.max_tokens,
            temperature=request.temperature,
        )

        logger.info(f"Hugging Face response: {len(response)} chars")
        return ProviderResponse(
            status="success",
            provider="huggingface",
            model=request.model,
            response=response,
            tokens_used=len(response) // 4,
            estimated_cost=0.0,  # Free tier
        )
    except Exception as e:
        logger.error(f"Error invoking Hugging Face: {str(e)}")
        return ProviderResponse(
            status="error",
            provider="huggingface",
            model=request.model,
            error=str(e),
        )


@router.post("/ollama", response_model=ProviderResponse)
async def invoke_ollama(
    request: OllamaRequest,
    current_user: User = Depends(get_current_user),
) -> ProviderResponse:
    """
    Invoke local Ollama model.

    Args:
        request: OllamaRequest with prompt and configuration
        current_user: Current authenticated user

    Returns:
        ProviderResponse with model's response

    Example:
        POST /api/ai/ollama
        {
            "prompt": "What is machine learning?",
            "model": "llama2",
            "base_url": "http://localhost:11434"
        }
    """
    try:
        provider = OllamaLocalProvider(
            base_url=request.base_url,
            model=request.model
        )
        response = await provider.invoke(
            request.prompt,
            model=request.model,
            max_tokens=request.max_tokens,
            temperature=request.temperature,
        )

        logger.info(f"Ollama response: {len(response)} chars")
        return ProviderResponse(
            status="success",
            provider="ollama",
            model=request.model,
            response=response,
            tokens_used=len(response) // 4,
            estimated_cost=0.0,  # Local, no cost
        )
    except Exception as e:
        logger.error(f"Error invoking Ollama: {str(e)}")
        return ProviderResponse(
            status="error",
            provider="ollama",
            model=request.model,
            error=str(e),
        )


@router.post("/zhipu", response_model=ProviderResponse)
async def invoke_zhipu(
    request: ZhipuRequest,
    current_user: User = Depends(get_current_user),
) -> ProviderResponse:
    """
    Invoke Zhipu GLM model.

    Args:
        request: ZhipuRequest with prompt and configuration
        current_user: Current authenticated user

    Returns:
        ProviderResponse with GLM's response

    Example:
        POST /api/ai/zhipu
        {
            "prompt": "Explain quantum computing in simple terms",
            "model": "glm-4.6",
            "max_tokens": 2000
        }
    """
    try:
        provider = ZhipuGLMProvider()
        response = await provider.invoke(
            request.prompt,
            system_message=request.system_message,
            model=request.model,
            max_tokens=request.max_tokens,
            temperature=request.temperature,
        )

        cost = provider.get_cost(
            len(response) // 4,
            model=request.model
        )

        logger.info(f"Zhipu response: {len(response)} chars")
        return ProviderResponse(
            status="success",
            provider="zhipu",
            model=request.model,
            response=response,
            tokens_used=len(response) // 4,
            estimated_cost=float(cost),
        )
    except Exception as e:
        logger.error(f"Error invoking Zhipu: {str(e)}")
        return ProviderResponse(
            status="error",
            provider="zhipu",
            model=request.model,
            error=str(e),
        )


@router.get("/providers", response_model=ProviderListResponse)
@cache.cached(ttl=CacheTTL.MEDIUM)
async def list_providers(
    current_user: User = Depends(get_current_user),
) -> ProviderListResponse:
    """
    List available AI providers and their details.

    Returns:
        ProviderListResponse with all available providers

    Example:
        GET /api/ai/providers

        Response:
        {
            "available_providers": ["anthropic", "cohere", "huggingface", "ollama"],
            "provider_details": {
                "anthropic": {
                    "models": [...],
                    "default_model": "...",
                    "max_tokens": 4096
                },
                ...
            },
            "total_providers": 4
        }
    """
    try:
        available = ProviderFactory.get_available_providers()
        logger.info(f"Listing {len(available)} providers")

        return ProviderListResponse(
            available_providers=available,
            provider_details=PROVIDER_DEFAULTS,
            total_providers=len(available),
        )
    except Exception as e:
        logger.error(f"Error listing providers: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error listing providers"
        )


@router.get("/providers/health", response_model=Dict[str, Any])
@cache.cached(ttl=CacheTTL.MEDIUM)
async def check_providers_health(
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Check health status of all providers.

    Returns:
        Dict with health status for each provider

    Example:
        GET /api/ai/providers/health

        Response:
        {
            "anthropic": {
                "status": "healthy",
                "api_key_configured": true
            },
            "cohere": {
                "status": "unconfigured",
                "api_key_configured": false
            },
            ...
        }
    """
    health_status = {}

    providers = [
        ("anthropic", AnthropicClaudeProvider),
        ("cohere", CohereProvider),
        ("huggingface", HuggingFaceProvider),
    ]

    for provider_name, provider_class in providers:
        try:
            provider = provider_class()
            api_key = getattr(provider, 'api_key', None)
            status_val = "healthy" if api_key else "unconfigured"

            health_status[provider_name] = {
                "status": status_val,
                "api_key_configured": bool(api_key),
                "available_models": PROVIDER_DEFAULTS.get(provider_name, {}).get("models", []),
            }
        except Exception as e:
            health_status[provider_name] = {
                "status": "unhealthy",
                "error": str(e),
            }

    # Ollama is always local
    health_status["ollama"] = {
        "status": "healthy",
        "api_key_configured": False,
        "available_models": PROVIDER_DEFAULTS["ollama"]["models"],
    }

    logger.info("Checked health of all providers")
    return health_status


@router.post("/multi-provider", response_model=MultiProviderResponse)
async def invoke_multiple_providers(
    request: MultiProviderRequest,
    current_user: User = Depends(get_current_user),
) -> MultiProviderResponse:
    """
    Invoke multiple providers simultaneously and compare responses.

    Useful for comparing outputs from different AI providers.

    Args:
        request: MultiProviderRequest with prompt and providers
        current_user: Current authenticated user

    Returns:
        MultiProviderResponse with responses from all providers

    Example:
        POST /api/ai/multi-provider
        {
            "prompt": "What is AI?",
            "providers": ["anthropic", "cohere", "huggingface"]
        }
    """
    responses = {}
    success_count = 0
    error_count = 0
    total_cost = 0.0

    for provider_name in request.providers:
        try:
            model = (request.models or {}).get(provider_name)
            provider = ProviderFactory.create_provider(provider_name)

            response = await provider.invoke(
                request.prompt,
                model=model,
                max_tokens=request.max_tokens,
                temperature=request.temperature,
            )

            cost = provider.get_cost(len(response) // 4, model=model)
            total_cost += float(cost)

            responses[provider_name] = ProviderResponse(
                status="success",
                provider=provider_name,
                model=model or "default",
                response=response,
                tokens_used=len(response) // 4,
                estimated_cost=float(cost),
            )
            success_count += 1

        except Exception as e:
            logger.warning(f"Error with {provider_name}: {str(e)}")
            error_count += 1
            responses[provider_name] = ProviderResponse(
                status="error",
                provider=provider_name,
                model=request.models.get(provider_name) if request.models else "unknown",
                error=str(e),
            )

    logger.info(
        f"Multi-provider invocation: {success_count} success, "
        f"{error_count} failed, ${total_cost:.4f} cost"
    )

    return MultiProviderResponse(
        prompt=request.prompt,
        responses=responses,
        success_count=success_count,
        error_count=error_count,
        total_estimated_cost=total_cost,
    )


# ============================================================================
# ANALYTICS ENDPOINTS (FASE 6)
# ============================================================================


@router.get("/analytics/dashboard", response_model=Dict[str, Any])
@cache.cached(ttl=CacheTTL.MEDIUM)
async def get_analytics_dashboard(
    analytics: AnalyticsService = Depends(get_analytics_service),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Get comprehensive analytics dashboard.

    Returns all key metrics and analytics for monitoring AI usage, costs,
    and optimization impact.

    Args:
        analytics: Analytics service
        current_user: Current authenticated user

    Returns:
        Dict with complete dashboard data

    Example:
        GET /api/ai/analytics/dashboard

        Response:
        {
            "summary": {
                "total_api_calls": 1250,
                "total_tokens_used": 1562500,
                "total_cost_usd": 125.50,
                ...
            },
            "performance": {...},
            "provider_breakdown": {...},
            "cost_trends": {...},
            "optimization_impact": {...}
        }
    """
    try:
        dashboard = analytics.get_dashboard_summary()
        logger.info("Dashboard analytics retrieved")
        return dashboard
    except Exception as e:
        logger.error(f"Error retrieving dashboard: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving analytics dashboard"
        )


@router.get("/analytics/summary", response_model=AnalyticsSummaryResponse)
@cache.cached(ttl=CacheTTL.MEDIUM)
async def get_summary(
    analytics: AnalyticsService = Depends(get_analytics_service),
    current_user: User = Depends(get_current_user),
) -> AnalyticsSummaryResponse:
    """
    Get summary analytics.

    Args:
        analytics: Analytics service
        current_user: Current authenticated user

    Returns:
        AnalyticsSummaryResponse with key metrics

    Example:
        GET /api/ai/analytics/summary
    """
    try:
        metrics = analytics.get_overall_metrics()
        return AnalyticsSummaryResponse(
            total_api_calls=metrics.total_api_calls,
            total_tokens_used=metrics.total_tokens_used,
            total_cost_usd=float(metrics.total_cost),
            average_cost_per_call=float(metrics.average_cost_per_call),
        )
    except Exception as e:
        logger.error(f"Error retrieving summary: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving summary"
        )


@router.get("/analytics/providers", response_model=Dict[str, Any])
@cache.cached(ttl=CacheTTL.MEDIUM)
async def get_provider_analytics(
    analytics: AnalyticsService = Depends(get_analytics_service),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Get analytics broken down by provider.

    Args:
        analytics: Analytics service
        current_user: Current authenticated user

    Returns:
        Dict with metrics for each provider

    Example:
        GET /api/ai/analytics/providers

        Response:
        {
            "gemini": {
                "total_calls": 500,
                "total_tokens": 625000,
                "total_cost": 50.25,
                ...
            },
            "openai": {...}
        }
    """
    try:
        breakdown = analytics.get_provider_breakdown()
        logger.info("Provider analytics retrieved")
        return breakdown
    except Exception as e:
        logger.error(f"Error retrieving provider analytics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving provider analytics"
        )


@router.get("/analytics/trends", response_model=Dict[str, Any])
@cache.cached(ttl=CacheTTL.MEDIUM)
async def get_cost_trends(
    days: int = 7,
    analytics: AnalyticsService = Depends(get_analytics_service),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Get cost trends over time.

    Args:
        days: Number of days to analyze (default: 7)
        analytics: Analytics service
        current_user: Current authenticated user

    Returns:
        Dict with cost trend data

    Example:
        GET /api/ai/analytics/trends?days=30
    """
    try:
        trends = analytics.get_cost_trends(days=days)
        logger.info(f"Cost trends retrieved for {days} days")
        return trends
    except Exception as e:
        logger.error(f"Error retrieving trends: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving cost trends"
        )


@router.get("/analytics/optimization", response_model=OptimizationImpactResponse)
@cache.cached(ttl=CacheTTL.MEDIUM)
async def get_optimization_impact(
    analytics: AnalyticsService = Depends(get_analytics_service),
    current_user: User = Depends(get_current_user),
) -> OptimizationImpactResponse:
    """
    Get impact of optimization features (caching, prompt optimization, batching).

    Args:
        analytics: Analytics service
        current_user: Current authenticated user

    Returns:
        OptimizationImpactResponse with savings and impact metrics

    Example:
        GET /api/ai/analytics/optimization

        Response:
        {
            "total_requests": 1000,
            "optimized_requests": 450,
            "optimization_rate_percent": 45.0,
            "cached_requests": 300,
            "cache_hit_rate_percent": 30.0,
            "estimated_savings": 87.50,
            "combined_impact": 75.0
        }
    """
    try:
        impact = analytics.get_optimization_impact()
        logger.info("Optimization impact retrieved")
        return OptimizationImpactResponse(**impact)
    except Exception as e:
        logger.error(f"Error retrieving optimization impact: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving optimization impact"
        )


@router.get("/analytics/performance", response_model=Dict[str, Any])
@cache.cached(ttl=CacheTTL.MEDIUM)
async def get_performance_report(
    analytics: AnalyticsService = Depends(get_analytics_service),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Get comprehensive performance report.

    Args:
        analytics: Analytics service
        current_user: Current authenticated user

    Returns:
        Dict with performance metrics

    Example:
        GET /api/ai/analytics/performance
    """
    try:
        report = analytics.get_performance_report()
        logger.info("Performance report retrieved")
        return report
    except Exception as e:
        logger.error(f"Error retrieving performance report: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving performance report"
        )


@router.post("/analytics/export", response_model=Dict[str, Any])
async def export_analytics(
    request: AnalyticsFilterRequest,
    analytics: AnalyticsService = Depends(get_analytics_service),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Export analytics data.

    Args:
        request: Export configuration
        analytics: Analytics service
        current_user: Current authenticated user

    Returns:
        Dict with exported analytics data

    Example:
        POST /api/ai/analytics/export
        {
            "provider": "gemini",
            "days": 30,
            "include_costs": true
        }
    """
    try:
        dashboard = analytics.get_dashboard_summary()

        # Filter by provider if specified
        if request.provider:
            provider_metrics = analytics.get_provider_metrics(request.provider)
            dashboard = {
                "provider": request.provider,
                "metrics": {
                    "total_calls": provider_metrics.total_calls,
                    "total_tokens": provider_metrics.total_tokens,
                    "total_cost": float(provider_metrics.total_cost),
                }
            }

        logger.info(f"Analytics exported for {request.provider or 'all providers'}")
        return {
            "status": "success",
            "data": dashboard,
            "export_time": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        logger.error(f"Error exporting analytics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error exporting analytics"
        )


@router.delete("/analytics/reset")
async def reset_analytics(
    analytics: AnalyticsService = Depends(get_analytics_service),
    current_user: User = Depends(get_current_user),
) -> Dict[str, str]:
    """
    Reset all analytics data (admin only).

    Args:
        analytics: Analytics service
        current_user: Current authenticated user

    Returns:
        Confirmation message

    Example:
        DELETE /api/ai/analytics/reset
    """
    # In production, should check for admin privileges
    try:
        analytics.clear_metrics()
        logger.warning(f"Analytics reset by {current_user.username if current_user else 'unknown'}")
        return {"status": "success", "message": "All analytics data reset"}
    except Exception as e:
        logger.error(f"Error resetting analytics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error resetting analytics"
        )
