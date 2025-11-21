"""
Batch Optimization Service

Detects and consolidates similar prompts in batch requests to reduce API calls.
Uses fuzzy matching to identify duplicate/similar prompts and groups them together.
Expected cost savings: 10-20% for batch operations.
"""

import logging
import hashlib
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass, field
from difflib import SequenceMatcher
from collections import defaultdict

logger = logging.getLogger(__name__)


@dataclass
class PromptGroup:
    """Represents a group of similar prompts"""
    representative_prompt: str
    prompt_indices: List[int] = field(default_factory=list)
    similarity_score: float = 1.0
    group_size: int = 0

    def __post_init__(self):
        self.group_size = len(self.prompt_indices)


@dataclass
class BatchOptimizationStats:
    """Statistics about batch optimization results"""
    original_prompts_count: int
    grouped_prompts_count: int
    duplicate_prompts_detected: int
    api_calls_saved: int
    cost_savings_percentage: float
    processing_time_ms: float
    groups: List[Dict[str, Any]] = field(default_factory=list)


@dataclass
class BatchOptimizationResult:
    """Result of batch optimization"""
    grouped_prompts: Dict[str, List[int]]  # prompt_hash -> original_indices
    representative_prompts: Dict[str, str]  # prompt_hash -> prompt text
    stats: BatchOptimizationStats
    optimization_map: Dict[int, str]  # original_index -> representative_prompt_hash


class BatchOptimizer:
    """Service for optimizing batch prompt requests"""

    def __init__(self, similarity_threshold: float = 0.85):
        """
        Initialize batch optimizer.

        Args:
            similarity_threshold: Minimum similarity score to group prompts (0.0-1.0)
                                Defaults to 0.85 (85% similar)
        """
        self.similarity_threshold = similarity_threshold
        logger.info(f"BatchOptimizer initialized with threshold: {similarity_threshold}")

    def _calculate_similarity(self, text1: str, text2: str) -> float:
        """
        Calculate similarity between two texts using SequenceMatcher.

        Args:
            text1: First text
            text2: Second text

        Returns:
            Similarity score (0.0-1.0)

        Example:
            score = optimizer._calculate_similarity("hello world", "hello earth")
            # Returns approximately 0.73
        """
        if text1 == text2:
            return 1.0
        if not text1 or not text2:
            return 0.0

        matcher = SequenceMatcher(None, text1.lower(), text2.lower())
        return matcher.ratio()

    def _generate_prompt_hash(self, prompt: str) -> str:
        """
        Generate deterministic hash for prompt.

        Args:
            prompt: Prompt text

        Returns:
            SHA256 hash (first 16 chars)
        """
        return hashlib.sha256(prompt.encode()).hexdigest()[:16]

    def detect_duplicates(self, prompts: List[str]) -> Dict[str, List[int]]:
        """
        Detect exact duplicate prompts in a batch.

        Args:
            prompts: List of prompts to analyze

        Returns:
            Dict mapping prompt hash to list of indices

        Example:
            duplicates = optimizer.detect_duplicates([
                "Write a function",
                "Write a function",
                "Write a class"
            ])
            # Returns: {'hash1': [0, 1], 'hash2': [2]}
        """
        duplicates = defaultdict(list)

        for idx, prompt in enumerate(prompts):
            prompt_hash = self._generate_prompt_hash(prompt)
            duplicates[prompt_hash].append(idx)

        # Only return groups with duplicates (size > 1)
        return {k: v for k, v in duplicates.items() if len(v) > 1}

    def detect_similar_prompts(self, prompts: List[str]) -> Dict[str, List[int]]:
        """
        Detect similar prompts using fuzzy matching.

        Args:
            prompts: List of prompts to analyze

        Returns:
            Dict mapping representative prompt to list of similar indices

        Example:
            similar = optimizer.detect_similar_prompts([
                "Write a Python function to sort data",
                "Create a Python function that sorts data",
                "Generate C++ code for sorting"
            ])
            # Returns groups based on similarity threshold
        """
        if len(prompts) < 2:
            return {}

        # First pass: find exact duplicates
        duplicates = self.detect_duplicates(prompts)
        processed_indices = set()
        for indices in duplicates.values():
            processed_indices.update(indices)

        groups = defaultdict(list)

        # Second pass: find similar prompts
        for i, prompt1 in enumerate(prompts):
            if i in processed_indices:
                continue

            if i not in groups:
                groups[self._generate_prompt_hash(prompt1)].append(i)

            for j in range(i + 1, len(prompts)):
                if j in processed_indices or j in groups:
                    continue

                prompt2 = prompts[j]
                similarity = self._calculate_similarity(prompt1, prompt2)

                if similarity >= self.similarity_threshold:
                    groups[self._generate_prompt_hash(prompt1)].append(j)
                    processed_indices.add(j)

        return {k: v for k, v in groups.items() if len(v) > 1}

    def group_prompts(
        self,
        prompts: List[str],
        detect_similar: bool = True
    ) -> Tuple[List[PromptGroup], Dict[int, int]]:
        """
        Group prompts into batches for optimization.

        Args:
            prompts: List of prompts to group
            detect_similar: Whether to detect similar (True) or just duplicates (False)

        Returns:
            Tuple of (PromptGroup list, index mapping dict)
            Index mapping: original_index -> group_index

        Example:
            groups, mapping = optimizer.group_prompts([
                "prompt1",
                "prompt1",  # duplicate
                "similar prompt1",  # similar to prompt1
                "prompt2"
            ])
            # Returns 2 groups (duplicates + similar, and unique)
        """
        if not prompts:
            return [], {}

        # Detect exact duplicates first
        duplicate_groups = self.detect_duplicates(prompts)

        # Then detect similar prompts
        if detect_similar:
            similar_groups = self.detect_similar_prompts(prompts)
            # Merge similar groups with duplicate groups
            all_groups = {**duplicate_groups, **similar_groups}
        else:
            all_groups = duplicate_groups

        # Create PromptGroup objects
        prompt_groups = []
        index_mapping = {}
        processed_indices = set()

        # Process grouped prompts
        for group_hash, indices in all_groups.items():
            if not indices:
                continue

            representative_idx = indices[0]
            group = PromptGroup(
                representative_prompt=prompts[representative_idx],
                prompt_indices=indices,
                similarity_score=1.0 if len(set(prompts[i] for i in indices)) == 1 else self.similarity_threshold,
            )
            prompt_groups.append(group)

            for idx in indices:
                index_mapping[idx] = len(prompt_groups) - 1
                processed_indices.add(idx)

        # Add ungrouped prompts as single-item groups
        for idx, prompt in enumerate(prompts):
            if idx not in processed_indices:
                group = PromptGroup(
                    representative_prompt=prompt,
                    prompt_indices=[idx],
                    similarity_score=1.0,
                )
                prompt_groups.append(group)
                index_mapping[idx] = len(prompt_groups) - 1

        return prompt_groups, index_mapping

    def optimize_batch(
        self,
        prompts: List[str],
        system_message: Optional[str] = None,
        detect_similar: bool = True
    ) -> BatchOptimizationResult:
        """
        Optimize a batch of prompts by grouping and consolidating.

        Args:
            prompts: List of prompts to optimize
            system_message: Optional system message (same for all)
            detect_similar: Whether to detect similar prompts

        Returns:
            BatchOptimizationResult with grouping information and stats

        Example:
            result = optimizer.optimize_batch([
                "Write a function",
                "Write a function",
                "Write a class",
                "Create a function"
            ])
            # Returns grouping with stats showing duplicates detected
        """
        import time
        start_time = time.time()

        if not prompts:
            stats = BatchOptimizationStats(
                original_prompts_count=0,
                grouped_prompts_count=0,
                duplicate_prompts_detected=0,
                api_calls_saved=0,
                cost_savings_percentage=0.0,
                processing_time_ms=0.0,
            )
            return BatchOptimizationResult(
                grouped_prompts={},
                representative_prompts={},
                stats=stats,
                optimization_map={},
            )

        # Group prompts
        groups, index_mapping = self.group_prompts(prompts, detect_similar)

        # Build result data structures
        grouped_prompts = defaultdict(list)
        representative_prompts = {}
        optimization_map = {}

        for group in groups:
            group_hash = self._generate_prompt_hash(group.representative_prompt)
            representative_prompts[group_hash] = group.representative_prompt

            for idx in group.prompt_indices:
                grouped_prompts[group_hash].append(idx)
                optimization_map[idx] = group_hash

        # Calculate statistics
        original_count = len(prompts)
        grouped_count = len(groups)
        duplicates_detected = original_count - grouped_count
        api_calls_saved = duplicates_detected
        cost_savings_percentage = (duplicates_detected / original_count * 100) if original_count > 0 else 0.0

        # Build group details
        groups_details = []
        for group_hash, indices in grouped_prompts.items():
            groups_details.append({
                "prompt_hash": group_hash,
                "representative_prompt": representative_prompts[group_hash],
                "count": len(indices),
                "indices": indices,
                "is_duplicate": len(indices) > 1,
            })

        elapsed_ms = (time.time() - start_time) * 1000

        stats = BatchOptimizationStats(
            original_prompts_count=original_count,
            grouped_prompts_count=grouped_count,
            duplicate_prompts_detected=duplicates_detected,
            api_calls_saved=api_calls_saved,
            cost_savings_percentage=cost_savings_percentage,
            processing_time_ms=elapsed_ms,
            groups=groups_details,
        )

        logger.info(
            f"Batch optimization: {original_count} → {grouped_count} "
            f"(saved {api_calls_saved} calls, {cost_savings_percentage:.1f}% savings)"
        )

        return BatchOptimizationResult(
            grouped_prompts=dict(grouped_prompts),
            representative_prompts=representative_prompts,
            stats=stats,
            optimization_map=optimization_map,
        )

    def split_results(
        self,
        grouped_result: Dict[str, Any],
        optimization_map: Dict[int, str],
        original_prompts_count: int
    ) -> List[Any]:
        """
        Split grouped API results back to individual original requests.

        Args:
            grouped_result: Result from API call on grouped prompts
            optimization_map: Mapping from original index to group hash
            original_prompts_count: Total number of original prompts

        Returns:
            List of results in original order

        Example:
            results = optimizer.split_results(
                {"group1": "response"},
                {0: "group1", 1: "group1", 2: "group2"},
                3
            )
            # Returns 3 results (with duplicates getting same response)
        """
        # Create reverse mapping
        reverse_map = defaultdict(list)
        for original_idx, group_hash in optimization_map.items():
            reverse_map[group_hash].append(original_idx)

        # Build result list in original order
        split_results = [None] * original_prompts_count

        for group_hash, original_indices in reverse_map.items():
            if group_hash in grouped_result:
                response = grouped_result[group_hash]
                for idx in original_indices:
                    split_results[idx] = response

        return split_results

    def calculate_batch_savings(self, prompts: List[str]) -> Dict[str, Any]:
        """
        Calculate potential cost savings for a batch without optimizing.

        Args:
            prompts: List of prompts to analyze

        Returns:
            Dict with savings analysis

        Example:
            savings = optimizer.calculate_batch_savings([
                "Write a function",
                "Write a function",
                "Write a class"
            ])
            # Returns estimated cost savings
        """
        if not prompts:
            return {
                "original_count": 0,
                "estimated_optimized_count": 0,
                "api_calls_saved": 0,
                "cost_savings_percentage": 0.0,
            }

        # Detect duplicates
        duplicates = self.detect_duplicates(prompts)

        original_count = len(prompts)
        duplicates_detected = sum(len(indices) - 1 for indices in duplicates.values())
        estimated_optimized_count = original_count - duplicates_detected

        cost_savings_percentage = (duplicates_detected / original_count * 100) if original_count > 0 else 0.0

        return {
            "original_count": original_count,
            "estimated_optimized_count": estimated_optimized_count,
            "api_calls_saved": duplicates_detected,
            "cost_savings_percentage": cost_savings_percentage,
            "duplicate_groups": len(duplicates),
        }

    def get_batch_statistics(self, result: BatchOptimizationResult) -> Dict[str, Any]:
        """
        Get comprehensive statistics about batch optimization.

        Args:
            result: BatchOptimizationResult from optimize_batch()

        Returns:
            Dict with detailed statistics

        Example:
            stats = optimizer.get_batch_statistics(result)
            # Returns detailed breakdown of optimization
        """
        return {
            "original_prompts": result.stats.original_prompts_count,
            "grouped_prompts": result.stats.grouped_prompts_count,
            "duplicates_detected": result.stats.duplicate_prompts_detected,
            "api_calls_saved": result.stats.api_calls_saved,
            "cost_savings_percentage": result.stats.cost_savings_percentage,
            "processing_time_ms": result.stats.processing_time_ms,
            "groups_count": len(result.stats.groups),
            "group_details": result.stats.groups,
        }
