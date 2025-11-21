"""
Timeout utilities for long-running operations
Provides timeout wrappers for synchronous and asynchronous operations
"""
import signal
import logging
from typing import Callable, Any, TypeVar, Optional
from functools import wraps
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError
import asyncio

logger = logging.getLogger(__name__)

T = TypeVar('T')


class TimeoutException(Exception):
    """Exception raised when an operation times out"""
    pass


def timeout_sync(seconds: int):
    """
    Decorator to add timeout to synchronous functions using signal (Unix/Linux only).

    Args:
        seconds: Maximum execution time in seconds

    Returns:
        Decorated function that raises TimeoutException if it exceeds timeout

    Example:
        >>> @timeout_sync(30)
        ... def slow_operation():
        ...     time.sleep(60)
        ...     return "done"
        >>>
        >>> try:
        ...     result = slow_operation()
        ... except TimeoutException:
        ...     print("Operation timed out!")

    Note:
        - Only works on Unix/Linux systems (uses signal.SIGALRM)
        - Not thread-safe (signal handlers are process-wide)
        - For Windows or thread-safe alternative, use timeout_executor()
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        def wrapper(*args, **kwargs) -> T:
            def timeout_handler(signum, frame):
                raise TimeoutException(f"Operation '{func.__name__}' timed out after {seconds} seconds")

            # Set the signal handler
            old_handler = signal.signal(signal.SIGALRM, timeout_handler)
            signal.alarm(seconds)

            try:
                result = func(*args, **kwargs)
            finally:
                # Restore old handler and cancel alarm
                signal.alarm(0)
                signal.signal(signal.SIGALRM, old_handler)

            return result
        return wrapper
    return decorator


def timeout_executor(func: Callable[..., T], timeout_seconds: int, *args, **kwargs) -> T:
    """
    Execute a function with timeout using ThreadPoolExecutor.
    This is platform-independent and works on Windows, Linux, and macOS.

    Args:
        func: Function to execute
        timeout_seconds: Maximum execution time in seconds
        *args: Positional arguments for the function
        **kwargs: Keyword arguments for the function

    Returns:
        Result of the function execution

    Raises:
        TimeoutException: If function execution exceeds timeout

    Example:
        >>> def slow_operation(value):
        ...     time.sleep(60)
        ...     return value * 2
        >>>
        >>> try:
        ...     result = timeout_executor(slow_operation, 30, 42)
        ... except TimeoutException:
        ...     print("Operation timed out!")

    Note:
        - Works on all platforms (Windows, Linux, macOS)
        - Thread-safe
        - Slightly more overhead than signal-based approach
        - Function must be picklable if args/kwargs contain complex objects
    """
    with ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(func, *args, **kwargs)
        try:
            result = future.result(timeout=timeout_seconds)
            return result
        except FuturesTimeoutError:
            future.cancel()
            raise TimeoutException(
                f"Operation '{func.__name__}' timed out after {timeout_seconds} seconds"
            )
        except Exception as e:
            # Re-raise any other exception from the function
            raise


async def timeout_async(coro, timeout_seconds: int):
    """
    Execute an async coroutine with timeout.

    Args:
        coro: Coroutine to execute
        timeout_seconds: Maximum execution time in seconds

    Returns:
        Result of the coroutine execution

    Raises:
        TimeoutException: If coroutine execution exceeds timeout

    Example:
        >>> async def slow_async_operation():
        ...     await asyncio.sleep(60)
        ...     return "done"
        >>>
        >>> try:
        ...     result = await timeout_async(slow_async_operation(), 30)
        ... except TimeoutException:
        ...     print("Operation timed out!")
    """
    try:
        result = await asyncio.wait_for(coro, timeout=timeout_seconds)
        return result
    except asyncio.TimeoutError:
        raise TimeoutException(f"Async operation timed out after {timeout_seconds} seconds")


__all__ = [
    "TimeoutException",
    "timeout_sync",
    "timeout_executor",
    "timeout_async"
]
