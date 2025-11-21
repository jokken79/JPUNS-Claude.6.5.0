"""
Additional AI Provider Services

Support for Anthropic Claude, Cohere, Hugging Face, and local models (Ollama).
Provides unified interface across multiple AI providers.
"""

import logging
from typing import Optional, Dict, Any
from decimal import Decimal
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)


class AIProviderBase(ABC):
    """Base class for AI providers"""

    @abstractmethod
    async def invoke(self, prompt: str, **kwargs) -> str:
        """Invoke the provider"""
        pass

    @abstractmethod
    def get_cost(self, tokens_used: int, **kwargs) -> Decimal:
        """Calculate cost for tokens used"""
        pass


class AnthropicClaudeProvider(AIProviderBase):
    """Anthropic Claude API provider"""

    # Pricing per 1M tokens
    PRICING = {
        "claude-3-opus": {"input": Decimal("0.015"), "output": Decimal("0.075")},
        "claude-3-sonnet": {"input": Decimal("0.003"), "output": Decimal("0.015")},
        "claude-3-haiku": {"input": Decimal("0.00025"), "output": Decimal("0.00125")},
        "claude-3-5-sonnet-20241022": {"input": Decimal("0.003"), "output": Decimal("0.015")},
    }

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Anthropic Claude provider.

        Args:
            api_key: Anthropic API key (from environment if not provided)
        """
        self.api_key = api_key or self._get_api_key()
        self.model = "claude-3-5-sonnet-20241022"
        logger.info(f"Initialized Anthropic provider with model: {self.model}")

    @staticmethod
    def _get_api_key() -> Optional[str]:
        """Get API key from environment"""
        import os
        return os.getenv("ANTHROPIC_API_KEY")

    async def invoke(
        self,
        prompt: str,
        system_message: Optional[str] = None,
        model: Optional[str] = None,
        max_tokens: int = 4096,
        temperature: float = 0.7,
    ) -> str:
        """
        Invoke Anthropic Claude.

        Args:
            prompt: User prompt
            system_message: System message
            model: Specific model to use
            max_tokens: Max tokens in response
            temperature: Model temperature

        Returns:
            Generated response text
        """
        if not self.api_key:
            raise ValueError("Anthropic API key not configured")

        model = model or self.model

        try:
            import anthropic
            client = anthropic.Anthropic(api_key=self.api_key)

            message = client.messages.create(
                model=model,
                max_tokens=max_tokens,
                temperature=temperature,
                system=system_message or "You are a helpful assistant.",
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            logger.info(f"Anthropic response: {model} - {message.usage.output_tokens} tokens")
            return message.content[0].text

        except ImportError:
            raise ImportError("Anthropic SDK not installed. Install with: pip install anthropic")
        except Exception as e:
            logger.error(f"Error invoking Anthropic: {str(e)}")
            raise

    def get_cost(
        self,
        tokens_used: int,
        input_tokens: int = 0,
        model: Optional[str] = None,
    ) -> Decimal:
        """
        Calculate cost for tokens used.

        Args:
            tokens_used: Output tokens
            input_tokens: Input tokens
            model: Model used

        Returns:
            Cost as Decimal
        """
        model = model or self.model
        pricing = self.PRICING.get(model, self.PRICING["claude-3-opus"])

        input_cost = Decimal(input_tokens) * pricing["input"] / 1_000_000
        output_cost = Decimal(tokens_used) * pricing["output"] / 1_000_000

        return input_cost + output_cost


class CohereProvider(AIProviderBase):
    """Cohere AI provider"""

    # Pricing per 1M tokens
    PRICING = {
        "command": {"input": Decimal("1.0"), "output": Decimal("2.0")},
        "command-light": {"input": Decimal("0.3"), "output": Decimal("0.6")},
        "command-nightly": {"input": Decimal("1.0"), "output": Decimal("2.0")},
    }

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Cohere provider.

        Args:
            api_key: Cohere API key (from environment if not provided)
        """
        self.api_key = api_key or self._get_api_key()
        self.model = "command"
        logger.info(f"Initialized Cohere provider with model: {self.model}")

    @staticmethod
    def _get_api_key() -> Optional[str]:
        """Get API key from environment"""
        import os
        return os.getenv("COHERE_API_KEY")

    async def invoke(
        self,
        prompt: str,
        model: Optional[str] = None,
        max_tokens: int = 4096,
        temperature: float = 0.7,
    ) -> str:
        """
        Invoke Cohere.

        Args:
            prompt: User prompt
            model: Specific model to use
            max_tokens: Max tokens in response
            temperature: Model temperature

        Returns:
            Generated response text
        """
        if not self.api_key:
            raise ValueError("Cohere API key not configured")

        model = model or self.model

        try:
            import cohere
            client = cohere.ClientV2(api_key=self.api_key)

            response = client.generate(
                model=model,
                prompt=prompt,
                max_tokens=max_tokens,
                temperature=temperature,
            )

            logger.info(f"Cohere response: {model} - tokens generated")
            return response.text

        except ImportError:
            raise ImportError("Cohere SDK not installed. Install with: pip install cohere")
        except Exception as e:
            logger.error(f"Error invoking Cohere: {str(e)}")
            raise

    def get_cost(
        self,
        tokens_used: int,
        input_tokens: int = 0,
        model: Optional[str] = None,
    ) -> Decimal:
        """
        Calculate cost for tokens used.

        Args:
            tokens_used: Output tokens
            input_tokens: Input tokens
            model: Model used

        Returns:
            Cost as Decimal
        """
        model = model or self.model
        pricing = self.PRICING.get(model, self.PRICING["command"])

        input_cost = Decimal(input_tokens) * pricing["input"] / 1_000_000
        output_cost = Decimal(tokens_used) * pricing["output"] / 1_000_000

        return input_cost + output_cost


class HuggingFaceProvider(AIProviderBase):
    """Hugging Face Inference API provider"""

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Hugging Face provider.

        Args:
            api_key: HF API key (from environment if not provided)
        """
        self.api_key = api_key or self._get_api_key()
        # Use an open-source model from HF
        self.model = "meta-llama/Llama-2-7b-chat-hf"
        logger.info(f"Initialized Hugging Face provider with model: {self.model}")

    @staticmethod
    def _get_api_key() -> Optional[str]:
        """Get API key from environment"""
        import os
        return os.getenv("HUGGINGFACE_API_KEY")

    async def invoke(
        self,
        prompt: str,
        model: Optional[str] = None,
        max_tokens: int = 1024,
        temperature: float = 0.7,
    ) -> str:
        """
        Invoke Hugging Face model.

        Args:
            prompt: User prompt
            model: Specific model to use
            max_tokens: Max tokens in response
            temperature: Model temperature

        Returns:
            Generated response text
        """
        if not self.api_key:
            raise ValueError("Hugging Face API key not configured")

        model = model or self.model

        try:
            from huggingface_hub import InferenceClient
            client = InferenceClient(api_key=self.api_key)

            response = client.text_generation(
                prompt=prompt,
                model=model,
                max_new_tokens=max_tokens,
                temperature=temperature,
            )

            logger.info(f"Hugging Face response: {model} - {len(response)} chars")
            return response

        except ImportError:
            raise ImportError("Hugging Face SDK not installed. Install with: pip install huggingface-hub")
        except Exception as e:
            logger.error(f"Error invoking Hugging Face: {str(e)}")
            raise

    def get_cost(
        self,
        tokens_used: int,
        input_tokens: int = 0,
        model: Optional[str] = None,
    ) -> Decimal:
        """
        Calculate cost for tokens used.

        Hugging Face free tier has rate limits but no direct per-token cost.
        Returns 0 for free tier calculations.

        Args:
            tokens_used: Output tokens
            input_tokens: Input tokens
            model: Model used

        Returns:
            Cost as Decimal (0 for free tier)
        """
        # Free tier - no direct API costs
        return Decimal("0")


class ZhipuGLMProvider(AIProviderBase):
    """Zhipu AI GLM-4.6 provider"""

    # Pricing per 1M tokens for GLM-4.6
    PRICING = {
        "glm-4.6": {"input": Decimal("0.0001"), "output": Decimal("0.0003")},
        "glm-4": {"input": Decimal("0.0001"), "output": Decimal("0.0003")},
        "glm-3.5-turbo": {"input": Decimal("0.00005"), "output": Decimal("0.00015")},
    }

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Zhipu GLM provider.

        Args:
            api_key: Zhipu API key (from environment if not provided)
        """
        self.api_key = api_key or self._get_api_key()
        self.model = "glm-4.6"
        self.base_url = "https://open.bigmodel.cn/api/paas/v4/chat/completions"
        logger.info(f"Initialized Zhipu provider with model: {self.model}")

    @staticmethod
    def _get_api_key() -> Optional[str]:
        """Get API key from environment"""
        import os
        return os.getenv("ZHIPU_API_KEY")

    async def invoke(
        self,
        prompt: str,
        system_message: Optional[str] = None,
        model: Optional[str] = None,
        max_tokens: int = 4096,
        temperature: float = 0.7,
    ) -> str:
        """
        Invoke Zhipu GLM model.

        Args:
            prompt: User prompt
            system_message: System message
            model: Specific model to use
            max_tokens: Max tokens in response
            temperature: Model temperature

        Returns:
            Generated response text
        """
        if not self.api_key:
            raise ValueError("Zhipu API key not configured")

        model = model or self.model

        try:
            import requests
            import json

            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            }

            payload = {
                "model": model,
                "messages": [
                    {
                        "role": "system",
                        "content": system_message or "You are a helpful assistant."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "max_tokens": max_tokens,
                "temperature": temperature,
            }

            response = requests.post(
                self.base_url,
                headers=headers,
                json=payload,
                timeout=30
            )

            response.raise_for_status()
            result = response.json()

            if "choices" in result and len(result["choices"]) > 0:
                content = result["choices"][0]["message"]["content"]
                logger.info(f"Zhipu response: {model} - {len(content)} chars")
                return content
            else:
                raise ValueError(f"Invalid response from Zhipu: {result}")

        except ImportError:
            raise ImportError("requests library not found. Install with: pip install requests")
        except Exception as e:
            logger.error(f"Error invoking Zhipu: {str(e)}")
            raise

    def get_cost(
        self,
        tokens_used: int,
        input_tokens: int = 0,
        model: Optional[str] = None,
    ) -> Decimal:
        """
        Calculate cost for tokens used.

        Args:
            tokens_used: Output tokens
            input_tokens: Input tokens
            model: Model used

        Returns:
            Cost as Decimal
        """
        model = model or self.model
        pricing = self.PRICING.get(model, self.PRICING["glm-4.6"])

        input_cost = Decimal(input_tokens) * pricing["input"] / 1_000_000
        output_cost = Decimal(tokens_used) * pricing["output"] / 1_000_000

        return input_cost + output_cost


class OllamaLocalProvider(AIProviderBase):
    """Local Ollama model provider"""

    def __init__(self, base_url: str = "http://localhost:11434", model: str = "llama2"):
        """
        Initialize Ollama local provider.

        Args:
            base_url: Ollama server base URL
            model: Model name to use
        """
        self.base_url = base_url
        self.model = model
        logger.info(f"Initialized Ollama provider at {base_url} with model: {model}")

    async def invoke(
        self,
        prompt: str,
        model: Optional[str] = None,
        max_tokens: int = 2048,
        temperature: float = 0.7,
    ) -> str:
        """
        Invoke local Ollama model.

        Args:
            prompt: User prompt
            model: Specific model to use
            max_tokens: Max tokens in response
            temperature: Model temperature

        Returns:
            Generated response text
        """
        model = model or self.model

        try:
            import requests
            url = f"{self.base_url}/api/generate"

            payload = {
                "model": model,
                "prompt": prompt,
                "stream": False,
                "temperature": temperature,
            }

            response = requests.post(url, json=payload)
            result = response.json()

            if "response" in result:
                logger.info(f"Ollama response: {model} - local generation")
                return result["response"]
            else:
                raise ValueError("Invalid response from Ollama")

        except ImportError:
            raise ImportError("requests library not found. Install with: pip install requests")
        except Exception as e:
            logger.error(f"Error invoking Ollama: {str(e)}")
            raise

    def get_cost(
        self,
        tokens_used: int,
        input_tokens: int = 0,
        model: Optional[str] = None,
    ) -> Decimal:
        """
        Calculate cost for local model.

        Local models running on Ollama have no API costs.

        Args:
            tokens_used: Output tokens
            input_tokens: Input tokens
            model: Model used

        Returns:
            Cost as Decimal (0 for local models)
        """
        return Decimal("0")


class ProviderFactory:
    """Factory for creating AI provider instances"""

    _providers = {
        "anthropic": AnthropicClaudeProvider,
        "cohere": CohereProvider,
        "huggingface": HuggingFaceProvider,
        "ollama": OllamaLocalProvider,
        "zhipu": ZhipuGLMProvider,
    }

    @classmethod
    def create_provider(
        cls,
        provider_name: str,
        **kwargs
    ) -> AIProviderBase:
        """
        Create a provider instance.

        Args:
            provider_name: Name of provider (anthropic, cohere, huggingface, ollama)
            **kwargs: Provider-specific arguments

        Returns:
            Provider instance

        Example:
            provider = ProviderFactory.create_provider("anthropic", api_key="...")
            response = await provider.invoke("Hello")
        """
        provider_class = cls._providers.get(provider_name.lower())
        if not provider_class:
            raise ValueError(
                f"Unknown provider: {provider_name}. "
                f"Available: {list(cls._providers.keys())}"
            )

        return provider_class(**kwargs)

    @classmethod
    def get_available_providers(cls) -> list:
        """Get list of available providers"""
        return list(cls._providers.keys())

    @classmethod
    def register_provider(cls, name: str, provider_class: type) -> None:
        """Register a new provider"""
        cls._providers[name.lower()] = provider_class


# Provider configuration with default settings
PROVIDER_DEFAULTS = {
    "anthropic": {
        "models": [
            "claude-3-opus",
            "claude-3-sonnet",
            "claude-3-haiku",
            "claude-3-5-sonnet-20241022",
        ],
        "default_model": "claude-3-5-sonnet-20241022",
        "max_tokens": 4096,
    },
    "cohere": {
        "models": ["command", "command-light", "command-nightly"],
        "default_model": "command",
        "max_tokens": 4096,
    },
    "huggingface": {
        "models": [
            "meta-llama/Llama-2-7b-chat-hf",
            "mistralai/Mistral-7B-Instruct-v0.1",
            "meta-llama/Llama-2-70b-chat-hf",
        ],
        "default_model": "meta-llama/Llama-2-7b-chat-hf",
        "max_tokens": 1024,
    },
    "ollama": {
        "models": ["llama2", "mistral", "neural-chat", "orca-mini"],
        "default_model": "llama2",
        "max_tokens": 2048,
        "base_url": "http://localhost:11434",
    },
    "zhipu": {
        "models": ["glm-4.6", "glm-4", "glm-3.5-turbo"],
        "default_model": "glm-4.6",
        "max_tokens": 4096,
    },
}
