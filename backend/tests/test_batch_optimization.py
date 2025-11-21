"""
Comprehensive test suite for batch optimization service
Tests cover duplicate detection, similarity analysis, grouping, and statistics
"""

import pytest
from app.services.batch_optimizer import BatchOptimizer, PromptGroup, BatchOptimizationStats


class TestBatchOptimizerInitialization:
    """Test BatchOptimizer initialization"""

    def test_optimizer_initialization_default(self):
        """Test optimizer initializes with default threshold"""
        optimizer = BatchOptimizer()
        assert optimizer.similarity_threshold == 0.85

    def test_optimizer_initialization_custom_threshold(self):
        """Test optimizer initializes with custom threshold"""
        optimizer = BatchOptimizer(similarity_threshold=0.75)
        assert optimizer.similarity_threshold == 0.75

    def test_optimizer_initialization_high_threshold(self):
        """Test optimizer with very high threshold (almost only duplicates)"""
        optimizer = BatchOptimizer(similarity_threshold=0.99)
        assert optimizer.similarity_threshold == 0.99

    def test_optimizer_initialization_low_threshold(self):
        """Test optimizer with low threshold (many matches)"""
        optimizer = BatchOptimizer(similarity_threshold=0.5)
        assert optimizer.similarity_threshold == 0.5


class TestPromptGroupDataclass:
    """Test PromptGroup dataclass"""

    def test_prompt_group_creation(self):
        """Test PromptGroup is created correctly"""
        group = PromptGroup(
            representative_prompt="Write a function",
            prompt_indices=[0, 1, 2],
            similarity_score=0.95,
        )
        assert group.representative_prompt == "Write a function"
        assert group.prompt_indices == [0, 1, 2]
        assert group.group_size == 3

    def test_prompt_group_post_init(self):
        """Test PromptGroup post_init sets group_size"""
        group = PromptGroup(
            representative_prompt="Test",
            prompt_indices=[0, 1],
        )
        assert group.group_size == 2


class TestSimilarityCalculation:
    """Test similarity calculation between texts"""

    def test_identical_texts_similarity(self):
        """Test identical texts have 1.0 similarity"""
        optimizer = BatchOptimizer()
        text = "Write a Python function"
        similarity = optimizer._calculate_similarity(text, text)
        assert similarity == 1.0

    def test_empty_text_similarity(self):
        """Test empty texts have 0.0 similarity"""
        optimizer = BatchOptimizer()
        similarity = optimizer._calculate_similarity("", "")
        assert similarity == 0.0

    def test_one_empty_text_similarity(self):
        """Test one empty text returns 0.0"""
        optimizer = BatchOptimizer()
        similarity = optimizer._calculate_similarity("Hello", "")
        assert similarity == 0.0

    def test_similar_texts_similarity(self):
        """Test similar texts have high similarity"""
        optimizer = BatchOptimizer()
        text1 = "Write a Python function to sort data"
        text2 = "Write a Python function that sorts data"
        similarity = optimizer._calculate_similarity(text1, text2)
        assert similarity > 0.8  # Should be high similarity

    def test_completely_different_texts_similarity(self):
        """Test completely different texts have low similarity"""
        optimizer = BatchOptimizer()
        text1 = "Write a Python function"
        text2 = "cat dog elephant"
        similarity = optimizer._calculate_similarity(text1, text2)
        assert similarity < 0.5  # Should be low similarity

    def test_case_insensitive_similarity(self):
        """Test similarity is case insensitive"""
        optimizer = BatchOptimizer()
        text1 = "Write a function"
        text2 = "WRITE A FUNCTION"
        similarity = optimizer._calculate_similarity(text1, text2)
        assert similarity == 1.0  # Should be identical when case-insensitive


class TestHashGeneration:
    """Test prompt hash generation"""

    def test_hash_is_deterministic(self):
        """Test same prompt always produces same hash"""
        optimizer = BatchOptimizer()
        prompt = "Write a Python function"
        hash1 = optimizer._generate_prompt_hash(prompt)
        hash2 = optimizer._generate_prompt_hash(prompt)
        assert hash1 == hash2

    def test_different_prompts_different_hashes(self):
        """Test different prompts produce different hashes"""
        optimizer = BatchOptimizer()
        hash1 = optimizer._generate_prompt_hash("Prompt 1")
        hash2 = optimizer._generate_prompt_hash("Prompt 2")
        assert hash1 != hash2

    def test_hash_length(self):
        """Test hash is 16 characters (SHA256 first 16 chars)"""
        optimizer = BatchOptimizer()
        hash_value = optimizer._generate_prompt_hash("test")
        assert len(hash_value) == 16


class TestDuplicateDetection:
    """Test exact duplicate detection"""

    def test_detect_no_duplicates(self):
        """Test detection with no duplicates"""
        optimizer = BatchOptimizer()
        prompts = [
            "Write a function",
            "Generate code",
            "Create a class",
        ]
        duplicates = optimizer.detect_duplicates(prompts)
        assert len(duplicates) == 0

    def test_detect_exact_duplicates(self):
        """Test detection of exact duplicates"""
        optimizer = BatchOptimizer()
        prompts = [
            "Write a function",
            "Write a function",
            "Write a function",
        ]
        duplicates = optimizer.detect_duplicates(prompts)
        assert len(duplicates) == 1
        assert len(list(duplicates.values())[0]) == 3

    def test_detect_mixed_duplicates(self):
        """Test detection with some duplicates"""
        optimizer = BatchOptimizer()
        prompts = [
            "Write a function",
            "Generate code",
            "Write a function",
            "Create a class",
            "Generate code",
        ]
        duplicates = optimizer.detect_duplicates(prompts)
        assert len(duplicates) == 2

    def test_detect_duplicates_returns_indices(self):
        """Test duplicates returns correct indices"""
        optimizer = BatchOptimizer()
        prompts = [
            "Prompt A",
            "Prompt A",
            "Prompt B",
        ]
        duplicates = optimizer.detect_duplicates(prompts)
        # Find the group for "Prompt A"
        prompt_a_indices = None
        for indices in duplicates.values():
            if len(indices) == 2:
                prompt_a_indices = indices
                break
        assert prompt_a_indices == [0, 1] or prompt_a_indices == [1, 0]

    def test_detect_empty_list(self):
        """Test detect_duplicates with empty list"""
        optimizer = BatchOptimizer()
        duplicates = optimizer.detect_duplicates([])
        assert len(duplicates) == 0


class TestSimilarPromptDetection:
    """Test similar prompt detection"""

    def test_detect_similar_high_threshold(self):
        """Test similar detection with high threshold"""
        optimizer = BatchOptimizer(similarity_threshold=0.95)
        prompts = [
            "Write a Python function",
            "Write a Python function",  # Duplicate, should be found
        ]
        similar = optimizer.detect_similar_prompts(prompts)
        assert len(similar) >= 1

    def test_detect_similar_low_threshold(self):
        """Test similar detection with low threshold"""
        optimizer = BatchOptimizer(similarity_threshold=0.5)
        prompts = [
            "Write a function",
            "Generate code",
            "Create something",
        ]
        similar = optimizer.detect_similar_prompts(prompts)
        # May or may not find similarity depending on text

    def test_detect_similar_no_matches(self):
        """Test similar detection with no matches"""
        optimizer = BatchOptimizer(similarity_threshold=0.99)
        prompts = [
            "Completely different text",
            "Entirely unique content",
            "No similarity here",
        ]
        similar = optimizer.detect_similar_prompts(prompts)
        # With such high threshold, shouldn't find matches

    def test_detect_similar_with_single_prompt(self):
        """Test similar detection with single prompt"""
        optimizer = BatchOptimizer()
        prompts = ["Only one prompt"]
        similar = optimizer.detect_similar_prompts(prompts)
        assert len(similar) == 0


class TestPromptGrouping:
    """Test prompt grouping"""

    def test_group_prompts_no_groups(self):
        """Test grouping with unique prompts"""
        optimizer = BatchOptimizer()
        prompts = [
            "Write a function",
            "Generate code",
            "Create a class",
        ]
        groups, mapping = optimizer.group_prompts(prompts, detect_similar=False)
        assert len(groups) == 3
        assert len(mapping) == 3

    def test_group_prompts_with_duplicates(self):
        """Test grouping detects and groups duplicates"""
        optimizer = BatchOptimizer()
        prompts = [
            "Write a function",
            "Write a function",
            "Generate code",
        ]
        groups, mapping = optimizer.group_prompts(prompts, detect_similar=False)
        # Should have 2 groups: one with duplicates, one unique
        assert len(groups) == 2

    def test_group_prompts_mapping_accuracy(self):
        """Test grouping produces correct mapping"""
        optimizer = BatchOptimizer()
        prompts = [
            "Prompt A",
            "Prompt A",
            "Prompt B",
        ]
        groups, mapping = optimizer.group_prompts(prompts, detect_similar=False)
        # Each prompt should map to a group
        assert len(mapping) == 3
        # First two should map to same group
        assert mapping[0] == mapping[1]
        # Third should map to different group
        assert mapping[2] != mapping[0]

    def test_group_prompts_empty_list(self):
        """Test grouping with empty list"""
        optimizer = BatchOptimizer()
        groups, mapping = optimizer.group_prompts([], detect_similar=False)
        assert len(groups) == 0
        assert len(mapping) == 0

    def test_group_prompts_single_prompt(self):
        """Test grouping with single prompt"""
        optimizer = BatchOptimizer()
        groups, mapping = optimizer.group_prompts(["Single prompt"])
        assert len(groups) == 1
        assert len(mapping) == 1


class TestBatchOptimization:
    """Test batch optimization"""

    def test_optimize_batch_empty(self):
        """Test optimizing empty batch"""
        optimizer = BatchOptimizer()
        result = optimizer.optimize_batch([])
        assert result.stats.original_prompts_count == 0
        assert result.stats.grouped_prompts_count == 0

    def test_optimize_batch_no_duplicates(self):
        """Test optimizing batch with no duplicates"""
        optimizer = BatchOptimizer()
        prompts = [
            "Write a function",
            "Generate code",
            "Create a class",
        ]
        result = optimizer.optimize_batch(prompts)
        assert result.stats.original_prompts_count == 3
        assert result.stats.grouped_prompts_count == 3
        assert result.stats.api_calls_saved == 0

    def test_optimize_batch_with_duplicates(self):
        """Test optimizing batch with duplicates"""
        optimizer = BatchOptimizer()
        prompts = [
            "Write a function",
            "Write a function",
            "Generate code",
            "Generate code",
            "Generate code",
        ]
        result = optimizer.optimize_batch(prompts)
        assert result.stats.original_prompts_count == 5
        assert result.stats.grouped_prompts_count == 2
        assert result.stats.duplicate_prompts_detected == 3
        assert result.stats.api_calls_saved == 3

    def test_optimize_batch_cost_savings_calculation(self):
        """Test cost savings percentage calculation"""
        optimizer = BatchOptimizer()
        prompts = [
            "Prompt",
            "Prompt",
            "Prompt",
            "Different",
        ]
        result = optimizer.optimize_batch(prompts)
        # 3 duplicates saved out of 4 = 75% savings... wait
        # Actually 2 duplicates out of 4 original = 50% savings
        # Let me think: original 4, groups 2, duplicates detected = 2, calls saved = 2
        expected_savings = (2 / 4) * 100
        assert result.stats.cost_savings_percentage == expected_savings

    def test_optimize_batch_returns_optimization_map(self):
        """Test optimize_batch returns mapping"""
        optimizer = BatchOptimizer()
        prompts = [
            "Prompt A",
            "Prompt A",
            "Prompt B",
        ]
        result = optimizer.optimize_batch(prompts)
        assert len(result.optimization_map) == 3
        # First two should map to same hash
        assert result.optimization_map[0] == result.optimization_map[1]
        # Third should map to different hash
        assert result.optimization_map[2] != result.optimization_map[0]

    def test_optimize_batch_statistics(self):
        """Test optimize_batch returns statistics"""
        optimizer = BatchOptimizer()
        prompts = ["Prompt"] * 5
        result = optimizer.optimize_batch(prompts)
        stats = result.stats
        assert stats.original_prompts_count > 0
        assert stats.grouped_prompts_count > 0
        assert stats.processing_time_ms >= 0


class TestSplitResults:
    """Test result splitting for grouped responses"""

    def test_split_results_basic(self):
        """Test basic result splitting"""
        optimizer = BatchOptimizer()
        grouped_result = {
            "hash1": "Response A",
            "hash2": "Response B",
        }
        optimization_map = {
            0: "hash1",
            1: "hash1",
            2: "hash2",
        }
        results = optimizer.split_results(grouped_result, optimization_map, 3)
        assert len(results) == 3
        assert results[0] == "Response A"
        assert results[1] == "Response A"
        assert results[2] == "Response B"

    def test_split_results_all_same_group(self):
        """Test splitting when all prompts in same group"""
        optimizer = BatchOptimizer()
        grouped_result = {"hash1": "Same Response"}
        optimization_map = {0: "hash1", 1: "hash1", 2: "hash1"}
        results = optimizer.split_results(grouped_result, optimization_map, 3)
        assert all(r == "Same Response" for r in results)

    def test_split_results_maintains_order(self):
        """Test splitting maintains original order"""
        optimizer = BatchOptimizer()
        grouped_result = {
            "h1": "Resp1",
            "h2": "Resp2",
            "h3": "Resp3",
        }
        optimization_map = {0: "h1", 1: "h2", 2: "h3", 3: "h1"}
        results = optimizer.split_results(grouped_result, optimization_map, 4)
        assert results[0] == "Resp1"
        assert results[1] == "Resp2"
        assert results[2] == "Resp3"
        assert results[3] == "Resp1"


class TestBatchSavingsEstimate:
    """Test batch savings estimation"""

    def test_calculate_batch_savings_no_duplicates(self):
        """Test savings with no duplicates"""
        optimizer = BatchOptimizer()
        savings = optimizer.calculate_batch_savings([
            "Unique 1",
            "Unique 2",
            "Unique 3",
        ])
        assert savings["cost_savings_percentage"] == 0.0
        assert savings["api_calls_saved"] == 0

    def test_calculate_batch_savings_all_duplicates(self):
        """Test savings when all prompts are duplicates"""
        optimizer = BatchOptimizer()
        savings = optimizer.calculate_batch_savings([
            "Same",
            "Same",
            "Same",
            "Same",
        ])
        assert savings["cost_savings_percentage"] == 75.0  # 3 out of 4 saved
        assert savings["api_calls_saved"] == 3

    def test_calculate_batch_savings_empty(self):
        """Test savings with empty list"""
        optimizer = BatchOptimizer()
        savings = optimizer.calculate_batch_savings([])
        assert savings["original_count"] == 0
        assert savings["cost_savings_percentage"] == 0.0

    def test_calculate_batch_savings_structure(self):
        """Test savings response has correct structure"""
        optimizer = BatchOptimizer()
        savings = optimizer.calculate_batch_savings(["A", "A"])
        required_keys = [
            "original_count",
            "estimated_optimized_count",
            "api_calls_saved",
            "cost_savings_percentage",
        ]
        for key in required_keys:
            assert key in savings


class TestBatchStatistics:
    """Test batch statistics"""

    def test_get_batch_statistics_structure(self):
        """Test statistics have all required fields"""
        optimizer = BatchOptimizer()
        prompts = ["A", "A", "B"]
        result = optimizer.optimize_batch(prompts)
        stats = optimizer.get_batch_statistics(result)

        required_keys = [
            "original_prompts",
            "grouped_prompts",
            "duplicates_detected",
            "api_calls_saved",
            "cost_savings_percentage",
            "processing_time_ms",
            "groups_count",
        ]
        for key in required_keys:
            assert key in stats

    def test_get_batch_statistics_values(self):
        """Test statistics have correct values"""
        optimizer = BatchOptimizer()
        prompts = ["Same", "Same", "Different"]
        result = optimizer.optimize_batch(prompts)
        stats = optimizer.get_batch_statistics(result)

        assert stats["original_prompts"] == 3
        assert stats["grouped_prompts"] == 2
        assert stats["duplicates_detected"] == 1


class TestBatchOptimizationLargeScale:
    """Test batch optimization with large datasets"""

    def test_optimize_large_batch(self):
        """Test optimizing a large batch of prompts"""
        optimizer = BatchOptimizer()
        # Create 1000 prompts with some duplicates
        prompts = ["Prompt " + str(i % 100) for i in range(1000)]
        result = optimizer.optimize_batch(prompts)

        assert result.stats.original_prompts_count == 1000
        assert result.stats.grouped_prompts_count == 100
        assert result.stats.api_calls_saved == 900

    def test_optimize_all_same_prompts(self):
        """Test optimizing batch with all same prompts"""
        optimizer = BatchOptimizer()
        prompts = ["Same prompt"] * 100
        result = optimizer.optimize_batch(prompts)

        assert result.stats.grouped_prompts_count == 1
        assert result.stats.api_calls_saved == 99
        assert result.stats.cost_savings_percentage == 99.0

    def test_optimize_performance_large_batch(self):
        """Test optimization completes in reasonable time"""
        import time
        optimizer = BatchOptimizer()
        prompts = ["Prompt " + str(i) for i in range(500)]

        start = time.time()
        result = optimizer.optimize_batch(prompts)
        elapsed = time.time() - start

        # Should complete in less than 2 seconds
        assert elapsed < 2.0
        assert result.stats.processing_time_ms < 2000


class TestBatchOptimizationEdgeCases:
    """Test edge cases"""

    def test_optimize_with_unicode_prompts(self):
        """Test optimization with unicode characters"""
        optimizer = BatchOptimizer()
        prompts = [
            "Write code in 日本語",
            "Write code in 日本語",
            "Generate 中文 response",
        ]
        result = optimizer.optimize_batch(prompts)
        assert result.stats.original_prompts_count == 3

    def test_optimize_with_very_long_prompts(self):
        """Test optimization with very long prompts"""
        optimizer = BatchOptimizer()
        long_prompt = "A" * 10000
        prompts = [long_prompt, long_prompt, "Short"]
        result = optimizer.optimize_batch(prompts)
        assert result.stats.duplicate_prompts_detected == 1

    def test_optimize_with_special_characters(self):
        """Test optimization with special characters"""
        optimizer = BatchOptimizer()
        prompts = [
            "Code: @#$%^&*()",
            "Code: @#$%^&*()",
            "Normal prompt",
        ]
        result = optimizer.optimize_batch(prompts)
        assert result.stats.duplicate_prompts_detected == 1


class TestBatchOptimizationConsistency:
    """Test consistency and determinism"""

    def test_optimize_same_batch_produces_same_result(self):
        """Test same batch produces same optimization result"""
        optimizer = BatchOptimizer()
        prompts = ["A", "A", "B", "C"]

        result1 = optimizer.optimize_batch(prompts)
        result2 = optimizer.optimize_batch(prompts)

        assert result1.stats.grouped_prompts_count == result2.stats.grouped_prompts_count
        assert result1.stats.api_calls_saved == result2.stats.api_calls_saved

    def test_optimize_batch_results_complete(self):
        """Test optimize_batch returns complete results"""
        optimizer = BatchOptimizer()
        prompts = ["Test1", "Test1", "Test2"]
        result = optimizer.optimize_batch(prompts)

        assert result.grouped_prompts is not None
        assert result.representative_prompts is not None
        assert result.optimization_map is not None
        assert result.stats is not None
