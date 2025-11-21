"""
Pydantic schemas for prompt optimization operations
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class OptimizationRequest(BaseModel):
    """Request to optimize a prompt"""

    prompt: str = Field(..., description="Prompt to optimize")
    system_message: Optional[str] = Field(None, description="Optional system message to optimize")
    aggressive: bool = Field(default=False, description="Use aggressive optimization (more reduction, slight quality trade-off)")


class OptimizationStatsResponse(BaseModel):
    """Response with optimization statistics"""

    original_length: int = Field(..., description="Original character count")
    optimized_length: int = Field(..., description="Optimized character count")
    tokens_saved: int = Field(..., description="Estimated tokens saved")
    reduction_percentage: float = Field(..., description="Percentage reduction")
    strategies_applied: List[str] = Field(..., description="Optimization strategies used")


class OptimizedPromptResponse(BaseModel):
    """Response with optimized prompt"""

    optimized_prompt: str = Field(..., description="Optimized user prompt")
    optimized_system_message: str = Field(..., description="Optimized system message")
    stats: OptimizationStatsResponse = Field(..., description="Optimization statistics")


class TokenSavingsResponse(BaseModel):
    """Response with token savings information"""

    original_chars: int = Field(..., description="Original character count")
    optimized_chars: int = Field(..., description="Optimized character count")
    chars_saved: int = Field(..., description="Characters saved")
    tokens_saved: int = Field(..., description="Tokens saved (estimated)")
    reduction_percentage: float = Field(..., description="Percentage reduction")


class OptimizationRecommendationsResponse(BaseModel):
    """Response with optimization recommendations"""

    prompt: str = Field(..., description="The analyzed prompt")
    recommendations: List[str] = Field(..., description="Specific optimization recommendations")
    has_optimization_opportunities: bool = Field(..., description="Whether optimization would help")


class OptimizationEstimateResponse(BaseModel):
    """Response with estimated savings (without actual optimization)"""

    original_chars: int = Field(..., description="Original character count")
    estimated_reduction_chars: int = Field(..., description="Estimated characters that would be removed")
    estimated_tokens_saved: int = Field(..., description="Estimated tokens saved")
    estimated_reduction_percentage: float = Field(..., description="Estimated percentage reduction")
    mode: str = Field(..., description="Optimization mode (normal or aggressive)")


class OptimizationStatsSnapshot(BaseModel):
    """Snapshot of optimization statistics over time"""

    timestamp: str = Field(..., description="When this snapshot was taken")
    total_prompts_optimized: int = Field(..., description="Total prompts optimized")
    total_tokens_saved: int = Field(..., description="Cumulative tokens saved")
    avg_tokens_saved_per_prompt: float = Field(..., description="Average tokens saved per prompt")
    avg_reduction_percentage: float = Field(..., description="Average reduction percentage")
    most_common_strategy: str = Field(..., description="Most frequently applied strategy")
