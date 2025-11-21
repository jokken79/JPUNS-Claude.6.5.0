"""Retry policy with exponential backoff for transient failures."""

from __future__ import annotations

import logging
import random
import time
from dataclasses import dataclass, field
from typing import Any, Callable, Optional, Sequence, Tuple, Type

logger = logging.getLogger(__name__)


class MaxRetriesExceededError(RuntimeError):
    """Raised when a retryable operation exhausts all attempts."""


@dataclass
class RetryStats:
    """Telemetry about retry executions."""

    total_attempts: int = 0
    total_retries: int = 0
    delays: list[float] = field(default_factory=list)
    last_error: Optional[str] = None


class ExponentialBackoffStrategy:
    """Simple exponential backoff helper supporting optional jitter."""

    def __init__(
        self,
        base_delay: float = 0.1,
        max_delay: float = 60.0,
        exponential_base: float = 2.0,
        jitter: bool = True,
    ) -> None:
        self.base_delay = max(0.0, base_delay)
        self.max_delay = max_delay
        self.exponential_base = max(1.0, exponential_base)
        self.jitter = jitter

    def get_delay(self, attempt: int) -> float:
        delay = self.base_delay * (self.exponential_base ** attempt)
        delay = min(delay, self.max_delay)
        if self.jitter and delay > 0:
            # ±10 % jitter to avoid thundering herd
            jitter_amount = delay * 0.1
            delay += random.uniform(-jitter_amount, jitter_amount)
        return max(0.0, delay)


class RetryPolicy:
    """Retry helper with configurable backoff strategy and telemetry."""

    def __init__(
        self,
        max_attempts: int = 3,
        *,
        base_delay: float = 0.1,
        max_delay: float = 10.0,
        exponential_base: float = 2.0,
        jitter: bool = True,
        retryable_exceptions: Optional[Sequence[Type[Exception]]] = None,
        name: str = "retry",
        backoff_strategy: Optional[ExponentialBackoffStrategy] = None,
    ) -> None:
        if max_attempts < 1:
            raise ValueError("max_attempts must be >= 1")

        self.max_attempts = max_attempts
        self.backoff_strategy = backoff_strategy or ExponentialBackoffStrategy(
            base_delay=base_delay,
            max_delay=max_delay,
            exponential_base=exponential_base,
            jitter=jitter,
        )
        self.retryable_exceptions: Tuple[Type[Exception], ...] = tuple(
            retryable_exceptions or (Exception,)
        )
        self.name = name
        self.stats = RetryStats()

    def execute(self, func: Callable[..., Any], *args, **kwargs) -> Any:
        """Execute ``func`` with retry semantics."""

        self.stats.total_attempts = 0
        self.stats.total_retries = 0
        self.stats.delays.clear()
        self.stats.last_error = None

        last_exception: Optional[Exception] = None

        for attempt in range(self.max_attempts):
            self.stats.total_attempts += 1
            try:
                return func(*args, **kwargs)
            except self.retryable_exceptions as exc:  # type: ignore[arg-type]
                last_exception = exc
                self.stats.last_error = str(exc)
                if attempt == self.max_attempts - 1:
                    logger.error(
                        "[%s] Exhausted %s attempts – raising", self.name, self.max_attempts
                    )
                    raise MaxRetriesExceededError(str(exc)) from exc

                delay = self.backoff_strategy.get_delay(attempt)
                self.stats.total_retries += 1
                self.stats.delays.append(delay)
                logger.warning(
                    "[%s] Attempt %s failed (%s). Retrying in %.2fs",
                    self.name,
                    attempt + 1,
                    exc,
                    delay,
                )
                if delay > 0:
                    time.sleep(delay)
            except Exception:
                # Non-retryable exception – propagate immediately
                raise

        # If we reach here, something unexpected happened
        raise last_exception or MaxRetriesExceededError(
            f"Failed after {self.max_attempts} attempts"
        )

    def reset(self) -> None:
        """Clear collected statistics."""

        self.stats = RetryStats()

