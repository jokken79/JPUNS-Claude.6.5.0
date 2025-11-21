"""
AI Gateway Service - Multi-AI Integration

This service provides a unified interface to invoke multiple AI systems:
- Google Gemini (Code generation, analysis)
- OpenAI (ChatGPT, code review, architecture)
- Anthropic Claude API (External Claude access)
- Local CLI tools (gemini-cli, custom tools)

Usage:
    gateway = AIGateway()

    # Invoke Gemini
    code = await gateway.invoke_gemini("Generate FastAPI endpoint...")

    # Invoke OpenAI
    review = await gateway.invoke_openai("Review this code...")

    # Invoke Claude API
    explanation = await gateway.invoke_claude_api("Explain this pattern...")

    # Invoke local CLI
    result = await gateway.invoke_local_cli("gemini-cli", {"action": "generate"})
"""

import logging
import os
import subprocess
import json
from typing import Optional, Dict, Any, List
from datetime import datetime

import httpx
from fastapi import HTTPException, status

from app.core.config import settings
from app.services.cache_service import CacheService
from app.services.prompt_optimizer import PromptOptimizer

logger = logging.getLogger(__name__)


class AIGatewayError(Exception):
    """Base exception for AI Gateway errors"""
    pass


class GeminiError(AIGatewayError):
    """Gemini API error"""
    pass


class OpenAIError(AIGatewayError):
    """OpenAI API error"""
    pass


class ClaudeAPIError(AIGatewayError):
    """Claude API error"""
    pass


class LocalCLIError(AIGatewayError):
    """Local CLI tool error"""
    pass


class AIGateway:
    """
    Unified gateway for invoking multiple AI systems.

    Supports:
    - Google Gemini (generativelanguage.googleapis.com)
    - OpenAI (api.openai.com)
    - Anthropic Claude API (api.anthropic.com)
    - Local CLI tools (subprocess)
    """

    # API endpoints
    GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
    OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions"
    CLAUDE_API_ENDPOINT = "https://api.anthropic.com/v1/messages"

    # API versions
    GEMINI_API_VERSION = "v1"
    ANTHROPIC_API_VERSION = "2023-06-01"
    OPENAI_API_VERSION = "2024-01-01"

    # Rate limiting
    MAX_RETRIES = 3
    RETRY_DELAY = 1  # seconds

    def __init__(self, timeout: int = 60, enable_cache: bool = True, cache_ttl: int = 86400, enable_optimization: bool = True, aggressive_optimization: bool = False):
        """
        Initialize AI Gateway.

        Args:
            timeout: HTTP request timeout in seconds (default: 60)
            enable_cache: Enable response caching (default: True)
            cache_ttl: Cache time-to-live in seconds (default: 86400 = 24 hours)
            enable_optimization: Enable prompt optimization (default: True)
            aggressive_optimization: Use aggressive optimization (default: False)
        """
        self.timeout = timeout
        self.enable_cache = enable_cache
        self.cache_ttl = cache_ttl
        self.enable_optimization = enable_optimization
        self.gemini_api_key = os.getenv("GOOGLE_API_KEY", "")
        self.openai_api_key = os.getenv("OPENAI_API_KEY", "")
        self.claude_api_key = os.getenv("ANTHROPIC_API_KEY", "")
        self.client = httpx.AsyncClient(timeout=timeout)

        # Initialize cache service
        self.cache = CacheService() if enable_cache else None

        # Initialize prompt optimizer
        self.optimizer = PromptOptimizer(aggressive=aggressive_optimization) if enable_optimization else None

        logger.info(
            f"AI Gateway initialized (cache: {'enabled' if enable_cache else 'disabled'}, "
            f"optimization: {'enabled' if enable_optimization else 'disabled'})"
        )

    async def invoke_gemini(
        self,
        prompt: str,
        max_tokens: int = 4096,
        temperature: float = 0.7,
        system_instruction: Optional[str] = None,
    ) -> str:
        """
        Invoke Google Gemini for code generation or analysis.

        Args:
            prompt: User prompt/instruction
            max_tokens: Maximum tokens in response (default: 4096)
            temperature: Model temperature (0.0-2.0, default: 0.7)
            system_instruction: System instruction for model behavior

        Returns:
            Generated text from Gemini

        Raises:
            GeminiError: If API call fails
        """
        if not self.gemini_api_key:
            raise GeminiError("GOOGLE_API_KEY not configured")

        # Optimize prompt if enabled
        optimized_prompt = prompt
        optimized_system_instruction = system_instruction
        if self.optimizer:
            optimized_prompt, optimized_system_instruction, stats = self.optimizer.optimize(
                prompt, system_instruction
            )
            logger.info(f"Prompt optimized: saved {stats.tokens_saved} tokens ({stats.reduction_percentage}%)")

        # Check cache first (using optimized prompt)
        if self.cache:
            cached = self.cache.get("gemini", "gemini-2.0-flash", optimized_prompt, optimized_system_instruction)
            if cached:
                logger.info("Cache hit for Gemini request")
                return cached["response"]

        try:
            # Build request payload
            contents = []

            if optimized_system_instruction:
                contents.append({
                    "role": "user",
                    "parts": [{"text": optimized_system_instruction}]
                })

            contents.append({
                "role": "user",
                "parts": [{"text": optimized_prompt}]
            })

            payload = {
                "contents": contents,
                "generationConfig": {
                    "maxOutputTokens": max_tokens,
                    "temperature": temperature,
                    "topK": 40,
                    "topP": 0.95,
                }
            }

            # Make request
            response = await self.client.post(
                f"{self.GEMINI_ENDPOINT}?key={self.gemini_api_key}",
                json=payload,
            )

            response.raise_for_status()
            data = response.json()

            # Extract response
            if "candidates" not in data or not data["candidates"]:
                raise GeminiError("No response from Gemini")

            candidate = data["candidates"][0]
            if "content" not in candidate or not candidate["content"]["parts"]:
                raise GeminiError("Empty response from Gemini")

            text = candidate["content"]["parts"][0]["text"]
            logger.info(f"Gemini invocation successful ({len(text)} chars)")

            # Cache the response (using optimized prompt as key)
            if self.cache:
                self.cache.set("gemini", "gemini-2.0-flash", optimized_prompt, text, self.cache_ttl, optimized_system_instruction)

            return text

        except httpx.HTTPError as e:
            logger.error(f"Gemini HTTP error: {str(e)}")
            raise GeminiError(f"Gemini API error: {str(e)}")
        except Exception as e:
            logger.error(f"Gemini error: {str(e)}")
            raise GeminiError(f"Gemini error: {str(e)}")

    async def invoke_openai(
        self,
        prompt: str,
        model: str = "gpt-4-turbo-preview",
        max_tokens: int = 4096,
        temperature: float = 0.7,
        system_message: Optional[str] = None,
    ) -> str:
        """
        Invoke OpenAI (ChatGPT) for analysis, review, or architecture.

        Args:
            prompt: User prompt/instruction
            model: Model name (default: gpt-4-turbo-preview)
            max_tokens: Maximum tokens in response (default: 4096)
            temperature: Model temperature (0.0-2.0, default: 0.7)
            system_message: System message for model behavior

        Returns:
            Response from OpenAI

        Raises:
            OpenAIError: If API call fails
        """
        if not self.openai_api_key:
            raise OpenAIError("OPENAI_API_KEY not configured")

        # Check cache first
        if self.cache:
            cached = self.cache.get("openai", model, prompt, system_message)
            if cached:
                logger.info("Cache hit for OpenAI request")
                return cached["response"]

        try:
            messages = []

            if system_message:
                messages.append({
                    "role": "system",
                    "content": system_message
                })

            messages.append({
                "role": "user",
                "content": prompt
            })

            payload = {
                "model": model,
                "messages": messages,
                "max_tokens": max_tokens,
                "temperature": temperature,
            }

            response = await self.client.post(
                self.OPENAI_ENDPOINT,
                json=payload,
                headers={"Authorization": f"Bearer {self.openai_api_key}"},
            )

            response.raise_for_status()
            data = response.json()

            # Extract response
            if "choices" not in data or not data["choices"]:
                raise OpenAIError("No response from OpenAI")

            text = data["choices"][0]["message"]["content"]
            logger.info(f"OpenAI invocation successful ({len(text)} chars)")

            # Cache the response
            if self.cache:
                self.cache.set("openai", model, prompt, text, self.cache_ttl, system_message)

            return text

        except httpx.HTTPError as e:
            logger.error(f"OpenAI HTTP error: {str(e)}")
            raise OpenAIError(f"OpenAI API error: {str(e)}")
        except Exception as e:
            logger.error(f"OpenAI error: {str(e)}")
            raise OpenAIError(f"OpenAI error: {str(e)}")

    async def invoke_claude_api(
        self,
        prompt: str,
        model: str = "claude-3-5-sonnet-20241022",
        max_tokens: int = 4096,
        system_prompt: Optional[str] = None,
    ) -> str:
        """
        Invoke Anthropic Claude API (external).

        Note: This is different from Claude Code (local).
        This invokes the external Claude API service.

        Args:
            prompt: User prompt/instruction
            model: Model name (default: claude-3-5-sonnet-20241022)
            max_tokens: Maximum tokens in response (default: 4096)
            system_prompt: System prompt for model behavior

        Returns:
            Response from Claude API

        Raises:
            ClaudeAPIError: If API call fails
        """
        if not self.claude_api_key:
            raise ClaudeAPIError("ANTHROPIC_API_KEY not configured")

        try:
            headers = {
                "x-api-key": self.claude_api_key,
                "anthropic-version": self.ANTHROPIC_API_VERSION,
                "content-type": "application/json",
            }

            payload = {
                "model": model,
                "max_tokens": max_tokens,
                "messages": [
                    {"role": "user", "content": prompt}
                ],
            }

            if system_prompt:
                payload["system"] = system_prompt

            response = await self.client.post(
                self.CLAUDE_API_ENDPOINT,
                json=payload,
                headers=headers,
            )

            response.raise_for_status()
            data = response.json()

            # Extract response
            if "content" not in data or not data["content"]:
                raise ClaudeAPIError("No response from Claude API")

            text = data["content"][0]["text"]
            logger.info(f"Claude API invocation successful ({len(text)} chars)")
            return text

        except httpx.HTTPError as e:
            logger.error(f"Claude API HTTP error: {str(e)}")
            raise ClaudeAPIError(f"Claude API error: {str(e)}")
        except Exception as e:
            logger.error(f"Claude API error: {str(e)}")
            raise ClaudeAPIError(f"Claude API error: {str(e)}")

    async def invoke_local_cli(
        self,
        tool: str,
        args: Dict[str, Any],
        timeout: int = 60,
    ) -> str:
        """
        Invoke local CLI tool (gemini-cli, custom tools, etc.).

        Args:
            tool: Tool name (e.g., "gemini-cli", "custom-tool")
            args: Arguments as dictionary
            timeout: Process timeout in seconds

        Returns:
            Tool output

        Raises:
            LocalCLIError: If tool execution fails
        """
        try:
            # Convert args to command line flags
            cmd = [tool]
            for key, value in args.items():
                if isinstance(value, bool):
                    if value:
                        cmd.append(f"--{key}")
                else:
                    cmd.append(f"--{key}")
                    cmd.append(str(value))

            logger.info(f"Executing local CLI: {' '.join(cmd)}")

            # Run subprocess
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=timeout,
            )

            if result.returncode != 0:
                error_msg = result.stderr or result.stdout
                logger.error(f"CLI tool failed: {error_msg}")
                raise LocalCLIError(f"Tool '{tool}' failed: {error_msg}")

            logger.info(f"CLI tool executed successfully ({len(result.stdout)} chars)")
            return result.stdout

        except subprocess.TimeoutExpired:
            logger.error(f"CLI tool '{tool}' timed out")
            raise LocalCLIError(f"Tool '{tool}' timed out after {timeout}s")
        except FileNotFoundError:
            logger.error(f"CLI tool not found: {tool}")
            raise LocalCLIError(f"Tool '{tool}' not found in PATH")
        except Exception as e:
            logger.error(f"CLI tool error: {str(e)}")
            raise LocalCLIError(f"Tool '{tool}' error: {str(e)}")

    async def batch_invoke(
        self,
        tasks: List[Dict[str, Any]],
        parallel: bool = True,
    ) -> List[Dict[str, Any]]:
        """
        Invoke multiple AI systems in parallel or sequence.

        Args:
            tasks: List of task dictionaries:
                {
                    "provider": "gemini|openai|claude_api|local_cli",
                    "prompt": "...",
                    ... other provider-specific args
                }
            parallel: Execute in parallel (default: True)

        Returns:
            List of results with provider and response
        """
        results = []

        for task in tasks:
            provider = task.get("provider", "").lower()

            try:
                if provider == "gemini":
                    result = await self.invoke_gemini(
                        prompt=task.get("prompt", ""),
                        max_tokens=task.get("max_tokens", 4096),
                        temperature=task.get("temperature", 0.7),
                        system_instruction=task.get("system_instruction"),
                    )

                elif provider == "openai":
                    result = await self.invoke_openai(
                        prompt=task.get("prompt", ""),
                        model=task.get("model", "gpt-4-turbo-preview"),
                        max_tokens=task.get("max_tokens", 4096),
                        temperature=task.get("temperature", 0.7),
                        system_message=task.get("system_message"),
                    )

                elif provider == "claude_api":
                    result = await self.invoke_claude_api(
                        prompt=task.get("prompt", ""),
                        model=task.get("model", "claude-3-5-sonnet-20241022"),
                        max_tokens=task.get("max_tokens", 4096),
                        system_prompt=task.get("system_prompt"),
                    )

                elif provider == "local_cli":
                    result = await self.invoke_local_cli(
                        tool=task.get("tool", ""),
                        args=task.get("args", {}),
                        timeout=task.get("timeout", 60),
                    )

                else:
                    result = f"Unknown provider: {provider}"

                results.append({
                    "provider": provider,
                    "status": "success",
                    "response": result,
                    "timestamp": datetime.utcnow().isoformat(),
                })

            except (AIGatewayError, Exception) as e:
                logger.error(f"Error invoking {provider}: {str(e)}")
                results.append({
                    "provider": provider,
                    "status": "error",
                    "error": str(e),
                    "timestamp": datetime.utcnow().isoformat(),
                })

        return results

    async def health_check(self) -> Dict[str, Any]:
        """
        Check health of all AI providers.

        Returns:
            Dictionary with health status of each provider
        """
        health = {
            "timestamp": datetime.utcnow().isoformat(),
            "providers": {}
        }

        # Check Gemini
        if self.gemini_api_key:
            try:
                await self.invoke_gemini("Say 'OK'", max_tokens=10)
                health["providers"]["gemini"] = "healthy"
            except Exception as e:
                health["providers"]["gemini"] = f"unhealthy: {str(e)}"
        else:
            health["providers"]["gemini"] = "not_configured"

        # Check OpenAI
        if self.openai_api_key:
            try:
                await self.invoke_openai("Say 'OK'", max_tokens=10)
                health["providers"]["openai"] = "healthy"
            except Exception as e:
                health["providers"]["openai"] = f"unhealthy: {str(e)}"
        else:
            health["providers"]["openai"] = "not_configured"

        # Check Claude API
        if self.claude_api_key:
            try:
                await self.invoke_claude_api("Say 'OK'", max_tokens=10)
                health["providers"]["claude_api"] = "healthy"
            except Exception as e:
                health["providers"]["claude_api"] = f"unhealthy: {str(e)}"
        else:
            health["providers"]["claude_api"] = "not_configured"

        # Check local CLI availability
        try:
            result = subprocess.run(
                ["which", "gemini-cli"],
                capture_output=True,
                timeout=5,
            )
            health["providers"]["local_cli"] = (
                "available" if result.returncode == 0 else "not_available"
            )
        except Exception:
            health["providers"]["local_cli"] = "error_checking"

        return health

    async def close(self):
        """Close HTTP client connection"""
        await self.client.aclose()
