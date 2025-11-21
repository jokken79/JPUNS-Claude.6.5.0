"""
Pydantic schemas for batch optimization operations
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class BatchOptimizationRequest(BaseModel):
    """Request to optimize a batch of prompts"""

    prompts: List[str] = Field(
        ..., description="List of prompts to optimize", min_items=1, max_items=1000
    )
    system_message: Optional[str] = Field(
        None, description="Optional system message (same for all prompts)"
    )
    detect_similar: bool = Field(
        default=True, description="Detect similar prompts in addition to duplicates"
    )


class BatchGroupInfo(BaseModel):
    """Information about a prompt group"""

    prompt_hash: str = Field(..., description="Unique hash of group representative prompt")
    representative_prompt: str = Field(
        ..., description="Representative prompt for this group"
    )
    count: int = Field(..., description="Number of prompts in this group")
    indices: List[int] = Field(..., description="Original indices of prompts in this group")
    is_duplicate: bool = Field(
        ..., description="Whether this is a duplicate group (count > 1)"
    )


class BatchOptimizationStatsResponse(BaseModel):
    """Statistics about batch optimization results"""

    original_prompts: int = Field(..., description="Total number of original prompts")
    grouped_prompts: int = Field(..., description="Number of unique groups after optimization")
    duplicates_detected: int = Field(
        ..., description="Number of duplicate prompts found"
    )
    api_calls_saved: int = Field(
        ..., description="Estimated number of API calls that can be saved"
    )
    cost_savings_percentage: float = Field(
        ..., description="Estimated cost savings percentage"
    )
    processing_time_ms: float = Field(
        ..., description="Time taken to process batch in milliseconds"
    )
    groups_count: int = Field(..., description="Total number of groups created")
    group_details: List[BatchGroupInfo] = Field(
        ..., description="Detailed information about each group"
    )


class BatchOptimizedResponse(BaseModel):
    """Response with optimized batch"""

    optimization_map: Dict[int, str] = Field(
        ..., description="Mapping from original index to group hash"
    )
    grouped_prompts: Dict[str, List[int]] = Field(
        ..., description="Group hash to list of original indices"
    )
    representative_prompts: Dict[str, str] = Field(
        ..., description="Group hash to representative prompt text"
    )
    stats: BatchOptimizationStatsResponse = Field(
        ..., description="Optimization statistics"
    )


class BatchSavingsEstimate(BaseModel):
    """Estimate of batch optimization savings"""

    original_count: int = Field(..., description="Original number of prompts")
    estimated_optimized_count: int = Field(
        ..., description="Estimated number after optimization"
    )
    api_calls_saved: int = Field(..., description="Estimated API calls that can be saved")
    cost_savings_percentage: float = Field(
        ..., description="Estimated cost savings percentage"
    )
    duplicate_groups: int = Field(
        ..., description="Number of duplicate groups detected"
    )


class PromptSimilarityRequest(BaseModel):
    """Request to analyze prompt similarity"""

    prompts: List[str] = Field(
        ..., description="List of prompts to analyze", min_items=2, max_items=100
    )
    similarity_threshold: float = Field(
        default=0.85, description="Similarity threshold (0.0-1.0)", ge=0.0, le=1.0
    )


class PromptSimilarityResult(BaseModel):
    """Result of prompt similarity analysis"""

    prompt1_index: int = Field(..., description="Index of first prompt")
    prompt2_index: int = Field(..., description="Index of second prompt")
    similarity_score: float = Field(..., description="Similarity score (0.0-1.0)")
    is_match: bool = Field(
        ..., description="Whether similarity exceeds threshold"
    )


class PromptSimilarityResponse(BaseModel):
    """Response with similarity analysis results"""

    similarity_threshold: float = Field(..., description="Threshold used for analysis")
    prompt_count: int = Field(..., description="Total prompts analyzed")
    matches: List[PromptSimilarityResult] = Field(
        ..., description="List of similar prompt pairs"
    )
    total_matches: int = Field(
        ..., description="Total number of similar pairs found"
    )
