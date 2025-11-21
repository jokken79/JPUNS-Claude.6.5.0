"""
Pydantic schemas for additional AI providers
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class AnthropicRequest(BaseModel):
    """Request schema for Anthropic Claude"""

    prompt: str = Field(..., description="User prompt")
    model: str = Field(
        default="claude-3-5-sonnet-20241022",
        description="Claude model to use"
    )
    system_message: Optional[str] = Field(None, description="System message")
    max_tokens: int = Field(default=4096, description="Maximum tokens in response")
    temperature: float = Field(
        default=0.7, ge=0.0, le=1.0, description="Model temperature"
    )


class CohereRequest(BaseModel):
    """Request schema for Cohere"""

    prompt: str = Field(..., description="User prompt")
    model: str = Field(default="command", description="Cohere model to use")
    max_tokens: int = Field(default=4096, description="Maximum tokens in response")
    temperature: float = Field(
        default=0.7, ge=0.0, le=1.0, description="Model temperature"
    )


class HuggingFaceRequest(BaseModel):
    """Request schema for Hugging Face"""

    prompt: str = Field(..., description="User prompt")
    model: str = Field(
        default="meta-llama/Llama-2-7b-chat-hf",
        description="Hugging Face model to use"
    )
    max_tokens: int = Field(default=1024, description="Maximum tokens in response")
    temperature: float = Field(
        default=0.7, ge=0.0, le=1.0, description="Model temperature"
    )


class OllamaRequest(BaseModel):
    """Request schema for Ollama local models"""

    prompt: str = Field(..., description="User prompt")
    model: str = Field(default="llama2", description="Local model to use")
    max_tokens: int = Field(default=2048, description="Maximum tokens in response")
    temperature: float = Field(
        default=0.7, ge=0.0, le=1.0, description="Model temperature"
    )
    base_url: str = Field(
        default="http://localhost:11434",
        description="Ollama server URL"
    )


class ZhipuRequest(BaseModel):
    """Request schema for Zhipu GLM"""

    prompt: str = Field(..., description="User prompt")
    model: str = Field(default="glm-4.6", description="Zhipu model to use")
    system_message: Optional[str] = Field(None, description="System message")
    max_tokens: int = Field(default=4096, description="Maximum tokens in response")
    temperature: float = Field(
        default=0.7, ge=0.0, le=1.0, description="Model temperature"
    )


class ProviderResponse(BaseModel):
    """Response from any provider"""

    status: str = Field(..., description="Response status: success|error")
    provider: str = Field(..., description="Provider used")
    model: str = Field(..., description="Model used")
    response: Optional[str] = Field(None, description="Generated response")
    error: Optional[str] = Field(None, description="Error message if failed")
    tokens_used: Optional[int] = Field(None, description="Tokens used")
    estimated_cost: Optional[float] = Field(None, description="Estimated cost in USD")


class ProviderListResponse(BaseModel):
    """Response with available providers"""

    available_providers: List[str] = Field(
        ..., description="List of available providers"
    )
    provider_details: Dict[str, Dict[str, Any]] = Field(
        ..., description="Details about each provider"
    )
    total_providers: int = Field(..., description="Total number of providers")


class ProviderHealthCheck(BaseModel):
    """Health check response for a provider"""

    provider: str = Field(..., description="Provider name")
    status: str = Field(
        ..., description="Status: healthy|unhealthy|unconfigured"
    )
    api_key_configured: bool = Field(
        ..., description="Whether API key is configured"
    )
    available_models: List[str] = Field(
        ..., description="Available models for this provider"
    )
    message: str = Field(..., description="Status message")


class MultiProviderRequest(BaseModel):
    """Request to invoke multiple providers simultaneously"""

    prompt: str = Field(..., description="Prompt to send to all providers")
    providers: List[str] = Field(
        ..., description="List of providers to invoke"
    )
    models: Optional[Dict[str, str]] = Field(
        None, description="Specific model per provider"
    )
    max_tokens: int = Field(default=1024, description="Max tokens per response")
    temperature: float = Field(
        default=0.7, ge=0.0, le=1.0, description="Temperature for all"
    )


class MultiProviderResponse(BaseModel):
    """Response from multiple providers"""

    prompt: str = Field(..., description="Original prompt")
    responses: Dict[str, ProviderResponse] = Field(
        ..., description="Response per provider"
    )
    success_count: int = Field(..., description="Number of successful responses")
    error_count: int = Field(..., description="Number of failed responses")
    total_estimated_cost: float = Field(
        ..., description="Total cost for all providers"
    )
