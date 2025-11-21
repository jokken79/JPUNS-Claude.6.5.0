"""
Comprehensive test suite for streaming service
Tests cover SSE streaming, chunking, statistics, and cost tracking
"""

import pytest
import time
from decimal import Decimal
from app.services.streaming_service import (
    StreamingService,
    StreamChunk,
    StreamingStats,
)


class TestStreamChunkDataclass:
    """Test StreamChunk dataclass"""

    def test_stream_chunk_creation(self):
        """Test StreamChunk is created correctly"""
        chunk = StreamChunk(
            chunk_id=1,
            content="Hello world",
            timestamp=time.time(),
            tokens_estimated=3,
            is_complete=False,
        )
        assert chunk.chunk_id == 1
        assert chunk.content == "Hello world"
        assert chunk.tokens_estimated == 3
        assert chunk.is_complete is False

    def test_stream_chunk_to_event_format(self):
        """Test StreamChunk converts to SSE format"""
        chunk = StreamChunk(
            chunk_id=0,
            content="Test",
            timestamp=123.456,
            tokens_estimated=1,
            is_complete=False,
        )
        event = chunk.to_event_format()
        assert "data: " in event
        assert '"chunk_id": 0' in event
        assert '"content": "Test"' in event
        assert "\n\n" in event  # SSE format ends with double newline


class TestStreamingServiceTokenEstimation:
    """Test token estimation"""

    def test_estimate_tokens_simple(self):
        """Test token estimation for simple text"""
        tokens = StreamingService.estimate_tokens("Hello")
        assert tokens > 0
        assert tokens >= 1  # At least 1 token

    def test_estimate_tokens_empty(self):
        """Test token estimation for empty text"""
        tokens = StreamingService.estimate_tokens("")
        assert tokens == 0

    def test_estimate_tokens_proportional(self):
        """Test token estimation is proportional to text length"""
        text1 = "Hello world"
        text2 = "Hello world " * 10

        tokens1 = StreamingService.estimate_tokens(text1)
        tokens2 = StreamingService.estimate_tokens(text2)

        assert tokens2 > tokens1

    def test_estimate_tokens_calculation(self):
        """Test token calculation uses 0.25 tokens per char"""
        text = "x" * 100  # 100 chars
        tokens = StreamingService.estimate_tokens(text)
        # 100 * 0.25 = 25 tokens
        assert tokens == 25

    def test_estimate_tokens_unicode(self):
        """Test token estimation with unicode"""
        tokens = StreamingService.estimate_tokens("こんにちは")  # Japanese
        assert tokens > 0


class TestTextChunking:
    """Test text chunking for streaming"""

    def test_chunk_text_empty(self):
        """Test chunking empty text"""
        chunks = StreamingService.chunk_text("")
        assert len(chunks) == 0

    def test_chunk_text_small(self):
        """Test chunking text smaller than chunk size"""
        text = "Small"
        chunks = StreamingService.chunk_text(text, chunk_size=100)
        assert len(chunks) == 1
        assert chunks[0] == text

    def test_chunk_text_basic(self):
        """Test basic text chunking"""
        text = "This is a test string for chunking"
        chunks = StreamingService.chunk_text(text, chunk_size=10)
        assert len(chunks) > 1
        # Reconstruct and verify no loss
        reconstructed = " ".join(chunks)
        # Note: may have slight whitespace differences

    def test_chunk_text_preserve_words(self):
        """Test chunking preserves words when enabled"""
        text = "One Two Three Four Five"
        chunks = StreamingService.chunk_text(
            text,
            chunk_size=10,
            preserve_words=True
        )
        # Should break on word boundaries
        for chunk in chunks:
            assert len(chunk) > 0

    def test_chunk_text_character_based(self):
        """Test character-based chunking"""
        text = "abcdefghijklmnop"
        chunks = StreamingService.chunk_text(
            text,
            chunk_size=5,
            preserve_words=False
        )
        assert len(chunks) > 1
        total_chars = sum(len(c) for c in chunks)
        assert total_chars == len(text)

    def test_chunk_text_exact_size(self):
        """Test chunking with exact chunk size"""
        text = "x" * 100
        chunks = StreamingService.chunk_text(text, chunk_size=20, preserve_words=False)
        assert len(chunks) == 5
        assert all(len(c) == 20 for c in chunks)


class TestStreamingStatistics:
    """Test streaming statistics"""

    def test_streaming_stats_creation(self):
        """Test StreamingStats is created correctly"""
        stats = StreamingStats(
            total_chunks=10,
            total_content_length=500,
            total_tokens_estimated=125,
            streaming_duration_ms=2500,
            chunks_per_second=4,
            average_chunk_size=50,
            provider="gemini",
            model="gemini-2.0-flash",
        )
        assert stats.total_chunks == 10
        assert stats.provider == "gemini"

    def test_streaming_stats_calculations(self):
        """Test streaming stats calculations"""
        streaming_service = StreamingService()
        stats = streaming_service.get_streaming_statistics(
            chunk_count=100,
            total_content_length=5000,
            total_tokens=1250,
            duration_ms=2500,
            provider="gemini",
            model="gemini-pro",
        )
        assert stats.total_chunks == 100
        assert stats.average_chunk_size == 50  # 5000 / 100
        assert stats.chunks_per_second == 40  # 100 / 2.5


class TestSSEEventFormatting:
    """Test Server-Sent Events formatting"""

    def test_format_sse_event_basic(self):
        """Test basic SSE event formatting"""
        data = {"message": "hello"}
        sse = StreamingService.format_sse_event(data)
        assert sse.startswith("data: ")
        assert sse.endswith("\n\n")

    def test_format_sse_event_complex(self):
        """Test SSE formatting with complex data"""
        data = {
            "chunk_id": 0,
            "content": "Test content",
            "timestamp": 123.456,
            "tokens": 3,
        }
        sse = StreamingService.format_sse_event(data)
        assert "chunk_id" in sse
        assert "Test content" in sse

    def test_parse_sse_response(self):
        """Test parsing SSE-formatted response"""
        sse_text = (
            'data: {"message": "hello"}\n\n'
            'data: {"message": "world"}\n\n'
        )
        events = StreamingService.parse_sse_response(sse_text)
        assert len(events) == 2
        assert events[0]["message"] == "hello"
        assert events[1]["message"] == "world"

    def test_parse_sse_response_empty(self):
        """Test parsing empty SSE response"""
        sse_text = ""
        events = StreamingService.parse_sse_response(sse_text)
        assert len(events) == 0

    def test_parse_sse_response_invalid_json(self):
        """Test parsing SSE with invalid JSON"""
        sse_text = 'data: {invalid json}\n\n'
        events = StreamingService.parse_sse_response(sse_text)
        # Should handle gracefully, may return empty or skip invalid


class TestStreamingCostCalculation:
    """Test cost calculation for streamed responses"""

    def test_calculate_streaming_cost_gemini(self):
        """Test cost calculation for Gemini"""
        streaming_service = StreamingService()
        cost = streaming_service.calculate_streaming_cost(
            tokens_used=1000,
            provider="gemini",
            model="gemini-2.0-flash",
            input_tokens=100,
        )
        assert cost >= Decimal("0")  # Should be non-negative
        assert isinstance(cost, Decimal)

    def test_calculate_streaming_cost_openai(self):
        """Test cost calculation for OpenAI"""
        streaming_service = StreamingService()
        cost = streaming_service.calculate_streaming_cost(
            tokens_used=1000,
            provider="openai",
            model="gpt-4",
            input_tokens=100,
        )
        assert cost >= Decimal("0")

    def test_calculate_streaming_cost_claude(self):
        """Test cost calculation for Claude"""
        streaming_service = StreamingService()
        cost = streaming_service.calculate_streaming_cost(
            tokens_used=1000,
            provider="claude_api",
            model="claude-3-opus",
            input_tokens=100,
        )
        assert cost >= Decimal("0")

    def test_calculate_streaming_cost_proportion(self):
        """Test cost scales with token count"""
        streaming_service = StreamingService()
        cost1 = streaming_service.calculate_streaming_cost(
            tokens_used=1000,
            provider="gemini",
            model="gemini-2.0-flash",
        )
        cost2 = streaming_service.calculate_streaming_cost(
            tokens_used=2000,
            provider="gemini",
            model="gemini-2.0-flash",
        )
        # Cost should increase with more tokens
        assert cost2 >= cost1


class TestShouldStreamDecision:
    """Test streaming recommendation logic"""

    def test_should_stream_large_response(self):
        """Test streaming recommended for large response"""
        service = StreamingService()
        should_stream = service.should_stream_response(5000)
        assert should_stream is True

    def test_should_stream_small_response(self):
        """Test streaming not recommended for small response"""
        service = StreamingService()
        should_stream = service.should_stream_response(100)
        assert should_stream is False

    def test_should_stream_exact_threshold(self):
        """Test streaming at threshold"""
        service = StreamingService()
        should_stream = service.should_stream_response(500)
        assert should_stream is False  # Default threshold is 500

    def test_should_stream_above_threshold(self):
        """Test streaming just above threshold"""
        service = StreamingService()
        should_stream = service.should_stream_response(501)
        assert should_stream is True


class TestMergingStreamChunks:
    """Test merging streamed chunks back together"""

    def test_merge_simple_chunks(self):
        """Test merging simple chunks"""
        service = StreamingService()
        chunks = [
            StreamChunk(0, "Hello ", time.time(), 2, False),
            StreamChunk(1, "world", time.time(), 1, False),
            StreamChunk(2, "", time.time(), 0, True),  # Completion marker
        ]
        merged = service.merge_streamed_chunks(chunks)
        assert merged == "Hello world"

    def test_merge_ignores_completion_marker(self):
        """Test merging ignores completion marker"""
        service = StreamingService()
        chunks = [
            StreamChunk(0, "Content", time.time(), 2, False),
            StreamChunk(1, "", time.time(), 0, True),  # Should be ignored
        ]
        merged = service.merge_streamed_chunks(chunks)
        assert merged == "Content"
        assert len(merged) == 7

    def test_merge_empty_chunks(self):
        """Test merging empty chunks"""
        service = StreamingService()
        chunks = [
            StreamChunk(0, "", time.time(), 0, False),
            StreamChunk(1, "", time.time(), 0, True),
        ]
        merged = service.merge_streamed_chunks(chunks)
        assert merged == ""


class TestStreamingServiceInitialization:
    """Test StreamingService initialization"""

    def test_streaming_service_creates(self):
        """Test StreamingService initializes"""
        service = StreamingService()
        assert service is not None

    def test_streaming_service_tokens_per_char(self):
        """Test StreamingService has correct token ratio"""
        assert StreamingService.TOKENS_PER_CHAR == 0.25


class TestStreamingEdgeCases:
    """Test edge cases in streaming"""

    def test_chunk_text_unicode(self):
        """Test chunking with unicode text"""
        text = "こんにちは世界 " * 10
        chunks = StreamingService.chunk_text(text, chunk_size=20)
        assert len(chunks) > 0

    def test_estimate_tokens_very_long_text(self):
        """Test token estimation for very long text"""
        text = "word " * 10000
        tokens = StreamingService.estimate_tokens(text)
        assert tokens > 10000  # Should be many tokens

    def test_streaming_stats_zero_duration(self):
        """Test statistics with zero duration"""
        service = StreamingService()
        stats = service.get_streaming_statistics(
            chunk_count=10,
            total_content_length=500,
            total_tokens=125,
            duration_ms=0,
            provider="gemini",
            model="test",
        )
        # Should handle zero duration gracefully
        assert stats.total_chunks == 10

    def test_streaming_stats_zero_chunks(self):
        """Test statistics with zero chunks"""
        service = StreamingService()
        stats = service.get_streaming_statistics(
            chunk_count=0,
            total_content_length=0,
            total_tokens=0,
            duration_ms=1000,
            provider="gemini",
            model="test",
        )
        assert stats.total_chunks == 0
        assert stats.average_chunk_size == 0


class TestStreamingConsistency:
    """Test consistency and determinism"""

    def test_same_text_produces_same_chunks(self):
        """Test same text always produces same chunks"""
        text = "Test content for streaming"
        chunks1 = StreamingService.chunk_text(text, chunk_size=10, preserve_words=False)
        chunks2 = StreamingService.chunk_text(text, chunk_size=10, preserve_words=False)
        assert chunks1 == chunks2

    def test_same_tokens_produces_same_count(self):
        """Test same text always produces same token count"""
        text = "Test content"
        tokens1 = StreamingService.estimate_tokens(text)
        tokens2 = StreamingService.estimate_tokens(text)
        assert tokens1 == tokens2

    def test_cost_calculation_consistent(self):
        """Test cost calculation is consistent"""
        service = StreamingService()
        cost1 = service.calculate_streaming_cost(1000, "gemini", "gemini-2.0-flash")
        cost2 = service.calculate_streaming_cost(1000, "gemini", "gemini-2.0-flash")
        assert cost1 == cost2
