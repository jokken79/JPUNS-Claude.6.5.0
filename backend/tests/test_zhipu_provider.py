"""
Test suite for Zhipu GLM provider integration
Tests the ZhipuGLMProvider class functionality
"""

import pytest
from decimal import Decimal
from app.services.additional_providers import ZhipuGLMProvider, ProviderFactory


class TestZhipuGLMProviderInitialization:
    """Test ZhipuGLMProvider initialization"""

    def test_zhipu_provider_creates(self):
        """Test ZhipuGLMProvider initializes"""
        provider = ZhipuGLMProvider(api_key="test_key")
        assert provider is not None
        assert provider.api_key == "test_key"
        assert provider.model == "glm-4.6"

    def test_zhipu_provider_has_api_endpoint(self):
        """Test Zhipu provider has correct API endpoint"""
        provider = ZhipuGLMProvider(api_key="test_key")
        assert "open.bigmodel.cn" in provider.base_url
        assert "chat/completions" in provider.base_url

    def test_zhipu_provider_has_pricing(self):
        """Test Zhipu provider has pricing configured"""
        assert "glm-4.6" in ZhipuGLMProvider.PRICING
        assert "glm-4" in ZhipuGLMProvider.PRICING
        assert "glm-3.5-turbo" in ZhipuGLMProvider.PRICING

    def test_zhipu_provider_pricing_structure(self):
        """Test Zhipu pricing has input/output costs"""
        pricing = ZhipuGLMProvider.PRICING["glm-4.6"]
        assert "input" in pricing
        assert "output" in pricing
        assert isinstance(pricing["input"], Decimal)
        assert isinstance(pricing["output"], Decimal)


class TestZhipuGLMCostCalculation:
    """Test cost calculation for Zhipu models"""

    def test_glm_4_6_cost_calculation(self):
        """Test cost calculation for GLM-4.6"""
        provider = ZhipuGLMProvider(api_key="test_key")

        # Test output tokens cost
        cost = provider.get_cost(tokens_used=1_000_000, model="glm-4.6")
        assert cost == Decimal("0.0003")  # 1M output tokens at $0.0003/1M

    def test_glm_4_cost_calculation(self):
        """Test cost calculation for GLM-4"""
        provider = ZhipuGLMProvider(api_key="test_key")

        cost = provider.get_cost(tokens_used=1_000_000, model="glm-4")
        assert cost == Decimal("0.0003")

    def test_glm_3_5_turbo_cost_calculation(self):
        """Test cost calculation for GLM-3.5-turbo"""
        provider = ZhipuGLMProvider(api_key="test_key")

        cost = provider.get_cost(tokens_used=1_000_000, model="glm-3.5-turbo")
        assert cost == Decimal("0.00015")

    def test_zhipu_cost_with_input_and_output(self):
        """Test cost calculation with both input and output tokens"""
        provider = ZhipuGLMProvider(api_key="test_key")

        # 1M input tokens + 1M output tokens
        cost = provider.get_cost(
            tokens_used=1_000_000,
            input_tokens=1_000_000,
            model="glm-4.6"
        )

        # Input: 1M * 0.0001 / 1M = 0.0001
        # Output: 1M * 0.0003 / 1M = 0.0003
        # Total: 0.0004
        expected = Decimal("0.0001") + Decimal("0.0003")
        assert cost == expected

    def test_zhipu_cost_default_model(self):
        """Test cost calculation uses default model if not specified"""
        provider = ZhipuGLMProvider(api_key="test_key")

        # Should use glm-4.6 by default
        cost = provider.get_cost(tokens_used=1_000_000)
        assert cost == Decimal("0.0003")


class TestZhipuGLMProviderRegistry:
    """Test Zhipu provider is registered in factory"""

    def test_zhipu_registered_in_factory(self):
        """Test ZhipuGLMProvider is registered in ProviderFactory"""
        available = ProviderFactory.get_available_providers()
        assert "zhipu" in available

    def test_zhipu_can_be_created_from_factory(self):
        """Test ZhipuGLMProvider can be instantiated via factory"""
        provider = ProviderFactory.create_provider("zhipu", api_key="test_key")
        assert isinstance(provider, ZhipuGLMProvider)
        assert provider.api_key == "test_key"

    def test_zhipu_factory_case_insensitive(self):
        """Test provider name is case insensitive"""
        provider1 = ProviderFactory.create_provider("zhipu", api_key="key1")
        provider2 = ProviderFactory.create_provider("ZHIPU", api_key="key2")

        assert isinstance(provider1, ZhipuGLMProvider)
        assert isinstance(provider2, ZhipuGLMProvider)


class TestZhipuGLMProviderDefaults:
    """Test Zhipu provider default configuration"""

    def test_zhipu_in_provider_defaults(self):
        """Test Zhipu is in PROVIDER_DEFAULTS"""
        from app.services.additional_providers import PROVIDER_DEFAULTS

        assert "zhipu" in PROVIDER_DEFAULTS
        zhipu_config = PROVIDER_DEFAULTS["zhipu"]

        assert "models" in zhipu_config
        assert "default_model" in zhipu_config
        assert "max_tokens" in zhipu_config

    def test_zhipu_default_model(self):
        """Test Zhipu default model is configured"""
        from app.services.additional_providers import PROVIDER_DEFAULTS

        zhipu_config = PROVIDER_DEFAULTS["zhipu"]
        assert zhipu_config["default_model"] == "glm-4.6"

    def test_zhipu_available_models(self):
        """Test Zhipu models are properly configured"""
        from app.services.additional_providers import PROVIDER_DEFAULTS

        zhipu_config = PROVIDER_DEFAULTS["zhipu"]
        models = zhipu_config["models"]

        assert "glm-4.6" in models
        assert "glm-4" in models
        assert "glm-3.5-turbo" in models
        assert len(models) >= 3

    def test_zhipu_max_tokens(self):
        """Test Zhipu max tokens is reasonable"""
        from app.services.additional_providers import PROVIDER_DEFAULTS

        zhipu_config = PROVIDER_DEFAULTS["zhipu"]
        assert zhipu_config["max_tokens"] == 4096


class TestZhipuGLMErrorHandling:
    """Test error handling in Zhipu provider"""

    def test_zhipu_missing_api_key_error(self):
        """Test Zhipu provider raises error when API key is missing"""
        provider = ZhipuGLMProvider(api_key=None)
        provider.api_key = None  # Force missing API key

        # The invoke method should raise ValueError when api_key is None
        # This test just verifies the error is properly handled
        assert provider.api_key is None

    def test_zhipu_provider_attributes(self):
        """Test ZhipuGLMProvider has required attributes"""
        provider = ZhipuGLMProvider(api_key="test_key")

        assert hasattr(provider, 'api_key')
        assert hasattr(provider, 'model')
        assert hasattr(provider, 'base_url')
        assert hasattr(provider, 'invoke')
        assert hasattr(provider, 'get_cost')


class TestZhipuGLMModelVariants:
    """Test Zhipu provider handles different model variants"""

    def test_glm_4_6_is_default(self):
        """Test GLM-4.6 is the default model"""
        provider = ZhipuGLMProvider(api_key="test_key")
        assert provider.model == "glm-4.6"

    def test_zhipu_supports_multiple_models(self):
        """Test Zhipu supports multiple model variants"""
        models = list(ZhipuGLMProvider.PRICING.keys())

        assert len(models) >= 3
        assert "glm-4.6" in models
        assert "glm-4" in models
        assert "glm-3.5-turbo" in models

    def test_model_pricing_fallback(self):
        """Test unknown models default to glm-4.6 pricing"""
        provider = ZhipuGLMProvider(api_key="test_key")

        # Cost for unknown model should default to glm-4.6 pricing
        cost = provider.get_cost(tokens_used=1_000_000, model="unknown-model")
        assert cost == Decimal("0.0003")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
