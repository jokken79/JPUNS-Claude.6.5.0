"""
Prompt Optimization Service

Optimizes AI prompts to reduce token count without losing quality.
Strategies include whitespace normalization, text condensation, and redundancy removal.
"""

import logging
import re
from typing import Dict, Any, Optional, Tuple
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class OptimizationStats:
    """Statistics about optimization results"""
    original_length: int
    optimized_length: int
    tokens_saved: int
    reduction_percentage: float
    strategies_applied: list


class PromptOptimizer:
    """Service for optimizing prompts to reduce token count"""

    # Approximate tokens per character (varies by model, but ~4 chars = 1 token)
    TOKENS_PER_CHAR = 0.25

    # Common redundant phrases that can be removed
    REDUNDANT_PHRASES = [
        r"\bplease\s+",  # "please" at start of sentences
        r"\b(i\s+)?would\s+like\s+you\s+to\s+",  # "I would like you to"
        r"\bthanks\s+in\s+advance\b",  # "thanks in advance"
        r"\bthank\s+you\b",  # "thank you" (at end)
        r"\bi\s+appreciate\s+",  # "I appreciate"
        r"\bcan\s+you\s+",  # "Can you" (sometimes redundant)
    ]

    # Common verbose phrases and their concise alternatives
    VERBOSE_REPLACEMENTS = {
        r"\bgenerate\s+code\s+for\s+me\b": "generate code",
        r"\bcan\s+you\s+please\s+": "please ",
        r"\bcould\s+you\s+please\s+": "please ",
        r"\bwould\s+you\s+mind\s+": "",
        r"\bi\s+need\s+you\s+to\s+": "please ",
        r"\bis\s+it\s+possible\s+to\s+": "",
        r"\bwould\s+you\s+be\s+so\s+kind\s+to\s+": "",
        r"\bif\s+possible\b": "",
        r"\bas\s+if\s+possible\b": "",
        r"\bif\s+you\s+could\b": "",
    }

    def __init__(self, aggressive: bool = False):
        """
        Initialize prompt optimizer.

        Args:
            aggressive: If True, apply more aggressive optimization (more reduction, slight quality loss)
        """
        self.aggressive = aggressive

    def optimize(self, prompt: str, system_message: Optional[str] = None) -> Tuple[str, str, OptimizationStats]:
        """
        Optimize prompt and system message.

        Args:
            prompt: User prompt to optimize
            system_message: Optional system message to optimize

        Returns:
            Tuple of (optimized_prompt, optimized_system_message, stats)
        """
        strategies_applied = []

        # Optimize prompt
        optimized_prompt = prompt
        original_prompt_length = len(prompt)

        # Apply optimizations in sequence
        optimized_prompt = self._normalize_whitespace(optimized_prompt)
        strategies_applied.append("whitespace_normalization")

        optimized_prompt = self._remove_redundancies(optimized_prompt)
        strategies_applied.append("redundancy_removal")

        optimized_prompt = self._condense_verbose_phrases(optimized_prompt)
        strategies_applied.append("verbose_phrase_condensation")

        if self.aggressive:
            optimized_prompt = self._aggressive_compression(optimized_prompt)
            strategies_applied.append("aggressive_compression")

        # Optimize system message
        optimized_system_message = system_message
        original_system_length = len(system_message) if system_message else 0

        if system_message:
            optimized_system_message = self._normalize_whitespace(system_message)
            optimized_system_message = self._remove_redundancies(optimized_system_message)
            optimized_system_message = self._condense_verbose_phrases(optimized_system_message)

            if self.aggressive:
                optimized_system_message = self._aggressive_compression(optimized_system_message)

        # Calculate statistics
        total_original = original_prompt_length + original_system_length
        total_optimized = len(optimized_prompt) + len(optimized_system_message or "")
        chars_saved = total_original - total_optimized
        tokens_saved = int(chars_saved * self.TOKENS_PER_CHAR)
        reduction_percentage = (chars_saved / total_original * 100) if total_original > 0 else 0

        stats = OptimizationStats(
            original_length=total_original,
            optimized_length=total_optimized,
            tokens_saved=tokens_saved,
            reduction_percentage=round(reduction_percentage, 2),
            strategies_applied=strategies_applied,
        )

        logger.info(f"Optimized prompt: saved {tokens_saved} tokens ({reduction_percentage:.1f}%)")

        return optimized_prompt, optimized_system_message or "", stats

    def _normalize_whitespace(self, text: str) -> str:
        """
        Remove excess whitespace without changing meaning.

        Args:
            text: Text to normalize

        Returns:
            Normalized text
        """
        # Remove leading/trailing whitespace
        text = text.strip()

        # Collapse multiple spaces to single space
        text = re.sub(r" +", " ", text)

        # Remove spaces around punctuation
        text = re.sub(r" +([.,!?;:])", r"\1", text)
        text = re.sub(r"([.,!?;:]) +", r"\1 ", text)

        # Collapse multiple newlines to single newline
        text = re.sub(r"\n\n+", "\n", text)

        # Remove trailing spaces on each line
        text = "\n".join(line.rstrip() for line in text.split("\n"))

        return text

    def _remove_redundancies(self, text: str) -> str:
        """
        Remove redundant phrases.

        Args:
            text: Text to optimize

        Returns:
            Text with redundancies removed
        """
        for phrase_pattern in self.REDUNDANT_PHRASES:
            text = re.sub(phrase_pattern, "", text, flags=re.IGNORECASE)

        # Remove duplicate sentences (simple approach)
        sentences = text.split(". ")
        unique_sentences = []
        for sentence in sentences:
            if sentence not in unique_sentences:
                unique_sentences.append(sentence)

        text = ". ".join(unique_sentences)

        return self._normalize_whitespace(text)

    def _condense_verbose_phrases(self, text: str) -> str:
        """
        Replace verbose phrases with concise alternatives.

        Args:
            text: Text to condense

        Returns:
            Condensed text
        """
        for verbose, concise in self.VERBOSE_REPLACEMENTS.items():
            text = re.sub(verbose, concise, text, flags=re.IGNORECASE)

        return self._normalize_whitespace(text)

    def _aggressive_compression(self, text: str) -> str:
        """
        Apply aggressive compression (more reduction, slight quality trade-off).

        Args:
            text: Text to compress

        Returns:
            Compressed text
        """
        # Remove explanatory phrases
        text = re.sub(r"\b(as\s+you\s+)?know,?\s+", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\b(basically|essentially|in\s+essence),?\s+", "", text, flags=re.IGNORECASE)

        # Remove filler words
        text = re.sub(r"\b(well|right|okay|alright),?\s+", "", text, flags=re.IGNORECASE)

        # Contract common phrases
        text = re.sub(r"\byour\s+", "yr ", text, flags=re.IGNORECASE)
        text = re.sub(r"\bwith\s+", "w/ ", text, flags=re.IGNORECASE)
        text = re.sub(r"\bwithout\s+", "w/o ", text, flags=re.IGNORECASE)
        text = re.sub(r"\bfor\s+", "4 ", text, flags=re.IGNORECASE)

        return self._normalize_whitespace(text)

    def calculate_token_savings(self, original_text: str, optimized_text: str) -> Dict[str, Any]:
        """
        Calculate token savings between original and optimized text.

        Args:
            original_text: Original text
            optimized_text: Optimized text

        Returns:
            Dict with savings information
        """
        original_length = len(original_text)
        optimized_length = len(optimized_text)
        chars_saved = original_length - optimized_length
        tokens_saved = int(chars_saved * self.TOKENS_PER_CHAR)
        reduction_percentage = (chars_saved / original_length * 100) if original_length > 0 else 0

        return {
            "original_chars": original_length,
            "optimized_chars": optimized_length,
            "chars_saved": chars_saved,
            "tokens_saved": tokens_saved,
            "reduction_percentage": round(reduction_percentage, 2),
        }

    def get_optimization_recommendations(self, prompt: str) -> list:
        """
        Get specific recommendations for optimizing a prompt.

        Args:
            prompt: Prompt to analyze

        Returns:
            List of recommendations
        """
        recommendations = []

        # Check for redundant phrases
        if re.search(r"\bplease\b.*\bplease\b", prompt, re.IGNORECASE):
            recommendations.append("Multiple instances of 'please' - consider removing some")

        # Check for excessive punctuation
        if prompt.count("!!") > 0 or prompt.count("??") > 0:
            recommendations.append("Multiple punctuation marks detected - can be condensed")

        # Check for polite filler words
        if re.search(r"\b(could you|would you|can you)\b", prompt, re.IGNORECASE):
            recommendations.append("Consider removing polite phrases like 'could you' or 'would you'")

        # Check for explanation overhead
        if re.search(r"\b(basically|essentially|you know)\b", prompt, re.IGNORECASE):
            recommendations.append("Remove explanatory filler words (basically, essentially, etc.)")

        # Check for all-caps sections (often less efficient)
        if any(word.isupper() and len(word) > 2 for word in prompt.split()):
            recommendations.append("Consider converting all-caps words to normal case for tokenization efficiency")

        # Check for code blocks that might benefit from comments removal
        if "```" in prompt:
            recommendations.append("Code blocks detected - remove comments for efficiency")

        # Check for excessive whitespace
        if "\n\n" in prompt or "  " in prompt:
            recommendations.append("Multiple spaces or line breaks detected - normalize whitespace")

        return recommendations

    def estimate_savings(self, prompt: str, system_message: Optional[str] = None) -> Dict[str, Any]:
        """
        Estimate token savings without actually optimizing.

        Args:
            prompt: Prompt to analyze
            system_message: Optional system message

        Returns:
            Dict with estimated savings
        """
        total_original = len(prompt) + len(system_message or "")

        # Estimate reduction based on typical patterns
        estimated_reduction = total_original * 0.15  # Assume ~15% reduction
        if self.aggressive:
            estimated_reduction = total_original * 0.25  # Assume ~25% reduction

        estimated_tokens_saved = int(estimated_reduction * self.TOKENS_PER_CHAR)

        return {
            "original_chars": total_original,
            "estimated_reduction_chars": int(estimated_reduction),
            "estimated_tokens_saved": estimated_tokens_saved,
            "estimated_reduction_percentage": round((estimated_reduction / total_original * 100), 2),
            "mode": "aggressive" if self.aggressive else "normal",
        }
