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
