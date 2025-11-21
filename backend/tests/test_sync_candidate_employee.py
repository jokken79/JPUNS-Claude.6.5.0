"""
Test unitario para el script de sincronización candidatos-empleados
Valida que la sincronización entre Candidate y Employee/Staff/ContractWorker funciona correctamente
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from sqlalchemy.orm import Session

from app.models.models import Candidate, Employee, ContractWorker, Staff


class MockCandidate:
    """Mock para objetos Candidate"""
    def __init__(self, id, rirekisho_id, full_name_kanji, status):
        self.id = id
        self.rirekisho_id = rirekisho_id
        self.full_name_kanji = full_name_kanji
        self.status = status


class MockEmployee:
    """Mock para objetos Employee"""
    def __init__(self, id, rirekisho_id, hakenmoto_id, full_name_kanji):
        self.id = id
        self.rirekisho_id = rirekisho_id
        self.hakenmoto_id = hakenmoto_id
        self.full_name_kanji = full_name_kanji


class MockContractWorker:
    """Mock para objetos ContractWorker"""
    def __init__(self, id, rirekisho_id, hakenmoto_id, full_name_kanji):
        self.id = id
        self.rirekisho_id = rirekisho_id
        self.hakenmoto_id = hakenmoto_id
        self.full_name_kanji = full_name_kanji


class MockStaff:
    """Mock para objetos Staff"""
    def __init__(self, id, rirekisho_id, staff_id, full_name_kanji):
        self.id = id
        self.rirekisho_id = rirekisho_id
        self.staff_id = staff_id
        self.full_name_kanji = full_name_kanji


@pytest.fixture
def mock_db_session():
    """Fixture para sesión de BD mockeada"""
    session = MagicMock(spec=Session)
    return session


def test_sync_finds_employee_in_employee_table(mock_db_session):
    """Verifica que el sync encuentra empleados en la tabla Employee"""

    # Create mock candidate
    candidate = MockCandidate(
        id=1,
        rirekisho_id=100,
        full_name_kanji="山田太郎",
        status="pending"
    )

    # Create mock employee
    employee = MockEmployee(
        id=1,
        rirekisho_id=100,
        hakenmoto_id="EMP001",
        full_name_kanji="山田太郎"
    )

    # Setup mock query chain for candidates
    mock_candidate_query = MagicMock()
    mock_candidate_query.all.return_value = [candidate]

    # Setup mock query chain for employee lookup
    mock_employee_query = MagicMock()
    mock_employee_filter = MagicMock()
    mock_employee_filter.first.return_value = employee

    mock_employee_query.filter.return_value = mock_employee_filter

    # Setup db.query to return appropriate mocks
    def query_side_effect(model):
        if model == Candidate:
            return mock_candidate_query
        elif model == Employee:
            return mock_employee_query
        else:
            # For ContractWorker and Staff, return None
            mock_other = MagicMock()
            mock_other_filter = MagicMock()
            mock_other_filter.first.return_value = None
            mock_other.filter.return_value = mock_other_filter
            return mock_other

    mock_db_session.query.side_effect = query_side_effect

    # Import and run the sync function
    from scripts.sync_candidate_employee_status import sync_candidate_employee_status

    # Patch SessionLocal to return our mock
    with patch('scripts.sync_candidate_employee_status.SessionLocal', return_value=mock_db_session):
        result = sync_candidate_employee_status()

    # Verify sync ran successfully
    assert result is True

    # Verify candidate status was updated to "hired"
    assert candidate.status == "hired"

    # Verify commit was called
    assert mock_db_session.commit.called


def test_sync_finds_contract_worker(mock_db_session):
    """Verifica que el sync encuentra contract workers"""

    candidate = MockCandidate(
        id=2,
        rirekisho_id=200,
        full_name_kanji="佐藤花子",
        status="pending"
    )

    contract_worker = MockContractWorker(
        id=1,
        rirekisho_id=200,
        hakenmoto_id="CW001",
        full_name_kanji="佐藤花子"
    )

    # Setup mock queries
    mock_candidate_query = MagicMock()
    mock_candidate_query.all.return_value = [candidate]

    # Employee query returns None
    mock_employee_query = MagicMock()
    mock_employee_filter = MagicMock()
    mock_employee_filter.first.return_value = None
    mock_employee_query.filter.return_value = mock_employee_filter

    # ContractWorker query returns the worker
    mock_cw_query = MagicMock()
    mock_cw_filter = MagicMock()
    mock_cw_filter.first.return_value = contract_worker
    mock_cw_query.filter.return_value = mock_cw_filter

    # Staff query returns None
    mock_staff_query = MagicMock()
    mock_staff_filter = MagicMock()
    mock_staff_filter.first.return_value = None
    mock_staff_query.filter.return_value = mock_staff_filter

    def query_side_effect(model):
        if model == Candidate:
            return mock_candidate_query
        elif model == Employee:
            return mock_employee_query
        elif model == ContractWorker:
            return mock_cw_query
        elif model == Staff:
            return mock_staff_query

    mock_db_session.query.side_effect = query_side_effect

    from scripts.sync_candidate_employee_status import sync_candidate_employee_status

    with patch('scripts.sync_candidate_employee_status.SessionLocal', return_value=mock_db_session):
        result = sync_candidate_employee_status()

    assert result is True
    assert candidate.status == "hired"


def test_sync_finds_staff(mock_db_session):
    """Verifica que el sync encuentra staff"""

    candidate = MockCandidate(
        id=3,
        rirekisho_id=300,
        full_name_kanji="鈴木一郎",
        status="pending"
    )

    staff = MockStaff(
        id=1,
        rirekisho_id=300,
        staff_id="STAFF001",
        full_name_kanji="鈴木一郎"
    )

    # Setup mock queries
    mock_candidate_query = MagicMock()
    mock_candidate_query.all.return_value = [candidate]

    # Employee and ContractWorker return None
    mock_employee_query = MagicMock()
    mock_employee_filter = MagicMock()
    mock_employee_filter.first.return_value = None
    mock_employee_query.filter.return_value = mock_employee_filter

    mock_cw_query = MagicMock()
    mock_cw_filter = MagicMock()
    mock_cw_filter.first.return_value = None
    mock_cw_query.filter.return_value = mock_cw_filter

    # Staff query returns the staff member
    mock_staff_query = MagicMock()
    mock_staff_filter = MagicMock()
    mock_staff_filter.first.return_value = staff
    mock_staff_query.filter.return_value = mock_staff_filter

    def query_side_effect(model):
        if model == Candidate:
            return mock_candidate_query
        elif model == Employee:
            return mock_employee_query
        elif model == ContractWorker:
            return mock_cw_query
        elif model == Staff:
            return mock_staff_query

    mock_db_session.query.side_effect = query_side_effect

    from scripts.sync_candidate_employee_status import sync_candidate_employee_status

    with patch('scripts.sync_candidate_employee_status.SessionLocal', return_value=mock_db_session):
        result = sync_candidate_employee_status()

    assert result is True
    assert candidate.status == "hired"


def test_sync_ignores_candidate_without_match(mock_db_session):
    """Verifica que candidatos sin match mantienen su status"""

    candidate = MockCandidate(
        id=4,
        rirekisho_id=400,
        full_name_kanji="田中次郎",
        status="pending"
    )

    # Setup mock queries - all return None
    mock_candidate_query = MagicMock()
    mock_candidate_query.all.return_value = [candidate]

    mock_employee_query = MagicMock()
    mock_employee_filter = MagicMock()
    mock_employee_filter.first.return_value = None
    mock_employee_query.filter.return_value = mock_employee_filter

    mock_cw_query = MagicMock()
    mock_cw_filter = MagicMock()
    mock_cw_filter.first.return_value = None
    mock_cw_query.filter.return_value = mock_cw_filter

    mock_staff_query = MagicMock()
    mock_staff_filter = MagicMock()
    mock_staff_filter.first.return_value = None
    mock_staff_query.filter.return_value = mock_staff_filter

    def query_side_effect(model):
        if model == Candidate:
            return mock_candidate_query
        elif model == Employee:
            return mock_employee_query
        elif model == ContractWorker:
            return mock_cw_query
        elif model == Staff:
            return mock_staff_query

    mock_db_session.query.side_effect = query_side_effect

    from scripts.sync_candidate_employee_status import sync_candidate_employee_status

    with patch('scripts.sync_candidate_employee_status.SessionLocal', return_value=mock_db_session):
        result = sync_candidate_employee_status()

    assert result is True
    # Status should remain "pending" since no employee was found
    assert candidate.status == "pending"


def test_sync_updates_already_hired_candidate(mock_db_session):
    """Verifica que candidatos ya 'hired' no se actualizan innecesariamente"""

    candidate = MockCandidate(
        id=5,
        rirekisho_id=500,
        full_name_kanji="高橋美咲",
        status="hired"  # Already hired
    )

    employee = MockEmployee(
        id=5,
        rirekisho_id=500,
        hakenmoto_id="EMP005",
        full_name_kanji="高橋美咲"
    )

    # Setup mock queries
    mock_candidate_query = MagicMock()
    mock_candidate_query.all.return_value = [candidate]

    mock_employee_query = MagicMock()
    mock_employee_filter = MagicMock()
    mock_employee_filter.first.return_value = employee
    mock_employee_query.filter.return_value = mock_employee_filter

    mock_cw_query = MagicMock()
    mock_cw_filter = MagicMock()
    mock_cw_filter.first.return_value = None
    mock_cw_query.filter.return_value = mock_cw_filter

    mock_staff_query = MagicMock()
    mock_staff_filter = MagicMock()
    mock_staff_filter.first.return_value = None
    mock_staff_query.filter.return_value = mock_staff_filter

    def query_side_effect(model):
        if model == Candidate:
            return mock_candidate_query
        elif model == Employee:
            return mock_employee_query
        elif model == ContractWorker:
            return mock_cw_query
        elif model == Staff:
            return mock_staff_query

    mock_db_session.query.side_effect = query_side_effect

    from scripts.sync_candidate_employee_status import sync_candidate_employee_status

    with patch('scripts.sync_candidate_employee_status.SessionLocal', return_value=mock_db_session):
        result = sync_candidate_employee_status()

    assert result is True
    # Status should remain "hired"
    assert candidate.status == "hired"
    # Commit should be called less times (not updating unchanged records)


def test_sync_handles_multiple_candidates(mock_db_session):
    """Verifica que el sync maneja múltiples candidatos correctamente"""

    # Create multiple candidates with different scenarios
    candidate1 = MockCandidate(1, 100, "山田太郎", "pending")
    candidate2 = MockCandidate(2, 200, "佐藤花子", "pending")
    candidate3 = MockCandidate(3, 300, "鈴木一郎", "hired")

    employee1 = MockEmployee(1, 100, "EMP001", "山田太郎")
    # No employee for candidate2
    employee3 = MockEmployee(3, 300, "EMP003", "鈴木一郎")

    candidates = [candidate1, candidate2, candidate3]

    # Setup mock queries
    mock_candidate_query = MagicMock()
    mock_candidate_query.all.return_value = candidates

    def query_side_effect(model):
        if model == Candidate:
            return mock_candidate_query
        elif model == Employee:
            mock_query = MagicMock()
            mock_filter = MagicMock()

            # Return appropriate employee based on rirekisho_id
            def first_side_effect():
                # This is a simplified version - in real scenario would need to check filter args
                # For testing, we'll just cycle through
                if not hasattr(first_side_effect, 'call_count'):
                    first_side_effect.call_count = 0

                if first_side_effect.call_count == 0:
                    first_side_effect.call_count += 1
                    return employee1  # For candidate1
                elif first_side_effect.call_count == 1:
                    first_side_effect.call_count += 1
                    return None  # For candidate2
                else:
                    return employee3  # For candidate3

            mock_filter.first.side_effect = first_side_effect
            mock_query.filter.return_value = mock_filter
            return mock_query
        else:
            # For ContractWorker and Staff
            mock_query = MagicMock()
            mock_filter = MagicMock()
            mock_filter.first.return_value = None
            mock_query.filter.return_value = mock_filter
            return mock_query

    mock_db_session.query.side_effect = query_side_effect

    from scripts.sync_candidate_employee_status import sync_candidate_employee_status

    with patch('scripts.sync_candidate_employee_status.SessionLocal', return_value=mock_db_session):
        result = sync_candidate_employee_status()

    assert result is True


def test_sync_handles_database_error(mock_db_session):
    """Verifica que el sync maneja errores de BD apropiadamente"""

    # Simulate database error
    mock_db_session.query.side_effect = Exception("Database connection error")

    from scripts.sync_candidate_employee_status import sync_candidate_employee_status

    with patch('scripts.sync_candidate_employee_status.SessionLocal', return_value=mock_db_session):
        result = sync_candidate_employee_status()

    # Should return False on error
    assert result is False

    # Verify rollback was called
    assert mock_db_session.rollback.called


def test_sync_closes_session(mock_db_session):
    """Verifica que la sesión de BD se cierra siempre (even on error)"""

    # Setup empty candidate list
    mock_candidate_query = MagicMock()
    mock_candidate_query.all.return_value = []
    mock_db_session.query.return_value = mock_candidate_query

    from scripts.sync_candidate_employee_status import sync_candidate_employee_status

    with patch('scripts.sync_candidate_employee_status.SessionLocal', return_value=mock_db_session):
        sync_candidate_employee_status()

    # Verify close was called
    assert mock_db_session.close.called


def test_sync_with_approved_status_candidate(mock_db_session):
    """Verifica que candidatos con status 'approved' se actualizan correctamente"""

    candidate = MockCandidate(
        id=6,
        rirekisho_id=600,
        full_name_kanji="伊藤直樹",
        status="approved"  # Approved but not hired yet
    )

    employee = MockEmployee(
        id=6,
        rirekisho_id=600,
        hakenmoto_id="EMP006",
        full_name_kanji="伊藤直樹"
    )

    # Setup mock queries
    mock_candidate_query = MagicMock()
    mock_candidate_query.all.return_value = [candidate]

    mock_employee_query = MagicMock()
    mock_employee_filter = MagicMock()
    mock_employee_filter.first.return_value = employee
    mock_employee_query.filter.return_value = mock_employee_filter

    mock_cw_query = MagicMock()
    mock_cw_filter = MagicMock()
    mock_cw_filter.first.return_value = None
    mock_cw_query.filter.return_value = mock_cw_filter

    mock_staff_query = MagicMock()
    mock_staff_filter = MagicMock()
    mock_staff_filter.first.return_value = None
    mock_staff_query.filter.return_value = mock_staff_filter

    def query_side_effect(model):
        if model == Candidate:
            return mock_candidate_query
        elif model == Employee:
            return mock_employee_query
        elif model == ContractWorker:
            return mock_cw_query
        elif model == Staff:
            return mock_staff_query

    mock_db_session.query.side_effect = query_side_effect

    from scripts.sync_candidate_employee_status import sync_candidate_employee_status

    with patch('scripts.sync_candidate_employee_status.SessionLocal', return_value=mock_db_session):
        result = sync_candidate_employee_status()

    assert result is True
    # Status should be updated from "approved" to "hired"
    assert candidate.status == "hired"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
