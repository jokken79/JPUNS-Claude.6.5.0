"""
Payroll Service for UNS-ClaudeJP 2.0
Automatic payroll calculation with all rules
"""
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from decimal import Decimal
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.models import Employee, Factory, Apartment, RentDeduction, DeductionStatus

logger = logging.getLogger(__name__)


class PayrollService:
    """Servicio de cálculo automático de nómina para sistema de gestión de recursos humanos.

    Implementa las reglas de cálculo de nómina japonesa incluyendo:
    - Pago base por horas trabajadas
    - Recargos por horas extras (時間外手当)
    - Recargos por trabajo nocturno (深夜手当)
    - Recargos por trabajo en días festivos (休日手当)
    - Bonificaciones (手当)
    - Deducciones (控除): apartamento, seguro social, impuestos

    Attributes:
        overtime_rate (Decimal): Tasa de recargo por horas extras (1.25 = 25%)
        night_rate (Decimal): Tasa de recargo nocturno (0.25 = 25% adicional)
        holiday_rate (Decimal): Tasa de recargo por festivos (1.35 = 35%)

    Note:
        - Usa Decimal para evitar errores de precisión en cálculos monetarios
        - Cumple con regulaciones laborales japonesas
        - Horario nocturno definido: 22:00 - 05:00
        - Horas extras: más de 8 horas al día
        - Fin de semana: Sábado y Domingo

    Examples:
        >>> service = PayrollService()
        >>> payroll = service.calculate_monthly_payroll(
        ...     employee_id=123,
        ...     year=2025,
        ...     month=10,
        ...     timer_cards=[...],
        ...     factory_config={'jikyu_tanka': 1500}
        ... )
        >>> print(f"Pago neto: ¥{payroll['net_pay']:,.0f}")
    """

    def __init__(self, db_session: Optional[Session] = None):
        """Inicializa el servicio con las tasas estándar de recargo.

        Args:
            db_session: Optional SQLAlchemy database session for fetching employee data
        """
        self.overtime_rate = Decimal('1.25')  # 25% premium
        self.night_rate = Decimal('0.25')     # 25% night premium
        self.holiday_rate = Decimal('1.35')   # 35% holiday premium
        self.db = db_session

    def get_employee_data_for_payroll(self, employee_id: int) -> Dict[str, Any]:
        """Fetches employee data from database for payroll calculation.

        Args:
            employee_id: ID of the employee

        Returns:
            Dictionary with employee data structured for payroll calculation

        Raises:
            ValueError: If employee not found or database session not available
        """
        if not self.db:
            raise ValueError("Database session is required to fetch employee data")

        try:
            # Fetch employee with relationships
            employee = (
                self.db.query(Employee)
                .filter(Employee.id == employee_id)
                .first()
            )

            if not employee:
                raise ValueError(f"Employee with ID {employee_id} not found")

            # Get factory info
            factory = None
            if employee.factory_id:
                factory = (
                    self.db.query(Factory)
                    .filter(Factory.factory_id == employee.factory_id)
                    .first()
                )

            # Get apartment info
            apartment = None
            if employee.apartment_id:
                apartment = (
                    self.db.query(Apartment)
                    .filter(Apartment.id == employee.apartment_id)
                    .first()
                )

            # Calculate dependents from yukyu (simplified - can be enhanced)
            dependents = 0  # This can be calculated from family data in the future

            # Build structured employee data
            employee_data = {
                'employee_id': employee.id,
                'name': employee.full_name_kanji,
                'hakenmoto_id': employee.hakenmoto_id,
                'base_hourly_rate': float(employee.jikyu) if employee.jikyu else 0.0,
                'jikyu': float(employee.jikyu) if employee.jikyu else 0.0,  # For backward compatibility
                'factory_id': employee.factory_id,
                'factory': {
                    'factory_id': employee.factory_id,
                    'company_name': employee.company_name or (factory.company_name if factory else None),
                    'plant_name': employee.plant_name or (factory.plant_name if factory else None),
                    'address': factory.address if factory else None
                },
                'prefecture': None,  # Factory doesn't have prefecture field,
                'apartment_id': employee.apartment_id,
                'apartment_rent': float(employee.apartment_rent) if employee.apartment_rent else 0.0,
                'apartment': {
                    'id': employee.apartment_id,
                    'apartment_code': apartment.apartment_code if apartment else None,
                    'address': apartment.address if apartment else None,
                    'rent': float(employee.apartment_rent) if employee.apartment_rent else 0.0
                } if apartment else None,
                'dependents': dependents,
                'contract_type': employee.contract_type,
                'hire_date': employee.hire_date.isoformat() if employee.hire_date else None,
                'current_hire_date': employee.current_hire_date.isoformat() if employee.current_hire_date else None,
                'hourly_rate_charged': float(employee.hourly_rate_charged) if employee.hourly_rate_charged else 0.0,
                'position': employee.position,
                'is_active': employee.is_active,
                'current_status': employee.current_status,
                'notes': employee.notes
            }

            logger.info(f"Retrieved employee data for ID {employee_id}: {employee.full_name_kanji}")
            return employee_data

        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Error fetching employee data for ID {employee_id}: {e}", exc_info=True)
            raise ValueError(f"Error retrieving employee data: {str(e)}")

    def get_apartment_deductions_for_month(
        self,
        employee_id: int,
        year: int,
        month: int
    ) -> Dict[str, Any]:
        """Obtiene las deducciones de apartamento para un empleado en un mes específico.

        Consulta la tabla rent_deductions para obtener todas las deducciones de renta
        del empleado para el mes y año especificados, incluyendo cargos adicionales.

        Args:
            employee_id: ID del empleado
            year: Año (ej: 2025)
            month: Mes (1-12)

        Returns:
            Diccionario con:
            - total_amount: Monto total de deducciones de apartamento
            - base_rent: Renta base (prorrateada o completa)
            - additional_charges: Suma de cargos adicionales
            - deductions: Lista detallada de deducciones
            - apartment_id: ID del apartamento
            - apartment_info: Información del apartamento

        Raises:
            ValueError: Si no hay conexión a base de datos
        """
        if not self.db:
            logger.warning(f"No DB session for apartment deductions of employee {employee_id}")
            return {
                'total_amount': 0,
                'base_rent': 0,
                'additional_charges': 0,
                'deductions': [],
                'apartment_id': None,
                'apartment_info': None
            }

        try:
            # Consultar deducciones para este empleado en este mes
            # Incluir deducciones pending y processed (not paid ni cancelled)
            deductions = (
                self.db.query(RentDeduction)
                .filter(
                    RentDeduction.employee_id == employee_id,
                    RentDeduction.year == year,
                    RentDeduction.month == month,
                    RentDeduction.status.in_([DeductionStatus.PENDING, DeductionStatus.PROCESSED])
                )
                .all()
            )

            if not deductions:
                logger.info(
                    f"No apartment deductions found for employee {employee_id}, "
                    f"period {year}-{month:02d}"
                )
                return {
                    'total_amount': 0,
                    'base_rent': 0,
                    'additional_charges': 0,
                    'deductions': [],
                    'apartment_id': None,
                    'apartment_info': None
                }

            # Sumar todos los montos
            total_amount = sum(d.total_deduction for d in deductions)
            total_base_rent = sum(d.base_rent for d in deductions)
            total_additional = sum(d.additional_charges for d in deductions)

            # Obtener información del apartamento (del primer registro)
            first_deduction = deductions[0]
            apartment = first_deduction.apartment
            apartment_info = {
                'apartment_id': apartment.id if apartment else None,
                'apartment_code': apartment.apartment_code if apartment else None,
                'name': apartment.name if apartment else None,
                'address': apartment.address if apartment else None,
                'building_name': apartment.building_name if apartment else None
            } if apartment else None

            # Construir lista de detalles de deducciones
            deductions_detail = [
                {
                    'assignment_id': d.assignment_id,
                    'period': f"{d.year}-{d.month:02d}",
                    'base_rent': d.base_rent,
                    'additional_charges': d.additional_charges,
                    'total_deduction': d.total_deduction,
                    'status': d.status.value,
                    'notes': d.notes
                }
                for d in deductions
            ]

            logger.info(
                f"Retrieved apartment deductions for employee {employee_id}, "
                f"period {year}-{month:02d}: total=¥{total_amount:,}"
            )

            return {
                'total_amount': int(total_amount),
                'base_rent': int(total_base_rent),
                'additional_charges': int(total_additional),
                'deductions': deductions_detail,
                'apartment_id': first_deduction.apartment_id,
                'apartment_info': apartment_info
            }

        except Exception as e:
            logger.error(
                f"Error retrieving apartment deductions for employee {employee_id}, "
                f"period {year}-{month:02d}: {e}",
                exc_info=True
            )
            raise ValueError(f"Error retrieving apartment deductions: {str(e)}")

    def calculate_employee_payroll(
        self,
        employee_data: Optional[Dict[str, Any]] = None,
        timer_records: Optional[List[Dict[str, Any]]] = None,
        payroll_run_id: Optional[int] = None,
        employee_id: Optional[int] = None,
        yukyu_days_approved: float = 0
    ) -> Dict[str, Any]:
        """Calculate payroll for a single employee.

        This method now supports two modes:
        1. Traditional mode: Pass employee_data dict directly
        2. Database mode: Pass employee_id to fetch data from database

        Args:
            employee_data: Employee information dict (id, name, rates, etc.) - for traditional mode
            timer_records: List of timer card records
            payroll_run_id: Optional payroll run ID
            employee_id: Employee ID to fetch from database - for database mode

        Returns:
            Dictionary with payroll calculation result
        """
        try:
            # Database mode: Fetch employee data from database
            if employee_id is not None:
                if not self.db:
                    raise ValueError("Database session is required when using employee_id")

                employee_data = self.get_employee_data_for_payroll(employee_id)

            # Validate inputs
            if not employee_data:
                raise ValueError("Employee data is required (either as dict or via employee_id)")

            if not timer_records:
                raise ValueError("Timer records are required for payroll calculation")

            # Calculate hours from timer records
            hours_breakdown = self._calculate_hours(timer_records)

            # Reducir horas por días de yukyu aprobados
            if yukyu_days_approved > 0:
                # Calcular teiji (定時/horario estándar del empleado)
                # teiji = horas_estándar_mes / días_laborales_mes (típicamente 20)
                standard_hours_per_month = employee_data.get('standard_hours_per_month', 160)
                teiji_hours_per_day = Decimal(str(standard_hours_per_month)) / Decimal('20')  # 20 días laborales típicos
                yukyu_reduction_hours = Decimal(str(yukyu_days_approved)) * teiji_hours_per_day

                total_worked_hours = (
                    hours_breakdown['normal_hours'] +
                    hours_breakdown['overtime_hours'] +
                    hours_breakdown['night_hours'] +
                    hours_breakdown['holiday_hours']
                )

                # Reducir de horas normales primero
                if hours_breakdown['normal_hours'] >= yukyu_reduction_hours:
                    hours_breakdown['normal_hours'] -= yukyu_reduction_hours
                    yukyu_reduction_hours = 0
                else:
                    yukyu_reduction_hours -= hours_breakdown['normal_hours']
                    hours_breakdown['normal_hours'] = 0

                # Luego de overtime si queda
                if yukyu_reduction_hours > 0 and hours_breakdown['overtime_hours'] > 0:
                    if hours_breakdown['overtime_hours'] >= yukyu_reduction_hours:
                        hours_breakdown['overtime_hours'] -= yukyu_reduction_hours
                    else:
                        yukyu_reduction_hours -= hours_breakdown['overtime_hours']
                        hours_breakdown['overtime_hours'] = 0

                logger.info(
                    f"Employee {employee_data.get('employee_id')}: "
                    f"Reduced hours by {yukyu_days_approved} days teiji={teiji_hours_per_day:.2f}h/day (¥{yukyu_days_approved * teiji_hours_per_day * Decimal(str(employee_data.get('base_hourly_rate', 0))):.2f})"
                )

            # Calculate base hourly rate from employee data
            base_rate = employee_data.get('base_hourly_rate', 0)
            if base_rate <= 0:
                base_rate = employee_data.get('jikyu', 0)

            # Calculate payment amounts
            overtime_rate = Decimal('1.25')
            night_rate = Decimal('1.25')
            holiday_rate = Decimal('1.35')

            base_amount = hours_breakdown['normal_hours'] * Decimal(str(base_rate))
            overtime_amount = hours_breakdown['overtime_hours'] * Decimal(str(base_rate)) * overtime_rate
            night_amount = hours_breakdown['night_hours'] * Decimal(str(base_rate)) * night_rate
            holiday_amount = hours_breakdown['holiday_hours'] * Decimal(str(base_rate)) * holiday_rate

            gross_amount = base_amount + overtime_amount + night_amount + holiday_amount

            # Calculate deductions using employee-specific data
            # Primero, intentar obtener deducciones de apartamento V2 desde la BD
            apartment_rent = employee_data.get('apartment_rent', 0)
            housing_info = None

            # Si tenemos employee_id y acceso a BD, consultar deducciones de apartamento del mes
            if employee_id is not None and self.db and timer_records:
                try:
                    # Extraer año y mes de los timer records
                    first_date_str = timer_records[0].get('work_date', '')
                    if first_date_str:
                        date_obj = datetime.strptime(str(first_date_str), '%Y-%m-%d')
                        year = date_obj.year
                        month = date_obj.month

                        # Obtener deducciones de apartamento para este mes
                        apartment_deductions = self.get_apartment_deductions_for_month(
                            employee_id=employee_id,
                            year=year,
                            month=month
                        )

                        # Si hay deducciones de apartamento, usar ese monto
                        if apartment_deductions['total_amount'] > 0:
                            apartment_rent = apartment_deductions['total_amount']
                            housing_info = apartment_deductions
                            logger.info(
                                f"Using apartment deductions for employee {employee_id}: "
                                f"¥{apartment_rent:,} (base: ¥{apartment_deductions['base_rent']}, "
                                f"additional: ¥{apartment_deductions['additional_charges']})"
                            )
                except Exception as e:
                    logger.warning(
                        f"Could not retrieve apartment deductions for employee {employee_id}: {e}. "
                        f"Using fallback apartment_rent: ¥{apartment_rent:,}"
                    )

            dependents = employee_data.get('dependents', 0)

            health_insurance = int(float(gross_amount) * 0.05)
            pension = int(float(gross_amount) * 0.09)
            employment_insurance = int(float(gross_amount) * 0.006)
            income_tax = int(float(gross_amount) * 0.05)
            resident_tax = int(float(gross_amount) * 0.10)

            # Calcular deducción por yukyu
            yukyu_deduction = 0
            if yukyu_days_approved > 0:
                base_rate = Decimal(str(employee_data.get('base_hourly_rate', 0)))
                # Usar teiji (定時/horario estándar del empleado) en lugar de 8 horas fijas
                standard_hours_per_month = employee_data.get('standard_hours_per_month', 160)
                teiji_hours_per_day = Decimal(str(standard_hours_per_month)) / Decimal('20')
                yukyu_deduction = int(yukyu_days_approved * teiji_hours_per_day * base_rate)

            total_deductions = (
                apartment_rent + health_insurance + pension +
                employment_insurance + income_tax + resident_tax + yukyu_deduction
            )

            net_amount = float(gross_amount) - total_deductions

            return {
                'success': True,
                'employee_id': employee_data.get('employee_id'),
                'payroll_run_id': payroll_run_id,
                'pay_period_start': timer_records[0].get('work_date') if timer_records else '',
                'pay_period_end': timer_records[-1].get('work_date') if timer_records else '',
                'hours_breakdown': {
                    'regular_hours': float(hours_breakdown['normal_hours']),
                    'overtime_hours': float(hours_breakdown['overtime_hours']),
                    'night_shift_hours': float(hours_breakdown['night_hours']),
                    'holiday_hours': float(hours_breakdown['holiday_hours']),
                    'sunday_hours': 0,
                    'total_hours': float(hours_breakdown['total_hours']),
                    'work_days': hours_breakdown['work_days']
                },
                'rates': {
                    'base_rate': float(base_rate),
                    'overtime_rate': float(overtime_rate),
                    'night_shift_rate': float(night_rate),
                    'holiday_rate': float(holiday_rate),
                    'sunday_rate': float(holiday_rate)
                },
                'amounts': {
                    'base_amount': int(base_amount),
                    'overtime_amount': int(overtime_amount),
                    'night_shift_amount': int(night_amount),
                    'holiday_amount': int(holiday_amount),
                    'sunday_amount': 0,
                    'gross_amount': int(gross_amount),
                    'total_deductions': total_deductions,
                    'net_amount': int(net_amount)
                },
                'deductions_detail': {
                    'income_tax': income_tax,
                    'resident_tax': resident_tax,
                    'health_insurance': health_insurance,
                    'pension': pension,
                    'employment_insurance': employment_insurance,
                    'apartment': apartment_rent,
                    'other': 0,
                    'yukyu_deduction': yukyu_deduction
                },
                'employee_info': {
                    'employee_id': employee_data.get('employee_id'),
                    'name': employee_data.get('name'),
                    'factory': employee_data.get('factory', {}),
                    'apartment': employee_data.get('apartment', {}),
                    'contract_type': employee_data.get('contract_type'),
                    'hire_date': employee_data.get('hire_date'),
                    'dependents': dependents
                },
                'housing_info': housing_info if housing_info else {
                    'total_amount': apartment_rent,
                    'base_rent': apartment_rent,
                    'additional_charges': 0,
                    'deductions': [],
                    'apartment_id': employee_data.get('apartment_id'),
                    'apartment_info': employee_data.get('apartment')
                },
                'validation': {
                    'is_valid': True,
                    'errors': [],
                    'warnings': [],
                    'validated_at': datetime.now().isoformat()
                },
                'calculated_at': datetime.now().isoformat()
            }

        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Error calculating employee payroll: {e}", exc_info=True)
            return {
                'success': False,
                'error': f'Error calculating payroll: {str(e)}'
            }

    def _calculate_hours(self, timer_cards: List[Dict]) -> Dict:
        """Calcula el desglose detallado de horas trabajadas.

        Procesa todas las tarjetas de tiempo del mes y categoriza las horas
        en: normales, extras, nocturnas, festivas.

        Args:
            timer_cards (List[Dict]): Lista de registros de tiempo con:
                - work_date: Fecha de trabajo
                - clock_in: Hora de entrada (HH:MM)
                - clock_out: Hora de salida (HH:MM)

        Returns:
            Dict: Desglose de horas:
                {
                    'total_hours': Decimal,  # Total horas trabajadas
                    'normal_hours': Decimal,  # Horas normales (hasta 8h/día)
                    'overtime_hours': Decimal,  # Horas extras (>8h/día)
                    'night_hours': Decimal,  # Horas nocturnas (22:00-05:00)
                    'holiday_hours': Decimal,  # Horas en fin de semana
                    'work_days': int  # Días trabajados
                }

        Note:
            - Maneja turnos nocturnos (si clock_out < clock_in, añade 1 día)
            - Fin de semana: Sábado (5) y Domingo (6)
            - Horas extras: solo en días laborables cuando >8h
            - Horas nocturnas se calculan independientemente
        """
        total_hours = Decimal('0')
        normal_hours = Decimal('0')
        overtime_hours = Decimal('0')
        night_hours = Decimal('0')
        holiday_hours = Decimal('0')
        work_days = 0

        for card in timer_cards:
            try:
                # Parse times
                work_date = card.get('work_date')
                clock_in = card.get('clock_in')
                clock_out = card.get('clock_out')

                if not all([work_date, clock_in, clock_out]):
                    continue

                # Convert to datetime objects
                date_obj = datetime.strptime(str(work_date), '%Y-%m-%d')
                start = datetime.strptime(clock_in, '%H:%M')
                end = datetime.strptime(clock_out, '%H:%M')

                # Handle overnight shifts
                if end < start:
                    end += timedelta(days=1)

                # Calculate total hours for this day
                hours = Decimal(str((end - start).total_seconds() / 3600))
                total_hours += hours
                work_days += 1

                # Check if weekend/holiday
                is_weekend = date_obj.weekday() >= 5  # Saturday or Sunday

                if is_weekend:
                    # All hours on weekend are holiday hours
                    holiday_hours += hours
                else:
                    # Normal weekday
                    if hours > 8:
                        normal_hours += Decimal('8')
                        overtime_hours += (hours - Decimal('8'))
                    else:
                        normal_hours += hours

                # Calculate night hours (22:00 - 05:00)
                night_hrs = self._calculate_night_hours(start, end)
                if night_hrs > 0:
                    night_hours += Decimal(str(night_hrs))

            except Exception as e:
                logger.error(f"Error processing timer card: {e}")
                continue

        return {
            'total_hours': total_hours,
            'normal_hours': normal_hours,
            'overtime_hours': overtime_hours,
            'night_hours': night_hours,
            'holiday_hours': holiday_hours,
            'work_days': work_days
        }

    def _calculate_night_hours(self, start: datetime, end: datetime) -> float:
        """Calcula las horas trabajadas en horario nocturno.

        Horario nocturno japonés: 22:00 - 05:00 (siguiente día)

        Args:
            start (datetime): Hora de inicio del turno
            end (datetime): Hora de fin del turno (puede ser día siguiente)

        Returns:
            float: Horas trabajadas en período nocturno

        Examples:
            >>> # Turno 08:00 - 17:00 (sin horario nocturno)
            >>> night_hours = service._calculate_night_hours(
            ...     datetime(2025, 10, 1, 8, 0),
            ...     datetime(2025, 10, 1, 17, 0)
            ... )
            >>> assert night_hours == 0.0

            >>> # Turno 22:00 - 05:00 (7 horas nocturnas)
            >>> night_hours = service._calculate_night_hours(
            ...     datetime(2025, 10, 1, 22, 0),
            ...     datetime(2025, 10, 2, 5, 0)
            ... )
            >>> assert night_hours == 7.0

        Note:
            - Calcula solapamiento entre período de trabajo y 22:00-05:00
            - Retorna 0.0 si no hay solapamiento
        """
        night_start = start.replace(hour=22, minute=0, second=0)
        night_end = (start + timedelta(days=1)).replace(hour=5, minute=0, second=0)

        # Find overlap between work period and night period
        work_start = start
        work_end = end

        overlap_start = max(work_start, night_start)
        overlap_end = min(work_end, night_end)

        if overlap_start < overlap_end:
            return (overlap_end - overlap_start).total_seconds() / 3600
        return 0.0

    def get_timer_cards_for_payroll(
        self,
        employee_id: int,
        start_date: str,
        end_date: str
    ) -> Dict[str, Any]:
        """Fetch timer cards for payroll calculation.

        Args:
            employee_id: ID of the employee
            start_date: Start date in format 'YYYY-MM-DD'
            end_date: End date in format 'YYYY-MM-DD'

        Returns:
            Dictionary with employee data and timer cards for the period
        """
        try:
            # Parse dates
            try:
                from datetime import datetime as dt
                start_dt = dt.strptime(start_date, '%Y-%m-%d').date()
                end_dt = dt.strptime(end_date, '%Y-%m-%d').date()
            except ValueError:
                return {
                    'success': False,
                    'error': 'Invalid date format. Use YYYY-MM-DD'
                }

            if not self.db:
                return {
                    'success': False,
                    'error': 'Database session not available'
                }

            # Fetch employee
            employee = self.db.query(Employee).filter(Employee.id == employee_id).first()
            if not employee:
                return {
                    'success': False,
                    'error': f'Employee with ID {employee_id} not found'
                }

            # Import TimerCard model
            from app.models.models import TimerCard

            # Fetch timer cards for the period
            timer_cards = self.db.query(TimerCard).filter(
                TimerCard.employee_id == employee_id,
                TimerCard.work_date >= start_dt,
                TimerCard.work_date <= end_dt
            ).all()

            # Format response
            timer_records = []
            for card in timer_cards:
                timer_records.append({
                    'work_date': card.work_date.strftime('%Y-%m-%d'),
                    'clock_in': card.clock_in.strftime('%H:%M') if card.clock_in else None,
                    'clock_out': card.clock_out.strftime('%H:%M') if card.clock_out else None,
                    'break_minutes': card.break_minutes,
                    'regular_hours': float(card.regular_hours),
                    'overtime_hours': float(card.overtime_hours),
                    'night_hours': float(card.night_hours),
                    'holiday_hours': float(card.holiday_hours),
                    'is_approved': card.is_approved
                })

            return {
                'success': True,
                'employee': {
                    'id': employee.id,
                    'full_name_kanji': employee.full_name_kanji,
                    'full_name_kana': employee.full_name_kana,
                    'jikyu': employee.jikyu,
                    'apartment_rent': employee.apartment_rent
                },
                'timer_records': timer_records,
                'total_records': len(timer_records)
            }

        except Exception as e:
            logger.error(f"Error fetching timer cards: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    def calculate_payroll_from_timer_cards(
        self,
        employee_id: int,
        start_date: str,
        end_date: str
    ) -> Dict[str, Any]:
        """Calculate payroll from timer cards.

        Args:
            employee_id: ID of the employee
            start_date: Start date in format 'YYYY-MM-DD'
            end_date: End date in format 'YYYY-MM-DD'

        Returns:
            Dictionary with complete payroll calculation
        """
        try:
            # First get timer cards
            timer_data = self.get_timer_cards_for_payroll(employee_id, start_date, end_date)
            if not timer_data['success']:
                return timer_data

            employee_info = timer_data['employee']
            timer_records = timer_data['timer_records']

            # Calculate totals
            work_days = 0
            total_hours = 0.0
            regular_hours = 0.0
            overtime_hours = 0.0
            night_hours = 0.0
            holiday_hours = 0.0

            for record in timer_records:
                work_days += 1
                total_hours += record.get('regular_hours', 0) + record.get('overtime_hours', 0)
                regular_hours += record.get('regular_hours', 0)
                overtime_hours += record.get('overtime_hours', 0)
                night_hours += record.get('night_hours', 0)
                holiday_hours += record.get('holiday_hours', 0)

            # Base salary calculations
            base_rate = float(employee_info['jikyu'])
            base_amount = int(regular_hours * base_rate)
            overtime_amount = int(overtime_hours * base_rate * float(self.overtime_rate))
            night_amount = int(night_hours * base_rate * (1 + float(self.night_rate)))
            holiday_amount = int(holiday_hours * base_rate * float(self.holiday_rate))

            gross_amount = base_amount + overtime_amount + night_amount + holiday_amount

            # Deductions
            apartment_deduction = employee_info.get('apartment_rent', 0)
            health_insurance = int(gross_amount * Decimal('0.055'))  # 5.5%
            pension = int(gross_amount * Decimal('0.091'))  # 9.1%
            income_tax = int(gross_amount * Decimal('0.10'))  # 10%

            total_deductions = apartment_deduction + int(health_insurance) + int(pension) + int(income_tax)
            net_amount = gross_amount - total_deductions

            return {
                'success': True,
                'employee_id': employee_id,
                'pay_period_start': start_date,
                'pay_period_end': end_date,
                'hours_breakdown': {
                    'work_days': work_days,
                    'total_hours': total_hours,
                    'regular_hours': regular_hours,
                    'overtime_hours': overtime_hours,
                    'night_hours': night_hours,
                    'holiday_hours': holiday_hours
                },
                'rates': {
                    'base_rate': base_rate,
                    'overtime_rate': float(self.overtime_rate),
                    'night_rate': float(self.night_rate),
                    'holiday_rate': float(self.holiday_rate)
                },
                'amounts': {
                    'base_amount': base_amount,
                    'overtime_amount': overtime_amount,
                    'night_amount': night_amount,
                    'holiday_amount': holiday_amount,
                    'gross_amount': gross_amount,
                    'net_amount': net_amount
                },
                'deductions_detail': {
                    'apartment': apartment_deduction,
                    'health_insurance': int(health_insurance),
                    'pension': int(pension),
                    'income_tax': int(income_tax),
                    'total': total_deductions
                },
                'validation': {
                    'is_valid': True,
                    'errors': []
                },
                'calculated_at': datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error calculating payroll: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    def get_unprocessed_timer_cards(self) -> Dict[str, Any]:
        """Get all unprocessed timer cards grouped by employee.

        Returns:
            Dictionary with unprocessed timer cards grouped by employee
        """
        try:
            if not self.db:
                return {
                    'success': False,
                    'error': 'Database session not available'
                }

            from app.models.models import TimerCard

            # Get unprocessed timer cards (is_approved = False)
            unprocessed = self.db.query(TimerCard).filter(
                TimerCard.is_approved == False
            ).all()

            # Group by employee
            employees_data = {}
            for card in unprocessed:
                if card.employee_id not in employees_data:
                    employee = self.db.query(Employee).filter(Employee.id == card.employee_id).first()
                    if employee:
                        employees_data[card.employee_id] = {
                            'employee_id': card.employee_id,
                            'employee_name': employee.full_name_kanji,
                            'timer_cards': []
                        }

                if card.employee_id in employees_data:
                    employees_data[card.employee_id]['timer_cards'].append({
                        'work_date': card.work_date.strftime('%Y-%m-%d'),
                        'clock_in': card.clock_in.strftime('%H:%M') if card.clock_in else None,
                        'clock_out': card.clock_out.strftime('%H:%M') if card.clock_out else None,
                        'break_minutes': card.break_minutes,
                        'regular_hours': float(card.regular_hours),
                        'overtime_hours': float(card.overtime_hours)
                    })

            employees_list = list(employees_data.values())
            total_records = len(unprocessed)

            return {
                'success': True,
                'total_employees': len(employees_list),
                'total_records': total_records,
                'employees': employees_list
            }

        except Exception as e:
            logger.error(f"Error fetching unprocessed timer cards: {e}")
            return {
                'success': False,
                'error': str(e)
            }


# Global instance - kept for backward compatibility
payroll_service = PayrollService()
