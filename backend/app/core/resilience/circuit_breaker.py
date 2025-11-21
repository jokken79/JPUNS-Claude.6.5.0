"""Circuit Breaker pattern implementation for import resilience."""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from threading import Lock
from typing import Any, Callable, Optional

logger = logging.getLogger(__name__)


class CircuitBreakerOpenError(RuntimeError):
    """Raised when an operation is attempted while the circuit is open."""


class CircuitBreakerState(str, Enum):
    """All possible circuit breaker states."""

    CLOSED = "closed"  # Normal operation
    OPEN = "open"  # Blocking calls
    HALF_OPEN = "half_open"  # Testing recovery


# Provide backwards compatible alias expected by the tests
CircuitState = CircuitBreakerState


@dataclass
class CircuitBreakerStats:
    """Runtime statistics collected by the circuit breaker."""

    total_requests: int = 0
    failed_requests: int = 0
    successful_requests: int = 0
    opened_count: int = 0
    last_failure_at: Optional[datetime] = None
    opened_at: Optional[datetime] = None


class CircuitBreaker:
    """Resilient circuit breaker with detailed telemetry and context-manager API."""

    def __init__(
        self,
        name: str = "default",
        failure_threshold: int = 5,
        timeout: Optional[int] = None,
        recovery_timeout: Optional[int] = None,
        success_threshold: int = 1,
    ) -> None:
        """Create a circuit breaker instance.

        Args:
            name: Identifier used in log messages.
            failure_threshold: Number of consecutive failures before opening.
            timeout: Alias for ``recovery_timeout`` for backwards compatibility.
            recovery_timeout: Seconds the breaker waits before attempting recovery.
            success_threshold: Successes required while HALF_OPEN before closing.
        """

        if recovery_timeout is None:
            recovery_timeout = timeout if timeout is not None else 60

        self.name = name
        self.failure_threshold = max(1, failure_threshold)
        self.recovery_timeout = max(1, recovery_timeout)
        self.success_threshold = max(1, success_threshold)

        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time: Optional[datetime] = None
        self.state: CircuitBreakerState = CircuitBreakerState.CLOSED
        self.stats = CircuitBreakerStats()
        self._lock = Lock()
        self._failure_tally = 0

    # ------------------------------------------------------------------
    # Context manager protocol
    # ------------------------------------------------------------------
    def __enter__(self) -> "CircuitBreaker":
        with self._lock:
            self.stats.total_requests += 1
            if self.state == CircuitBreakerState.OPEN and not self._should_attempt_reset():
                logger.debug("[%s] Rejecting call - circuit open", self.name)
                raise CircuitBreakerOpenError(
                    f"Circuit breaker '{self.name}' is OPEN"
                )

            if self.state == CircuitBreakerState.OPEN:
                # Timeout elapsed → give HALF_OPEN a chance
                self.state = CircuitBreakerState.HALF_OPEN
                self.success_count = 0
                logger.info("[%s] Circuit breaker entering HALF_OPEN", self.name)

            return self

    def __exit__(self, exc_type, exc, tb) -> bool:
        with self._lock:
            if exc_type is None:
                self._on_success()
            else:
                self._on_failure()
            # Never suppress exceptions
            return False

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------
    def call(self, func: Callable[..., Any], *args, **kwargs) -> Any:
        """Execute ``func`` under circuit breaker protection."""

        with self:
            try:
                result = func(*args, **kwargs)
            except Exception:
                # ``__exit__`` already recorded the failure – re-raise
                raise
        return result

    @property
    def is_open(self) -> bool:
        return self.state == CircuitBreakerState.OPEN

    def get_state(self) -> str:
        """Return the current state as string for compatibility."""

        return self.state.value

    def reset(self) -> None:
        """Manually reset the breaker to the CLOSED state."""

        with self._lock:
            self.failure_count = 0
            self.success_count = 0
            self.state = CircuitBreakerState.CLOSED
            self.stats.opened_at = None
            self._failure_tally = 0
            logger.info("[%s] Circuit breaker manually reset", self.name)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------
    def _should_attempt_reset(self) -> bool:
        if self.last_failure_time is None:
            return False

        elapsed = datetime.now() - self.last_failure_time
        return elapsed >= timedelta(seconds=self.recovery_timeout)

    def _on_success(self) -> None:
        self.stats.successful_requests += 1

        if self.state == CircuitBreakerState.HALF_OPEN:
            self.success_count += 1
            if self.success_count >= self.success_threshold:
                logger.info("[%s] Circuit breaker CLOSED (recovered)", self.name)
                self.state = CircuitBreakerState.CLOSED
                self.failure_count = 0
                self.success_count = 0
                self._failure_tally = 0
                self.stats.opened_at = None
        elif self.state == CircuitBreakerState.CLOSED and self.failure_count > 0:
            # Gradually decay failure count to avoid instant resets
            self.failure_count = max(0, self.failure_count - 1)

    def _on_failure(self) -> None:
        self.stats.failed_requests += 1
        self.failure_count += 1
        self._failure_tally += 1
        self.success_count = 0
        self.last_failure_time = datetime.now()

        if self._failure_tally >= self.failure_threshold:
            if self.state != CircuitBreakerState.OPEN:
                logger.error(
                    "[%s] Circuit breaker OPEN after %s failures",
                    self.name,
                    self._failure_tally,
                )
                self.stats.opened_count += 1
                self.stats.opened_at = self.last_failure_time
            self.state = CircuitBreakerState.OPEN
            self._failure_tally = 0
        elif self.state == CircuitBreakerState.HALF_OPEN:
            logger.warning(
                "[%s] Recovery attempt failed – circuit OPEN", self.name
            )
            self.state = CircuitBreakerState.OPEN
            self.stats.opened_count += 1
            self.stats.opened_at = self.last_failure_time
            self._failure_tally = 0

