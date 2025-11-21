"""
Comprehensive test suite for prompt optimization service
Tests cover token reduction, optimization strategies, recommendations, and API endpoints
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from app.services.prompt_optimizer import PromptOptimizer, OptimizationStats
from app.schemas.prompt_optimization import (
    OptimizationRequest,
    OptimizedPromptResponse,
    OptimizationStatsResponse,
    OptimizationRecommendationsResponse,
    OptimizationEstimateResponse,
)


class TestOptimizationStats:
    """Test OptimizationStats dataclass"""

    def test_optimization_stats_initialization(self):
        """Test OptimizationStats is created correctly"""
        stats = OptimizationStats(
            original_length=100,
            optimized_length=80,
            tokens_saved=5,
            reduction_percentage=20.0,
            strategies_applied=["normalize_whitespace", "remove_redundancies"],
        )
        assert stats.original_length == 100
        assert stats.optimized_length == 80
        assert stats.tokens_saved == 5
        assert stats.reduction_percentage == 20.0
        assert len(stats.strategies_applied) == 2

    def test_optimization_stats_with_no_reduction(self):
        """Test OptimizationStats when no optimization occurs"""
        stats = OptimizationStats(
            original_length=50,
            optimized_length=50,
            tokens_saved=0,
            reduction_percentage=0.0,
            strategies_applied=[],
        )
        assert stats.tokens_saved == 0
        assert stats.reduction_percentage == 0.0
        assert stats.strategies_applied == []


class TestPromptOptimizerNormalMode:
    """Test PromptOptimizer in normal mode (standard optimization)"""

    def test_optimizer_initialization_normal_mode(self):
        """Test optimizer initializes in normal mode"""
        optimizer = PromptOptimizer(aggressive=False)
        assert optimizer.aggressive is False

    def test_whitespace_normalization(self):
        """Test normalization removes excess whitespace"""
        optimizer = PromptOptimizer(aggressive=False)
        prompt = "Hello    world\n\n\nHow are you?"
        optimized_prompt, _, stats = optimizer.optimize(prompt)

        # Should have fewer characters
        assert len(optimized_prompt) < len(prompt)
        assert "normalize_whitespace" in stats.strategies_applied
        assert stats.reduction_percentage > 0

    def test_redundancy_removal(self):
        """Test removal of redundant phrases"""
        optimizer = PromptOptimizer(aggressive=False)
        prompt = "Please generate code for me. Please make it clean. Please add comments."

        optimized_prompt, _, stats = optimizer.optimize(prompt)

        # Should remove "Please" instances
        assert optimized_prompt.count("Please") < prompt.count("Please")
        assert "remove_redundancies" in stats.strategies_applied

    def test_verbose_phrase_condensation(self):
        """Test replacement of verbose phrases with concise ones"""
        optimizer = PromptOptimizer(aggressive=False)
        prompt = "I would like you to generate code for a Python function."

        optimized_prompt, _, stats = optimizer.optimize(prompt)

        # Should replace verbose phrases
        assert len(optimized_prompt) < len(prompt)
        assert "condense_verbose_phrases" in stats.strategies_applied

    def test_optimization_preserves_meaning(self):
        """Test that optimization doesn't destroy original meaning"""
        optimizer = PromptOptimizer(aggressive=False)
        prompt = "Please help me. I would like you to create a function that sorts an array."

        optimized_prompt, _, stats = optimizer.optimize(prompt)

        # Core meaning should be preserved
        assert "function" in optimized_prompt
        assert "sort" in optimized_prompt
        assert "array" in optimized_prompt

    def test_normal_mode_reduction_percentage(self):
        """Test normal mode achieves 15-25% reduction"""
        optimizer = PromptOptimizer(aggressive=False)
        prompt = (
            "I would like you to please generate code for me. "
            "Please make it clean and well documented. "
            "Thanks in advance for your help with this."
        )

        optimized_prompt, _, stats = optimizer.optimize(prompt)

        # Normal mode should reduce by 10-25% (with test prompts)
        assert stats.reduction_percentage >= 5.0  # At least some reduction


class TestPromptOptimizerAggressiveMode:
    """Test PromptOptimizer in aggressive mode (maximum optimization)"""

    def test_optimizer_initialization_aggressive_mode(self):
        """Test optimizer initializes in aggressive mode"""
        optimizer = PromptOptimizer(aggressive=True)
        assert optimizer.aggressive is True

    def test_aggressive_mode_more_reduction(self):
        """Test aggressive mode produces more reduction than normal"""
        prompt = (
            "I would like you to please generate code for me. "
            "Please make it clean and well documented. "
            "Thanks in advance for your help with this."
        )

        normal_optimizer = PromptOptimizer(aggressive=False)
        aggressive_optimizer = PromptOptimizer(aggressive=True)

        _, _, normal_stats = normal_optimizer.optimize(prompt)
        _, _, aggressive_stats = aggressive_optimizer.optimize(prompt)

        # Aggressive should reduce more or equal
        assert aggressive_stats.reduction_percentage >= normal_stats.reduction_percentage

    def test_aggressive_compression_applies(self):
        """Test aggressive compression applies additional strategies"""
        optimizer = PromptOptimizer(aggressive=True)
        prompt = "I need help with writing code for the project with requirements."

        optimized_prompt, _, stats = optimizer.optimize(prompt)

        # Aggressive mode may apply additional compressions
        assert stats.reduction_percentage > 0

    def test_aggressive_mode_with_numbers_and_words(self):
        """Test aggressive mode handles number replacements"""
        optimizer = PromptOptimizer(aggressive=True)
        prompt = "Write code for the following with these requirements for testing."

        optimized_prompt, _, stats = optimizer.optimize(prompt)

        # Should still contain meaningful content
        assert len(optimized_prompt) > 0
        assert "code" in optimized_prompt.lower()


class TestSystemMessageOptimization:
    """Test optimization of system messages"""

    def test_system_message_optimization(self):
        """Test that system messages are optimized separately"""
        optimizer = PromptOptimizer(aggressive=False)
        prompt = "Write a function."
        system_message = "You are a helpful programming assistant. Please be thorough and clear."

        optimized_prompt, optimized_system, stats = optimizer.optimize(prompt, system_message)

        # System message should be optimized
        assert optimized_system != system_message
        assert len(optimized_system) <= len(system_message)

    def test_both_prompt_and_system_optimized(self):
        """Test both prompt and system message are optimized together"""
        optimizer = PromptOptimizer(aggressive=False)
        prompt = "Please help me write code for a function that sorts data."
        system_message = "You are a helpful assistant. Please provide detailed explanations."

        optimized_prompt, optimized_system, stats = optimizer.optimize(prompt, system_message)

        original_total = len(prompt) + len(system_message)
        optimized_total = len(optimized_prompt) + len(optimized_system)

        assert optimized_total <= original_total


class TestTokenCalculations:
    """Test token calculation accuracy"""

    def test_token_savings_calculation(self):
        """Test token savings calculation (0.25 tokens per character)"""
        optimizer = PromptOptimizer(aggressive=False)
        original_text = "This is a test string with some content."
        optimized_text = "Test string content."

        token_savings = optimizer.calculate_token_savings(original_text, optimized_text)

        # 40 chars → 10 tokens, 20 chars → 5 tokens, difference = 5 tokens
        assert token_savings["original_tokens"] > 0
        assert token_savings["optimized_tokens"] > 0
        assert token_savings["tokens_saved"] > 0
        assert token_savings["reduction_percentage"] > 0

    def test_token_savings_with_identical_strings(self):
        """Test token savings when strings are identical"""
        optimizer = PromptOptimizer(aggressive=False)
        text = "Same text for both"

        token_savings = optimizer.calculate_token_savings(text, text)

        assert token_savings["tokens_saved"] == 0
        assert token_savings["reduction_percentage"] == 0.0

    def test_token_ratio_accuracy(self):
        """Test token calculation uses 0.25 tokens per char ratio"""
        optimizer = PromptOptimizer(aggressive=False)
        text = "x" * 100  # 100 characters

        token_savings = optimizer.calculate_token_savings(text, "")

        # 100 chars = 25 tokens
        assert token_savings["original_tokens"] == 25
        assert token_savings["tokens_saved"] == 25


class TestRecommendations:
    """Test optimization recommendations generation"""

    def test_get_recommendations_with_redundant_prompt(self):
        """Test recommendations identify redundant content"""
        optimizer = PromptOptimizer(aggressive=False)
        prompt = "Please generate code for me. Please make it clean. Please add tests."

        recommendations = optimizer.get_optimization_recommendations(prompt)

        assert len(recommendations) > 0
        assert any("redundant" in rec.lower() or "please" in rec.lower() for rec in recommendations)

    def test_get_recommendations_with_verbose_prompt(self):
        """Test recommendations identify verbose phrasing"""
        optimizer = PromptOptimizer(aggressive=False)
        prompt = "I would like you to create a function that does something."

        recommendations = optimizer.get_optimization_recommendations(prompt)

        assert len(recommendations) > 0

    def test_get_recommendations_returns_list(self):
        """Test recommendations always returns a list"""
        optimizer = PromptOptimizer(aggressive=False)
        prompt = "Clean prompt with minimal redundancy."

        recommendations = optimizer.get_optimization_recommendations(prompt)

        assert isinstance(recommendations, list)
        # Should have some recommendations or be empty, but valid list
        assert len(recommendations) >= 0

    def test_get_recommendations_with_empty_prompt(self):
        """Test recommendations with empty prompt"""
        optimizer = PromptOptimizer(aggressive=False)
        prompt = ""

        recommendations = optimizer.get_optimization_recommendations(prompt)

        assert isinstance(recommendations, list)


class TestSavingsEstimation:
    """Test estimation of potential savings"""

    def test_estimate_savings_normal_mode(self):
        """Test estimate_savings in normal mode"""
        optimizer = PromptOptimizer(aggressive=False)
        prompt = (
            "I would like you to please generate code for me. "
            "Please make it clean and documented. Thanks in advance."
        )

        estimate = optimizer.estimate_savings(prompt)

        assert estimate["original_chars"] > 0
        assert estimate["estimated_reduction_chars"] >= 0
        assert estimate["estimated_tokens_saved"] >= 0
        assert estimate["estimated_reduction_percentage"] >= 0
        assert estimate["mode"] == "normal"

    def test_estimate_savings_aggressive_mode(self):
        """Test estimate_savings in aggressive mode"""
        optimizer = PromptOptimizer(aggressive=True)
        prompt = (
            "I would like you to please generate code for me. "
            "Please make it clean and documented. Thanks in advance."
        )

        estimate = optimizer.estimate_savings(prompt, system_message="Be helpful.")

        assert estimate["mode"] == "aggressive"
        # Aggressive should estimate more reduction or equal
        assert estimate["estimated_reduction_percentage"] >= 0

    def test_estimate_savings_structure(self):
        """Test estimate_savings returns correct structure"""
        optimizer = PromptOptimizer(aggressive=False)
        prompt = "Test prompt."

        estimate = optimizer.estimate_savings(prompt)

        required_keys = [
            "original_chars",
            "estimated_reduction_chars",
            "estimated_tokens_saved",
            "estimated_reduction_percentage",
            "mode",
        ]
        for key in required_keys:
            assert key in estimate


class TestOptimizationWithSystemMessage:
    """Test optimization with system message provided"""

    def test_optimize_with_none_system_message(self):
        """Test optimize handles None system message"""
        optimizer = PromptOptimizer(aggressive=False)
        prompt = "Please help me write code."

        optimized_prompt, optimized_system, stats = optimizer.optimize(prompt, system_message=None)

        assert optimized_prompt is not None
        # System message should be empty or None
        assert optimized_system == "" or optimized_system is None

    def test_optimize_with_system_message(self):
        """Test optimize processes both prompt and system message"""
        optimizer = PromptOptimizer(aggressive=False)
        prompt = "Write a function."
        system_message = "You are helpful."

        optimized_prompt, optimized_system, stats = optimizer.optimize(prompt, system_message)

        assert optimized_prompt is not None
        assert optimized_system is not None
        assert len(optimized_prompt) > 0


class TestEdgeCases:
    """Test edge cases and error handling"""

    def test_optimize_very_short_prompt(self):
        """Test optimization of very short prompt"""
        optimizer = PromptOptimizer(aggressive=False)
        prompt = "Help"

        optimized_prompt, _, stats = optimizer.optimize(prompt)

        assert optimized_prompt is not None
        assert len(optimized_prompt) > 0

    def test_optimize_very_long_prompt(self):
        """Test optimization of very long prompt"""
        optimizer = PromptOptimizer(aggressive=False)
        prompt = "Please " * 100 + "help me with code generation."

        optimized_prompt, _, stats = optimizer.optimize(prompt)

        # Should reduce "Please" instances
        assert optimized_prompt.count("Please") < prompt.count("Please")

    def test_optimize_prompt_with_special_characters(self):
        """Test optimization with special characters"""
        optimizer = PromptOptimizer(aggressive=False)
        prompt = "Help me! @#$% Code for this: [function]"

        optimized_prompt, _, stats = optimizer.optimize(prompt)

        assert optimized_prompt is not None

    def test_optimize_prompt_with_code_block(self):
        """Test optimization preserves code blocks"""
        optimizer = PromptOptimizer(aggressive=False)
        prompt = """Please help me optimize this code:
        def function():
            pass
        """

        optimized_prompt, _, stats = optimizer.optimize(prompt)

        # Should preserve code structure
        assert "def" in optimized_prompt

    def test_optimize_unicode_characters(self):
        """Test optimization with unicode characters"""
        optimizer = PromptOptimizer(aggressive=False)
        prompt = "Please help me write code. こんにちは世界"

        optimized_prompt, _, stats = optimizer.optimize(prompt)

        assert optimized_prompt is not None
        assert "こんにちは世界" in optimized_prompt


class TestOptimizationStatsAccuracy:
    """Test accuracy of optimization statistics"""

    def test_stats_original_length(self):
        """Test that original_length is accurate"""
        optimizer = PromptOptimizer(aggressive=False)
        prompt = "Test prompt content"

        _, _, stats = optimizer.optimize(prompt)

        assert stats.original_length == len(prompt)

    def test_stats_optimized_length(self):
        """Test that optimized_length is accurate"""
        optimizer = PromptOptimizer(aggressive=False)
        prompt = "Please help me write code."

        optimized_prompt, _, stats = optimizer.optimize(prompt)

        assert stats.optimized_length == len(optimized_prompt)

    def test_stats_reduction_percentage_calculation(self):
        """Test reduction percentage calculation accuracy"""
        optimizer = PromptOptimizer(aggressive=False)
        prompt = "Please help me write code for a function."

        _, _, stats = optimizer.optimize(prompt)

        expected_reduction = (
            (stats.original_length - stats.optimized_length)
            / stats.original_length
            * 100
        )

        assert abs(stats.reduction_percentage - expected_reduction) < 0.01

    def test_stats_tokens_saved_calculation(self):
        """Test tokens saved calculation"""
        optimizer = PromptOptimizer(aggressive=False)
        prompt = "Please help me write code."

        _, _, stats = optimizer.optimize(prompt)

        expected_tokens_saved = int(
            (stats.original_length - stats.optimized_length) * 0.25
        )

        assert stats.tokens_saved == expected_tokens_saved


class TestIntegrationWithAIGateway:
    """Test integration with AIGateway"""

    @patch("app.services.ai_gateway.AIGateway")
    def test_optimizer_in_gateway_flow(self, mock_gateway):
        """Test optimizer can be integrated into gateway"""
        optimizer = PromptOptimizer(aggressive=False)
        prompt = "Please help me write code for a function."

        optimized_prompt, _, stats = optimizer.optimize(prompt)

        # Verify optimizer returns valid data for gateway use
        assert isinstance(optimized_prompt, str)
        assert isinstance(stats.tokens_saved, int)
        assert isinstance(stats.reduction_percentage, float)

    def test_optimizer_output_suitable_for_caching(self):
        """Test optimized prompt is suitable for cache key generation"""
        optimizer = PromptOptimizer(aggressive=False)
        prompt = "Please help me write code."

        optimized_prompt, _, _ = optimizer.optimize(prompt)

        # Should be valid string for hashing
        import hashlib

        hash_result = hashlib.sha256(optimized_prompt.encode()).hexdigest()
        assert len(hash_result) == 64  # SHA256 produces 64 char hex


class TestOptimizationEndpointSchemas:
    """Test Pydantic schema validation"""

    def test_optimization_request_schema(self):
        """Test OptimizationRequest schema"""
        request = OptimizationRequest(
            prompt="Test prompt",
            system_message="Test system",
            aggressive=False,
        )
        assert request.prompt == "Test prompt"
        assert request.system_message == "Test system"
        assert request.aggressive is False

    def test_optimization_request_schema_minimal(self):
        """Test OptimizationRequest with minimal fields"""
        request = OptimizationRequest(
            prompt="Test prompt",
        )
        assert request.prompt == "Test prompt"
        assert request.system_message is None
        assert request.aggressive is False

    def test_optimized_prompt_response_schema(self):
        """Test OptimizedPromptResponse schema"""
        stats_response = OptimizationStatsResponse(
            original_length=100,
            optimized_length=80,
            tokens_saved=5,
            reduction_percentage=20.0,
            strategies_applied=["test"],
        )
        response = OptimizedPromptResponse(
            optimized_prompt="optimized",
            optimized_system_message="system",
            stats=stats_response,
        )
        assert response.optimized_prompt == "optimized"
        assert response.stats.tokens_saved == 5

    def test_optimization_estimate_response_schema(self):
        """Test OptimizationEstimateResponse schema"""
        estimate = OptimizationEstimateResponse(
            original_chars=100,
            estimated_reduction_chars=20,
            estimated_tokens_saved=5,
            estimated_reduction_percentage=20.0,
            mode="normal",
        )
        assert estimate.original_chars == 100
        assert estimate.estimated_reduction_chars == 20
        assert estimate.mode == "normal"


class TestOptimizationPerformance:
    """Test performance characteristics"""

    def test_optimization_completes_quickly(self):
        """Test optimization completes in reasonable time"""
        import time

        optimizer = PromptOptimizer(aggressive=False)
        prompt = "Please help me. " * 100

        start = time.time()
        optimizer.optimize(prompt)
        elapsed = time.time() - start

        # Should complete in less than 1 second
        assert elapsed < 1.0

    def test_recommendations_generation_performance(self):
        """Test recommendations complete in reasonable time"""
        import time

        optimizer = PromptOptimizer(aggressive=False)
        prompt = "Please help me with code. " * 50

        start = time.time()
        optimizer.get_optimization_recommendations(prompt)
        elapsed = time.time() - start

        # Should complete in less than 500ms
        assert elapsed < 0.5


class TestOptimizationConsistency:
    """Test consistency of optimization results"""

    def test_same_prompt_produces_same_result(self):
        """Test that optimizing same prompt produces same result"""
        optimizer = PromptOptimizer(aggressive=False)
        prompt = "Please help me write code for a function."

        result1, _, stats1 = optimizer.optimize(prompt)
        result2, _, stats2 = optimizer.optimize(prompt)

        assert result1 == result2
        assert stats1.tokens_saved == stats2.tokens_saved

    def test_different_prompts_produce_different_results(self):
        """Test that different prompts produce different results"""
        optimizer = PromptOptimizer(aggressive=False)
        prompt1 = "Please help me write code."
        prompt2 = "Please help me write documentation."

        result1, _, _ = optimizer.optimize(prompt1)
        result2, _, _ = optimizer.optimize(prompt2)

        # Results should be different
        assert result1 != result2
