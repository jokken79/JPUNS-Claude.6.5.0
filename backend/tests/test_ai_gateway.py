"""
Tests for AI Gateway Service

Tests the multi-AI integration service with mocked API responses.
"""

import pytest
import json
from unittest.mock import AsyncMock, MagicMock, patch, mock_open
from datetime import datetime

from app.services.ai_gateway import (
    AIGateway,
    AIGatewayError,
    GeminiError,
    OpenAIError,
    ClaudeAPIError,
    LocalCLIError,
)


@pytest.fixture
def ai_gateway():
    """Create AI Gateway instance with test configuration"""
    with patch.dict("os.environ", {
        "GOOGLE_API_KEY": "test-gemini-key",
        "OPENAI_API_KEY": "test-openai-key",
        "ANTHROPIC_API_KEY": "test-claude-key",
    }):
        gateway = AIGateway(timeout=10)
        yield gateway


@pytest.mark.asyncio
async def test_gemini_success(ai_gateway):
    """Test successful Gemini invocation"""
    mock_response = {
        "candidates": [
            {
                "content": {
                    "parts": [{"text": "Generated code here"}]
                }
            }
        ]
    }

    with patch.object(ai_gateway.client, "post", new_callable=AsyncMock) as mock_post:
        # Mock successful response
        mock_post.return_value = MagicMock(
            json=lambda: mock_response,
            raise_for_status=lambda: None,
        )

        result = await ai_gateway.invoke_gemini("Generate FastAPI endpoint")

        assert result == "Generated code here"
        assert mock_post.called


@pytest.mark.asyncio
async def test_gemini_missing_api_key():
    """Test Gemini error when API key not configured"""
    with patch.dict("os.environ", {"GOOGLE_API_KEY": ""}):
        gateway = AIGateway()

        with pytest.raises(GeminiError, match="GOOGLE_API_KEY not configured"):
            await gateway.invoke_gemini("Generate code")


@pytest.mark.asyncio
async def test_gemini_api_error(ai_gateway):
    """Test Gemini error handling"""
    with patch.object(ai_gateway.client, "post", new_callable=AsyncMock) as mock_post:
        # Mock API error
        mock_post.side_effect = Exception("API Error")

        with pytest.raises(GeminiError):
            await ai_gateway.invoke_gemini("Generate code")


@pytest.mark.asyncio
async def test_gemini_empty_response(ai_gateway):
    """Test Gemini error when no response returned"""
    mock_response = {"candidates": []}

    with patch.object(ai_gateway.client, "post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = MagicMock(
            json=lambda: mock_response,
            raise_for_status=lambda: None,
        )

        with pytest.raises(GeminiError, match="No response from Gemini"):
            await ai_gateway.invoke_gemini("Generate code")


@pytest.mark.asyncio
async def test_openai_success(ai_gateway):
    """Test successful OpenAI invocation"""
    mock_response = {
        "choices": [
            {
                "message": {"content": "Code review complete"}
            }
        ]
    }

    with patch.object(ai_gateway.client, "post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = MagicMock(
            json=lambda: mock_response,
            raise_for_status=lambda: None,
        )

        result = await ai_gateway.invoke_openai("Review this code")

        assert result == "Code review complete"
        assert mock_post.called


@pytest.mark.asyncio
async def test_openai_missing_api_key():
    """Test OpenAI error when API key not configured"""
    with patch.dict("os.environ", {"OPENAI_API_KEY": ""}):
        gateway = AIGateway()

        with pytest.raises(OpenAIError, match="OPENAI_API_KEY not configured"):
            await gateway.invoke_openai("Review code")


@pytest.mark.asyncio
async def test_openai_custom_model(ai_gateway):
    """Test OpenAI with custom model parameter"""
    mock_response = {
        "choices": [
            {"message": {"content": "Response from GPT-4"}}
        ]
    }

    with patch.object(ai_gateway.client, "post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = MagicMock(
            json=lambda: mock_response,
            raise_for_status=lambda: None,
        )

        result = await ai_gateway.invoke_openai(
            "Review code",
            model="gpt-4",
            temperature=0.5,
        )

        assert result == "Response from GPT-4"
        # Verify correct model was used in request
        call_args = mock_post.call_args
        assert call_args[1]["json"]["model"] == "gpt-4"
        assert call_args[1]["json"]["temperature"] == 0.5


@pytest.mark.asyncio
async def test_claude_api_success(ai_gateway):
    """Test successful Claude API invocation"""
    mock_response = {
        "content": [
            {"text": "Claude's response"}
        ]
    }

    with patch.object(ai_gateway.client, "post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = MagicMock(
            json=lambda: mock_response,
            raise_for_status=lambda: None,
        )

        result = await ai_gateway.invoke_claude_api("Explain this pattern")

        assert result == "Claude's response"
        assert mock_post.called


@pytest.mark.asyncio
async def test_claude_api_missing_key():
    """Test Claude API error when API key not configured"""
    with patch.dict("os.environ", {"ANTHROPIC_API_KEY": ""}):
        gateway = AIGateway()

        with pytest.raises(ClaudeAPIError, match="ANTHROPIC_API_KEY not configured"):
            await gateway.invoke_claude_api("Explain pattern")


@pytest.mark.asyncio
async def test_local_cli_success(ai_gateway):
    """Test successful local CLI invocation"""
    with patch("subprocess.run") as mock_run:
        mock_run.return_value = MagicMock(
            returncode=0,
            stdout="CLI output here",
            stderr="",
        )

        result = await ai_gateway.invoke_local_cli(
            "gemini-cli",
            {"action": "generate", "prompt": "Generate code"}
        )

        assert result == "CLI output here"
        assert mock_run.called


@pytest.mark.asyncio
async def test_local_cli_not_found(ai_gateway):
    """Test local CLI error when tool not found"""
    with patch("subprocess.run") as mock_run:
        mock_run.side_effect = FileNotFoundError("Tool not found")

        with pytest.raises(LocalCLIError, match="not found"):
            await ai_gateway.invoke_local_cli("missing-tool", {})


@pytest.mark.asyncio
async def test_local_cli_timeout(ai_gateway):
    """Test local CLI timeout handling"""
    import subprocess

    with patch("subprocess.run") as mock_run:
        mock_run.side_effect = subprocess.TimeoutExpired(
            "gemini-cli",
            timeout=5
        )

        with pytest.raises(LocalCLIError, match="timed out"):
            await ai_gateway.invoke_local_cli("gemini-cli", {}, timeout=5)


@pytest.mark.asyncio
async def test_local_cli_error(ai_gateway):
    """Test local CLI error handling"""
    with patch("subprocess.run") as mock_run:
        mock_run.return_value = MagicMock(
            returncode=1,
            stdout="",
            stderr="Command failed",
        )

        with pytest.raises(LocalCLIError, match="failed"):
            await ai_gateway.invoke_local_cli("bad-tool", {})


@pytest.mark.asyncio
async def test_batch_invoke_all_success(ai_gateway):
    """Test batch invocation with all successful tasks"""
    with patch.object(ai_gateway.client, "post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = MagicMock(
            json=lambda: {
                "candidates": [{"content": {"parts": [{"text": "OK"}]}}]
            },
            raise_for_status=lambda: None,
        )

        tasks = [
            {
                "provider": "gemini",
                "prompt": "Generate code"
            },
            {
                "provider": "openai",
                "prompt": "Review code"
            }
        ]

        results = await ai_gateway.batch_invoke(tasks)

        assert len(results) == 2
        assert all(r["status"] == "success" for r in results)
        assert results[0]["provider"] == "gemini"
        assert results[1]["provider"] == "openai"


@pytest.mark.asyncio
async def test_batch_invoke_mixed_results(ai_gateway):
    """Test batch invocation with mixed success/failure"""
    with patch.object(ai_gateway.client, "post", new_callable=AsyncMock) as mock_post:
        # First call succeeds, second fails
        mock_post.side_effect = [
            MagicMock(
                json=lambda: {
                    "candidates": [{"content": {"parts": [{"text": "Success"}]}}]
                },
                raise_for_status=lambda: None,
            ),
            Exception("API Error")
        ]

        tasks = [
            {"provider": "gemini", "prompt": "OK"},
            {"provider": "openai", "prompt": "FAIL"}
        ]

        results = await ai_gateway.batch_invoke(tasks)

        assert len(results) == 2
        assert results[0]["status"] == "success"
        assert results[1]["status"] == "error"


@pytest.mark.asyncio
async def test_batch_invoke_unknown_provider(ai_gateway):
    """Test batch invocation with unknown provider"""
    tasks = [
        {"provider": "unknown_ai", "prompt": "test"}
    ]

    results = await ai_gateway.batch_invoke(tasks)

    assert len(results) == 1
    assert "Unknown provider" in results[0]["response"]


@pytest.mark.asyncio
async def test_health_check_all_healthy(ai_gateway):
    """Test health check when all providers are healthy"""
    with patch.object(ai_gateway.client, "post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = MagicMock(
            json=lambda: {
                "candidates": [{"content": {"parts": [{"text": "OK"}]}}]
            },
            raise_for_status=lambda: None,
        )

        with patch("subprocess.run") as mock_run:
            mock_run.return_value = MagicMock(returncode=0)

            health = await ai_gateway.health_check()

            assert "providers" in health
            assert health["providers"]["gemini"] == "healthy"
            assert health["providers"]["openai"] == "healthy"
            assert health["providers"]["claude_api"] == "healthy"


@pytest.mark.asyncio
async def test_health_check_with_errors(ai_gateway):
    """Test health check with some providers failing"""
    with patch.object(ai_gateway.client, "post", new_callable=AsyncMock) as mock_post:
        mock_post.side_effect = Exception("API Error")

        health = await ai_gateway.health_check()

        assert "providers" in health
        assert "unhealthy" in health["providers"]["gemini"]


@pytest.mark.asyncio
async def test_gemini_with_system_instruction(ai_gateway):
    """Test Gemini with system instruction"""
    mock_response = {
        "candidates": [
            {
                "content": {
                    "parts": [{"text": "Code with system instruction"}]
                }
            }
        ]
    }

    with patch.object(ai_gateway.client, "post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = MagicMock(
            json=lambda: mock_response,
            raise_for_status=lambda: None,
        )

        result = await ai_gateway.invoke_gemini(
            prompt="Generate code",
            system_instruction="You are a Python expert"
        )

        assert result == "Code with system instruction"
        # Verify system instruction was in request
        call_args = mock_post.call_args
        payload = call_args[1]["json"]
        assert len(payload["contents"]) == 2


@pytest.mark.asyncio
async def test_openai_with_system_message(ai_gateway):
    """Test OpenAI with system message"""
    mock_response = {
        "choices": [
            {"message": {"content": "Code review"}}
        ]
    }

    with patch.object(ai_gateway.client, "post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = MagicMock(
            json=lambda: mock_response,
            raise_for_status=lambda: None,
        )

        result = await ai_gateway.invoke_openai(
            prompt="Review code",
            system_message="You are a code reviewer"
        )

        assert result == "Code review"
        # Verify system message was in request
        call_args = mock_post.call_args
        messages = call_args[1]["json"]["messages"]
        assert messages[0]["role"] == "system"


@pytest.mark.asyncio
async def test_local_cli_with_args(ai_gateway):
    """Test local CLI with various argument types"""
    with patch("subprocess.run") as mock_run:
        mock_run.return_value = MagicMock(
            returncode=0,
            stdout="Output",
            stderr="",
        )

        await ai_gateway.invoke_local_cli(
            "test-tool",
            {
                "string_arg": "value",
                "int_arg": 42,
                "bool_arg": True,
                "float_arg": 3.14,
            }
        )

        # Verify all arguments were converted properly
        call_args = mock_run.call_args
        cmd = call_args[0][0]
        assert "test-tool" in cmd
        assert "--string_arg" in cmd
        assert "value" in cmd
        assert "--bool_arg" in cmd


@pytest.mark.asyncio
async def test_rate_limiting_placeholder(ai_gateway):
    """Placeholder for rate limiting tests (to be implemented)"""
    # TODO: Implement rate limiting tests when implemented in service
    pass


@pytest.mark.asyncio
async def test_close_gateway(ai_gateway):
    """Test closing gateway connection"""
    with patch.object(ai_gateway.client, "aclose", new_callable=AsyncMock) as mock_close:
        await ai_gateway.close()
        assert mock_close.called
