"""
Employees API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_
from typing import Optional
import pandas as pd
from datetime import datetime, date
import io

from app.core.database import get_db
from app.models.models import (
    Employee,
    Candidate,
    User,
    CandidateStatus,
    Factory,
    Document,
    ContractWorker,
    Staff,
    Apartment,
    ApartmentAssignment,
    AssignmentStatus,
)
from app.schemas.employee import (
    EmployeeCreate, EmployeeUpdate, EmployeeResponse,
    EmployeeTerminate, YukyuUpdate,
    StaffResponse,           # NUEVO
    ContractWorkerResponse   # NUEVO
)
from app.services.auth_service import auth_service
from pydantic import BaseModel

router = APIRouter()


class ChangeTypeRequest(BaseModel):
    """Request schema for changing employee type"""
    new_type: str  # "employee" | "staff" | "contract_worker"
    # Campos opcionales específicos de cada tipo
    monthly_salary: Optional[int] = None  # Para staff
    jikyu: Optional[int] = None  # Para employee/contract_worker


@router.post("/", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
async def create_employee(
    employee: EmployeeCreate,
    current_user: User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db)
):
    """Create employee from approved candidate (入社届)"""
    # Verify candidate is approved
    candidate = db.query(Candidate).filter(Candidate.rirekisho_id == employee.rirekisho_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    if candidate.status != CandidateStatus.APPROVED:
        raise HTTPException(status_code=400, detail="Candidate not approved")

    # Generate Hakenmoto ID
    last_employee = db.query(Employee).order_by(Employee.hakenmoto_id.desc()).first()
    hakenmoto_id = (last_employee.hakenmoto_id + 1) if last_employee else 1

    # Create employee with data from candidate
    employee_data = employee.model_dump()

    # Copy photo from candidate
    if candidate.photo_url:
        employee_data['photo_url'] = candidate.photo_url
    if candidate.photo_data_url:
        employee_data['photo_data_url'] = candidate.photo_data_url

    new_employee = Employee(
        hakenmoto_id=hakenmoto_id,
        **employee_data
    )

    # Mark candidate as hired
    candidate.status = CandidateStatus.HIRED

    db.add(new_employee)
    db.commit()
    db.refresh(new_employee)

    # Copy documents from candidate to employee
    candidate_documents = db.query(Document).filter(Document.candidate_id == candidate.id).all()
    for doc in candidate_documents:
        # Create a copy of the document for the employee
        employee_document = Document(
            employee_id=new_employee.id,
            candidate_id=None,  # Keep reference to original candidate if needed, or set to None
            document_type=doc.document_type,
            file_name=doc.file_name,
            file_path=doc.file_path,
            file_size=doc.file_size,
            mime_type=doc.mime_type,
            ocr_data=doc.ocr_data,
            uploaded_by=current_user.id
        )
        db.add(employee_document)

    db.commit()

    return new_employee


def _paginate_response(items, total, page, page_size):
    total_pages = (total + page_size - 1) // page_size
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_previous": page > 1
    }


def _list_contract_workers(
    *,
    page: int,
    page_size: int,
    factory_id: Optional[str],
    is_active: Optional[bool],
    search: Optional[str],
    db: Session,
):
    """Lista ContractWorker (請負社員) usando ContractWorkerResponse directamente"""
    query = db.query(ContractWorker)
    # Exclude soft-deleted contract workers by default
    query = query.filter(ContractWorker.deleted_at.is_(None))

    if factory_id:
        query = query.filter(ContractWorker.factory_id == factory_id)
    if is_active is not None:
        query = query.filter(ContractWorker.is_active == is_active)
    if search:
        from sqlalchemy import or_, cast, String

        search_conditions = [
            ContractWorker.full_name_kanji.ilike(f"%{search}%"),
            ContractWorker.full_name_kana.ilike(f"%{search}%"),
            ContractWorker.rirekisho_id.ilike(f"%{search}%"),
            ContractWorker.factory_id.ilike(f"%{search}%"),
            ContractWorker.hakensaki_shain_id.ilike(f"%{search}%"),
            ContractWorker.gender.ilike(f"%{search}%"),
            ContractWorker.nationality.ilike(f"%{search}%"),
            ContractWorker.address.ilike(f"%{search}%"),
            ContractWorker.phone.ilike(f"%{search}%"),
            ContractWorker.email.ilike(f"%{search}%"),
            ContractWorker.postal_code.ilike(f"%{search}%"),
            ContractWorker.assignment_location.ilike(f"%{search}%"),
            ContractWorker.assignment_line.ilike(f"%{search}%"),
            ContractWorker.job_description.ilike(f"%{search}%"),
            ContractWorker.position.ilike(f"%{search}%"),
            ContractWorker.contract_type.ilike(f"%{search}%"),
            ContractWorker.notes.ilike(f"%{search}%"),
            cast(ContractWorker.hakenmoto_id, String).ilike(f"%{search}%"),
        ]

        try:
            search_num = int(search)
            search_conditions.extend(
                [
                    ContractWorker.jikyu == search_num,
                    ContractWorker.hourly_rate_charged == search_num,
                    ContractWorker.profit_difference == search_num,
                    ContractWorker.apartment_id == search_num,
                ]
            )
        except ValueError:
            pass

        query = query.filter(or_(*search_conditions))

    total = query.count()
    workers = query.offset((page - 1) * page_size).limit(page_size).all()

    # Usar ContractWorkerResponse directamente (sin mapeo manual)
    items = [ContractWorkerResponse.model_validate(worker).model_dump() for worker in workers]

    return _paginate_response(items, total, page, page_size)


def _list_staff_members(
    *,
    page: int,
    page_size: int,
    is_active: Optional[bool],
    search: Optional[str],
    db: Session,
):
    """Lista Staff (スタッフ) usando StaffResponse directamente"""
    query = db.query(Staff)
    # Exclude soft-deleted staff by default
    query = query.filter(Staff.deleted_at.is_(None))

    if is_active is not None:
        query = query.filter(Staff.is_active == is_active)
    if search:
        from sqlalchemy import or_, cast, String

        search_conditions = [
            Staff.full_name_kanji.ilike(f"%{search}%"),
            Staff.full_name_kana.ilike(f"%{search}%"),
            Staff.rirekisho_id.ilike(f"%{search}%"),
            Staff.email.ilike(f"%{search}%"),
            Staff.phone.ilike(f"%{search}%"),
            Staff.address.ilike(f"%{search}%"),
            Staff.postal_code.ilike(f"%{search}%"),
            Staff.position.ilike(f"%{search}%"),
            Staff.department.ilike(f"%{search}%"),
            Staff.notes.ilike(f"%{search}%"),
            cast(Staff.staff_id, String).ilike(f"%{search}%"),
        ]

        try:
            search_num = int(search)
            search_conditions.extend(
                [
                    Staff.monthly_salary == search_num,
                ]
            )
        except ValueError:
            pass

        query = query.filter(or_(*search_conditions))

    total = query.count()
    staff_members = query.offset((page - 1) * page_size).limit(page_size).all()

    # Usar StaffResponse directamente (sin mapeo manual)
    items = [StaffResponse.model_validate(member).model_dump() for member in staff_members]

    return _paginate_response(items, total, page, page_size)


@router.get("")
@router.get("/")
async def list_employees(
    page: int = 1,
    page_size: int = 20,
    factory_id: Optional[str] = None,
    is_active: Optional[bool] = None,
    contract_type: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(auth_service.get_current_active_user),
    db: Session = Depends(get_db)
):
    """List all employees"""

    if contract_type == '請負':
        return _list_contract_workers(
            page=page,
            page_size=page_size,
            factory_id=factory_id,
            is_active=is_active,
            search=search,
            db=db,
        )

    if contract_type == 'スタッフ':
        return _list_staff_members(
            page=page,
            page_size=page_size,
            is_active=is_active,
            search=search,
            db=db,
        )

    query = db.query(Employee)

    # Exclude soft-deleted employees by default
    query = query.filter(Employee.deleted_at.is_(None))

    # Hide staff (スタッフ) from non-SUPER_ADMIN users
    from app.models.models import UserRole
    if current_user.role != UserRole.SUPER_ADMIN:
        query = query.filter(Employee.contract_type != 'スタッフ')

    if factory_id:
        query = query.filter(Employee.factory_id == factory_id)
    if is_active is not None:
        query = query.filter(Employee.is_active == is_active)
    if contract_type:
        query = query.filter(Employee.contract_type == contract_type)
    if search:
        # Universal search - busca en TODOS los campos de texto y numéricos
        from sqlalchemy import or_, cast, String

        search_conditions = [
            # Nombres
            Employee.full_name_kanji.ilike(f"%{search}%"),
            Employee.full_name_kana.ilike(f"%{search}%"),

            # IDs y códigos
            Employee.rirekisho_id.ilike(f"%{search}%"),
            Employee.factory_id.ilike(f"%{search}%"),
            Employee.hakensaki_shain_id.ilike(f"%{search}%"),  # ⭐ MUY IMPORTANTE
            cast(Employee.hakenmoto_id, String).ilike(f"%{search}%"),

            # Información personal
            Employee.gender.ilike(f"%{search}%"),
            Employee.nationality.ilike(f"%{search}%"),
            Employee.address.ilike(f"%{search}%"),
            Employee.phone.ilike(f"%{search}%"),
            Employee.email.ilike(f"%{search}%"),
            Employee.postal_code.ilike(f"%{search}%"),

            # Asignación
            Employee.assignment_location.ilike(f"%{search}%"),
            Employee.assignment_line.ilike(f"%{search}%"),
            Employee.job_description.ilike(f"%{search}%"),
            Employee.position.ilike(f"%{search}%"),
            Employee.contract_type.ilike(f"%{search}%"),

            # Visa y documentos
            Employee.visa_type.ilike(f"%{search}%"),
            Employee.zairyu_card_number.ilike(f"%{search}%"),
            Employee.license_type.ilike(f"%{search}%"),
            Employee.commute_method.ilike(f"%{search}%"),
            Employee.japanese_level.ilike(f"%{search}%"),

            # Status y notas
            Employee.current_status.ilike(f"%{search}%"),
            Employee.notes.ilike(f"%{search}%"),
            Employee.termination_reason.ilike(f"%{search}%"),
        ]

        # Try to search by numeric fields if search is a number
        try:
            search_num = int(search)
            search_conditions.extend([
                Employee.hakenmoto_id == search_num,
                Employee.jikyu == search_num,
                Employee.hourly_rate_charged == search_num,
                Employee.profit_difference == search_num,
                Employee.apartment_id == search_num,
            ])
        except ValueError:
            pass

        query = query.filter(or_(*search_conditions))

    total = query.count()
    # Apply pagination without eager loading to avoid issues with nullable ForeignKeys
    employees = (
        query
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    # Convert to response models and add factory name
    items = []
    for emp in employees:
        emp_dict = EmployeeResponse.model_validate(emp).model_dump()
        # Get factory name
        if emp.factory_id:
            factory = db.query(Factory).filter(Factory.factory_id == emp.factory_id).first()
            emp_dict['factory_name'] = factory.name if factory else None
        items.append(emp_dict)

    return _paginate_response(items, total, page, page_size)


@router.get("/available-for-apartment")
async def list_available_for_apartment(
    page: int = Query(1, ge=1),
    page_size: int = Query(1000, ge=1, le=2000),
    search: Optional[str] = Query(None),
    current_user: User = Depends(auth_service.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get employees and contract workers for apartment assignment.
    Combines both employees and contract_workers tables.
    Returns ALL active workers (including those already assigned, allowing transfers).
    """
    from sqlalchemy import union_all, cast, String, literal

    # Build search filters for employees
    employee_filters = [
        Employee.deleted_at.is_(None),
        Employee.is_active == True
        # Removed: Employee.apartment_id.is_(None) - allow transfers
    ]

    if search:
        search_filter = or_(
            Employee.hakensaki_shain_id.ilike(f"%{search}%"),  # ID hakenshain
            Employee.full_name_kanji.ilike(f"%{search}%"),
            cast(Employee.hakenmoto_id, String).ilike(f"%{search}%")  # ID hakenmoto
        )
        employee_filters.append(search_filter)

    # Query employees - select specific fields and map to common schema
    employees_query = db.query(
        Employee.id.label('id'),
        Employee.hakensaki_shain_id.label('employee_id'),
        Employee.full_name_kanji.label('full_name_kanji'),
        Employee.full_name_roman.label('full_name_roman'),
        Employee.factory_id.label('factory_id'),
        Employee.hakenmoto_id.label('hakenmoto_id'),
        Employee.apartment_id.label('apartment_id'),
        Employee.contract_type.label('contract_type'),
        literal('employee').label('worker_type')
    ).filter(and_(*employee_filters))

    # Build search filters for contract workers
    contract_filters = [
        ContractWorker.deleted_at.is_(None),
        ContractWorker.is_active == True
        # Removed: ContractWorker.apartment_id.is_(None) - allow transfers
    ]

    if search:
        search_filter = or_(
            ContractWorker.hakensaki_shain_id.ilike(f"%{search}%"),  # ID hakenshain
            ContractWorker.full_name_kanji.ilike(f"%{search}%"),
            cast(ContractWorker.hakenmoto_id, String).ilike(f"%{search}%")  # ID hakenmoto
        )
        contract_filters.append(search_filter)

    # Query contract workers - map to same schema
    contract_workers_query = db.query(
        ContractWorker.id.label('id'),
        ContractWorker.hakensaki_shain_id.label('employee_id'),
        ContractWorker.full_name_kanji.label('full_name_kanji'),
        ContractWorker.full_name_roman.label('full_name_roman'),
        ContractWorker.factory_id.label('factory_id'),
        ContractWorker.hakenmoto_id.label('hakenmoto_id'),
        ContractWorker.apartment_id.label('apartment_id'),
        literal('請負').label('contract_type'),
        literal('contract_worker').label('worker_type')
    ).filter(and_(*contract_filters))

    # Combine both queries with UNION ALL
    combined_query = union_all(employees_query, contract_workers_query).alias('workers')

    # Get total count
    total_query = db.query(combined_query).count()

    # Apply pagination
    offset = (page - 1) * page_size
    results = db.query(combined_query).offset(offset).limit(page_size).all()

    # Convert results to dictionaries
    items = []
    for worker in results:
        worker_dict = {
            'id': worker.id,
            'employee_id': worker.employee_id,
            'full_name_kanji': worker.full_name_kanji,
            'full_name_roman': worker.full_name_roman,
            'factory_id': worker.factory_id,
            'hakenmoto_id': worker.hakenmoto_id,
            'apartment_id': worker.apartment_id,
            'contract_type': worker.contract_type,
            'worker_type': worker.worker_type
        }

        # Add factory name if factory_id exists
        if worker.factory_id:
            factory = db.query(Factory).filter(Factory.factory_id == worker.factory_id).first()
            worker_dict['factory_name'] = factory.name if factory else None
        else:
            worker_dict['factory_name'] = None

        items.append(worker_dict)

    return _paginate_response(items, total_query, page, page_size)


@router.get("/{employee_id}")
async def get_employee(
    employee_id: int,
    current_user: User = Depends(auth_service.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get employee by ID"""
    employee = db.query(Employee).filter(
        Employee.id == employee_id,
        Employee.deleted_at.is_(None)  # Exclude soft-deleted
    ).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Convert to dict and add factory name
    emp_dict = EmployeeResponse.model_validate(employee).model_dump()
    if employee.factory_id:
        factory = db.query(Factory).filter(Factory.factory_id == employee.factory_id).first()
        emp_dict['factory_name'] = factory.name if factory else None

    return emp_dict


@router.get("/by-rirekisho/{rirekisho_id}", response_model=EmployeeResponse)
async def get_employee_by_rirekisho(
    rirekisho_id: str,
    current_user: User = Depends(auth_service.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get employee by rirekisho_id"""
    employee = db.query(Employee).filter(
        Employee.rirekisho_id == rirekisho_id,
        Employee.deleted_at.is_(None)
    ).first()

    if not employee:
        raise HTTPException(
            status_code=404,
            detail=f"Employee with rirekisho_id '{rirekisho_id}' not found"
        )

    return employee


@router.put("/{employee_id}", response_model=EmployeeResponse)
async def update_employee(
    employee_id: int,
    employee_update: EmployeeUpdate,
    current_user: User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db)
):
    """
    Update employee

    SINCRONIZACIÓN BIDIRECCIONAL:
    Si se actualiza apartment_id, automáticamente:
    - Crea/finaliza/transfiere ApartmentAssignment
    - Mantiene consistencia entre Employee y ApartmentAssignment
    """
    employee = db.query(Employee).filter(
        and_(
            Employee.id == employee_id,
            Employee.deleted_at.is_(None)
        )
    ).first()

    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Obtener datos de actualización
    update_data = employee_update.model_dump(exclude_unset=True)

    # DETECTAR CAMBIO DE APARTAMENTO
    old_apartment_id = employee.apartment_id
    new_apartment_id = update_data.get('apartment_id')

    try:
        # CASO 1: Asignar nuevo apartamento (None → ID)
        if old_apartment_id is None and new_apartment_id is not None:
            # Validar que el apartamento existe
            apartment = db.query(Apartment).filter(
                and_(
                    Apartment.id == new_apartment_id,
                    Apartment.deleted_at.is_(None)
                )
            ).first()

            if not apartment:
                raise HTTPException(
                    status_code=404,
                    detail=f"Apartamento {new_apartment_id} no encontrado"
                )

            # Verificar que no tenga assignment activo ya
            existing_assignment = db.query(ApartmentAssignment).filter(
                and_(
                    ApartmentAssignment.employee_id == employee_id,
                    ApartmentAssignment.status == AssignmentStatus.ACTIVE,
                    ApartmentAssignment.deleted_at.is_(None)
                )
            ).first()

            if not existing_assignment:
                # Crear Assignment automáticamente
                start_date = update_data.get('apartment_start_date') or date.today()
                monthly_rent = update_data.get('apartment_rent') or apartment.base_rent

                new_assignment = ApartmentAssignment(
                    employee_id=employee_id,
                    apartment_id=new_apartment_id,
                    start_date=start_date,
                    end_date=None,  # Activo
                    monthly_rent=monthly_rent,
                    status=AssignmentStatus.ACTIVE,
                    total_deduction=0,  # Se calculará después
                    notes=f"Asignación creada automáticamente desde actualización de empleado"
                )
                db.add(new_assignment)

        # CASO 2: Remover apartamento (ID → None)
        elif old_apartment_id is not None and new_apartment_id is None:
            # Finalizar Assignment activo
            active_assignment = db.query(ApartmentAssignment).filter(
                and_(
                    ApartmentAssignment.employee_id == employee_id,
                    ApartmentAssignment.status == AssignmentStatus.ACTIVE,
                    ApartmentAssignment.deleted_at.is_(None)
                )
            ).first()

            if active_assignment:
                end_date = update_data.get('apartment_move_out_date') or date.today()
                active_assignment.status = AssignmentStatus.ENDED
                active_assignment.end_date = end_date
                active_assignment.updated_at = datetime.now()

        # CASO 3: Cambiar apartamento (ID1 → ID2)
        elif old_apartment_id is not None and new_apartment_id is not None and old_apartment_id != new_apartment_id:
            # Validar que el nuevo apartamento existe
            new_apartment = db.query(Apartment).filter(
                and_(
                    Apartment.id == new_apartment_id,
                    Apartment.deleted_at.is_(None)
                )
            ).first()

            if not new_apartment:
                raise HTTPException(
                    status_code=404,
                    detail=f"Apartamento {new_apartment_id} no encontrado"
                )

            # Finalizar assignment antiguo
            old_assignment = db.query(ApartmentAssignment).filter(
                and_(
                    ApartmentAssignment.employee_id == employee_id,
                    ApartmentAssignment.status == AssignmentStatus.ACTIVE,
                    ApartmentAssignment.deleted_at.is_(None)
                )
            ).first()

            if old_assignment:
                old_assignment.status = AssignmentStatus.TRANSFERRED
                old_assignment.end_date = date.today()
                old_assignment.updated_at = datetime.now()

            # Crear nuevo assignment
            start_date = update_data.get('apartment_start_date') or date.today()
            monthly_rent = update_data.get('apartment_rent') or new_apartment.base_rent

            new_assignment = ApartmentAssignment(
                employee_id=employee_id,
                apartment_id=new_apartment_id,
                start_date=start_date,
                end_date=None,  # Activo
                monthly_rent=monthly_rent,
                status=AssignmentStatus.ACTIVE,
                total_deduction=0,  # Se calculará después
                notes=f"Transferencia desde apartamento {old_apartment_id}"
            )
            db.add(new_assignment)

        # Actualizar campos del empleado normalmente
        for field, value in update_data.items():
            setattr(employee, field, value)

        employee.updated_at = datetime.now()

        db.commit()
        db.refresh(employee)
        return employee

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error al actualizar empleado: {str(e)}"
        )


@router.post("/{employee_id}/terminate")
async def terminate_employee(
    employee_id: int,
    termination: EmployeeTerminate,
    current_user: User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db)
):
    """Terminate employee"""
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    employee.is_active = False
    employee.termination_date = termination.termination_date
    employee.termination_reason = termination.termination_reason
    
    db.commit()
    return {"message": "Employee terminated successfully"}


@router.put("/{employee_id}/yukyu", response_model=EmployeeResponse)
async def update_yukyu(
    employee_id: int,
    yukyu_update: YukyuUpdate,
    current_user: User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db)
):
    """Update employee yukyu balance"""
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    employee.yukyu_total = yukyu_update.yukyu_total
    employee.yukyu_remaining = yukyu_update.yukyu_total - employee.yukyu_used

    db.commit()
    db.refresh(employee)
    return employee


@router.delete("/{employee_id}")
async def delete_employee(
    employee_id: int,
    current_user: User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db)
):
    """
    Soft delete employee

    Marks the employee as deleted without removing from database.
    Allows for auditing and potential restoration.
    """
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Check if already deleted
    if employee.is_deleted:
        raise HTTPException(status_code=400, detail="Employee is already deleted")

    employee.soft_delete()
    db.commit()

    return {"message": "Employee deleted successfully"}


@router.post("/{employee_id}/restore")
async def restore_employee(
    employee_id: int,
    current_user: User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db)
):
    """
    Restore soft-deleted employee

    Restores a previously soft-deleted employee, making them active again.
    """
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Check if not deleted
    if not employee.is_deleted:
        raise HTTPException(status_code=400, detail="Employee is not deleted")

    employee.restore()
    db.commit()

    return {"message": "Employee restored successfully"}


@router.post("/import-excel")
async def import_employees_from_excel(
    file: UploadFile = File(...),
    current_user: User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db)
):
    """Import employees from Excel file"""

    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="File must be Excel format (.xlsx or .xls)")

    try:
        # Read Excel file
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))

        # Track results
        created_count = 0
        updated_count = 0
        errors = []

        for index, row in df.iterrows():
            try:
                # Get or create hakenmoto_id
                hakenmoto_id = row.get('社員№')

                if pd.isna(hakenmoto_id) or not hakenmoto_id:
                    # Generate new hakenmoto_id
                    last_employee = db.query(Employee).order_by(Employee.hakenmoto_id.desc()).first()
                    hakenmoto_id = (last_employee.hakenmoto_id + 1) if last_employee else 1

                # Check if employee exists
                existing = db.query(Employee).filter(Employee.hakenmoto_id == int(hakenmoto_id)).first()

                # Parse dates
                def parse_date(value):
                    if pd.isna(value) or value == '' or value == '-':
                        return None
                    if isinstance(value, datetime):
                        return value.date()
                    try:
                        return pd.to_datetime(value).date()
                    except (ValueError, TypeError):
                        # Return None for unparseable date formats
                        return None

                # Parse integer
                def parse_int(value):
                    if pd.isna(value) or value == '' or value == '-':
                        return None
                    try:
                        return int(value)
                    except (ValueError, TypeError):
                        # Return None for non-integer values
                        return None

                # Parse boolean
                def parse_bool(value):
                    if pd.isna(value) or value == '':
                        return None
                    if isinstance(value, bool):
                        return value
                    if str(value).lower() in ['true', 'yes', '1', 'はい', '○']:
                        return True
                    return False

                # Determine if active based on 現在 column
                is_active = True
                status_value = row.get('現在')
                if not pd.isna(status_value):
                    if str(status_value) in ['退社', '退職', '×']:
                        is_active = False

                # Get factory name from 派遣先 column
                factory_name = row.get('派遣先')
                factory_id = None

                # Try to find factory by name
                if factory_name and not pd.isna(factory_name):
                    factory = db.query(Factory).filter(Factory.name.ilike(f'%{factory_name}%')).first()
                    if factory:
                        factory_id = factory.factory_id

                # Create employee data with ALL columns
                employee_data = {
                    'hakenmoto_id': int(hakenmoto_id),
                    'factory_id': factory_id,  # ID interno del sistema
                    'hakensaki_shain_id': row.get('派遣先ID'),  # ID que la fábrica da al empleado
                    'full_name_kanji': row.get('氏名'),
                    'full_name_kana': row.get('カナ'),
                    'gender': row.get('性別'),
                    'nationality': row.get('国籍'),
                    'date_of_birth': parse_date(row.get('生年月日')),
                    'jikyu': parse_int(row.get('時給')) or 0,
                    'hourly_rate_charged': parse_int(row.get('請求単価')),
                    'profit_difference': parse_int(row.get('差額利益')),
                    'standard_compensation': parse_int(row.get('標準報酬')),
                    'health_insurance': parse_int(row.get('健康保険')),
                    'nursing_insurance': parse_int(row.get('介護保険')),
                    'pension_insurance': parse_int(row.get('厚生年金')),
                    'zairyu_expire_date': parse_date(row.get('ビザ期限')),
                    'visa_type': row.get('ビザ種類'),
                    'postal_code': row.get('〒'),
                    'address': row.get('住所'),
                    'apartment_id': parse_int(row.get('ｱﾊﾟｰﾄ')),
                    'apartment_start_date': parse_date(row.get('入居')),
                    'hire_date': parse_date(row.get('入社日')),
                    'termination_date': parse_date(row.get('退社日')),
                    'apartment_move_out_date': parse_date(row.get('退去')),
                    'social_insurance_date': parse_date(row.get('社保加入')),
                    'entry_request_date': parse_date(row.get('入社依頼')),
                    'notes': row.get('備考'),
                    'license_type': row.get('免許種類'),
                    'license_expire_date': parse_date(row.get('免許期限')),
                    'commute_method': row.get('通勤方法'),
                    'optional_insurance_expire': parse_date(row.get('任意保険期限')),
                    'japanese_level': row.get('日本語検定'),
                    'career_up_5years': parse_bool(row.get('キャリアアップ5年目')),
                    'is_active': is_active
                }

                if existing:
                    # Update existing employee
                    for key, value in employee_data.items():
                        if value is not None and key != 'hakenmoto_id':
                            setattr(existing, key, value)
                    updated_count += 1
                else:
                    # Create new employee
                    new_employee = Employee(**employee_data)
                    db.add(new_employee)
                    created_count += 1

            except Exception as e:
                errors.append(f"Row {index + 2}: {str(e)}")
                continue

        db.commit()

        return {
            "success": True,
            "created": created_count,
            "updated": updated_count,
            "errors": errors,
            "total_processed": created_count + updated_count
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error processing Excel file: {str(e)}")


@router.patch("/{employee_id}/change-type", response_model=EmployeeResponse)
async def change_employee_type(
    employee_id: int,
    change_request: ChangeTypeRequest,
    current_user: User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db)
):
    """
    Cambia el tipo de empleado entre Employee, Staff y ContractWorker.

    Proceso:
    1. Buscar el registro actual en las 3 tablas
    2. Copiar todos los campos comunes
    3. Crear nuevo registro en la tabla destino
    4. Eliminar registro original
    5. Retornar nuevo registro
    """

    # 1. Buscar en las 3 tablas usando employee_id (id primary key)
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    current_type = "employee"
    current_hakenmoto_id = None

    if not employee:
        employee = db.query(ContractWorker).filter(ContractWorker.id == employee_id).first()
        current_type = "contract_worker"

    if not employee:
        employee = db.query(Staff).filter(Staff.id == employee_id).first()
        current_type = "staff"

    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    # No hacer nada si el tipo es el mismo
    if current_type == change_request.new_type:
        # Retornar el empleado actual como EmployeeResponse
        return EmployeeResponse.model_validate(employee, from_attributes=True)

    # Guardar el hakenmoto_id/staff_id actual
    if current_type == "staff":
        current_hakenmoto_id = employee.staff_id
    else:
        current_hakenmoto_id = employee.hakenmoto_id

    # 2. Crear diccionario con campos comunes
    common_fields = {
        'rirekisho_id': employee.rirekisho_id,
        'full_name_kanji': employee.full_name_kanji,
        'full_name_kana': getattr(employee, 'full_name_kana', None),
        'photo_url': getattr(employee, 'photo_url', None),
        'photo_data_url': getattr(employee, 'photo_data_url', None),
        'date_of_birth': getattr(employee, 'date_of_birth', None),
        'gender': getattr(employee, 'gender', None),
        'nationality': getattr(employee, 'nationality', None),
        'address': getattr(employee, 'address', None),
        'phone': getattr(employee, 'phone', None),
        'email': getattr(employee, 'email', None),
        'postal_code': getattr(employee, 'postal_code', None),
        'emergency_contact_name': getattr(employee, 'emergency_contact_name', None),
        'emergency_contact_phone': getattr(employee, 'emergency_contact_phone', None),
        'emergency_contact_relationship': getattr(employee, 'emergency_contact_relationship', None),
        'hire_date': getattr(employee, 'hire_date', None),
        'health_insurance': getattr(employee, 'health_insurance', None),
        'nursing_insurance': getattr(employee, 'nursing_insurance', None),
        'pension_insurance': getattr(employee, 'pension_insurance', None),
        'social_insurance_date': getattr(employee, 'social_insurance_date', None),
        'yukyu_total': getattr(employee, 'yukyu_total', 0),
        'yukyu_used': getattr(employee, 'yukyu_used', 0),
        'yukyu_remaining': getattr(employee, 'yukyu_remaining', 0),
        'is_active': getattr(employee, 'is_active', True),
        'termination_date': getattr(employee, 'termination_date', None),
        'termination_reason': getattr(employee, 'termination_reason', None),
        'notes': getattr(employee, 'notes', None),
    }

    # Campos específicos de Employee/ContractWorker
    if current_type in ["employee", "contract_worker"]:
        common_fields.update({
            'factory_id': getattr(employee, 'factory_id', None),
            'company_name': getattr(employee, 'company_name', None),
            'plant_name': getattr(employee, 'plant_name', None),
            'hakensaki_shain_id': getattr(employee, 'hakensaki_shain_id', None),
            'zairyu_card_number': getattr(employee, 'zairyu_card_number', None),
            'zairyu_expire_date': getattr(employee, 'zairyu_expire_date', None),
            'current_hire_date': getattr(employee, 'current_hire_date', None),
            'jikyu': getattr(employee, 'jikyu', None),
            'jikyu_revision_date': getattr(employee, 'jikyu_revision_date', None),
            'position': getattr(employee, 'position', None),
            'contract_type': getattr(employee, 'contract_type', None),
            'assignment_location': getattr(employee, 'assignment_location', None),
            'assignment_line': getattr(employee, 'assignment_line', None),
            'job_description': getattr(employee, 'job_description', None),
            'hourly_rate_charged': getattr(employee, 'hourly_rate_charged', None),
            'billing_revision_date': getattr(employee, 'billing_revision_date', None),
            'profit_difference': getattr(employee, 'profit_difference', None),
            'standard_compensation': getattr(employee, 'standard_compensation', None),
            'visa_type': getattr(employee, 'visa_type', None),
            'license_type': getattr(employee, 'license_type', None),
            'license_expire_date': getattr(employee, 'license_expire_date', None),
            'commute_method': getattr(employee, 'commute_method', None),
            'optional_insurance_expire': getattr(employee, 'optional_insurance_expire', None),
            'japanese_level': getattr(employee, 'japanese_level', None),
            'career_up_5years': getattr(employee, 'career_up_5years', False),
            'entry_request_date': getattr(employee, 'entry_request_date', None),
            'apartment_id': getattr(employee, 'apartment_id', None),
            'apartment_start_date': getattr(employee, 'apartment_start_date', None),
            'apartment_move_out_date': getattr(employee, 'apartment_move_out_date', None),
            'apartment_rent': getattr(employee, 'apartment_rent', None),
            'is_corporate_housing': getattr(employee, 'is_corporate_housing', False),
        })

    # 3. Crear nuevo registro según el tipo destino
    try:
        if change_request.new_type == "employee":
            new_record = Employee(
                hakenmoto_id=current_hakenmoto_id,
                **{k: v for k, v in common_fields.items() if hasattr(Employee, k)}
            )
            if change_request.jikyu:
                new_record.jikyu = change_request.jikyu

        elif change_request.new_type == "staff":
            new_record = Staff(
                staff_id=current_hakenmoto_id,
                **{k: v for k, v in common_fields.items() if hasattr(Staff, k)}
            )
            if change_request.monthly_salary:
                new_record.monthly_salary = change_request.monthly_salary
            # Staff no tiene factory_id, position específico, etc.
            new_record.position = getattr(employee, 'position', None)
            new_record.department = getattr(employee, 'job_description', None)

        elif change_request.new_type == "contract_worker":
            new_record = ContractWorker(
                hakenmoto_id=current_hakenmoto_id,
                **{k: v for k, v in common_fields.items() if hasattr(ContractWorker, k)}
            )
            if change_request.jikyu:
                new_record.jikyu = change_request.jikyu
        else:
            raise HTTPException(status_code=400, detail="Invalid employee type. Must be: employee, staff, or contract_worker")

        # 4. Guardar nuevo y eliminar viejo (en transacción)
        db.add(new_record)
        db.flush()  # Para obtener el ID
        db.delete(employee)
        db.commit()
        db.refresh(new_record)

        # Retornar como EmployeeResponse
        return EmployeeResponse.model_validate(new_record, from_attributes=True)

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error changing employee type: {str(e)}")
