"""
Payroll Service - Payroll System
Servicio principal orquestador para cálculos de nómina
"""
from typing import Dict, List, Optional, Any
from decimal import Decimal
from datetime import datetime, timedelta
import logging

from sqlalchemy.orm import Session
from sqlalchemy import text

from app.models.payroll_models import PayrollRun, EmployeePayroll, PayrollSettings
from app.services.payroll.rate_calculator import RateCalculator
from app.services.payroll.overtime_calculator import OvertimeCalculator
from app.services.payroll.deduction_calculator import DeductionCalculator
from app.services.payroll.payroll_validator import PayrollValidator
from app.services.payroll.payslip_generator import PayslipGenerator

logger = logging.getLogger(__name__)


class PayrollService:
    """Servicio principal para cálculos de nómina y gestión de payroll.

    Orquesta todos los módulos de cálculo:
    - RateCalculator: Cálculo de tarifas por hora
    - OvertimeCalculator: Cálculo de horas extras y recargos
    - DeductionCalculator: Cálculo de deducciones
    - PayrollValidator: Validaciones de compliance
    - PayslipGenerator: Generación de payslips en PDF

    Integra con:
    - TimerCardOCRService (Fase 5) para procesar timer cards
    - Database tables (payroll_runs, employee_payroll, payroll_settings)
    - Employee master data
    """

    def __init__(self, db_session: Optional[Session] = None):
        """Inicializa el servicio de payroll.

        Args:
            db_session (Session): Sesión de base de datos SQLAlchemy (opcional)
        """
        self.db_session = db_session
        self.rate_calculator = RateCalculator()
        self.overtime_calculator = OvertimeCalculator()
        self.deduction_calculator = DeductionCalculator()
        self.validator = PayrollValidator()
        self.payslip_generator = PayslipGenerator()

        logger.info("PayrollService initialized with all calculators")

    def create_payroll_run(
        self,
        pay_period_start: str,
        pay_period_end: str,
        created_by: Optional[str] = None
    ) -> Dict[str, Any]:
        """Crea una nueva ejecución de payroll.

        Args:
            pay_period_start (str): Fecha inicio período (YYYY-MM-DD)
            pay_period_end (str): Fecha fin período (YYYY-MM-DD)
            created_by (str): Usuario que crea el payroll

        Returns:
            Dict: Información del payroll run creado
        """
        try:
            if not self.db_session:
                return {
                    'success': False,
                    'error': 'Database session required'
                }

            # Insert into payroll_runs table
            from datetime import date

            payroll_run = PayrollRun(
                pay_period_start=date.fromisoformat(pay_period_start),
                pay_period_end=date.fromisoformat(pay_period_end),
                status='draft',
                created_by=created_by
            )

            self.db_session.add(payroll_run)
            self.db_session.commit()
            self.db_session.refresh(payroll_run)

            result = {
                'success': True,
                'payroll_run_id': payroll_run.id,
                'pay_period_start': pay_period_start,
                'pay_period_end': pay_period_end,
                'status': payroll_run.status,
                'created_by': created_by,
                'created_at': payroll_run.created_at.isoformat(),
                'employees': []
            }

            logger.info(f"Payroll run created with ID {payroll_run.id} for period {pay_period_start} to {pay_period_end}")
            return result

        except Exception as e:
            logger.error(f"Error creating payroll run: {e}")
            if self.db_session:
                self.db_session.rollback()
            return {
                'success': False,
                'error': str(e)
            }

    def calculate_employee_payroll(
        self,
        employee_data: Dict,
        timer_records: List[Dict],
        payroll_run_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Calcula payroll completo para un empleado.

        Args:
            employee_data (Dict): Datos del empleado:
                {
                    'employee_id': int,
                    'name': str,
                    'base_hourly_rate': float,
                    'factory_id': str,
                    'prefecture': str,
                    'apartment_rent': float,
                    'dependents': int
                }
            timer_records (List[Dict]): Registros de timer card (de Fase 5)
            payroll_run_id (int): ID del payroll run (opcional)

        Returns:
            Dict: Payroll calculado completo

        Examples:
            >>> service = PayrollService(db_session)
            >>> employee = {'employee_id': 123, 'name': '山田太郎', 'base_hourly_rate': 1200}
            >>> timer_records = [{'work_date': '2025-10-01', 'clock_in': '09:00', 'clock_out': '18:00'}]
            >>> payroll = service.calculate_employee_payroll(employee, timer_records)
            >>> print(f"Pago neto: ¥{payroll['net_amount']:,.0f}")
        """
        try:
            logger.info(f"Calculating payroll for employee {employee_data['employee_id']}")

            # 1. Get payroll settings from database
            payroll_settings = self._get_payroll_settings()
            if not payroll_settings:
                logger.warning("Using default payroll settings")
                payroll_settings = {}

            # 2. Update calculators with settings
            self.rate_calculator.update_settings(payroll_settings)
            self.overtime_calculator = OvertimeCalculator(payroll_settings)

            # 3. Calculate hours breakdown
            hours_breakdown = self.overtime_calculator.calculate_hours_breakdown(timer_records)
            logger.debug(f"Hours breakdown: {hours_breakdown}")

            # 4. Calculate rates
            rates = self.rate_calculator.calculate_all_rates(employee_data)
            logger.debug(f"Rates: {rates}")

            # 5. Calculate amounts
            amounts = self.overtime_calculator.calculate_all_amounts(hours_breakdown, rates['base_rate'])
            logger.debug(f"Amounts: {amounts}")

            # 6. Calculate gross amount
            gross_amount = (
                amounts['base_amount'] +
                amounts['overtime_amount'] +
                amounts['night_shift_amount'] +
                amounts['holiday_amount'] +
                amounts['sunday_amount']
            )

            # 7. Calculate deductions
            self.deduction_calculator.update_employee_data(employee_data)
            deductions = self.deduction_calculator.calculate_all_deductions(gross_amount)

            # 8. Calculate net amount
            net_amount = gross_amount - deductions['total']

            # 9. Validate payroll
            payroll_data = {
                'employee_data': employee_data,
                'timer_records': timer_records,
                'hours_breakdown': hours_breakdown,
                'rates': rates,
                'amounts': amounts,
                'gross_amount': gross_amount,
                'deductions': deductions,
                'net_amount': net_amount
            }

            validation = self.validator.validate_payroll_data(payroll_data)

            if not validation['is_valid']:
                logger.warning(f"Payroll validation failed: {validation['errors']}")

            # 10. Save to database if payroll_run_id provided
            if payroll_run_id and self.db_session:
                self._save_employee_payroll(
                    payroll_run_id=payroll_run_id,
                    employee_data=employee_data,
                    hours_breakdown=hours_breakdown,
                    rates=rates,
                    amounts=amounts,
                    deductions=deductions,
                    gross_amount=gross_amount,
                    net_amount=net_amount
                )

            # 11. Prepare result
            result = {
                'success': True,
                'employee_id': employee_data['employee_id'],
                'payroll_run_id': payroll_run_id,
                'pay_period_start': self._get_pay_period_start(payroll_run_id),
                'pay_period_end': self._get_pay_period_end(payroll_run_id),
                'hours_breakdown': {
                    'regular_hours': float(hours_breakdown['regular_hours']),
                    'overtime_hours': float(hours_breakdown['overtime_hours']),
                    'night_shift_hours': float(hours_breakdown['night_shift_hours']),
                    'holiday_hours': float(hours_breakdown['holiday_hours']),
                    'sunday_hours': float(hours_breakdown['sunday_hours']),
                    'total_hours': float(hours_breakdown['total_hours']),
                    'work_days': hours_breakdown['work_days']
                },
                'rates': {
                    'base_rate': float(rates['base_rate']),
                    'overtime_rate': float(rates['overtime_rate']),
                    'night_shift_rate': float(rates['night_shift_rate']),
                    'holiday_rate': float(rates['holiday_rate']),
                    'sunday_rate': float(rates['sunday_rate'])
                },
                'amounts': {
                    'base_amount': float(amounts['base_amount']),
                    'overtime_amount': float(amounts['overtime_amount']),
                    'night_shift_amount': float(amounts['night_shift_amount']),
                    'holiday_amount': float(amounts['holiday_amount']),
                    'sunday_amount': float(amounts['sunday_amount']),
                    'gross_amount': float(gross_amount),
                    'total_deductions': float(deductions['total']),
                    'net_amount': float(net_amount)
                },
                'deductions_detail': {
                    'income_tax': float(deductions['income_tax']),
                    'resident_tax': float(deductions['resident_tax']),
                    'health_insurance': float(deductions['health_insurance']),
                    'pension': float(deductions['pension']),
                    'employment_insurance': float(deductions['employment_insurance']),
                    'apartment': float(deductions['apartment']),
                    'other': float(deductions['other'])
                },
                'validation': validation,
                'calculated_at': datetime.now().isoformat()
            }

            logger.info(f"Payroll calculated successfully: Gross={gross_amount}, Net={net_amount}")
            return result

        except Exception as e:
            logger.error(f"Error calculating payroll: {e}")
            return {
                'success': False,
                'error': str(e),
                'employee_id': employee_data.get('employee_id')
            }

    def calculate_bulk_payroll(
        self,
        employees_data: Dict[int, Dict],
        payroll_run_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Calcula payroll para múltiples empleados.

        Args:
            employees_data (Dict): Datos de empleados con timer records:
                {
                    employee_id: {
                        'employee_data': {...},
                        'timer_records': [...]
                    },
                    ...
                }
            payroll_run_id (int): ID del payroll run

        Returns:
            Dict: Resultados del cálculo masivo
        """
        results = []
        errors = []
        successful = 0
        failed = 0

        logger.info(f"Starting bulk payroll calculation for {len(employees_data)} employees")

        for employee_id, data in employees_data.items():
            try:
                result = self.calculate_employee_payroll(
                    data['employee_data'],
                    data['timer_records'],
                    payroll_run_id
                )
                result['employee_id'] = employee_id
                results.append(result)

                if result['success']:
                    successful += 1
                else:
                    failed += 1
                    errors.append({
                        'employee_id': employee_id,
                        'error': result.get('error', 'Unknown error')
                    })

            except Exception as e:
                failed += 1
                error_msg = f"Employee {employee_id}: {str(e)}"
                errors.append({'employee_id': employee_id, 'error': error_msg})
                logger.error(error_msg)

        logger.info(f"Bulk payroll complete: {successful} success, {failed} failed")

        return {
            'total_employees': len(employees_data),
            'successful': successful,
            'failed': failed,
            'results': results,
            'errors': errors,
            'calculated_at': datetime.now().isoformat()
        }

    def generate_payslip(self, employee_id: int, payroll_data: Dict) -> Dict[str, Any]:
        """Genera payslip en PDF para un empleado.

        Args:
            employee_id (int): ID del empleado
            payroll_data (Dict): Datos de payroll calculados

        Returns:
            Dict: Resultado de generación de payslip
        """
        # Prepare employee data
        employee_data = {
            'employee_id': employee_id,
            'name': payroll_data.get('employee_name', 'Unknown'),
            'employee_number': str(employee_id)
        }

        # Prepare payroll data
        payslip_data = {
            'pay_period': f"{payroll_data.get('pay_period_start', '')} - {payroll_data.get('pay_period_end', '')}",
            'base_pay': payroll_data['amounts']['base_amount'],
            'overtime_pay': payroll_data['amounts']['overtime_amount'],
            'gross_pay': payroll_data['amounts']['gross_amount'],
            'total_deductions': payroll_data['amounts']['total_deductions'],
            'net_pay': payroll_data['amounts']['net_amount']
        }

        return self.payslip_generator.generate_payslip(employee_data, payslip_data)

    def _get_payroll_settings(self) -> Optional[Dict]:
        """Obtiene configuración de payroll desde la base de datos.

        Returns:
            Optional[Dict]: Configuración de payroll o None
        """
        if not self.db_session:
            return None

        try:
            # Query payroll_settings table
            settings = self.db_session.query(PayrollSettings).first()

            if not settings:
                # Return default settings if none in database
                return {
                    'overtime_rate': Decimal('1.25'),
                    'night_shift_rate': Decimal('1.25'),
                    'holiday_rate': Decimal('1.35'),
                    'sunday_rate': Decimal('1.35'),
                    'standard_hours_per_month': Decimal('160')
                }

            return {
                'overtime_rate': settings.overtime_rate,
                'night_shift_rate': settings.night_shift_rate,
                'holiday_rate': settings.holiday_rate,
                'sunday_rate': settings.sunday_rate,
                'standard_hours_per_month': settings.standard_hours_per_month
            }

        except Exception as e:
            logger.error(f"Error getting payroll settings: {e}")
            return None

    def _get_pay_period_start(self, payroll_run_id: Optional[int] = None) -> str:
        """Obtiene fecha de inicio del período actual.

        Args:
            payroll_run_id: ID del payroll run (si no se proporciona, usa mes actual)

        Returns:
            Fecha de inicio en formato 'YYYY-MM-DD'
        """
        if payroll_run_id and self.db_session:
            # Query real payroll_run from DB
            payroll_run = self.db_session.query(PayrollRun).filter(
                PayrollRun.id == payroll_run_id
            ).first()

            if payroll_run and payroll_run.pay_period_start:
                return payroll_run.pay_period_start.strftime('%Y-%m-%d')

        # Fallback to current month if no payroll_run_id or not found
        return datetime.now().replace(day=1).strftime('%Y-%m-%d')

    def _get_pay_period_end(self, payroll_run_id: Optional[int] = None) -> str:
        """Obtiene fecha de fin del período actual.

        Args:
            payroll_run_id: ID del payroll run (si no se proporciona, usa mes actual)

        Returns:
            Fecha de fin en formato 'YYYY-MM-DD'
        """
        if payroll_run_id and self.db_session:
            # Query real payroll_run from DB
            payroll_run = self.db_session.query(PayrollRun).filter(
                PayrollRun.id == payroll_run_id
            ).first()

            if payroll_run and payroll_run.pay_period_end:
                return payroll_run.pay_period_end.strftime('%Y-%m-%d')

        # Fallback to current month end if no payroll_run_id or not found
        now = datetime.now()
        next_month = now.replace(day=28) + timedelta(days=4)
        return (next_month.replace(day=1) - timedelta(days=1)).strftime('%Y-%m-%d')

    def _save_employee_payroll(
        self,
        payroll_run_id: int,
        employee_data: Dict,
        hours_breakdown: Dict,
        rates: Dict,
        amounts: Dict,
        deductions: Dict,
        gross_amount: Decimal,
        net_amount: Decimal
    ):
        """Guarda payroll del empleado en la base de datos.

        Args:
            payroll_run_id (int): ID del payroll run
            employee_data (Dict): Datos del empleado
            hours_breakdown (Dict): Desglose de horas
            rates (Dict): Tarifas calculadas
            amounts (Dict): Montos calculados
            deductions (Dict): Deducciones calculadas
            gross_amount (Decimal): Monto bruto
            net_amount (Decimal): Monto neto
        """
        if not self.db_session:
            return

        try:
            # Insert into employee_payroll table
            from datetime import date

            employee_payroll = EmployeePayroll(
                payroll_run_id=payroll_run_id,
                employee_id=employee_data['employee_id'],
                pay_period_start=date.fromisoformat(self._get_pay_period_start(payroll_run_id)),
                pay_period_end=date.fromisoformat(self._get_pay_period_end(payroll_run_id)),
                regular_hours=hours_breakdown['regular_hours'],
                overtime_hours=hours_breakdown['overtime_hours'],
                night_shift_hours=hours_breakdown['night_shift_hours'],
                holiday_hours=hours_breakdown['holiday_hours'],
                sunday_hours=hours_breakdown['sunday_hours'],
                base_rate=rates['base_rate'],
                overtime_rate=rates['overtime_rate'],
                night_shift_rate=rates['night_shift_rate'],
                holiday_rate=rates['holiday_rate'],
                base_amount=amounts['base_amount'],
                overtime_amount=amounts['overtime_amount'],
                night_shift_amount=amounts['night_shift_amount'],
                holiday_amount=amounts['holiday_amount'],
                gross_amount=gross_amount,
                income_tax=deductions['income_tax'],
                resident_tax=deductions['resident_tax'],
                health_insurance=deductions['health_insurance'],
                pension=deductions['pension'],
                employment_insurance=deductions['employment_insurance'],
                total_deductions=deductions['total'],
                net_amount=net_amount
            )

            self.db_session.add(employee_payroll)
            self.db_session.commit()

            logger.info(f"Saved payroll for employee {employee_data['employee_id']}")

        except Exception as e:
            logger.error(f"Error saving employee payroll: {e}")
            if self.db_session:
                self.db_session.rollback()
            raise

    def update_payroll_settings(self, settings: Dict) -> Dict[str, Any]:
        """Actualiza configuración de payroll.

        Args:
            settings (Dict): Nuevas configuraciones

        Returns:
            Dict: Resultado de actualización
        """
        try:
            if not self.db_session:
                return {
                    'success': False,
                    'error': 'Database session required'
                }

            # Get existing settings or create new
            payroll_settings = self.db_session.query(PayrollSettings).first()

            if payroll_settings:
                # Update existing settings
                if 'overtime_rate' in settings:
                    payroll_settings.overtime_rate = settings['overtime_rate']
                if 'night_shift_rate' in settings:
                    payroll_settings.night_shift_rate = settings['night_shift_rate']
                if 'holiday_rate' in settings:
                    payroll_settings.holiday_rate = settings['holiday_rate']
                if 'sunday_rate' in settings:
                    payroll_settings.sunday_rate = settings['sunday_rate']
                if 'standard_hours_per_month' in settings:
                    payroll_settings.standard_hours_per_month = settings['standard_hours_per_month']
            else:
                # Create new settings record
                payroll_settings = PayrollSettings(
                    company_id=None,
                    overtime_rate=settings.get('overtime_rate', Decimal('1.25')),
                    night_shift_rate=settings.get('night_shift_rate', Decimal('1.25')),
                    holiday_rate=settings.get('holiday_rate', Decimal('1.35')),
                    sunday_rate=settings.get('sunday_rate', Decimal('1.35')),
                    standard_hours_per_month=settings.get('standard_hours_per_month', Decimal('160'))
                )
                self.db_session.add(payroll_settings)

            self.db_session.commit()
            self.db_session.refresh(payroll_settings)

            # Update in-memory calculators
            self.rate_calculator.update_settings(settings)
            self.overtime_calculator = OvertimeCalculator(settings)

            logger.info(f"Payroll settings updated successfully")
            return {
                'success': True,
                'settings': settings,
                'updated_at': datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error updating payroll settings: {e}")
            if self.db_session:
                self.db_session.rollback()
            return {
                'success': False,
                'error': str(e)
            }

    def get_employee_data_for_payroll(self, employee_id: int) -> Dict[str, Any]:
        """Fetches employee data from database for payroll calculation.

        Retrieves employee information from database including factory and apartment details.

        Args:
            employee_id: ID of the employee

        Returns:
            Dictionary with employee data structured for payroll calculation

        Raises:
            ValueError: If employee not found or database session not available
        """
        if not self.db_session:
            raise ValueError("Database session is required to fetch employee data")

        try:
            from app.models.models import Employee, Factory, Apartment

            # Fetch employee with relationships
            employee = (
                self.db_session.query(Employee)
                .filter(Employee.id == employee_id)
                .first()
            )

            if not employee:
                raise ValueError(f"Employee with ID {employee_id} not found")

            # Get factory info
            factory = None
            if employee.factory_id:
                factory = (
                    self.db_session.query(Factory)
                    .filter(Factory.factory_id == employee.factory_id)
                    .first()
                )

            # Get apartment info
            apartment = None
            if employee.apartment_id:
                apartment = (
                    self.db_session.query(Apartment)
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
                'prefecture': None,
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
        if not self.db_session:
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
            from app.models.models import RentDeduction, DeductionStatus

            # Consultar deducciones para este empleado en este mes
            deductions = (
                self.db_session.query(RentDeduction)
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

            # Obtener información del apartamento
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
