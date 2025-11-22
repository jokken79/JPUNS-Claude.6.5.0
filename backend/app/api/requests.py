"""
Requests API Endpoints (Yukyu, Ikkikokoku, Taisha, etc.)

NOTE (2025-11-12): This API handles ALL request types generically.
For yukyu-specific operations (balance management, calculations, reports),
use the specialized /api/yukyu endpoints which provide richer functionality.

Supported request types:
- YUKYU (有給休暇) - Paid vacation -> Use /api/yukyu for advanced features
- IKKIKOKOKU (一時帰国) - Temporary return home
- TAISHA (退社) - Resignation
- NYUUSHA (入社) - New hire
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from datetime import date, datetime

from app.core.database import get_db
from app.models.models import Request, Employee, User, RequestType, RequestStatus, Candidate, CandidateStatus, Factory, Apartment
from app.schemas.request import RequestCreate, RequestUpdate, RequestResponse, RequestReview, EmployeeDataInput
from app.schemas.base import PaginatedResponse, create_paginated_response
from app.services.auth_service import auth_service
from app.services.audit_service import audit_service, AuditAction
from app.services.notification_service import NotificationService
from app.core.rate_limiter import limiter
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/", response_model=RequestResponse, status_code=201)
@limiter.limit("60/minute")async def create_request(
    request_data: RequestCreate,
    current_user: User = Depends(auth_service.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create new request (yukyu, ikkikokoku, taisha, nyuusha, etc.)

    NOTE: For yukyu requests with automatic balance deduction and
    advanced validations, consider using POST /api/yukyu/requests/ instead.
    """
    # Verify employee exists
    employee = db.query(Employee).filter(Employee.id == request_data.employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Check if employee can make request (only their own unless admin)
    if current_user.role.value == "employee":
        # Employee can only request for themselves
        # You'd need to link user to employee here
        pass

    # Calculate total days (for validation)
    delta = request_data.end_date - request_data.start_date
    total_days = delta.days + 1

    # Check yukyu balance for yukyu/hankyu requests
    if request_data.request_type in [RequestType.YUKYU, RequestType.HANKYU]:
        if employee.yukyu_remaining < float(total_days):
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient yukyu balance. Available: {employee.yukyu_remaining}"
            )

    # Create request with hakenmoto_id from employee
    request_dict = request_data.model_dump()
    request_dict['hakenmoto_id'] = employee.hakenmoto_id
    del request_dict['employee_id']  # Remove employee_id from schema
    if 'total_days' in request_dict:
        del request_dict['total_days']  # Remove total_days - it's a computed property

    new_request = Request(**request_dict)
    db.add(new_request)
    db.commit()
    db.refresh(new_request)

    return new_request


@router.get("/", response_model=PaginatedResponse[RequestResponse])
@limiter.limit("60/minute")async def list_requests(
    employee_id: int = Query(None, description="Filter by employee ID"),
    status: RequestStatus = Query(None, description="Filter by request status"),
    request_type: RequestType = Query(None, description="Filter by request type"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(auth_service.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    List requests with pagination.

    Returns paginated list of employee requests (yukyu, ikkikokoku, taisha, etc.)
    """
    query = db.query(Request)

    # Apply filters
    if employee_id:
        # Convert employee.id to hakenmoto_id for filtering
        employee = db.query(Employee).filter(Employee.id == employee_id).first()
        if employee:
            query = query.filter(Request.hakenmoto_id == employee.hakenmoto_id)
        else:
            # If employee not found, return empty result
            return create_paginated_response(items=[], total=0, page=page, page_size=page_size)

    if status:
        query = query.filter(Request.status == status)
    if request_type:
        query = query.filter(Request.request_type == request_type)

    # Get total count
    total = query.count()

    # Calculate pagination
    skip = (page - 1) * page_size

    # Get paginated results
    items = (
        query
        .order_by(Request.created_at.desc())
        .offset(skip)
        .limit(page_size)
        .all()
    )

    return create_paginated_response(
        items=items,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{request_id}", response_model=RequestResponse)
@limiter.limit("60/minute")async def get_request(
    request_id: int,
    current_user: User = Depends(auth_service.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get request by ID"""
    request = db.query(Request).filter(Request.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    return request


@router.put("/{request_id}", response_model=RequestResponse)
@limiter.limit("60/minute")async def update_request(
    request_id: int,
    request_update: RequestUpdate,
    current_user: User = Depends(auth_service.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update request (before approval)"""
    request = db.query(Request).filter(Request.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")

    if request.status != RequestStatus.PENDING:
        raise HTTPException(status_code=400, detail="Can only update pending requests")

    # Update fields, excluding total_days (computed property)
    for field, value in request_update.model_dump(exclude_unset=True).items():
        if field != 'total_days':
            setattr(request, field, value)

    db.commit()
    db.refresh(request)
    return request


@router.post("/{request_id}/review", response_model=RequestResponse)
@limiter.limit("60/minute")async def review_request(
    request_id: int,
    review_data: RequestReview,
    current_user: User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db)
):
    """Approve or reject request"""
    request = db.query(Request).filter(Request.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")

    if request.status != RequestStatus.PENDING:
        raise HTTPException(status_code=400, detail="Request already reviewed")

    request.status = review_data.status
    request.approved_by = current_user.id
    request.approved_at = func.now()
    if review_data.notes:
        request.notes = review_data.notes

    # Update yukyu balance if approved
    if review_data.status == RequestStatus.APPROVED:
        if request.request_type in [RequestType.YUKYU, RequestType.HANKYU]:
            employee = db.query(Employee).filter(Employee.hakenmoto_id == request.hakenmoto_id).first()
            if employee:
                employee.yukyu_used += float(request.total_days)
                employee.yukyu_remaining -= float(request.total_days)

    db.commit()
    db.refresh(request)
    return request


@router.post("/{request_id}/approve", response_model=RequestResponse)
@limiter.limit("60/minute")async def approve_request(
    request_id: int,
    current_user: User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db)
):
    """
    Approve a request (convenience endpoint).
    Shortcut for /review with status=APPROVED.

    NOTE: For yukyu requests, /api/yukyu/requests/{id}/approve provides
    comprehensive approval logic with balance validation and history tracking.
    """
    request = db.query(Request).filter(Request.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")

    if request.status != RequestStatus.PENDING:
        raise HTTPException(status_code=400, detail="Request already reviewed")

    request.status = RequestStatus.APPROVED
    request.approved_by = current_user.id
    request.approved_at = func.now()

    # Update yukyu balance if approved
    if request.request_type in [RequestType.YUKYU, RequestType.HANKYU]:
        employee = db.query(Employee).filter(Employee.hakenmoto_id == request.hakenmoto_id).first()
        if employee:
            employee.yukyu_used += float(request.total_days)
            employee.yukyu_remaining -= float(request.total_days)

    db.commit()
    db.refresh(request)
    return request


@router.post("/{request_id}/reject", response_model=RequestResponse)
@limiter.limit("60/minute")async def reject_request_endpoint(
    request_id: int,
    reason: str,
    current_user: User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db)
):
    """
    Reject a request with reason (convenience endpoint).
    Shortcut for /review with status=REJECTED.
    """
    request = db.query(Request).filter(Request.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")

    if request.status != RequestStatus.PENDING:
        raise HTTPException(status_code=400, detail="Request already reviewed")

    request.status = RequestStatus.REJECTED
    request.approved_by = current_user.id
    request.approved_at = func.now()
    request.notes = reason

    db.commit()
    db.refresh(request)
    return request


@router.delete("/{request_id}")
@limiter.limit("60/minute")async def delete_request(
    request_id: int,
    current_user: User = Depends(auth_service.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete request (only pending requests)"""
    request = db.query(Request).filter(Request.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")

    if request.status != RequestStatus.PENDING:
        raise HTTPException(status_code=400, detail="Can only delete pending requests")

    db.delete(request)
    db.commit()
    return {"message": "Request deleted"}


# ═══════════════════════════════════════════════════════════════════════════
#  🆕 ENDPOINTS FOR 入社連絡票 (NYUUSHA RENRAKUHYO) WORKFLOW
# ═══════════════════════════════════════════════════════════════════════════

@router.put(
    "/{request_id}/employee-data",
    tags=["requests", "nyuusha"],
    summary="保存従業員データ (Save Employee Data for NYUUSHA)",
    responses={
        200: {"description": "Employee data saved successfully"},
        400: {"description": "Invalid request type, status, or validation failed"},
        404: {"description": "Request, factory, or apartment not found"},
        403: {"description": "Permission denied"}
    }
)
async def save_employee_data(
    request_id: int,
    employee_data: EmployeeDataInput,
    current_user: User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db)
):
    """
    保存従業員データ - Save employee-specific data for a 入社連絡票 (New Hire Notification Form)

    ## Purpose
    This endpoint allows admins to fill in the employee-specific fields before approving
    the 入社連絡票 (New Hire Notification Form) and creating the employee record.

    The data is stored as JSON in the `employee_data` field and will be used when the
    request is approved (via `/approve-nyuusha`) to create the employee record.

    ## Workflow Step
    This is **STEP 2** of the NYUUSHA workflow:
    1. Candidate is approved → 入社連絡票 automatically created (status=PENDING)
    2. **Admin calls this endpoint** → employee_data filled with factory, hire_date, position, etc.
    3. Admin calls `/approve-nyuusha` → Employee created in database

    ## Required Role
    **admin** or higher

    ## Path Parameters
    - `request_id` (int, required): ID of the NYUUSHA request

    ## Request Body
    All employee data fields:
    - `factory_id` (str, required): Factory ID where employee will work
    - `hire_date` (str, required): Employee start date (YYYY-MM-DD, cannot be in past)
    - `jikyu` (int, required): Hourly wage in yen (must be 800-5000)
    - `position` (str, required): Job position/title (e.g., "Machine Operator", "製造スタッフ")
    - `contract_type` (str, required): Contract type (正社員, 契約社員, パート, etc.)
    - `is_shatak` (bool, required, default=false): 社宅 (Company housing) - Yes/No checkbox
    - `apartment_id` (str, optional): Housing assignment ID (used if is_shatak=true)
    - `hakensaki_shain_id` (str, optional): Dispatch staff ID
    - `bank_name` (str, optional): Bank name for salary deposit
    - `bank_account` (str, optional): Bank account number
    - `emergency_contact_name` (str, optional): Emergency contact person name
    - `emergency_contact_phone` (str, optional): Emergency contact phone number
    - `created_by_user` (str, optional): Username/name of person who created/filled this NYUUSHA document

    ## Validations
    - Factory must exist in database (checks factory_id)
    - Apartment must exist if provided (checks apartment_id)
    - Hire date cannot be in the past
    - Jikyu must be between 800-5000 yen
    - Request must be type NYUUSHA (not YUKYU, TAISHA, etc.)
    - Request must have status PENDING (not APPROVED or COMPLETED)

    ## Success Response (200)
    ```json
    {
      "message": "Employee data saved successfully",
      "request_id": 1,
      "employee_data": {
        "factory_id": "FAC-001",
        "hire_date": "2025-11-20",
        "jikyu": 1500,
        "position": "Machine Operator",
        "contract_type": "正社員",
        "is_shatak": true,
        "apartment_id": "APT-001",
        "bank_name": "Test Bank",
        "bank_account": "1234567890",
        "emergency_contact_name": "Jane Doe",
        "emergency_contact_phone": "090-9876-5432",
        "created_by_user": "admin_test"
      }
    }
    ```

    ## Error Examples

    ### 404 - Factory not found
    ```json
    {"detail": "Factory 'INVALID-FAC' not found. Please provide a valid factory_id"}
    ```

    ### 404 - Apartment not found
    ```json
    {"detail": "Apartment 'INVALID-APT' not found. Please provide a valid apartment_id or leave blank"}
    ```

    ### 400 - Hire date in past
    ```json
    {"detail": "Hire date cannot be in the past. Provided: 2025-11-10, Today: 2025-11-13"}
    ```

    ### 400 - Invalid jikyu
    ```json
    {"detail": "Jikyu must be between 800 and 5000 yen. Provided: 600"}
    ```

    ### 400 - Not a NYUUSHA request
    ```json
    {"detail": "This endpoint is only for 入社連絡票 (NYUUSHA) requests"}
    ```

    ### 400 - Request not pending
    ```json
    {"detail": "Cannot modify request with status: COMPLETED"}
    ```

    ## Audit Trail
    This action is logged in the audit trail with:
    - User ID who performed the action
    - All employee data fields provided
    - Timestamp of when data was filled
    """
    # Get request
    request = db.query(Request).filter(Request.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")

    # Verify it's a NYUUSHA request
    if request.request_type != RequestType.NYUUSHA:
        raise HTTPException(
            status_code=400,
            detail="This endpoint is only for 入社連絡票 (NYUUSHA) requests"
        )

    # Verify request is still pending
    if request.status != RequestStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot modify request with status: {request.status}"
        )

    # VALIDATION: Check that factory exists
    factory = db.query(Factory).filter(Factory.factory_id == employee_data.factory_id).first()
    if not factory:
        raise HTTPException(
            status_code=404,
            detail=f"Factory '{employee_data.factory_id}' not found. Please provide a valid factory_id"
        )

    # VALIDATION: Check that apartment exists (if provided)
    if employee_data.apartment_id:
        apartment = db.query(Apartment).filter(Apartment.id == employee_data.apartment_id).first()
        if not apartment:
            raise HTTPException(
                status_code=404,
                detail=f"Apartment '{employee_data.apartment_id}' not found. Please provide a valid apartment_id or leave blank"
            )

    # VALIDATION: Check hire_date is not in the past
    hire_date = datetime.strptime(employee_data.hire_date, "%Y-%m-%d").date() if isinstance(employee_data.hire_date, str) else employee_data.hire_date
    if hire_date < date.today():
        raise HTTPException(
            status_code=400,
            detail=f"Hire date cannot be in the past. Provided: {hire_date}, Today: {date.today()}"
        )

    # VALIDATION: Check jikyu is within valid range (800-5000 yen/hour)
    if employee_data.jikyu < 800 or employee_data.jikyu > 5000:
        raise HTTPException(
            status_code=400,
            detail=f"Jikyu must be between 800 and 5000 yen. Provided: {employee_data.jikyu}"
        )

    # Save employee data as JSON
    request.employee_data = employee_data.model_dump()

    db.commit()
    db.refresh(request)

    # Log to audit trail
    try:
        audit_service.log_employee_data_filled(
            db=db,
            user_id=current_user.id,
            request_id=request.id,
            candidate_id=request.candidate_id,
            employee_data=request.employee_data
        )
    except Exception as e:
        logger.error(f"Failed to log audit trail: {str(e)}")

    logger.info(f"Saved employee data for 入社連絡票 request {request_id} by user {current_user.id}")

    return {
        "message": "Employee data saved successfully",
        "request_id": request.id,
        "employee_data": request.employee_data
    }


@router.post(
    "/{request_id}/approve-nyuusha",
    tags=["requests", "nyuusha"],
    summary="承認入社連絡票 (Approve NYUUSHA and Create Employee)",
    responses={
        200: {"description": "NYUUSHA approved and employee created successfully"},
        400: {"description": "Invalid request type, status, or validation failed"},
        404: {"description": "Request or associated candidate not found"},
        403: {"description": "Permission denied"}
    }
)
async def approve_nyuusha_request(
    request_id: int,
    current_user: User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db)
):
    """
    承認入社連絡票 - Approve a 入社連絡票 (New Hire Notification Form) and create employee record

    ## Purpose
    This endpoint finalizes the NYUUSHA workflow by:
    1. Validating all employee data has been filled
    2. Creating an Employee record in the database
    3. Updating the candidate status to HIRED
    4. Marking the request as COMPLETED
    5. Linking the employee to the request via hakenmoto_id

    ## Workflow Step
    This is **STEP 3** of the NYUUSHA workflow (Final step):
    1. Candidate is approved → 入社連絡票 automatically created (status=PENDING)
    2. Admin calls `/employee-data` → employee_data filled with factory, hire_date, position, etc.
    3. **Admin calls this endpoint** → Employee created and request marked COMPLETED

    ## Required Role
    **admin** or higher

    ## Path Parameters
    - `request_id` (int, required): ID of the NYUUSHA request to approve

    ## Request Body
    None - All data comes from the request's employee_data field (filled in STEP 2)

    ## Pre-requisites
    Before calling this endpoint, ensure:
    - Request must be type NYUUSHA
    - Request must have status PENDING
    - Request must have employee_data filled (via PUT /employee-data)
    - No employee should already exist for this candidate
    - Associated candidate must still exist

    ## Data Copied
    The endpoint copies 40+ fields from candidate to create employee:
    - Personal: full_name_roman, full_name_kanji, full_name_kana, date_of_birth, gender
    - Contact: email, phone, address
    - Immigration: passport_number, zairyu_card_number, visa_type, visa_expiration
    - Personal Info: marital_status, dependents, photo_data_url
    - Employment (from employee_data): factory_id, hire_date, jikyu, position, contract_type
    - Additional: apartment_id, bank_name, bank_account, emergency_contact_*

    ## Success Response (200)
    ```json
    {
      "message": "入社連絡票 approved successfully. Employee created.",
      "employee_id": 123,
      "hakenmoto_id": 1001,
      "rirekisho_id": "RK-2025-001",
      "candidate_status": "HIRED",
      "request_status": "COMPLETED"
    }
    ```

    ## Error Examples

    ### 400 - Employee data not filled
    ```json
    {"detail": "Employee data must be filled before approval. Use PUT /api/requests/{id}/employee-data first."}
    ```

    ### 400 - Employee already exists
    ```json
    {"detail": "Employee already exists for this candidate (hakenmoto_id: 1000)"}
    ```

    ### 400 - Request is not pending
    ```json
    {"detail": "Request is already COMPLETED"}
    ```

    ### 400 - Not a NYUUSHA request
    ```json
    {"detail": "This endpoint is only for 入社連絡票 (NYUUSHA) requests"}
    ```

    ### 404 - Candidate not found
    ```json
    {"detail": "Associated candidate not found"}
    ```

    ## Side Effects
    This endpoint performs multiple operations:
    1. **Database**: Creates Employee record, updates Candidate status, updates Request status
    2. **Audit Log**: Records NYUUSHA approval and employee creation events
    3. **Notifications**: Sends email notification about new employee creation
    4. **ID Generation**: Generates new hakenmoto_id (auto-incrementing)

    ## Audit Trail
    This action is logged in the audit trail with:
    - NYUUSHA_APPROVED: Request approval event
    - EMPLOYEE_CREATED: New employee record creation
    - Timestamp, user ID, all affected entity IDs
    """
    # 1. Get and validate request
    request = db.query(Request).filter(Request.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")

    if request.request_type != RequestType.NYUUSHA:
        raise HTTPException(
            status_code=400,
            detail="This endpoint is only for 入社連絡票 (NYUUSHA) requests"
        )

    if request.status != RequestStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail=f"Request is already {request.status}"
        )

    if not request.employee_data:
        raise HTTPException(
            status_code=400,
            detail="Employee data must be filled before approval. Use PUT /api/requests/{id}/employee-data first."
        )

    # 2. Get candidate
    if not request.candidate_id:
        raise HTTPException(
            status_code=400,
            detail="Request has no associated candidate"
        )

    candidate = db.query(Candidate).filter(Candidate.id == request.candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Associated candidate not found")

    # 3. Check if employee already exists
    existing_employee = db.query(Employee).filter(
        Employee.rirekisho_id == candidate.rirekisho_id
    ).first()

    if existing_employee:
        raise HTTPException(
            status_code=400,
            detail=f"Employee already exists for this candidate (hakenmoto_id: {existing_employee.hakenmoto_id})"
        )

    # 4. Generate hakenmoto_id
    max_hakenmoto_id = db.query(func.max(Employee.hakenmoto_id)).scalar() or 0
    new_hakenmoto_id = max_hakenmoto_id + 1

    # 5. Extract employee data from JSON
    emp_data = request.employee_data

    # 6. Create Employee record
    new_employee = Employee(
        hakenmoto_id=new_hakenmoto_id,
        rirekisho_id=candidate.rirekisho_id,

        # Copy personal data from candidate (40+ fields)
        full_name_roman=candidate.full_name_roman,
        full_name_kanji=candidate.full_name_kanji,
        full_name_kana=candidate.full_name_kana,
        date_of_birth=candidate.date_of_birth,
        gender=candidate.gender,
        nationality=candidate.nationality,
        email=candidate.email,
        phone=candidate.phone,
        address=candidate.address,
        photo_data_url=candidate.photo_data_url,
        passport_number=candidate.passport_number,
        # FIXED: Use correct field names from Candidate model
        residence_card_number=candidate.residence_card_number,  # Fixed: was zairyu_card_number
        residence_status=candidate.residence_status,  # Fixed: was visa_type
        residence_expiry=candidate.residence_expiry,  # Fixed: was visa_expiration
        marital_status=candidate.marital_status,
        # Note: dependents field doesn't exist in Candidate model, so not copied

        # Add employee-specific data from employee_data JSON
        factory_id=emp_data.get("factory_id"),
        hire_date=emp_data.get("hire_date"),
        jikyu=emp_data.get("jikyu"),
        position=emp_data.get("position"),
        contract_type=emp_data.get("contract_type"),
        hakensaki_shain_id=emp_data.get("hakensaki_shain_id"),
        apartment_id=emp_data.get("apartment_id"),
        bank_name=emp_data.get("bank_name"),
        bank_account=emp_data.get("bank_account"),
        emergency_contact_name=emp_data.get("emergency_contact_name"),
        emergency_contact_phone=emp_data.get("emergency_contact_phone"),

        # Status
        status="active",
        created_at=datetime.now(),
        updated_at=datetime.now()
    )

    db.add(new_employee)
    db.flush()  # Get the employee ID without committing

    # 7. Update candidate status to HIRED
    candidate.status = CandidateStatus.HIRED

    # 8. Update request
    request.status = RequestStatus.COMPLETED  # 済
    request.approved_by = current_user.id
    request.approved_at = datetime.now()
    request.hakenmoto_id = new_hakenmoto_id  # Link request to employee

    db.commit()
    db.refresh(new_employee)

    # Log to audit trail - NYUUSHA approval
    try:
        audit_service.log_nyuusha_approved(
            db=db,
            user_id=current_user.id,
            request_id=request.id,
            candidate_id=candidate.id,
            hakenmoto_id=new_hakenmoto_id
        )

        # Also log employee creation separately
        audit_service.log_employee_created(
            db=db,
            user_id=current_user.id,
            employee_id=new_employee.id,
            hakenmoto_id=new_hakenmoto_id,
            candidate_id=candidate.id,
            candidate_name=candidate.full_name_roman
        )
    except Exception as e:
        logger.error(f"Failed to log audit trail for NYUUSHA approval: {str(e)}")

    # Send notification about employee creation
    try:
        notification_service = NotificationService()
        # Use current_user.email if available, otherwise use a default admin email
        admin_email = current_user.email or "admin@unsclaudejp.jp"
        await notification_service.send_employee_created(
            employee_name=new_employee.full_name_roman,
            hakenmoto_id=new_hakenmoto_id,
            admin_email=admin_email
        )
    except Exception as e:
        logger.warning(f"Failed to send notification: {str(e)}")

    logger.info(
        f"入社連絡票 approved: Request {request_id} → Employee created "
        f"(hakenmoto_id: {new_hakenmoto_id}, rirekisho_id: {candidate.rirekisho_id})"
    )

    return {
        "message": "入社連絡票 approved successfully. Employee created.",
        "employee_id": new_employee.id,
        "hakenmoto_id": new_hakenmoto_id,
        "rirekisho_id": new_employee.rirekisho_id,
        "candidate_status": candidate.status,
        "request_status": request.status
    }
