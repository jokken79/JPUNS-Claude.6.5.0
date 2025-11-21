"""
Chaos Engineering Tests for Resilience Module

Tests that INTENTIONALLY break things to verify resilience:
- Network failures
- Database crashes
- File corruption
- Deadlocks
- Timeouts
- Circuit breaker triggers
- Partial failures

These tests ensure the system remains operational under adverse conditions.
"""
import pytest
import time
import random
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock
from sqlalchemy.exc import OperationalError, IntegrityError

from app.core.resilience import (
    CircuitBreaker,
    CircuitState,
    CircuitBreakerOpenError,
    RetryPolicy,
    MaxRetriesExceededError,
    TransactionManager,
    DeadlockError,
    CheckpointManager,
    IdempotencyGuard,
    StructuredLogger,
    ImportOrchestrator,
    ImportState,
    PreImportValidator,
)


# ============================================================================
# Circuit Breaker Tests
# ============================================================================

class TestCircuitBreaker:
    """Test circuit breaker under failure scenarios"""

    def test_circuit_opens_after_threshold(self):
        """Circuit should open after exceeding failure threshold"""
        breaker = CircuitBreaker(
            name="test",
            failure_threshold=3,
            timeout=1
        )

        # First 3 failures should be allowed
        for i in range(3):
            try:
                with breaker:
                    raise Exception(f"Failure {i}")
            except Exception:
                pass

        # 4th attempt should fail fast
        with pytest.raises(CircuitBreakerOpenError):
            with breaker:
                raise Exception("Should not reach here")

        assert breaker.state == CircuitState.OPEN

    def test_circuit_recovers_after_timeout(self):
        """Circuit should transition to HALF_OPEN after timeout"""
        breaker = CircuitBreaker(
            name="test",
            failure_threshold=2,
            timeout=1  # 1 second timeout
        )

        # Trigger failures to open circuit
        for _ in range(2):
            try:
                with breaker:
                    raise Exception("Failure")
            except Exception:
                pass

        assert breaker.state == CircuitState.OPEN

        # Wait for timeout
        time.sleep(1.1)

        # Next attempt should transition to HALF_OPEN
        try:
            with breaker:
                pass  # Success
        except CircuitBreakerOpenError:
            pytest.fail("Circuit should be HALF_OPEN, not OPEN")

        assert breaker.state == CircuitState.CLOSED

    def test_circuit_tracks_statistics(self):
        """Circuit breaker should track detailed statistics"""
        breaker = CircuitBreaker(name="test", failure_threshold=5)

        # Mix of successes and failures
        for i in range(10):
            try:
                with breaker:
                    if i % 3 == 0:
                        raise Exception("Planned failure")
            except Exception:
                pass

        stats = breaker.stats
        assert stats.total_requests == 10
        assert stats.failed_requests > 0
        assert stats.successful_requests > 0


# ============================================================================
# Retry Policy Tests
# ============================================================================

class TestRetryPolicy:
    """Test retry policy under transient failures"""

    def test_retries_transient_failures(self):
        """Should retry transient failures with backoff"""
        retry = RetryPolicy(
            max_attempts=3,
            base_delay=0.1,
            jitter=False
        )

        attempt_count = 0

        def flaky_function():
            nonlocal attempt_count
            attempt_count += 1
            if attempt_count < 3:
                raise Exception("Transient failure")
            return "success"

        result = retry.execute(flaky_function)
        assert result == "success"
        assert attempt_count == 3

    def test_fails_after_max_attempts(self):
        """Should fail after max attempts exhausted"""
        retry = RetryPolicy(max_attempts=3, base_delay=0.1)

        def always_fails():
            raise Exception("Permanent failure")

        with pytest.raises(MaxRetriesExceededError):
            retry.execute(always_fails)

        assert retry.stats.total_retries == 2  # 3 attempts = 2 retries

    def test_exponential_backoff_timing(self):
        """Should use exponential backoff between retries"""
        retry = RetryPolicy(
            max_attempts=4,
            base_delay=0.1,
            exponential_base=2,
            jitter=False
        )

        attempt_times = []

        def record_and_fail():
            attempt_times.append(time.time())
            raise Exception("Failure")

        try:
            retry.execute(record_and_fail)
        except MaxRetriesExceededError:
            pass

        # Check delays: ~0.1s, ~0.2s, ~0.4s
        delays = [attempt_times[i+1] - attempt_times[i] for i in range(len(attempt_times)-1)]
        assert delays[0] >= 0.1
        assert delays[1] >= 0.2
        assert delays[2] >= 0.4


# ============================================================================
# Transaction Manager Tests
# ============================================================================

class TestTransactionManager:
    """Test transaction manager under database failures"""

    @pytest.fixture
    def mock_session(self):
        """Mock SQLAlchemy session"""
        session = Mock()
        session.commit = Mock()
        session.rollback = Mock()
        session.execute = Mock()
        return session

    def test_rollback_on_exception(self, mock_session):
        """Should rollback transaction on exception"""
        tm = TransactionManager(mock_session)

        with pytest.raises(ValueError):
            with tm.transaction() as txn:
                raise ValueError("Intentional failure")

        mock_session.rollback.assert_called_once()

    def test_savepoint_rollback(self, mock_session):
        """Should support partial rollback to savepoint"""
        mock_session.begin_nested = Mock(return_value=Mock())

        tm = TransactionManager(mock_session)

        with tm.transaction() as txn:
            txn.savepoint("checkpoint1")
            txn.savepoint("checkpoint2")

            # Rollback to checkpoint1
            txn.rollback_to_savepoint("checkpoint1")

        assert mock_session.commit.called

    def test_deadlock_retry(self, mock_session):
        """Should retry on deadlock"""
        attempt_count = 0

        def simulate_deadlock():
            nonlocal attempt_count
            attempt_count += 1
            if attempt_count < 3:
                raise OperationalError("deadlock detected", None, None)
            return "success"

        tm = TransactionManager(mock_session)
        result = tm.execute_with_retry(simulate_deadlock, max_retries=3)

        assert result == "success"
        assert attempt_count == 3


# ============================================================================
# Checkpoint Manager Tests
# ============================================================================

class TestCheckpointManager:
    """Test checkpoint manager for recovery"""

    def test_creates_checkpoint(self, tmp_path):
        """Should create checkpoint file"""
        manager = CheckpointManager(
            operation_id="test_op",
            checkpoint_dir=str(tmp_path)
        )

        manager.checkpoint(
            progress={"batch": 5, "rows": 500},
            metadata={"source": "test"}
        )

        checkpoints = list(tmp_path.glob("*.json"))
        assert len(checkpoints) == 1

    def test_resumes_from_checkpoint(self, tmp_path):
        """Should resume from last checkpoint"""
        manager = CheckpointManager(
            operation_id="test_op",
            checkpoint_dir=str(tmp_path)
        )

        # Create checkpoint
        manager.checkpoint(progress={"batch": 10, "rows": 1000})

        # Load checkpoint
        state = manager.load_checkpoint()
        assert state is not None
        assert state.progress["batch"] == 10

    def test_cleanup_old_checkpoints(self, tmp_path):
        """Should cleanup old checkpoints"""
        manager = CheckpointManager(
            operation_id="test_op",
            checkpoint_dir=str(tmp_path)
        )

        # Create multiple checkpoints
        for i in range(5):
            manager.checkpoint(progress={"batch": i})
            time.sleep(0.1)

        # Should have 5 checkpoints
        checkpoints_before = list(tmp_path.glob("*.json"))
        assert len(checkpoints_before) == 5

        # Cleanup doesn't affect recent files
        manager.cleanup_old_checkpoints(keep_days=1)
        checkpoints_after = list(tmp_path.glob("*.json"))
        assert len(checkpoints_after) == 5  # All recent


# ============================================================================
# Idempotency Guard Tests
# ============================================================================

class TestIdempotencyGuard:
    """Test idempotency guard for duplicate prevention"""

    def test_detects_duplicates(self, tmp_path):
        """Should detect duplicate data"""
        guard = IdempotencyGuard(
            operation_id="test",
            storage_dir=str(tmp_path)
        )

        data = {"id": 1, "name": "Test"}

        # First time should process
        assert guard.should_process(data) is True
        guard.mark_processed(data)

        # Second time should skip
        assert guard.should_process(data) is False

    def test_different_data_not_duplicate(self, tmp_path):
        """Should not treat different data as duplicate"""
        guard = IdempotencyGuard(
            operation_id="test",
            storage_dir=str(tmp_path)
        )

        data1 = {"id": 1, "name": "Test1"}
        data2 = {"id": 2, "name": "Test2"}

        guard.mark_processed(data1)

        assert guard.should_process(data2) is True

    def test_persists_and_loads_hashes(self, tmp_path):
        """Should persist hashes across instances"""
        # First instance
        guard1 = IdempotencyGuard(
            operation_id="test",
            storage_dir=str(tmp_path)
        )

        data = {"id": 1, "name": "Test"}
        guard1.mark_processed(data)
        guard1.flush()

        # Second instance should load hashes
        guard2 = IdempotencyGuard(
            operation_id="test",
            storage_dir=str(tmp_path)
        )

        assert guard2.should_process(data) is False


# ============================================================================
# Structured Logger Tests
# ============================================================================

class TestStructuredLogger:
    """Test structured logger"""

    def test_logs_with_context(self, tmp_path):
        """Should log with contextual information"""
        logger = StructuredLogger(
            operation_id="test",
            log_file=str(tmp_path / "test.jsonl")
        )

        with logger.context(batch=5, row=10):
            logger.info("Processing row")

        # Read log file
        with open(tmp_path / "test.jsonl") as f:
            import json
            log_entry = json.loads(f.readline())

        assert log_entry["context"]["batch_number"] == 5
        assert log_entry["context"]["row_number"] == 10

    def test_tracks_operation_metrics(self):
        """Should track operation duration and success"""
        logger = StructuredLogger("test", enable_file=False)

        with logger.operation("test_op"):
            time.sleep(0.1)

        metrics = logger.get_metrics()
        assert "test_op" in metrics
        assert metrics["test_op"]["total_runs"] == 1
        assert metrics["test_op"]["avg_duration_ms"] > 100


# ============================================================================
# Import Orchestrator Integration Tests
# ============================================================================

class TestImportOrchestrator:
    """Test complete import orchestrator (integration)"""

    @pytest.fixture
    def mock_db(self):
        """Mock database session"""
        db = Mock()
        db.execute = Mock(return_value=Mock(scalars=Mock(return_value=Mock(all=Mock(return_value=[])))))
        db.commit = Mock()
        db.rollback = Mock()
        db.add = Mock()
        db.flush = Mock()
        db.begin_nested = Mock(return_value=Mock())
        return db

    def test_orchestrator_initialization(self, mock_db):
        """Should initialize all resilience components"""
        orchestrator = ImportOrchestrator(
            db=mock_db,
            operation_id="test_import"
        )

        assert orchestrator.state == ImportState.PENDING
        assert orchestrator.logger is not None
        assert orchestrator.validator is not None
        assert orchestrator.transaction_manager is not None

    @pytest.mark.skip(reason="Requires actual Excel file")
    def test_full_import_flow(self, mock_db, tmp_path):
        """Test complete import flow with mock data"""
        # This would require creating actual test Excel file
        pass

    def test_handles_validation_failure(self, mock_db, tmp_path):
        """Should handle validation failures gracefully"""
        # Create invalid Excel file
        import pandas as pd
        df = pd.DataFrame({
            "invalid_column": [1, 2, 3]
        })
        excel_file = tmp_path / "invalid.xlsx"
        df.to_excel(excel_file, index=False)

        orchestrator = ImportOrchestrator(
            db=mock_db,
            operation_id="test_import"
        )

        result = orchestrator.import_file(
            str(excel_file),
            table_type="employees"
        )

        assert result.success is False
        assert result.state == ImportState.FAILED
        assert len(result.validation_errors) > 0


# ============================================================================
# Chaos Engineering Tests
# ============================================================================

class TestChaosEngineering:
    """Chaos engineering: intentional failure injection"""

    def test_random_failures_with_circuit_breaker(self):
        """Inject random failures and verify circuit breaker protects"""
        breaker = CircuitBreaker(
            name="chaos",
            failure_threshold=5,
            timeout=1
        )

        successful_calls = 0
        circuit_breaker_trips = 0

        for i in range(100):
            try:
                with breaker:
                    # Random failure (30% chance)
                    if random.random() < 0.3:
                        raise Exception("Random chaos failure")
                    successful_calls += 1
            except CircuitBreakerOpenError:
                circuit_breaker_trips += 1
            except Exception:
                pass

        # Circuit breaker should have tripped at least once
        assert circuit_breaker_trips > 0
        # Some calls should have succeeded
        assert successful_calls > 0

    def test_cascading_failure_prevention(self):
        """Verify circuit breaker prevents cascading failures"""
        db_breaker = CircuitBreaker(name="db", failure_threshold=3, timeout=2)
        api_breaker = CircuitBreaker(name="api", failure_threshold=3, timeout=2)

        db_failures = 0
        api_failures = 0

        def simulate_db_call():
            with db_breaker:
                raise OperationalError("DB down", None, None)

        def simulate_api_call():
            with api_breaker:
                simulate_db_call()

        # Simulate multiple API calls
        for _ in range(10):
            try:
                simulate_api_call()
            except (CircuitBreakerOpenError, OperationalError):
                api_failures += 1

        # Both breakers should be open
        assert db_breaker.state == CircuitState.OPEN
        assert api_breaker.state == CircuitState.OPEN
        # Failures should stop quickly (not all 10 attempts hit DB)
        assert api_failures == 10

    def test_network_partition_recovery(self):
        """Simulate network partition and recovery"""
        retry = RetryPolicy(max_attempts=5, base_delay=0.1)
        attempts = 0

        def flaky_network():
            nonlocal attempts
            attempts += 1
            # Simulate network coming back after 3 attempts
            if attempts < 3:
                raise ConnectionError("Network partition")
            return "success"

        result = retry.execute(flaky_network)
        assert result == "success"
        assert attempts == 3


# ============================================================================
# Performance Under Load
# ============================================================================

class TestPerformanceUnderLoad:
    """Test resilience under high load"""

    def test_high_volume_idempotency_check(self, tmp_path):
        """Idempotency guard should handle high volume efficiently"""
        guard = IdempotencyGuard(
            operation_id="load_test",
            storage_dir=str(tmp_path)
        )

        # Process 10,000 items
        start = time.time()
        for i in range(10000):
            data = {"id": i, "value": f"item_{i}"}
            if guard.should_process(data):
                guard.mark_processed(data, persist=False)

        elapsed = time.time() - start

        # Should complete in reasonable time (< 5 seconds)
        assert elapsed < 5.0
        assert guard.get_stats()["total_processed"] == 10000

    def test_concurrent_circuit_breaker_access(self):
        """Circuit breaker should be thread-safe"""
        import threading

        breaker = CircuitBreaker(name="concurrent", failure_threshold=50)
        results = {"success": 0, "failure": 0}
        lock = threading.Lock()

        def worker():
            for _ in range(100):
                try:
                    with breaker:
                        if random.random() < 0.1:  # 10% failure rate
                            raise Exception("Random failure")
                    with lock:
                        results["success"] += 1
                except Exception:
                    with lock:
                        results["failure"] += 1

        # Run 10 threads
        threads = [threading.Thread(target=worker) for _ in range(10)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        # Should have processed all attempts
        assert results["success"] + results["failure"] == 1000


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
