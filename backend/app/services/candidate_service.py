"""
Candidate Service - Business Logic for Candidate Management (履歴書/Rirekisho)

This service handles all business logic for candidate operations:
- CRUD operations (Create, Read, Update, Delete)
- Duplicate validation
- Soft delete and restore
- Approval workflow
- Promotion to employee
- Thread-safe ID generation
"""

import logging
import threading
from typing import Optional, List, Tuple
from datetime import datetime, date
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from fastapi import HTTPException, status

from app.models.models import Candidate, Employee, User, CandidateStatus
from app.schemas.candidate import CandidateCreate, CandidateUpdate
from app.core.config import settings

logger = logging.getLogger(__name__)

# Thread-safe locks for ID generation
id_generation_lock = threading.Lock()
applicant_id_generation_lock = threading.Lock()


class CandidateService:
    """Service for candidate business logic"""

    def __init__(self, db: Session):
        self.db = db

    async def create_candidate(
        self,
        candidate_data: CandidateCreate,
        current_user: User
    ) -> Candidate:
        """
        Create a new candidate with duplicate validation.

        Args:
            candidate_data: Candidate creation data
            current_user: User creating the candidate

        Returns:
            Created Candidate object

        Raises:
            HTTPException: If validation fails or duplicate found
        """
        # Basic validation
        if not candidate_data.full_name_kanji and not candidate_data.full_name_roman:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Candidate name (Kanji or Roman) is required."
            )

        # Validate duplicates
        await self._validate_duplicates(candidate_data)

        # Generate rirekisho_id
        rirekisho_id = self._generate_rirekisho_id()

        # Create candidate
        candidate_dict = candidate_data.model_dump(exclude_unset=True)
        candidate = Candidate(
            rirekisho_id=rirekisho_id,
            **candidate_dict
        )

        # Set applicant_id if not provided
        if not candidate.applicant_id:
            candidate.applicant_id = rirekisho_id

        # Copy photo_data_url to photo_url if not provided
        if candidate.photo_data_url and not candidate.photo_url:
            candidate.photo_url = candidate.photo_data_url

        self.db.add(candidate)
        self.db.commit()
        self.db.refresh(candidate)

        logger.info(f"Created candidate {candidate.rirekisho_id} by user {current_user.username}")

        return candidate

    async def get_candidate(self, candidate_id: int) -> Optional[Candidate]:
        """
        Get candidate by ID (excluding soft-deleted).

        Args:
            candidate_id: Candidate ID

        Returns:
            Candidate object or None if not found
        """
        return (
            self.db.query(Candidate)
            .filter(
                Candidate.id == candidate_id,
                Candidate.deleted_at.is_(None)
            )
            .first()
        )

    async def get_candidate_by_rirekisho_id(self, rirekisho_id: str) -> Optional[Candidate]:
        """
        Get candidate by rirekisho_id (excluding soft-deleted).

        Args:
            rirekisho_id: Rirekisho ID (e.g., 'UNS-1')

        Returns:
            Candidate object or None if not found
        """
        return (
            self.db.query(Candidate)
            .filter(
                Candidate.rirekisho_id == rirekisho_id,
                Candidate.deleted_at.is_(None)
            )
            .first()
        )

    async def list_candidates(
        self,
        skip: int = 0,
        limit: int = 50,
        status_filter: Optional[str] = None,
        search: Optional[str] = None,
        sort: str = "newest"
    ) -> Tuple[List[Candidate], int]:
        """
        List candidates with filters and pagination.

        Args:
            skip: Number of records to skip (pagination)
            limit: Maximum number of records to return
            status_filter: Filter by candidate status
            search: Search term (name, rirekisho_id)
            sort: Sort order ('newest', 'oldest', 'id_asc', 'id_desc')

        Returns:
            Tuple of (candidates list, total count)
        """
        query = self.db.query(Candidate).filter(Candidate.deleted_at.is_(None))

        # Apply status filter
        if status_filter:
            query = query.filter(Candidate.status == status_filter)

        # Apply search
        if search:
            query = query.filter(
                or_(
                    Candidate.full_name_kanji.ilike(f"%{search}%"),
                    Candidate.full_name_kana.ilike(f"%{search}%"),
                    Candidate.full_name_roman.ilike(f"%{search}%"),
                    Candidate.rirekisho_id.ilike(f"%{search}%")
                )
            )

        # Get total count
        total = query.count()

        # Apply sorting
        if sort == "oldest":
            query = query.order_by(Candidate.id.asc())
        elif sort == "id_asc":
            query = query.order_by(Candidate.id.asc())
        elif sort == "id_desc":
            query = query.order_by(Candidate.id.desc())
        else:  # default to newest
            query = query.order_by(Candidate.id.desc())

        # Apply pagination
        candidates = query.offset(skip).limit(limit).all()

        return candidates, total

    async def update_candidate(
        self,
        candidate_id: int,
        candidate_data: CandidateUpdate,
        current_user: User
    ) -> Candidate:
        """
        Update candidate.

        Args:
            candidate_id: Candidate ID
            candidate_data: Updated candidate data
            current_user: User updating the candidate

        Returns:
            Updated Candidate object

        Raises:
            HTTPException: If candidate not found
        """
        candidate = await self.get_candidate(candidate_id)
        if not candidate:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Candidate not found"
            )

        # Update fields
        update_data = candidate_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(candidate, key, value)

        self.db.commit()
        self.db.refresh(candidate)

        logger.info(f"Updated candidate {candidate.rirekisho_id} by user {current_user.username}")

        return candidate

    async def delete_candidate(self, candidate_id: int, current_user: User) -> None:
        """
        Soft delete candidate.

        Args:
            candidate_id: Candidate ID
            current_user: User deleting the candidate

        Raises:
            HTTPException: If candidate not found or already deleted
        """
        candidate = await self.get_candidate(candidate_id)
        if not candidate:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Candidate not found"
            )

        if candidate.is_deleted:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Candidate is already deleted"
            )

        candidate.soft_delete()
        self.db.commit()

        logger.info(f"Soft deleted candidate {candidate.rirekisho_id} by user {current_user.username}")

    async def restore_candidate(self, candidate_id: int, current_user: User) -> Candidate:
        """
        Restore soft-deleted candidate.

        Args:
            candidate_id: Candidate ID
            current_user: User restoring the candidate

        Returns:
            Restored Candidate object

        Raises:
            HTTPException: If candidate not found or not deleted
        """
        candidate = self.db.query(Candidate).filter(
            Candidate.id == candidate_id
        ).first()

        if not candidate:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Candidate not found"
            )

        if not candidate.deleted_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Candidate is not deleted"
            )

        candidate.restore()
        self.db.commit()
        self.db.refresh(candidate)

        logger.info(f"Restored candidate {candidate.rirekisho_id} by user {current_user.username}")

        return candidate

    async def approve_candidate(
        self,
        candidate_id: int,
        notes: Optional[str],
        current_user: User
    ) -> Candidate:
        """
        Approve candidate.

        Args:
            candidate_id: Candidate ID
            notes: Optional approval notes
            current_user: User approving the candidate

        Returns:
            Approved Candidate object

        Raises:
            HTTPException: If candidate not found
        """
        candidate = await self.get_candidate(candidate_id)
        if not candidate:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Candidate not found"
            )

        candidate.status = CandidateStatus.APPROVED
        candidate.approved_by = current_user.id
        candidate.approved_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(candidate)

        logger.info(f"Approved candidate {candidate.rirekisho_id} by user {current_user.username}")

        return candidate

    async def reject_candidate(
        self,
        candidate_id: int,
        reason: Optional[str],
        current_user: User
    ) -> Candidate:
        """
        Reject candidate.

        Args:
            candidate_id: Candidate ID
            reason: Rejection reason
            current_user: User rejecting the candidate

        Returns:
            Rejected Candidate object

        Raises:
            HTTPException: If candidate not found
        """
        candidate = await self.get_candidate(candidate_id)
        if not candidate:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Candidate not found"
            )

        candidate.status = CandidateStatus.REJECTED
        candidate.approved_by = current_user.id
        candidate.approved_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(candidate)

        logger.info(f"Rejected candidate {candidate.rirekisho_id} by user {current_user.username}")

        return candidate

    async def evaluate_candidate(
        self,
        candidate_id: int,
        approved: bool,
        notes: Optional[str],
        current_user: User
    ) -> Candidate:
        """
        Quick evaluate candidate (thumbs up/down).

        Args:
            candidate_id: Candidate ID
            approved: True for approved, False for pending
            notes: Optional evaluation notes
            current_user: User evaluating the candidate

        Returns:
            Evaluated Candidate object

        Raises:
            HTTPException: If candidate not found
        """
        candidate = await self.get_candidate(candidate_id)
        if not candidate:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Candidate not found"
            )

        candidate.status = CandidateStatus.APPROVED if approved else CandidateStatus.PENDING
        candidate.approved_by = current_user.id
        candidate.approved_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(candidate)

        logger.info(f"Evaluated candidate {candidate.rirekisho_id} (approved={approved}) by user {current_user.username}")

        return candidate

    async def promote_to_employee(
        self,
        candidate: Candidate,
        factory_id: Optional[str],
        hire_date: Optional[date],
        jikyu: Optional[int],
        position: Optional[str],
        contract_type: Optional[str],
        hakensaki_shain_id: Optional[str],
        notes: Optional[str],
        current_user: User
    ) -> Employee:
        """
        Promote candidate to employee.

        Args:
            candidate: Candidate object to promote
            factory_id: Factory/client site ID
            hire_date: Hire date
            jikyu: Hourly wage (時給)
            position: Job position
            contract_type: Contract type
            hakensaki_shain_id: Client employee ID (派遣先社員ID)
            notes: Optional notes
            current_user: User promoting the candidate

        Returns:
            Created Employee object

        Raises:
            HTTPException: If employee already exists or candidate data invalid
        """
        # Check if employee already exists
        existing = self.db.query(Employee).filter(
            Employee.rirekisho_id == candidate.rirekisho_id
        ).first()

        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Employee already exists for this candidate (ID: {existing.hakenmoto_id})"
            )

        # Validate candidate has required data
        employee_name = candidate.full_name_kanji or candidate.full_name_roman
        if not employee_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Candidate name is required to create an employee"
            )

        # Generate hakenmoto_id
        hakenmoto_id = self._generate_hakenmoto_id()

        # Build address from 3-part Japanese structure
        address_parts = [
            candidate.current_address,
            candidate.address_banchi,
            candidate.address_building,
        ]
        candidate_address = " ".join([part for part in address_parts if part]) or candidate.registered_address

        # Default jikyu to 0 if not provided
        jikyu_value = jikyu if jikyu is not None else 0

        # Create employee
        new_employee = Employee(
            hakenmoto_id=hakenmoto_id,
            rirekisho_id=candidate.rirekisho_id,
            factory_id=factory_id,
            hakensaki_shain_id=hakensaki_shain_id,
            full_name_kanji=employee_name,
            full_name_kana=candidate.full_name_kana,
            photo_url=candidate.photo_url,
            photo_data_url=candidate.photo_data_url,
            date_of_birth=candidate.date_of_birth,
            gender=candidate.gender,
            nationality=candidate.nationality,
            zairyu_card_number=candidate.residence_card_number,
            zairyu_expire_date=candidate.residence_expiry,
            address=candidate_address,
            current_address=candidate.current_address,  # 現住所 - Base address
            address_banchi=candidate.address_banchi,  # 番地 - Block/lot number
            address_building=candidate.address_building,  # 物件名 - Building name
            postal_code=candidate.postal_code,
            phone=candidate.mobile or candidate.phone,
            email=candidate.email,
            emergency_contact_name=candidate.emergency_contact_name,
            emergency_contact_relationship=candidate.emergency_contact_relation,
            emergency_contact_phone=candidate.emergency_contact_phone,
            hire_date=hire_date or candidate.hire_date,
            jikyu=jikyu_value,
            position=position,
            contract_type=contract_type,
            notes=notes,
        )

        self.db.add(new_employee)
        self.db.flush()

        # Update candidate status to hired
        candidate.status = CandidateStatus.HIRED

        self.db.commit()
        self.db.refresh(new_employee)

        logger.info(f"Promoted candidate {candidate.rirekisho_id} to employee {new_employee.hakenmoto_id} by user {current_user.username}")

        return new_employee

    async def _validate_duplicates(self, candidate_data: CandidateCreate) -> None:
        """
        Validate that candidate doesn't already exist.

        Args:
            candidate_data: Candidate data to validate

        Raises:
            HTTPException: If duplicate found
        """
        # Check by name + date of birth
        if candidate_data.full_name_kanji and candidate_data.date_of_birth:
            existing = self.db.query(Candidate).filter(
                Candidate.full_name_kanji == candidate_data.full_name_kanji,
                Candidate.date_of_birth == candidate_data.date_of_birth,
                Candidate.deleted_at.is_(None)
            ).first()

            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"候補者が既に存在します (ID: {existing.rirekisho_id})"
                )

        # Check by email if provided
        if candidate_data.email:
            existing = self.db.query(Candidate).filter(
                Candidate.email == candidate_data.email,
                Candidate.deleted_at.is_(None)
            ).first()

            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"このメールアドレスは既に使用されています"
                )

    def _generate_rirekisho_id(self) -> str:
        """
        Generate next rirekisho_id (thread-safe).

        Returns:
            Generated rirekisho ID (e.g., 'UNS-1')
        """
        with id_generation_lock:
            last_candidate = self.db.query(Candidate).order_by(
                Candidate.id.desc()
            ).first()

            prefix = getattr(settings, 'RIREKISHO_ID_PREFIX', 'UNS-')
            start_num = getattr(settings, 'RIREKISHO_ID_START', 1)

            if not isinstance(prefix, str) or not prefix:
                raise ValueError("RIREKISHO_ID_PREFIX must be a non-empty string.")
            if not isinstance(start_num, int) or start_num < 1:
                raise ValueError("RIREKISHO_ID_START must be a positive integer.")

            # Extract numeric part from existing rirekisho_id or use database count
            if last_candidate and last_candidate.rirekisho_id:
                try:
                    # Parse existing ID: UNS-123 -> 123
                    id_parts = last_candidate.rirekisho_id.split('-')
                    if len(id_parts) >= 2:
                        last_num = int(id_parts[1])
                        next_num = last_num + 1
                        logger.info(f"Generated next rirekisho_id: {prefix}{next_num} (from previous: {last_candidate.rirekisho_id})")
                    else:
                        # Fallback to database count
                        next_num = self.db.query(Candidate).count() + start_num
                        logger.info(f"Generated next rirekisho_id: {prefix}{next_num} (fallback to count)")
                except (ValueError, IndexError) as e:
                    logger.warning(f"Failed to parse rirekisho_id '{last_candidate.rirekisho_id}': {e}")
                    # Fallback if parsing fails
                    next_num = self.db.query(Candidate).count() + start_num
                    logger.info(f"Generated next rirekisho_id: {prefix}{next_num} (fallback due to parse error)")
            else:
                # First candidate
                next_num = start_num
                logger.info(f"Generated first rirekisho_id: {prefix}{next_num}")

            return f"{prefix}{next_num}"

    def _generate_hakenmoto_id(self) -> int:
        """
        Generate next hakenmoto_id for employee.

        Returns:
            Generated hakenmoto ID (integer)
        """
        last_employee = self.db.query(Employee).order_by(
            Employee.hakenmoto_id.desc()
        ).first()

        next_id = (last_employee.hakenmoto_id + 1) if last_employee else 1
        logger.info(f"Generated hakenmoto_id: {next_id}")

        return next_id


# Dependency for FastAPI
def get_candidate_service(db: Session) -> CandidateService:
    """
    Dependency to get CandidateService instance.

    Args:
        db: Database session

    Returns:
        CandidateService instance
    """
    return CandidateService(db)
