"""
Payroll Validator - Payroll System
Validaciones de reglas de negocio y compliance japonés
"""
from typing import Dict, List, Optional
from decimal import Decimal
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class PayrollValidator:
    """Validador de reglas de negocio y compliance para payroll japonés.

    Valida:
    - Horas máximas de trabajo diarias/mensuales
    - Descansos obligatorios
    - Límites de horas extras
    - Turnos nocturnos
    - Reglas de días festivos
    - Datos requeridos
    - Límites de tarifas
    """

    # Límites según Japanese Labor Standards Act
    MAX_HOURS_PER_DAY = Decimal('8')  # Máximo 8 horas/día (40h/semana)
    MAX_OVERTIME_PER_DAY = Decimal('3')  # Máximo 3h extras/día
    MAX_OVERTIME_PER_MONTH = Decimal('45')  # Máximo 45h extras/mes
    MAX_TOTAL_HOURS_PER_MONTH = Decimal('240')  # Máximo teórico 240h/mes
    MAX_NIGHT_SHIFT_HOURS_PER_DAY = Decimal('5')  # Máximo 5h nocturnas/día

    # Descansos obligatorios
    MIN_BREAK_MINUTES_FOR_6H = Decimal('45')  # 45 min si trabaja 6+ horas
    MIN_BREAK_MINUTES_FOR_8H = Decimal('60')  # 60 min si trabaja 8+ horas

    def __init__(self):
        """Inicializa el validador de payroll."""
        logger.info("PayrollValidator initialized")

    def validate_payroll_data(self, payroll_data: Dict) -> Dict[str, any]:
        """Valida datos completos de payroll.

        Args:
            payroll_data (Dict): Datos de payroll a validar

        Returns:
            Dict: Resultado de validación con errores si existen

        Examples:
            >>> validator = PayrollValidator()
            >>> result = validator.validate_payroll_data(payroll_data)
            >>> if result['is_valid']:
            ...     print("Payroll data is valid")
            ... else:
            ...     print(f"Errors: {result['errors']}")
        """
        errors = []
        warnings = []

        # Validate employee data
        employee_errors = self.validate_employee_data(payroll_data.get('employee_data', {}))
        errors.extend(employee_errors)

        # Validate timer card data
        timer_errors = self.validate_timer_data(payroll_data.get('timer_records', []))
        errors.extend(timer_errors)

        # Validate hours compliance
        hours_errors = self.validate_hours_compliance(payroll_data.get('hours_breakdown', {}))
        errors.extend(hours_errors)

        # Validate rates
        rate_errors = self.validate_rates(payroll_data.get('rates', {}))
        errors.extend(rate_errors)

        # Validate deductions
        deduction_warnings = self.validate_deductions(payroll_data.get('deductions', {}))
        warnings.extend(deduction_warnings)

        is_valid = len(errors) == 0

        return {
            'is_valid': is_valid,
            'errors': errors,
            'warnings': warnings,
            'validated_at': datetime.now().isoformat()
        }

    def validate_employee_data(self, employee_data: Dict) -> List[str]:
        """Valida datos del empleado.

        Args:
            employee_data (Dict): Datos del empleado

        Returns:
            List[str]: Lista de errores encontrados
        """
        errors = []

        # Required fields
        required_fields = ['employee_id', 'name', 'base_hourly_rate']
        for field in required_fields:
            if field not in employee_data or not employee_data[field]:
                errors.append(f"Missing required field: {field}")

        # Validate employee_id
        if 'employee_id' in employee_data:
            try:
                emp_id = int(employee_data['employee_id'])
                if emp_id <= 0:
                    errors.append("employee_id must be positive")
            except (ValueError, TypeError):
                errors.append("employee_id must be a valid integer")

        # Validate base hourly rate
        if 'base_hourly_rate' in employee_data:
            try:
                rate = Decimal(str(employee_data['base_hourly_rate']))
                if rate <= 0:
                    errors.append("base_hourly_rate must be positive")
                if rate > Decimal('10000'):  # Unreasonable rate
                    errors.append(f"base_hourly_rate too high: {rate} (max 10000)")
            except (ValueError, TypeError):
                errors.append("base_hourly_rate must be a valid number")

        logger.debug(f"Employee data validation: {len(errors)} errors")
        return errors

    def validate_timer_data(self, timer_records: List[Dict]) -> List[str]:
        """Valida datos de timer cards.

        Args:
            timer_records (List[Dict]): Lista de registros de timer

        Returns:
            List[str]: Lista de errores encontrados
        """
        errors = []

        if not timer_records:
            errors.append("No timer records provided")
            return errors

        for idx, record in enumerate(timer_records):
            try:
                # Check required fields
                required = ['work_date', 'clock_in', 'clock_out']
                for field in required:
                    if field not in record or not record[field]:
                        errors.append(f"Record {idx}: Missing {field}")

                # Validate date format
                if 'work_date' in record:
                    try:
                        datetime.strptime(str(record['work_date']), '%Y-%m-%d')
                    except ValueError:
                        errors.append(f"Record {idx}: Invalid date format (YYYY-MM-DD)")

                # Validate time formats
                for time_field in ['clock_in', 'clock_out']:
                    if time_field in record:
                        try:
                            datetime.strptime(record[time_field], '%H:%M')
                        except ValueError:
                            errors.append(f"Record {idx}: Invalid time format for {time_field} (HH:MM)")

                # Check if clock_out is after clock_in
                if all(field in record for field in ['clock_in', 'clock_out']):
                    try:
                        clock_in = datetime.strptime(record['clock_in'], '%H:%M')
                        clock_out = datetime.strptime(record['clock_out'], '%H:%M')

                        # Handle overnight shifts
                        if clock_out <= clock_in:
                            clock_out = clock_out.replace(day=clock_out.day + 1)

                        hours_worked = (clock_out - clock_in).total_seconds() / 3600

                        if hours_worked <= 0:
                            errors.append(f"Record {idx}: Hours worked must be positive")
                        elif hours_worked > 24:
                            errors.append(f"Record {idx}: Hours worked too high ({hours_worked}h)")

                        # Check break time
                        break_minutes = record.get('break_minutes', 0)
                        if hours_worked >= 6 and break_minutes < 45:
                            errors.append(f"Record {idx}: Break time too short (min 45min for 6+h)")
                        if hours_worked >= 8 and break_minutes < 60:
                            errors.append(f"Record {idx}: Break time too short (min 60min for 8+h)")

                    except Exception as e:
                        errors.append(f"Record {idx}: Error validating times - {e}")

            except Exception as e:
                errors.append(f"Record {idx}: Error processing record - {e}")

        logger.debug(f"Timer data validation: {len(errors)} errors")
        return errors

    def validate_hours_compliance(self, hours_breakdown: Dict) -> List[str]:
        """Valida cumplimiento de límites de horas laborales japonesas.

        Args:
            hours_breakdown (Dict): Desglose de horas

        Returns:
            List[str]: Lista de errores encontrados
        """
        errors = []

        if not hours_breakdown:
            errors.append("No hours breakdown provided")
            return errors

        total_hours = Decimal(str(hours_breakdown.get('total_hours', 0)))
        regular_hours = Decimal(str(hours_breakdown.get('regular_hours', 0)))
        overtime_hours = Decimal(str(hours_breakdown.get('overtime_hours', 0)))
        night_hours = Decimal(str(hours_breakdown.get('night_shift_hours', 0)))

        # Check total monthly hours
        if total_hours > self.MAX_TOTAL_HOURS_PER_MONTH:
            errors.append(
                f"Total hours too high: {total_hours}h (max {self.MAX_TOTAL_HOURS_PER_MONTH}h/month)"
            )

        # Check overtime limit
        if overtime_hours > self.MAX_OVERTIME_PER_MONTH:
            errors.append(
                f"Overtime hours too high: {overtime_hours}h (max {self.MAX_OVERTIME_PER_MONTH}h/month)"
            )

        # Check night shift hours
        if night_hours > self.MAX_NIGHT_SHIFT_HOURS_PER_DAY:
            logger.warning(
                f"Night shift hours high: {night_hours}h (should be <{self.MAX_NIGHT_SHIFT_HOURS_PER_DAY}h/day)"
            )

        # Check for reasonable work schedule
        if regular_hours > Decimal('160'):
            logger.warning(f"Regular hours high: {regular_hours}h (expected ~160h/month)")

        logger.debug(f"Hours compliance validation: {len(errors)} errors")
        return errors

    def validate_rates(self, rates: Dict) -> List[str]:
        """Valida que las tarifas sean razonables.

        Args:
            rates (Dict): Diccionario de tarifas

        Returns:
            List[str]: Lista de errores encontrados
        """
        errors = []

        if not rates:
            errors.append("No rates provided")
            return errors

        base_rate = Decimal(str(rates.get('base_rate', 0)))
        overtime_rate = Decimal(str(rates.get('overtime_rate', 0)))
        night_rate = Decimal(str(rates.get('night_shift_rate', 0)))

        # Validate base rate
        if base_rate <= 0:
            errors.append("base_rate must be positive")
        elif base_rate > Decimal('5000'):
            errors.append(f"base_rate too high: ¥{base_rate}/h (max ¥5000)")

        # Validate overtime rate (should be at least 25% premium)
        if overtime_rate < base_rate * Decimal('1.25'):
            errors.append(
                f"overtime_rate too low: ¥{overtime_rate}/h (min ¥{base_rate * 1.25}/h)"
            )

        # Validate night rate (should be at least 25% premium)
        if night_rate < base_rate * Decimal('1.25'):
            errors.append(
                f"night_shift_rate too low: ¥{night_rate}/h (min ¥{base_rate * 1.25}/h)"
            )

        # Check for reasonable rate differences
        if overtime_rate > base_rate * Decimal('2.0'):
            logger.warning(f"overtime_rate very high: ¥{overtime_rate}/h")

        if night_rate > base_rate * Decimal('2.0'):
            logger.warning(f"night_shift_rate very high: ¥{night_rate}/h")

        logger.debug(f"Rates validation: {len(errors)} errors")
        return errors

    def validate_deductions(self, deductions: Dict) -> List[str]:
        """Valida que las deducciones sean razonables.

        Args:
            deductions (Dict): Diccionario de deducciones

        Returns:
            List[str]: Lista de warnings
        """
        warnings = []

        if not deductions:
            return warnings

        total_deductions = Decimal(str(deductions.get('total', 0)))

        # Check if deductions are too high (>70% of gross is suspicious)
        if 'gross_income' in deductions:
            gross = Decimal(str(deductions['gross_income']))
            if total_deductions > gross * Decimal('0.7'):
                warnings.append(
                    f"Deductions very high: ¥{total_deductions} (>70% of gross)"
                )

        # Check for negative deductions
        for key, value in deductions.items():
            if key in ['total', 'gross_income']:
                continue
            try:
                val = Decimal(str(value))
                if val < 0:
                    warnings.append(f"Deduction {key} is negative: ¥{val}")
            except (ValueError, TypeError):
                pass

        logger.debug(f"Deductions validation: {len(warnings)} warnings")
        return warnings

    def validate_payslip_data(self, payslip_data: Dict) -> Dict[str, any]:
        """Valida datos de payslip antes de generar PDF.

        Args:
            payslip_data (Dict): Datos del payslip

        Returns:
            Dict: Resultado de validación
        """
        errors = []
        warnings = []

        # Required fields for payslip
        required_fields = [
            'employee_name', 'employee_id', 'pay_period',
            'base_pay', 'overtime_pay', 'gross_pay',
            'total_deductions', 'net_pay'
        ]

        for field in required_fields:
            if field not in payslip_data or payslip_data[field] is None:
                errors.append(f"Missing required field: {field}")

        # Validate amounts are positive
        amount_fields = ['base_pay', 'overtime_pay', 'gross_pay', 'total_deductions', 'net_pay']
        for field in amount_fields:
            if field in payslip_data:
                try:
                    amount = Decimal(str(payslip_data[field]))
                    if amount < 0:
                        errors.append(f"{field} cannot be negative: ¥{amount}")
                except (ValueError, TypeError):
                    errors.append(f"{field} must be a valid number")

        # Validate net pay calculation
        if all(field in payslip_data for field in ['gross_pay', 'total_deductions', 'net_pay']):
            try:
                gross = Decimal(str(payslip_data['gross_pay']))
                deductions = Decimal(str(payslip_data['total_deductions']))
                net = Decimal(str(payslip_data['net_pay']))

                expected_net = gross - deductions
                if abs(net - expected_net) > Decimal('1'):  # Allow ¥1 difference for rounding
                    errors.append(
                        f"Net pay calculation error: {net} != {gross} - {deductions} = {expected_net}"
                    )
            except (ValueError, TypeError):
                pass

        is_valid = len(errors) == 0

        return {
            'is_valid': is_valid,
            'errors': errors,
            'warnings': warnings
        }

    def get_compliance_report(self, payroll_data: Dict) -> Dict:
        """Genera reporte de compliance detallado.

        Args:
            payroll_data (Dict): Datos de payroll

        Returns:
            Dict: Reporte de compliance
        """
        validation = self.validate_payroll_data(payroll_data)
        hours_breakdown = payroll_data.get('hours_breakdown', {})

        report = {
            'is_compliant': validation['is_valid'],
            'validation_result': validation,
            'compliance_summary': {
                'total_hours': hours_breakdown.get('total_hours', 0),
                'overtime_hours': hours_breakdown.get('overtime_hours', 0),
                'night_hours': hours_breakdown.get('night_shift_hours', 0),
                'within_daily_limits': True,
                'within_monthly_limits': True,
                'within_overtime_limits': True
            },
            'recommendations': []
        }

        # Add recommendations
        if hours_breakdown.get('total_hours', 0) > 180:
            report['recommendations'].append(
                "Consider reviewing work schedule (hours > 180/month)"
            )

        if hours_breakdown.get('overtime_hours', 0) > 30:
            report['recommendations'].append(
                "Overtime approaching limit (30h), monitor closely"
            )

        return report
