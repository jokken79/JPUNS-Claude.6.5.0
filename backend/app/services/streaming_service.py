"""
Streaming Response Service

Handles Server-Sent Events (SSE) streaming for real-time AI responses.
Supports partial response streaming, token counting, and cost tracking for streaming.
"""

import logging
import json
import time
from typing import AsyncGenerator, Optional, Dict, Any, List
from dataclasses import dataclass
from decimal import Decimal

logger = logging.getLogger(__name__)


@dataclass
class StreamChunk:
    """Represents a streamed chunk of data"""
    chunk_id: int
    content: str
    timestamp: float
    tokens_estimated: int
    is_complete: bool = False

    def to_event_format(self) -> str:
        """Convert to SSE event format"""
        data = {
            "chunk_id": self.chunk_id,
            "content": self.content,
            "timestamp": self.timestamp,
            "tokens_estimated": self.tokens_estimated,
            "is_complete": self.is_complete,
        }
        return f"data: {json.dumps(data)}\n\n"


@dataclass
class StreamingStats:
    """Statistics about a streaming session"""
    total_chunks: int
    total_content_length: int
    total_tokens_estimated: int
    streaming_duration_ms: float
    chunks_per_second: float
    average_chunk_size: float
    provider: str
    model: str


class StreamingService:
    """Service for handling streaming responses"""

    # Approximate tokens per character
    TOKENS_PER_CHAR = 0.25

    def __init__(self):
        """Initialize streaming service"""
        logger.info("StreamingService initialized")

    @staticmethod
    def estimate_tokens(text: str) -> int:
        """
        Estimate tokens in text.

        Args:
            text: Text to estimate tokens for

        Returns:
            Estimated token count (0.25 tokens per char)

        Example:
            tokens = StreamingService.estimate_tokens("Hello world")
            # Returns approximately 3 tokens
        """
        return max(1, int(len(text) * StreamingService.TOKENS_PER_CHAR))

    @staticmethod
    def chunk_text(
        text: str,
        chunk_size: int = 100,
        preserve_words: bool = True
    ) -> List[str]:
        """
        Split text into chunks for streaming.

        Args:
            text: Text to chunk
            chunk_size: Approximate size of each chunk
            preserve_words: Try to break on word boundaries

        Returns:
            List of text chunks

        Example:
            chunks = StreamingService.chunk_text(
                "This is a long text...",
                chunk_size=20
            )
        """
        if not text:
            return []

        if len(text) <= chunk_size:
            return [text]

        chunks = []
        if preserve_words:
            words = text.split()
            current_chunk = ""

            for word in words:
                if len(current_chunk) + len(word) + 1 <= chunk_size:
                    current_chunk += (word + " " if current_chunk else word)
                else:
                    if current_chunk:
                        chunks.append(current_chunk.strip())
                    current_chunk = word

            if current_chunk:
                chunks.append(current_chunk.strip())
        else:
            # Simple character-based chunking
            for i in range(0, len(text), chunk_size):
                chunks.append(text[i:i + chunk_size])

        return chunks

    async def stream_response(
        self,
        response_generator: AsyncGenerator[str, None],
        chunk_size: int = 50,
        delay_ms: int = 0,
        provider: str = "unknown",
        model: str = "unknown",
    ) -> AsyncGenerator[StreamChunk, None]:
        """
        Stream response chunks with SSE formatting.

        Args:
            response_generator: Async generator yielding response text
            chunk_size: Size of chunks to yield
            delay_ms: Artificial delay between chunks (for testing)
            provider: AI provider name
            model: Model name

        Yields:
            StreamChunk objects representing streamed content

        Example:
            async for chunk in streaming_service.stream_response(
                response_generator,
                chunk_size=50
            ):
                yield chunk.to_event_format()
        """
        chunk_id = 0
        buffer = ""
        start_time = time.time()

        try:
            async for text in response_generator:
                buffer += text
                chunk_id += 1

                # Send chunks of specified size
                while len(buffer) >= chunk_size:
                    chunk_content = buffer[:chunk_size]
                    buffer = buffer[chunk_size:]

                    tokens = self.estimate_tokens(chunk_content)
                    chunk = StreamChunk(
                        chunk_id=chunk_id,
                        content=chunk_content,
                        timestamp=time.time(),
                        tokens_estimated=tokens,
                        is_complete=False,
                    )

                    yield chunk

                    if delay_ms > 0:
                        await self._async_sleep(delay_ms / 1000)

            # Send remaining buffer
            if buffer:
                tokens = self.estimate_tokens(buffer)
                chunk = StreamChunk(
                    chunk_id=chunk_id + 1,
                    content=buffer,
                    timestamp=time.time(),
                    tokens_estimated=tokens,
                    is_complete=False,
                )
                yield chunk

            # Send completion marker
            completion_chunk = StreamChunk(
                chunk_id=chunk_id + 2,
                content="",
                timestamp=time.time(),
                tokens_estimated=0,
                is_complete=True,
            )
            yield completion_chunk

            duration_ms = (time.time() - start_time) * 1000
            logger.info(
                f"Streaming complete: {chunk_id} chunks, "
                f"{duration_ms:.0f}ms elapsed"
            )

        except Exception as e:
            logger.error(f"Error in streaming: {str(e)}")
            error_chunk = StreamChunk(
                chunk_id=chunk_id + 999,
                content=f"ERROR: {str(e)}",
                timestamp=time.time(),
                tokens_estimated=0,
                is_complete=True,
            )
            yield error_chunk

    async def stream_with_statistics(
        self,
        response_generator: AsyncGenerator[str, None],
        provider: str,
        model: str,
        chunk_size: int = 50,
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Stream response with statistics tracking.

        Yields:
            Dict with content and statistics

        Example:
            async for event in streaming_service.stream_with_statistics(
                response_gen, "gemini", "gemini-2.0-flash"
            ):
                yield event
        """
        chunk_count = 0
        total_tokens = 0
        total_content_length = 0
        start_time = time.time()

        async for chunk in self.stream_response(
            response_generator,
            chunk_size=chunk_size,
            provider=provider,
            model=model,
        ):
            chunk_count += 1
            total_tokens += chunk.tokens_estimated
            total_content_length += len(chunk.content)

            yield {
                "chunk": chunk.to_event_format(),
                "chunk_id": chunk.chunk_id,
                "is_complete": chunk.is_complete,
                "running_stats": {
                    "chunks_received": chunk_count,
                    "total_tokens": total_tokens,
                    "total_chars": total_content_length,
                    "elapsed_ms": (time.time() - start_time) * 1000,
                }
            }

    def get_streaming_statistics(
        self,
        chunk_count: int,
        total_content_length: int,
        total_tokens: int,
        duration_ms: float,
        provider: str,
        model: str,
    ) -> StreamingStats:
        """
        Calculate streaming statistics.

        Args:
            chunk_count: Number of chunks sent
            total_content_length: Total characters streamed
            total_tokens: Total tokens estimated
            duration_ms: Duration of streaming in milliseconds
            provider: AI provider
            model: Model name

        Returns:
            StreamingStats object

        Example:
            stats = streaming_service.get_streaming_statistics(
                100, 5000, 1250, 2500, "gemini", "gemini-2.0-flash"
            )
        """
        chunks_per_second = (chunk_count / duration_ms * 1000) if duration_ms > 0 else 0
        average_chunk_size = (total_content_length / chunk_count) if chunk_count > 0 else 0

        return StreamingStats(
            total_chunks=chunk_count,
            total_content_length=total_content_length,
            total_tokens_estimated=total_tokens,
            streaming_duration_ms=duration_ms,
            chunks_per_second=chunks_per_second,
            average_chunk_size=average_chunk_size,
            provider=provider,
            model=model,
        )

    @staticmethod
    async def _async_sleep(seconds: float):
        """Async sleep helper"""
        import asyncio
        await asyncio.sleep(seconds)

    @staticmethod
    def format_sse_event(event_data: Dict[str, Any]) -> str:
        """
        Format data as Server-Sent Event.

        Args:
            event_data: Dictionary to serialize

        Returns:
            SSE-formatted string

        Example:
            sse_str = StreamingService.format_sse_event({
                "message": "hello",
                "timestamp": 123456
            })
            # Returns: "data: {...}\n\n"
        """
        return f"data: {json.dumps(event_data)}\n\n"

    @staticmethod
    def parse_sse_response(sse_text: str) -> List[Dict[str, Any]]:
        """
        Parse SSE-formatted response back to events.

        Args:
            sse_text: SSE-formatted response

        Returns:
            List of parsed event dictionaries

        Example:
            events = StreamingService.parse_sse_response(sse_response)
        """
        events = []
        lines = sse_text.split("\n")

        for line in lines:
            if line.startswith("data: "):
                data_str = line[6:]  # Remove "data: " prefix
                try:
                    event = json.loads(data_str)
                    events.append(event)
                except json.JSONDecodeError:
                    logger.warning(f"Failed to parse SSE event: {data_str}")

        return events

    def calculate_streaming_cost(
        self,
        tokens_used: int,
        provider: str,
        model: str,
        input_tokens: int = 0,
    ) -> Decimal:
        """
        Calculate cost for streamed response.

        Args:
            tokens_used: Output tokens used
            provider: AI provider
            model: Model name
            input_tokens: Input tokens (if different from output)

        Returns:
            Cost as Decimal

        Example:
            cost = streaming_service.calculate_streaming_cost(
                1250, "gemini", "gemini-2.0-flash"
            )
        """
        # Provider pricing (input/output per 1M tokens)
        PROVIDER_PRICING = {
            "gemini": {
                "gemini-pro": {"input": Decimal("0.0005"), "output": Decimal("0.0015")},
                "gemini-2.0-flash": {"input": Decimal("0.00004"), "output": Decimal("0.00016")},
            },
            "openai": {
                "gpt-4": {"input": Decimal("0.03"), "output": Decimal("0.06")},
                "gpt-4-turbo": {"input": Decimal("0.01"), "output": Decimal("0.03")},
            },
            "claude_api": {
                "claude-3-opus": {"input": Decimal("0.015"), "output": Decimal("0.075")},
                "claude-3-sonnet": {"input": Decimal("0.003"), "output": Decimal("0.015")},
            },
        }

        pricing = PROVIDER_PRICING.get(provider, {}).get(model, {
            "input": Decimal("0"),
            "output": Decimal("0")
        })

        # Calculate cost
        input_cost = Decimal(input_tokens) * pricing["input"] / 1_000_000
        output_cost = Decimal(tokens_used) * pricing["output"] / 1_000_000

        return input_cost + output_cost

    def should_stream_response(
        self,
        response_length_estimate: int,
        min_length_for_streaming: int = 500,
        provider: str = "gemini",
    ) -> bool:
        """
        Determine if response should be streamed.

        Args:
            response_length_estimate: Estimated response length
            min_length_for_streaming: Minimum length to justify streaming
            provider: AI provider

        Returns:
            True if streaming recommended

        Example:
            if streaming_service.should_stream_response(5000):
                # Use streaming
        """
        # Stream if response is large enough
        if response_length_estimate < min_length_for_streaming:
            return False

        # Stream for all providers
        return True

    def merge_streamed_chunks(self, chunks: List[StreamChunk]) -> str:
        """
        Merge streamed chunks back into complete response.

        Args:
            chunks: List of StreamChunk objects

        Returns:
            Complete response text

        Example:
            complete = streaming_service.merge_streamed_chunks(chunks)
        """
        return "".join(chunk.content for chunk in chunks if not chunk.is_complete)
