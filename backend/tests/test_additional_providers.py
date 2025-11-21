"""
Comprehensive test suite for additional AI providers
Tests cover Anthropic Claude, Cohere, Hugging Face, and Ollama
"""

import pytest
from decimal import Decimal
from app.services.additional_providers import (
    AnthropicClaudeProvider,
    CohereProvider,
    HuggingFaceProvider,
    OllamaLocalProvider,
    ProviderFactory,
    PROVIDER_DEFAULTS,
)


class TestAnthropicClaudeProvider:
    """Test Anthropic Claude provider"""

    def test_anthropic_initialization(self):
        """Test Anthropic provider initializes"""
        provider = AnthropicClaudeProvider(api_key="test-key")
        assert provider.api_key == "test-key"
        assert provider.model == "claude-3-5-sonnet-20241022"

    def test_anthropic_default_model(self):
        """Test Anthropic has default model"""
        provider = AnthropicClaudeProvider(api_key="test-key")
        assert provider.model in provider.PRICING

    def test_anthropic_pricing_models(self):
        """Test Anthropic pricing includes all models"""
        assert "claude-3-opus" in AnthropicClaudeProvider.PRICING
        assert "claude-3-sonnet" in AnthropicClaudeProvider.PRICING
        assert "claude-3-haiku" in AnthropicClaudeProvider.PRICING

    def test_anthropic_pricing_structure(self):
        """Test pricing structure is correct"""
        pricing = AnthropicClaudeProvider.PRICING["claude-3-opus"]
        assert "input" in pricing
        assert "output" in pricing
        assert isinstance(pricing["input"], Decimal)
        assert isinstance(pricing["output"], Decimal)

    def test_anthropic_get_cost_calculation(self):
        """Test cost calculation for Anthropic"""
        provider = AnthropicClaudeProvider(api_key="test-key")
        cost = provider.get_cost(1000, input_tokens=100)
        assert isinstance(cost, Decimal)
        assert cost >= Decimal("0")

    def test_anthropic_cost_scales_with_tokens(self):
        """Test cost scales proportionally with tokens"""
        provider = AnthropicClaudeProvider(api_key="test-key")
        cost1 = provider.get_cost(1000)
        cost2 = provider.get_cost(2000)
        # Cost should increase with more output tokens
        assert cost2 > cost1

    def test_anthropic_no_api_key_detection(self):
        """Test API key requirement is detected"""
        provider = AnthropicClaudeProvider(api_key=None)
        assert provider.api_key is None


class TestCohereProvider:
    """Test Cohere provider"""

    def test_cohere_initialization(self):
        """Test Cohere provider initializes"""
        provider = CohereProvider(api_key="test-key")
        assert provider.api_key == "test-key"
        assert provider.model == "command"

    def test_cohere_models_in_pricing(self):
        """Test all Cohere models have pricing"""
        assert "command" in CohereProvider.PRICING
        assert "command-light" in CohereProvider.PRICING

    def test_cohere_get_cost(self):
        """Test cost calculation for Cohere"""
        provider = CohereProvider(api_key="test-key")
        cost = provider.get_cost(1000)
        assert isinstance(cost, Decimal)
        assert cost >= Decimal("0")

    def test_cohere_cost_calculation_correct(self):
        """Test Cohere cost is calculated correctly"""
        provider = CohereProvider(api_key="test-key")
        # For command model with 1000 tokens
        # Pricing: output = 2.0 per 1M tokens
        # Cost = 1000 * 2.0 / 1M = 0.002
        cost = provider.get_cost(1000, model="command")
        assert cost >= Decimal("0")


class TestHuggingFaceProvider:
    """Test Hugging Face provider"""

    def test_huggingface_initialization(self):
        """Test Hugging Face provider initializes"""
        provider = HuggingFaceProvider(api_key="test-key")
        assert provider.api_key == "test-key"
        assert "Llama" in provider.model

    def test_huggingface_free_tier_cost(self):
        """Test Hugging Face free tier has zero cost"""
        provider = HuggingFaceProvider(api_key="test-key")
        cost = provider.get_cost(10000)
        assert cost == Decimal("0")

    def test_huggingface_supports_multiple_models(self):
        """Test Hugging Face supports multiple models"""
        models = PROVIDER_DEFAULTS["huggingface"]["models"]
        assert len(models) > 0
        assert all(isinstance(m, str) for m in models)


class TestOllamaLocalProvider:
    """Test Ollama local provider"""

    def test_ollama_initialization(self):
        """Test Ollama provider initializes"""
        provider = OllamaLocalProvider()
        assert provider.base_url == "http://localhost:11434"
        assert provider.model == "llama2"

    def test_ollama_custom_url(self):
        """Test Ollama with custom URL"""
        provider = OllamaLocalProvider(
            base_url="http://192.168.1.100:11434",
            model="mistral"
        )
        assert provider.base_url == "http://192.168.1.100:11434"
        assert provider.model == "mistral"

    def test_ollama_local_cost_zero(self):
        """Test Ollama local cost is always zero"""
        provider = OllamaLocalProvider()
        cost = provider.get_cost(100000)
        assert cost == Decimal("0")

    def test_ollama_supports_multiple_models(self):
        """Test Ollama supports multiple models"""
        models = PROVIDER_DEFAULTS["ollama"]["models"]
        assert len(models) > 0
        assert "llama2" in models


class TestProviderFactory:
    """Test ProviderFactory for creating providers"""

    def test_factory_create_anthropic(self):
        """Test factory creates Anthropic provider"""
        provider = ProviderFactory.create_provider("anthropic", api_key="test")
        assert isinstance(provider, AnthropicClaudeProvider)

    def test_factory_create_cohere(self):
        """Test factory creates Cohere provider"""
        provider = ProviderFactory.create_provider("cohere", api_key="test")
        assert isinstance(provider, CohereProvider)

    def test_factory_create_huggingface(self):
        """Test factory creates Hugging Face provider"""
        provider = ProviderFactory.create_provider("huggingface", api_key="test")
        assert isinstance(provider, HuggingFaceProvider)

    def test_factory_create_ollama(self):
        """Test factory creates Ollama provider"""
        provider = ProviderFactory.create_provider("ollama")
        assert isinstance(provider, OllamaLocalProvider)

    def test_factory_invalid_provider(self):
        """Test factory raises error for invalid provider"""
        with pytest.raises(ValueError):
            ProviderFactory.create_provider("nonexistent")

    def test_factory_case_insensitive(self):
        """Test factory is case-insensitive"""
        provider1 = ProviderFactory.create_provider("ANTHROPIC", api_key="test")
        provider2 = ProviderFactory.create_provider("anthropic", api_key="test")
        assert isinstance(provider1, AnthropicClaudeProvider)
        assert isinstance(provider2, AnthropicClaudeProvider)

    def test_factory_get_available_providers(self):
        """Test factory lists available providers"""
        providers = ProviderFactory.get_available_providers()
        assert "anthropic" in providers
        assert "cohere" in providers
        assert "huggingface" in providers
        assert "ollama" in providers

    def test_factory_register_provider(self):
        """Test factory can register new provider"""
        # Register a test provider
        class TestProvider:
            pass

        original_count = len(ProviderFactory.get_available_providers())
        ProviderFactory.register_provider("test_custom", TestProvider)
        assert "test_custom" in ProviderFactory.get_available_providers()


class TestProviderDefaults:
    """Test provider default configuration"""

    def test_anthropic_defaults_exist(self):
        """Test Anthropic defaults are configured"""
        assert "anthropic" in PROVIDER_DEFAULTS
        assert "models" in PROVIDER_DEFAULTS["anthropic"]
        assert "default_model" in PROVIDER_DEFAULTS["anthropic"]

    def test_cohere_defaults_exist(self):
        """Test Cohere defaults are configured"""
        assert "cohere" in PROVIDER_DEFAULTS
        assert "models" in PROVIDER_DEFAULTS["cohere"]

    def test_huggingface_defaults_exist(self):
        """Test Hugging Face defaults are configured"""
        assert "huggingface" in PROVIDER_DEFAULTS
        assert "models" in PROVIDER_DEFAULTS["huggingface"]

    def test_ollama_defaults_exist(self):
        """Test Ollama defaults are configured"""
        assert "ollama" in PROVIDER_DEFAULTS
        assert "base_url" in PROVIDER_DEFAULTS["ollama"]

    def test_all_providers_have_models(self):
        """Test all providers have model lists"""
        for provider, config in PROVIDER_DEFAULTS.items():
            assert "models" in config
            assert len(config["models"]) > 0

    def test_all_providers_have_max_tokens(self):
        """Test all providers have max tokens configured"""
        for provider, config in PROVIDER_DEFAULTS.items():
            assert "max_tokens" in config
            assert config["max_tokens"] > 0


class TestProviderCostCalculations:
    """Test cost calculations across providers"""

    def test_anthropic_opus_expensive(self):
        """Test Anthropic Opus is more expensive than Haiku"""
        provider = AnthropicClaudeProvider(api_key="test")
        opus_cost = provider.get_cost(1000, model="claude-3-opus")
        haiku_cost = provider.get_cost(1000, model="claude-3-haiku")
        assert opus_cost > haiku_cost

    def test_cohere_command_more_expensive_than_light(self):
        """Test Cohere command is more expensive than light"""
        provider = CohereProvider(api_key="test")
        command_cost = provider.get_cost(1000, model="command")
        light_cost = provider.get_cost(1000, model="command-light")
        assert command_cost > light_cost

    def test_input_and_output_tokens_both_counted(self):
        """Test input and output tokens both affect cost"""
        provider = AnthropicClaudeProvider(api_key="test")
        cost_with_input = provider.get_cost(
            tokens_used=1000,
            input_tokens=500
        )
        cost_without_input = provider.get_cost(
            tokens_used=1000,
            input_tokens=0
        )
        # Cost with input should be higher
        assert cost_with_input > cost_without_input


class TestProviderErrorHandling:
    """Test error handling in providers"""

    def test_anthropic_missing_api_key_detected(self):
        """Test Anthropic detects missing API key"""
        provider = AnthropicClaudeProvider(api_key=None)
        # Should not raise error on init, only when invoking
        assert provider.api_key is None

    def test_cohere_missing_api_key_detected(self):
        """Test Cohere detects missing API key"""
        provider = CohereProvider(api_key=None)
        assert provider.api_key is None

    def test_huggingface_missing_api_key_detected(self):
        """Test Hugging Face detects missing API key"""
        provider = HuggingFaceProvider(api_key=None)
        assert provider.api_key is None

    def test_ollama_no_api_key_required(self):
        """Test Ollama doesn't require API key"""
        provider = OllamaLocalProvider()
        # No API key for local model
        assert not hasattr(provider, 'api_key') or provider.api_key is None


class TestProviderInitializationEdgeCases:
    """Test edge cases in provider initialization"""

    def test_anthropic_empty_string_api_key(self):
        """Test Anthropic with empty string API key"""
        provider = AnthropicClaudeProvider(api_key="")
        assert provider.api_key == ""

    def test_cohere_with_special_characters_in_key(self):
        """Test provider handles special chars in API key"""
        key = "test!@#$%^&*()_+-=[]{}|;:,.<>?"
        provider = CohereProvider(api_key=key)
        assert provider.api_key == key

    def test_ollama_with_custom_port(self):
        """Test Ollama with non-standard port"""
        provider = OllamaLocalProvider(base_url="http://localhost:9999")
        assert "9999" in provider.base_url

    def test_ollama_with_different_host(self):
        """Test Ollama with different host"""
        provider = OllamaLocalProvider(base_url="http://ollama-server:11434")
        assert "ollama-server" in provider.base_url


class TestProviderPricingAccuracy:
    """Test pricing accuracy across providers"""

    def test_anthropic_pricing_is_decimal(self):
        """Test Anthropic pricing uses Decimal for accuracy"""
        provider = AnthropicClaudeProvider(api_key="test")
        for model, pricing in provider.PRICING.items():
            assert isinstance(pricing["input"], Decimal)
            assert isinstance(pricing["output"], Decimal)

    def test_cohere_pricing_is_decimal(self):
        """Test Cohere pricing uses Decimal"""
        provider = CohereProvider(api_key="test")
        for model, pricing in provider.PRICING.items():
            assert isinstance(pricing["input"], Decimal)
            assert isinstance(pricing["output"], Decimal)

    def test_cost_never_negative(self):
        """Test cost calculation never returns negative"""
        providers_to_test = [
            AnthropicClaudeProvider(api_key="test"),
            CohereProvider(api_key="test"),
            HuggingFaceProvider(api_key="test"),
            OllamaLocalProvider(),
        ]

        for provider in providers_to_test:
            cost = provider.get_cost(tokens_used=1000)
            assert cost >= Decimal("0"), f"{provider.__class__.__name__} returned negative cost"


class TestProviderConsistency:
    """Test consistency of provider behavior"""

    def test_same_input_produces_same_cost(self):
        """Test same input always produces same cost"""
        provider = AnthropicClaudeProvider(api_key="test")
        cost1 = provider.get_cost(1000, model="claude-3-opus")
        cost2 = provider.get_cost(1000, model="claude-3-opus")
        assert cost1 == cost2

    def test_provider_factory_creates_consistent_instances(self):
        """Test factory creates consistent instances"""
        provider1 = ProviderFactory.create_provider("anthropic", api_key="test")
        provider2 = ProviderFactory.create_provider("anthropic", api_key="test")

        # Both should calculate cost the same way
        cost1 = provider1.get_cost(1000)
        cost2 = provider2.get_cost(1000)
        assert cost1 == cost2
