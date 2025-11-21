"""
Pydantic schemas for streaming operations
"""

from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class StreamingRequest(BaseModel):
    """Request to stream an AI response"""

    prompt: str = Field(..., description="User prompt")
    system_message: Optional[str] = Field(None, description="System message")
    provider: str = Field(default="gemini", description="AI provider to use")
    model: Optional[str] = Field(None, description="Specific model to use")
    chunk_size: int = Field(default=50, description="Size of each chunk in characters")
    max_tokens: int = Field(default=4096, description="Maximum tokens in response")
    temperature: float = Field(
        default=0.7, ge=0.0, le=2.0, description="Model temperature"
    )


class StreamChunkResponse(BaseModel):
    """Individual stream chunk"""

    chunk_id: int = Field(..., description="Unique chunk identifier")
    content: str = Field(..., description="Chunk content")
    timestamp: float = Field(..., description="Timestamp when chunk was sent")
    tokens_estimated: int = Field(..., description="Estimated tokens in this chunk")
    is_complete: bool = Field(
        ..., description="Whether this is the final chunk"
    )


class StreamingStatisticsResponse(BaseModel):
    """Statistics about a streaming session"""

    total_chunks: int = Field(..., description="Total chunks sent")
    total_content_length: int = Field(..., description="Total characters streamed")
    total_tokens_estimated: int = Field(..., description="Total tokens estimated")
    streaming_duration_ms: float = Field(..., description="Streaming duration in ms")
    chunks_per_second: float = Field(
        ..., description="Average chunks per second"
    )
    average_chunk_size: float = Field(
        ..., description="Average characters per chunk"
    )
    provider: str = Field(..., description="AI provider used")
    model: str = Field(..., description="Model used")


class StreamingSessionResponse(BaseModel):
    """Response for a streaming session"""

    session_id: str = Field(..., description="Unique session identifier")
    prompt: str = Field(..., description="Original prompt")
    provider: str = Field(..., description="AI provider used")
    model: str = Field(..., description="Model used")
    streaming_url: str = Field(..., description="URL to stream from")
    expected_duration_ms: Optional[int] = Field(
        None, description="Estimated streaming duration"
    )
    instructions: str = Field(
        default="Connect to streaming_url to receive SSE events",
        description="Instructions for consuming stream"
    )


class StreamCostEstimate(BaseModel):
    """Cost estimate for streaming response"""

    tokens_used: int = Field(..., description="Output tokens used")
    input_tokens: int = Field(default=0, description="Input tokens used")
    total_tokens: int = Field(..., description="Total tokens (input + output)")
    estimated_cost: float = Field(..., description="Estimated cost in USD")
    provider: str = Field(..., description="AI provider")
    model: str = Field(..., description="Model name")


class MergedStreamResponse(BaseModel):
    """Merged complete stream response"""

    complete_response: str = Field(..., description="Complete merged response")
    total_chunks: int = Field(..., description="Number of chunks received")
    total_tokens: int = Field(..., description="Total tokens in response")
    streaming_duration_ms: float = Field(
        ..., description="Time taken to stream response"
    )
    cost_estimate: float = Field(..., description="Estimated cost")
    provider: str = Field(..., description="Provider used")
    model: str = Field(..., description="Model used")


class StreamingHealthCheck(BaseModel):
    """Health check for streaming capability"""

    streaming_available: bool = Field(
        ..., description="Whether streaming is available"
    )
    supported_providers: list[str] = Field(
        ..., description="List of providers supporting streaming"
    )
    max_concurrent_streams: int = Field(
        ..., description="Maximum concurrent streaming sessions"
    )
    active_streams: int = Field(..., description="Currently active streams")
    message: str = Field(..., description="Status message")
