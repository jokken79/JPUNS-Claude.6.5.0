"""
Unit tests for CandidateService
Tests candidate CRUD operations, validation, and business logic
"""

import pytest
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.services.candidate_service import CandidateService
from app.models.models import Candidate, User, CandidateStatus
from app.schemas.candidate import CandidateCreate, CandidateUpdate
from tests.factories import CandidateFactory, UserFactory


@pytest.mark.unit
@pytest.mark.service
class TestCandidateCreation:
    """Test candidate creation with validation."""
    
    async def test_create_candidate_success(self, db_session: Session, test_user: User):
        """Test successful candidate creation."""
        # Arrange
        service = CandidateService(db=db_session)
        candidate_data = CandidateFactory.build()
        candidate_create = CandidateCreate(**candidate_data)
        
        # Act
        candidate = await service.create_candidate(
            candidate_data=candidate_create,
            current_user=test_user
        )
        
        # Assert
        assert candidate is not None
        assert candidate.id is not None
        assert candidate.full_name_kanji == candidate_data.get("full_name_kanji")
        assert candidate.email == candidate_data.get("email")
        assert candidate.rirekisho_id is not None
    
    async def test_create_candidate_requires_name(self, db_session: Session, test_user: User):
        """Test candidate creation requires name (kanji or roman)."""
        # Arrange
        service = CandidateService(db=db_session)
        candidate_data = CandidateFactory.build()
        candidate_data["full_name_kanji"] = None
        candidate_data["full_name_roman"] = None
        
        candidate_create = CandidateCreate(**candidate_data)
        
        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            await service.create_candidate(
                candidate_data=candidate_create,
                current_user=test_user
            )
        
        assert exc_info.value.status_code == 422
        assert "name" in str(exc_info.value.detail).lower()
    
    async def test_create_candidate_generates_rirekisho_id(
        self, db_session: Session, test_user: User
    ):
        """Test automatic rirekisho_id generation."""
        # Arrange
        service = CandidateService(db=db_session)
        candidate_data = CandidateFactory.build()
        candidate_create = CandidateCreate(**candidate_data)
        
        # Act
        candidate = await service.create_candidate(
            candidate_data=candidate_create,
            current_user=test_user
        )
        
        # Assert
        assert candidate.rirekisho_id is not None
        assert len(candidate.rirekisho_id) > 0
        assert candidate.applicant_id is not None
    
    async def test_create_candidate_prevents_duplicate_email(
        self, db_session: Session, test_user: User
    ):
        """Test duplicate email validation."""
        # Arrange
        service = CandidateService(db=db_session)
        
        # Create first candidate
        candidate_data1 = CandidateFactory.build(email="test@example.com")
        candidate_create1 = CandidateCreate(**candidate_data1)
        await service.create_candidate(
            candidate_data=candidate_create1,
            current_user=test_user
        )
        
        # Try to create duplicate
        candidate_data2 = CandidateFactory.build(email="test@example.com")
        candidate_create2 = CandidateCreate(**candidate_data2)
        
        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            await service.create_candidate(
                candidate_data=candidate_create2,
                current_user=test_user
            )
        
        assert exc_info.value.status_code == 400
        assert "duplicate" in str(exc_info.value.detail).lower()


@pytest.mark.unit
@pytest.mark.service
class TestCandidateRetrieval:
    """Test candidate retrieval operations."""
    
    def test_get_candidate_by_id(self, db_session: Session, test_candidate: Candidate):
        """Test retrieving candidate by ID."""
        # Arrange
        service = CandidateService(db=db_session)
        
        # Act
        candidate = service.get_candidate(candidate_id=test_candidate.id)
        
        # Assert
        assert candidate is not None
        assert candidate.id == test_candidate.id
        assert candidate.name == test_candidate.name
    
    def test_get_candidate_not_found(self, db_session: Session):
        """Test retrieving non-existent candidate returns None."""
        # Arrange
        service = CandidateService(db=db_session)
        
        # Act
        candidate = service.get_candidate(candidate_id=99999)
        
        # Assert
        assert candidate is None
    
    def test_get_all_candidates(self, db_session: Session, test_candidates: list[Candidate]):
        """Test retrieving all candidates."""
        # Arrange
        service = CandidateService(db=db_session)
        
        # Act
        candidates = service.get_candidates(skip=0, limit=100)
        
        # Assert
        assert len(candidates) >= len(test_candidates)
        assert all(isinstance(c, Candidate) for c in candidates)
    
    def test_get_candidates_pagination(
        self, db_session: Session, test_candidates: list[Candidate]
    ):
        """Test candidate pagination."""
        # Arrange
        service = CandidateService(db=db_session)
        
        # Act
        page1 = service.get_candidates(skip=0, limit=2)
        page2 = service.get_candidates(skip=2, limit=2)
        
        # Assert
        assert len(page1) == 2
        assert len(page2) >= 1
        assert page1[0].id != page2[0].id
    
    def test_get_candidates_by_status(self, db_session: Session):
        """Test filtering candidates by status."""
        # Arrange
        service = CandidateService(db=db_session)
        
        # Create candidates with different statuses
        candidate1_data = CandidateFactory.build(status="applied")
        candidate2_data = CandidateFactory.build(status="interviewing")
        
        candidate1 = Candidate(**candidate1_data)
        candidate2 = Candidate(**candidate2_data)
        
        db_session.add_all([candidate1, candidate2])
        db_session.commit()
        
        # Act
        applied_candidates = service.get_candidates_by_status(status="applied")
        
        # Assert
        assert len(applied_candidates) >= 1
        assert all(c.status == "applied" for c in applied_candidates)


@pytest.mark.unit
@pytest.mark.service
class TestCandidateUpdate:
    """Test candidate update operations."""
    
    async def test_update_candidate_success(
        self, db_session: Session, test_candidate: Candidate, test_user: User
    ):
        """Test successful candidate update."""
        # Arrange
        service = CandidateService(db=db_session)
        update_data = CandidateUpdate(
            name="Updated Name",
            phone="555-9999"
        )
        
        # Act
        updated_candidate = await service.update_candidate(
            candidate_id=test_candidate.id,
            candidate_data=update_data,
            current_user=test_user
        )
        
        # Assert
        assert updated_candidate.name == "Updated Name"
        assert updated_candidate.phone == "555-9999"
        assert updated_candidate.id == test_candidate.id
    
    async def test_update_candidate_not_found(
        self, db_session: Session, test_user: User
    ):
        """Test updating non-existent candidate fails."""
        # Arrange
        service = CandidateService(db=db_session)
        update_data = CandidateUpdate(name="Updated Name")
        
        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            await service.update_candidate(
                candidate_id=99999,
                candidate_data=update_data,
                current_user=test_user
            )
        
        assert exc_info.value.status_code == 404
    
    async def test_update_candidate_status(
        self, db_session: Session, test_candidate: Candidate, test_user: User
    ):
        """Test updating candidate status."""
        # Arrange
        service = CandidateService(db=db_session)
        update_data = CandidateUpdate(status="interviewing")
        
        # Act
        updated_candidate = await service.update_candidate(
            candidate_id=test_candidate.id,
            candidate_data=update_data,
            current_user=test_user
        )
        
        # Assert
        assert updated_candidate.status == "interviewing"
    
    async def test_partial_update_candidate(
        self, db_session: Session, test_candidate: Candidate, test_user: User
    ):
        """Test partial update only modifies specified fields."""
        # Arrange
        service = CandidateService(db=db_session)
        original_email = test_candidate.email
        update_data = CandidateUpdate(phone="555-1234")
        
        # Act
        updated_candidate = await service.update_candidate(
            candidate_id=test_candidate.id,
            candidate_data=update_data,
            current_user=test_user
        )
        
        # Assert
        assert updated_candidate.phone == "555-1234"
        assert updated_candidate.email == original_email  # Unchanged


@pytest.mark.unit
@pytest.mark.service
class TestCandidateDeletion:
    """Test candidate deletion operations."""
    
    async def test_soft_delete_candidate(
        self, db_session: Session, test_candidate: Candidate, test_user: User
    ):
        """Test soft delete marks candidate as deleted."""
        # Arrange
        service = CandidateService(db=db_session)
        
        # Act
        result = await service.soft_delete_candidate(
            candidate_id=test_candidate.id,
            current_user=test_user
        )
        
        # Assert
        assert result is True
        
        # Verify candidate is marked as deleted
        db_session.refresh(test_candidate)
        assert test_candidate.is_deleted is True
        assert test_candidate.deleted_at is not None
    
    async def test_restore_candidate(
        self, db_session: Session, test_candidate: Candidate, test_user: User
    ):
        """Test restoring a soft-deleted candidate."""
        # Arrange
        service = CandidateService(db=db_session)
        
        # Soft delete first
        await service.soft_delete_candidate(
            candidate_id=test_candidate.id,
            current_user=test_user
        )
        
        # Act
        restored_candidate = await service.restore_candidate(
            candidate_id=test_candidate.id,
            current_user=test_user
        )
        
        # Assert
        assert restored_candidate.is_deleted is False
        assert restored_candidate.deleted_at is None
    
    async def test_hard_delete_candidate(
        self, db_session: Session, test_candidate: Candidate, admin_user: User
    ):
        """Test hard delete permanently removes candidate."""
        # Arrange
        service = CandidateService(db=db_session)
        candidate_id = test_candidate.id
        
        # Act
        result = await service.hard_delete_candidate(
            candidate_id=candidate_id,
            current_user=admin_user
        )
        
        # Assert
        assert result is True
        
        # Verify candidate no longer exists
        candidate = service.get_candidate(candidate_id=candidate_id)
        assert candidate is None


@pytest.mark.unit
@pytest.mark.service
class TestCandidatePromotionToEmployee:
    """Test promoting candidate to employee."""
    
    async def test_promote_candidate_to_employee(
        self, db_session: Session, test_candidate: Candidate, admin_user: User
    ):
        """Test successful promotion of candidate to employee."""
        # Arrange
        service = CandidateService(db=db_session)
        
        # Act
        employee = await service.promote_to_employee(
            candidate_id=test_candidate.id,
            current_user=admin_user
        )
        
        # Assert
        assert employee is not None
        assert employee.name == test_candidate.name
        assert employee.email == test_candidate.email
        
        # Verify candidate status updated
        db_session.refresh(test_candidate)
        assert test_candidate.status == CandidateStatus.HIRED
    
    async def test_promote_requires_approval(
        self, db_session: Session, test_candidate: Candidate, admin_user: User
    ):
        """Test promotion requires candidate to be approved."""
        # Arrange
        service = CandidateService(db=db_session)
        test_candidate.status = CandidateStatus.APPLIED
        db_session.commit()
        
        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            await service.promote_to_employee(
                candidate_id=test_candidate.id,
                current_user=admin_user
            )
        
        assert exc_info.value.status_code == 400
        assert "not approved" in str(exc_info.value.detail).lower()


@pytest.mark.unit
@pytest.mark.service
class TestCandidateSearch:
    """Test candidate search functionality."""
    
    def test_search_candidates_by_name(self, db_session: Session):
        """Test searching candidates by name."""
        # Arrange
        service = CandidateService(db=db_session)
        
        candidate1_data = CandidateFactory.build(name="John Doe")
        candidate2_data = CandidateFactory.build(name="Jane Smith")
        
        candidate1 = Candidate(**candidate1_data)
        candidate2 = Candidate(**candidate2_data)
        
        db_session.add_all([candidate1, candidate2])
        db_session.commit()
        
        # Act
        results = service.search_candidates(query="John")
        
        # Assert
        assert len(results) >= 1
        assert any(c.name == "John Doe" for c in results)
    
    def test_search_candidates_by_email(self, db_session: Session):
        """Test searching candidates by email."""
        # Arrange
        service = CandidateService(db=db_session)
        
        candidate_data = CandidateFactory.build(email="unique@example.com")
        candidate = Candidate(**candidate_data)
        db_session.add(candidate)
        db_session.commit()
        
        # Act
        results = service.search_candidates(query="unique@example.com")
        
        # Assert
        assert len(results) >= 1
        assert results[0].email == "unique@example.com"
    
    def test_search_candidates_case_insensitive(self, db_session: Session):
        """Test search is case-insensitive."""
        # Arrange
        service = CandidateService(db=db_session)
        
        candidate_data = CandidateFactory.build(name="Alice Wonderland")
        candidate = Candidate(**candidate_data)
        db_session.add(candidate)
        db_session.commit()
        
        # Act
        results_lower = service.search_candidates(query="alice")
        results_upper = service.search_candidates(query="ALICE")
        
        # Assert
        assert len(results_lower) >= 1
        assert len(results_upper) >= 1
        assert results_lower[0].id == results_upper[0].id
