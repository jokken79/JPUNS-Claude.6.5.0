"""
Timer Cards API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from sqlalchemy.orm import Session, joinedload
from datetime import time as datetime_time, date, datetime
import os
import shutil
import logging

from app.core.database import get_db
from fastapi import Request
from app.core.response import success_response, created_response, paginated_response, no_content_response
from app.core.config import settings
from app.models.models import TimerCard, Employee, User
from app.schemas.timer_card import (
    TimerCardCreate, TimerCardUpdate, TimerCardResponse,
    TimerCardBulkCreate, TimerCardProcessResult,
    TimerCardUploadResponse, TimerCardApprove, TimerCardOCRData
)
from app.services.auth_service import auth_service
from app.services.timer_card_ocr_service import timer_card_ocr_service

logger = logging.getLogger(__name__)

router = APIRouter()

# Import limiter from main app (configured in main.py)
# Access via: from app.main import limiter
# Or use request.app.state.limiter inside endpoints if needed
from app.main import limiter


def _is_japanese_holiday(work_date: date) -> bool:
    """
    Check if a date is a Japanese national holiday or weekend.

    Args:
        work_date: Date to check

    Returns:
        True if holiday/weekend, False otherwise
    """
    # Weekend check (Saturday=5, Sunday=6)
    if work_date.weekday() in [5, 6]:
        return True

    # Japanese National Holidays (祝日)
    # Fixed holidays
    fixed_holidays = {
        (1, 1): "元日 (New Year's Day)",
        (2, 11): "建国記念の日 (National Foundation Day)",
        (2, 23): "天皇誕生日 (Emperor's Birthday)",
        (4, 29): "昭和の日 (Showa Day)",
        (5, 3): "憲法記念日 (Constitution Day)",
        (5, 4): "みどりの日 (Greenery Day)",
        (5, 5): "こどもの日 (Children's Day)",
        (8, 11): "山の日 (Mountain Day)",
        (11, 3): "文化の日 (Culture Day)",
        (11, 23): "勤労感謝の日 (Labor Thanksgiving Day)",
    }

    month_day = (work_date.month, work_date.day)
    if month_day in fixed_holidays:
        return True

    # Movable holidays (simplified calculation)
    year = work_date.year

    # 成人の日 (Coming of Age Day): Second Monday of January
    if work_date.month == 1:
        second_monday = _get_nth_weekday(year, 1, 0, 2)  # 0 = Monday
        if work_date == second_monday:
            return True

    # 海の日 (Marine Day): Third Monday of July
    if work_date.month == 7:
        third_monday = _get_nth_weekday(year, 7, 0, 3)
        if work_date == third_monday:
            return True

    # 敬老の日 (Respect for the Aged Day): Third Monday of September
    if work_date.month == 9:
        third_monday = _get_nth_weekday(year, 9, 0, 3)
        if work_date == third_monday:
            return True

    # スポーツの日 (Sports Day): Second Monday of October
    if work_date.month == 10:
        second_monday = _get_nth_weekday(year, 10, 0, 2)
        if work_date == second_monday:
            return True

    # 春分の日・秋分の日 (Vernal/Autumnal Equinox) - simplified
    # Exact calculation requires astronomical data, using approximation
    if work_date.month == 3 and 19 <= work_date.day <= 21:
        # Approximate vernal equinox (春分の日)
        vernal_equinox_day = int(20.8431 + 0.242194 * (year - 1980) - int((year - 1980) / 4))
        if work_date.day == vernal_equinox_day:
            return True

    if work_date.month == 9 and 22 <= work_date.day <= 24:
        # Approximate autumnal equinox (秋分の日)
        autumnal_equinox_day = int(23.2488 + 0.242194 * (year - 1980) - int((year - 1980) / 4))
        if work_date.day == autumnal_equinox_day:
            return True

    return False


def _get_nth_weekday(year: int, month: int, weekday: int, n: int) -> date:
    """
    Get the nth occurrence of a weekday in a month.

    Args:
        year: Year
        month: Month (1-12)
        weekday: Weekday (0=Monday, 6=Sunday)
        n: Which occurrence (1=first, 2=second, etc.)

    Returns:
        Date of the nth weekday
    """
    from datetime import date, timedelta

    # Start with first day of month
    first_day = date(year, month, 1)

    # Find first occurrence of target weekday
    days_ahead = weekday - first_day.weekday()
    if days_ahead < 0:
        days_ahead += 7

    first_occurrence = first_day + timedelta(days=days_ahead)

    # Add weeks to get nth occurrence
    nth_occurrence = first_occurrence + timedelta(weeks=n - 1)

    return nth_occurrence


def calculate_hours(clock_in: datetime_time, clock_out: datetime_time, break_minutes: int = 0, work_date: date = None):
    """
    Calculate work hours including night shift hours (22:00-05:00 JST) and holiday hours.

    Args:
        clock_in: Clock in time
        clock_out: Clock out time
        break_minutes: Break duration in minutes
        work_date: Date of work (for holiday detection)

    Returns:
        Dictionary with regular_hours, overtime_hours, night_hours, holiday_hours
    """
    from datetime import datetime, timedelta

    # Use provided work_date or today
    if work_date is None:
        work_date = datetime.today().date()

    # Convert to datetime for calculation
    start = datetime.combine(work_date, clock_in)
    end = datetime.combine(work_date, clock_out)

    # Handle overnight shifts
    if end < start:
        end += timedelta(days=1)

    # Calculate total hours
    total_minutes = (end - start).total_seconds() / 60
    work_minutes = total_minutes - break_minutes
    work_hours = work_minutes / 60

    # Check if it's a holiday/weekend
    is_holiday = _is_japanese_holiday(work_date)

    if is_holiday:
        # On holidays, ALL hours are holiday hours
        holiday_hours = work_hours
        regular_hours = 0.0
        overtime_hours = 0.0
    else:
        # Regular workday
        holiday_hours = 0.0
        regular_hours = min(work_hours, 8.0)
        overtime_hours = max(work_hours - 8.0, 0)

    # Calculate night hours (22:00-05:00 JST)
    night_hours = _calculate_night_hours(start, end, break_minutes)

    return {
        "regular_hours": round(regular_hours, 2),
        "overtime_hours": round(overtime_hours, 2),
        "night_hours": round(night_hours, 2),
        "holiday_hours": round(holiday_hours, 2)
    }


def _calculate_night_hours(start: datetime, end: datetime, break_minutes: int = 0) -> float:
    """
    Calculate hours worked during night shift period (22:00-05:00).

    Args:
        start: Work start datetime
        end: Work end datetime
        break_minutes: Break duration in minutes

    Returns:
        Total night shift hours
    """
    from datetime import datetime, timedelta, time as datetime_time

    # Night shift period: 22:00-05:00 (next day)
    NIGHT_START = datetime_time(22, 0)  # 22:00
    NIGHT_END = datetime_time(5, 0)     # 05:00

    night_minutes = 0.0

    # Process each day the shift spans
    current = start
    while current < end:
        day_date = current.date()

        # Define night period for this day (22:00 today - 05:00 tomorrow)
        night_start_dt = datetime.combine(day_date, NIGHT_START)
        night_end_dt = datetime.combine(day_date + timedelta(days=1), NIGHT_END)

        # Calculate overlap between work period and night period
        overlap_start = max(current, night_start_dt)
        overlap_end = min(end, night_end_dt)

        if overlap_start < overlap_end:
            overlap_minutes = (overlap_end - overlap_start).total_seconds() / 60
            night_minutes += overlap_minutes

        # Move to next day
        current = datetime.combine(day_date + timedelta(days=1), datetime_time(0, 0))

    # Subtract proportional break time from night hours
    if break_minutes > 0:
        total_work_minutes = (end - start).total_seconds() / 60
        if total_work_minutes > 0:
            break_ratio = break_minutes / total_work_minutes
            night_minutes = night_minutes * (1 - break_ratio)

    return round(night_minutes / 60, 2)


@router.post("/", response_model=TimerCardResponse, status_code=201)
@limiter.limit("30/minute")
async def create_timer_card(
    request: Request,
    timer_card: TimerCardCreate,
    current_user: User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db)
):
    """Create single timer card (Rate limit: 30/minute)"""
    # Calculate hours with holiday detection
    hours = calculate_hours(
        timer_card.clock_in,
        timer_card.clock_out,
        timer_card.break_minutes,
        timer_card.work_date
    )

    new_card = TimerCard(
        **timer_card.model_dump(),
        **hours
    )

    db.add(new_card)
    db.commit()
    db.refresh(new_card)
    return new_card


@router.post("/bulk", response_model=TimerCardProcessResult)
@limiter.limit("10/minute")
async def create_timer_cards_bulk(
    request: Request,
    bulk_data: TimerCardBulkCreate,
    current_user: User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db)
):
    """Create multiple timer cards (Rate limit: 10/minute - bulk operation)"""
    created_ids = []
    errors = []

    for record in bulk_data.records:
        try:
            hours = calculate_hours(
                record.clock_in,
                record.clock_out,
                record.break_minutes,
                record.work_date
            )
            new_card = TimerCard(**record.model_dump(), **hours)
            db.add(new_card)
            db.flush()
            created_ids.append(new_card.id)
        except Exception as e:
            errors.append(f"Error creating record for hakenmoto {record.hakenmoto_id}: {str(e)}")

    db.commit()

    return TimerCardProcessResult(
        total_records=len(bulk_data.records),
        successful=len(created_ids),
        failed=len(errors),
        errors=errors,
        created_ids=created_ids
    )


@router.post("/upload", response_model=TimerCardUploadResponse)
@limiter.limit("20/hour")  # OCR processing is expensive - limit to 20 uploads per hour
async def upload_timer_card_file(
    request: Request,
    file: UploadFile = File(...),
    factory_id: str = None,
    current_user: User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db)
):
    """Upload timer card PDF and process with OCR (Rate limit: 20/hour - expensive OCR operation)"""

    # Validar tipo de archivo
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos PDF")

    # Leer contenido del PDF
    pdf_bytes = await file.read()

    # Procesar con OCR
    try:
        ocr_result = timer_card_ocr_service.process_pdf(pdf_bytes, factory_id)

        if not ocr_result.get('success'):
            raise HTTPException(
                status_code=500,
                detail=f"Error procesando PDF: {ocr_result.get('error')}"
            )

        # Convertir a TimerCardOCRData schemas
        ocr_data = [
            TimerCardOCRData(
                page_number=record.get('page_number'),
                work_date=record.get('work_date'),
                employee_name_ocr=record.get('employee_name_ocr'),
                employee_matched=record.get('employee_matched'),
                clock_in=record.get('clock_in'),
                clock_out=record.get('clock_out'),
                break_minutes=record.get('break_minutes', 0),
                validation_errors=record.get('validation_errors', []),
                confidence_score=record.get('confidence_score', 0.0)
            )
            for record in ocr_result.get('records', [])
        ]

        return TimerCardUploadResponse(
            file_name=file.filename,
            pages_processed=ocr_result.get('pages_processed', 0),
            records_found=len(ocr_data),
            ocr_data=ocr_data,
            processing_errors=ocr_result.get('processing_errors', []),
            message=f"{len(ocr_data)} registros extraídos. Por favor revisar y confirmar."
        )

    except Exception as e:
        logger.error(f"Error processing timer card: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error procesando timer card: {str(e)}"
        )


@router.get("/", response_model=list[TimerCardResponse])
@limiter.limit("100/minute")
async def list_timer_cards(
    request: Request,
    employee_id: int = None,
    factory_id: str = None,
    is_approved: bool = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(auth_service.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    List timer cards with role-based access control (Rate limit: 100/minute)

    Role-based filtering:
    - EMPLOYEE/CONTRACT_WORKER: Only see their own timer cards (matched by email)
    - KANRININSHA: See timer cards from their factory
    - COORDINATOR: See timer cards from assigned factories
    - ADMIN/SUPER_ADMIN/KEITOSAN/TANTOSHA: See all timer cards
    """
    # Limit to max 1000
    limit = min(limit, 1000)

    query = db.query(TimerCard)

    # Role-based access control filtering
    user_role = current_user.role.value

    if user_role in ["EMPLOYEE", "CONTRACT_WORKER"]:
        # Employees can only see their own timer cards
        # Match user email with employee email to find their timer cards
        employee = db.query(Employee).filter(Employee.email == current_user.email).first()
        if employee:
            query = query.filter(TimerCard.hakenmoto_id == employee.hakenmoto_id)
            logger.info(f"User {current_user.username} filtering timer cards for hakenmoto_id={employee.hakenmoto_id}")
        else:
            # If no employee record found for this user, return empty list
            logger.warning(f"User {current_user.username} (role: {user_role}) has no employee record")
            return []

    elif user_role == "KANRININSHA":
        # Managers can see timer cards from their factory
        employee = db.query(Employee).filter(Employee.email == current_user.email).first()
        if employee and employee.factory_id:
            query = query.filter(TimerCard.factory_id == employee.factory_id)
            logger.info(f"Manager {current_user.username} filtering timer cards for factory_id={employee.factory_id}")
        else:
            logger.warning(f"Manager {current_user.username} has no factory assignment")
            return []

    elif user_role == "COORDINATOR":
        # Coordinators can see timer cards from their assigned factories
        # For now, allow all - can be restricted based on coordinator-factory relationship
        logger.info(f"Coordinator {current_user.username} accessing all timer cards")

    # ADMIN, SUPER_ADMIN, KEITOSAN, TANTOSHA: No filtering (see all)

    # Apply additional filters (available to authorized roles)
    if employee_id:
        # Convert employee.id to hakenmoto_id for filtering
        employee = db.query(Employee).filter(Employee.id == employee_id).first()
        if employee:
            query = query.filter(TimerCard.hakenmoto_id == employee.hakenmoto_id)
        else:
            # If employee not found, return empty result
            return []
    if factory_id:
        query = query.filter(TimerCard.factory_id == factory_id)
    if is_approved is not None:
        query = query.filter(TimerCard.is_approved == is_approved)

    # Eager load employee relationship to prevent N+1 queries
    return (
        query
        .order_by(TimerCard.work_date.desc(), TimerCard.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/{timer_card_id}", response_model=TimerCardResponse)
@limiter.limit("100/minute")
async def get_timer_card(
    request: Request,
    timer_card_id: int,
    current_user: User = Depends(auth_service.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific timer card by ID with role-based access control (Rate limit: 100/minute)

    Access rules:
    - EMPLOYEE/CONTRACT_WORKER: Only their own timer cards (matched by email)
    - KANRININSHA: Only timer cards from their factory
    - COORDINATOR: Only timer cards from assigned factories
    - ADMIN/SUPER_ADMIN/KEITOSAN/TANTOSHA: All timer cards
    """
    timer_card = (
        db.query(TimerCard)
        .filter(TimerCard.id == timer_card_id)
        .first()
    )

    if not timer_card:
        raise HTTPException(status_code=404, detail="Timer card not found")

    # Role-based access control
    user_role = current_user.role.value

    if user_role in ["EMPLOYEE", "CONTRACT_WORKER"]:
        # Employees can only view their own timer cards
        employee = db.query(Employee).filter(Employee.email == current_user.email).first()

        if not employee:
            logger.warning(f"Employee record not found for user {current_user.username}")
            raise HTTPException(
                status_code=403,
                detail="Access denied: Employee record not found"
            )

        if timer_card.hakenmoto_id != employee.hakenmoto_id:
            logger.warning(
                f"User {current_user.username} attempted to access timer card {timer_card_id} "
                f"belonging to different employee"
            )
            raise HTTPException(
                status_code=403,
                detail="Access denied: You can only view your own timer cards"
            )

    elif user_role == "KANRININSHA":
        # Managers can view timer cards from their factory
        employee = db.query(Employee).filter(Employee.email == current_user.email).first()

        if not employee:
            logger.warning(f"Manager record not found for user {current_user.username}")
            raise HTTPException(
                status_code=403,
                detail="Access denied: Manager employee record not found"
            )

        # Check if timer card belongs to same factory
        if timer_card.factory_id != employee.factory_id:
            logger.warning(
                f"Manager {current_user.username} attempted to access timer card from different factory"
            )
            raise HTTPException(
                status_code=403,
                detail="Access denied: You can only view timer cards from your factory"
            )

    elif user_role == "COORDINATOR":
        # Coordinators can view timer cards from assigned factories
        # For now, allow all - can be restricted based on coordinator-factory relationship
        pass

    # ADMIN, SUPER_ADMIN, KEITOSAN, TANTOSHA: No restrictions

    logger.info(f"User {current_user.username} accessed timer card {timer_card_id}")
    return timer_card


@router.put("/{timer_card_id}", response_model=TimerCardResponse)
@limiter.limit("30/minute")
async def update_timer_card(
    request: Request,
    timer_card_id: int,
    timer_card_update: TimerCardUpdate,
    current_user: User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db)
):
    """Update timer card (Rate limit: 30/minute)"""
    timer_card = db.query(TimerCard).filter(TimerCard.id == timer_card_id).first()
    if not timer_card:
        raise HTTPException(status_code=404, detail="Timer card not found")
    
    # Update fields
    for field, value in timer_card_update.model_dump(exclude_unset=True).items():
        setattr(timer_card, field, value)

    # Recalculate hours if time or date changed
    if timer_card_update.clock_in or timer_card_update.clock_out or timer_card_update.work_date:
        hours = calculate_hours(
            timer_card.clock_in,
            timer_card.clock_out,
            timer_card.break_minutes,
            timer_card.work_date
        )
        for key, value in hours.items():
            setattr(timer_card, key, value)

    db.commit()
    db.refresh(timer_card)
    return timer_card


@router.post("/approve", response_model=dict)
@limiter.limit("30/minute")
async def approve_timer_cards(
    request: Request,
    approve_data: TimerCardApprove,
    current_user: User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db)
):
    """Approve multiple timer cards (Rate limit: 30/minute)"""
    cards = db.query(TimerCard).filter(TimerCard.id.in_(approve_data.timer_card_ids)).all()
    
    for card in cards:
        card.is_approved = True
    
    db.commit()
    
    return {"message": f"Approved {len(cards)} timer cards"}


@router.delete("/{timer_card_id}")
@limiter.limit("20/minute")
async def delete_timer_card(
    request: Request,
    timer_card_id: int,
    current_user: User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db)
):
    """Delete timer card (Rate limit: 20/minute)"""
    timer_card = db.query(TimerCard).filter(TimerCard.id == timer_card_id).first()
    if not timer_card:
        raise HTTPException(status_code=404, detail="Timer card not found")
    
    db.delete(timer_card)
    db.commit()
    return {"message": "Timer card deleted"}
