"""
Payslip Generator - Payroll System
Generador de payslips en PDF para empleados
"""
from typing import Dict, Optional
from datetime import datetime
import logging
import os
from pathlib import Path

logger = logging.getLogger(__name__)

# Import ReportLab for PDF generation
try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False
    logger.warning("ReportLab not installed. PDF generation will use placeholder mode.")


class PayslipGenerator:
    """Generador de payslips en PDF con formato japonés.

    Genera payslips profesionales con:
    - Logo de la empresa
    - Datos del empleado
    - Desglose detallado de horas
    - Cálculos de pagos y deducciones
    - Totales y firmas
    """

    def __init__(self, storage_path: Optional[str] = None):
        """Inicializa el generador de payslips.

        Args:
            storage_path (str): Directorio donde guardar PDFs (opcional)
        """
        self.storage_path = storage_path or 'storage/payslips'
        self._ensure_storage_directory()
        logger.info(f"PayslipGenerator initialized. Storage: {self.storage_path}")

    def _ensure_storage_directory(self):
        """Crea el directorio de almacenamiento si no existe."""
        Path(self.storage_path).mkdir(parents=True, exist_ok=True)

    def generate_payslip(self, employee_data: Dict, payroll_data: Dict) -> Dict[str, any]:
        """Genera un payslip completo para un empleado.

        Args:
            employee_data (Dict): Datos del empleado:
                {
                    'employee_id': int,
                    'name': str,
                    'name_kana': str,
                    'department': str,
                    'position': str,
                    'employee_number': str
                }
            payroll_data (Dict): Datos de payroll calculados:
                {
                    'pay_period': str,  # e.g., "2025-10"
                    'pay_period_start': str,  # "2025-10-01"
                    'pay_period_end': str,  # "2025-10-31"
                    'hours': {...},
                    'rates': {...},
                    'amounts': {...},
                    'deductions': {...},
                    'totals': {...}
                }

        Returns:
            Dict: Información del payslip generado:
                {
                    'success': bool,
                    'pdf_path': str,
                    'pdf_url': str,
                    'payslip_id': str,
                    'generated_at': str
                }

        Examples:
            >>> generator = PayslipGenerator()
            >>> result = generator.generate_payslip(employee_data, payroll_data)
            >>> if result['success']:
            ...     print(f"Payslip saved to: {result['pdf_path']}")
        """
        try:
            payslip_id = f"PSL_{employee_data['employee_id']}_{payroll_data['pay_period']}"
            pdf_filename = f"{payslip_id}.pdf"
            pdf_path = os.path.join(self.storage_path, pdf_filename)

            # Generate actual PDF with ReportLab
            if REPORTLAB_AVAILABLE:
                self._create_pdf(employee_data, payroll_data, pdf_path)
                logger.info(f"Payslip PDF generated successfully: {pdf_path}")
            else:
                # Fallback: Create a placeholder file if ReportLab not available
                self._create_placeholder_pdf(employee_data, payroll_data, pdf_path)
                logger.warning(f"Using placeholder PDF for {payslip_id} (ReportLab not installed)")

            result = {
                'success': True,
                'pdf_path': pdf_path,
                'pdf_url': f"/api/payroll/payslips/{payslip_id}",
                'payslip_id': payslip_id,
                'generated_at': datetime.now().isoformat(),
                'employee_id': employee_data['employee_id'],
                'pay_period': payroll_data['pay_period']
            }

            logger.info(f"Payslip generated: {payslip_id}")
            return result

        except Exception as e:
            logger.error(f"Error generating payslip: {e}")
            return {
                'success': False,
                'error': str(e),
                'generated_at': datetime.now().isoformat()
            }

    def generate_bulk_payslips(self, employees_data: Dict[int, Dict]) -> Dict[str, any]:
        """Genera payslips para múltiples empleados.

        Args:
            employees_data (Dict): Datos de empleados con payroll calculado:
                {
                    employee_id: {
                        'employee_data': {...},
                        'payroll_data': {...}
                    },
                    ...
                }

        Returns:
            Dict: Resultado de generación masiva:
                {
                    'total_employees': int,
                    'successful': int,
                    'failed': int,
                    'results': [...],
                    'errors': [...]
                }

        Examples:
            >>> generator = PayslipGenerator()
            >>> result = generator.generate_bulk_payslips(employees_data)
            >>> print(f"Generated {result['successful']} payslips")
        """
        results = []
        errors = []
        successful = 0
        failed = 0

        for employee_id, data in employees_data.items():
            try:
                result = self.generate_payslip(
                    data['employee_data'],
                    data['payroll_data']
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

        logger.info(f"Bulk payslip generation complete: {successful} success, {failed} failed")

        return {
            'total_employees': len(employees_data),
            'successful': successful,
            'failed': failed,
            'results': results,
            'errors': errors,
            'generated_at': datetime.now().isoformat()
        }

    def get_payslip_info(self, payslip_id: str) -> Optional[Dict]:
        """Obtiene información de un payslip generado.

        Args:
            payslip_id (str): ID del payslip

        Returns:
            Optional[Dict]: Información del payslip o None si no existe
        """
        pdf_filename = f"{payslip_id}.pdf"
        pdf_path = os.path.join(self.storage_path, pdf_filename)

        if os.path.exists(pdf_path):
            stat = os.stat(pdf_path)
            return {
                'payslip_id': payslip_id,
                'pdf_path': pdf_path,
                'pdf_url': f"/api/payroll/payslips/{payslip_id}",
                'file_size': stat.st_size,
                'created_at': datetime.fromtimestamp(stat.st_ctime).isoformat(),
                'modified_at': datetime.fromtimestamp(stat.st_mtime).isoformat()
            }

        return None

    def delete_payslip(self, payslip_id: str) -> bool:
        """Elimina un payslip generado.

        Args:
            payslip_id (str): ID del payslip

        Returns:
            bool: True si se eliminó exitosamente
        """
        pdf_filename = f"{payslip_id}.pdf"
        pdf_path = os.path.join(self.storage_path, pdf_filename)

        try:
            if os.path.exists(pdf_path):
                os.remove(pdf_path)
                logger.info(f"Payslip deleted: {payslip_id}")
                return True
            else:
                logger.warning(f"Payslip not found: {payslip_id}")
                return False
        except Exception as e:
            logger.error(f"Error deleting payslip {payslip_id}: {e}")
            return False

    def _format_amount(self, amount: float) -> str:
        """Formatea monto en yen japonés.

        Args:
            amount (float): Monto a formatear

        Returns:
            str: Monto formateado (ej. "¥1,234")

        Examples:
            >>> generator = PayslipGenerator()
            >>> formatted = generator._format_amount(1234.56)
            >>> print(formatted)
            ¥1,234
        """
        return f"¥{int(amount):,}"

    def _format_hours(self, hours: float) -> str:
        """Formatea horas con 2 decimales.

        Args:
            hours (float): Horas a formatear

        Returns:
            str: Horas formateadas (ej. "160.00h")

        Examples:
            >>> generator = PayslipGenerator()
            >>> formatted = generator._format_hours(160.5)
            >>> print(formatted)
            160.50h
        """
        return f"{hours:.2f}h"

    def get_template_info(self) -> Dict:
        """Obtiene información sobre el template de payslip.

        Returns:
            Dict: Información del template
        """
        return {
            'template_name': 'Japanese Standard Payslip',
            'version': '1.0',
            'language': 'Japanese',
            'format': 'PDF',
            'fields': {
                'company_info': ['Logo', 'Company Name', 'Address'],
                'employee_info': ['Name', 'Employee ID', 'Department', 'Position'],
                'pay_period': ['Start Date', 'End Date'],
                'hours': ['Regular', 'Overtime', 'Night Shift', 'Holiday'],
                'rates': ['Base Rate', 'Overtime Rate', 'Night Rate', 'Holiday Rate'],
                'earnings': ['Base Pay', 'Overtime Pay', 'Night Pay', 'Holiday Pay', 'Gross Pay'],
                'deductions': ['Income Tax', 'Resident Tax', 'Health Insurance', 'Pension', 'Other'],
                'net_pay': ['Net Amount'],
                'footer': ['Generated Date', 'Notes']
            },
            'compliance': {
                'labor_law': 'Japanese Labor Standards Act',
                'tax_compliance': 'National Tax Agency guidelines',
                'format_standard': 'Standard Japanese payroll format'
            }
        }

    def estimate_generation_time(self, num_employees: int) -> Dict[str, int]:
        """Estima el tiempo de generación para múltiples payslips.

        Args:
            num_employees (int): Número de empleados

        Returns:
            Dict: Estimación en segundos por fase
        """
        # Time estimates (in seconds)
        per_employee = {
            'pdf_generation': 2,
            'file_write': 1,
            'validation': 1
        }

        return {
            'total_seconds': num_employees * sum(per_employee.values()),
            'per_employee_seconds': sum(per_employee.values()),
            'breakdown': {
                phase: time * num_employees
                for phase, time in per_employee.items()
            }
        }

    def _create_pdf(self, employee_data: Dict, payroll_data: Dict, pdf_path: str):
        """Crea el PDF del payslip usando ReportLab.

        Args:
            employee_data (Dict): Datos del empleado
            payroll_data (Dict): Datos de payroll
            pdf_path (str): Ruta donde guardar el PDF
        """
        if not REPORTLAB_AVAILABLE:
            raise RuntimeError("ReportLab is not available")

        # Create PDF document
        doc = SimpleDocTemplate(
            pdf_path,
            pagesize=A4,
            rightMargin=2*cm,
            leftMargin=2*cm,
            topMargin=2*cm,
            bottomMargin=2*cm
        )

        # Get styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=18,
            spaceAfter=30,
            alignment=1  # Center alignment
        )

        # Build content
        story = []

        # Company header
        story.append(Paragraph("UNS-Kikaku Co., Ltd.", title_style))
        story.append(Spacer(1, 20))

        # Payslip title
        story.append(Paragraph("Salary Statement (給与明細)", styles['Heading2']))
        story.append(Spacer(1, 20))

        # Employee information
        emp_data = [
            ['Employee Name', employee_data.get('name', 'N/A')],
            ['Employee ID', str(employee_data.get('employee_id', 'N/A'))],
            ['Pay Period', payroll_data.get('pay_period', 'N/A')],
            ['Pay Period Start', payroll_data.get('pay_period_start', 'N/A')],
            ['Pay Period End', payroll_data.get('pay_period_end', 'N/A')]
        ]

        emp_table = Table(emp_data, colWidths=[4*cm, 8*cm])
        emp_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))

        story.append(Paragraph("Employee Information", styles['Heading3']))
        story.append(emp_table)
        story.append(Spacer(1, 20))

        # Hours worked
        hours = payroll_data.get('hours', {})
        hours_data = [
            ['Description', 'Hours', 'Rate', 'Amount'],
            ['Regular Hours', f"{hours.get('regular_hours', 0):.2f}", '', ''],
            ['Overtime Hours', f"{hours.get('overtime_hours', 0):.2f}", '', ''],
            ['Night Shift Hours', f"{hours.get('night_shift_hours', 0):.2f}", '', ''],
            ['Holiday Hours', f"{hours.get('holiday_hours', 0):.2f}", '', ''],
            ['Total Hours', f"{hours.get('total_hours', 0):.2f}", '', '']
        ]

        hours_table = Table(hours_data, colWidths=[5*cm, 3*cm, 3*cm, 4*cm])
        hours_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))

        story.append(Paragraph("Hours Worked", styles['Heading3']))
        story.append(hours_table)
        story.append(Spacer(1, 20))

        # Earnings and deductions
        amounts = payroll_data.get('amounts', {})
        deductions = payroll_data.get('deductions', {})

        earnings_data = [
            ['Earnings', 'Amount'],
            ['Base Pay', self._format_amount(amounts.get('base_amount', 0))],
            ['Overtime Pay', self._format_amount(amounts.get('overtime_amount', 0))],
            ['Night Shift Pay', self._format_amount(amounts.get('night_shift_amount', 0))],
            ['Holiday Pay', self._format_amount(amounts.get('holiday_amount', 0))],
            ['Gross Pay', self._format_amount(amounts.get('gross_amount', 0))]
        ]

        deductions_data = [
            ['Deductions', 'Amount'],
            ['Income Tax', self._format_amount(deductions.get('income_tax', 0))],
            ['Resident Tax', self._format_amount(deductions.get('resident_tax', 0))],
            ['Health Insurance', self._format_amount(deductions.get('health_insurance', 0))],
            ['Pension', self._format_amount(deductions.get('pension', 0))],
            ['Employment Insurance', self._format_amount(deductions.get('employment_insurance', 0))],
            ['Total Deductions', self._format_amount(deductions.get('total', 0))]
        ]

        # Create tables
        earnings_table = Table(earnings_data, colWidths=[5*cm, 4*cm])
        earnings_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))

        deductions_table = Table(deductions_data, colWidths=[5*cm, 4*cm])
        deductions_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))

        # Add tables side by side
        from reportlab.platypus import Table as ReportLabTable
        combined_table = ReportLabTable([
            [earnings_table, deductions_table]
        ], colWidths=[9*cm, 9*cm])

        story.append(Paragraph("Earnings and Deductions", styles['Heading3']))
        story.append(combined_table)
        story.append(Spacer(1, 20))

        # Net pay (highlighted)
        net_amount = amounts.get('gross_amount', 0) - deductions.get('total', 0)
        net_data = [
            ['NET PAY (差引支給額)', self._format_amount(net_amount)]
        ]

        net_table = Table(net_data, colWidths=[10*cm, 4*cm])
        net_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.lightgreen),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 14),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 15),
            ('TOPPADDING', (0, 0), (-1, -1), 15),
            ('GRID', (0, 0), (-1, -1), 2, colors.black)
        ]))

        story.append(net_table)
        story.append(Spacer(1, 30))

        # Footer
        story.append(Paragraph(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
        story.append(Paragraph("This is a computer-generated document.", styles['Normal']))

        # Build PDF
        doc.build(story)

    def _create_placeholder_pdf(self, employee_data: Dict, payroll_data: Dict, pdf_path: str):
        """Crea un archivo placeholder si ReportLab no está disponible.

        Args:
            employee_data (Dict): Datos del empleado
            payroll_data (Dict): Datos de payroll
            pdf_path (str): Ruta donde guardar el placeholder
        """
        # Create a text file as placeholder
        content = f"""
UNS-Kikaku Co., Ltd.
Salary Statement (給与明細)
{'='*50}

Employee Information:
  Name: {employee_data.get('name', 'N/A')}
  Employee ID: {employee_data.get('employee_id', 'N/A')}
  Pay Period: {payroll_data.get('pay_period', 'N/A')}
  Period: {payroll_data.get('pay_period_start', 'N/A')} to {payroll_data.get('pay_period_end', 'N/A')}

Hours:
  Regular Hours: {payroll_data.get('hours', {}).get('regular_hours', 0):.2f}
  Overtime Hours: {payroll_data.get('hours', {}).get('overtime_hours', 0):.2f}
  Night Shift Hours: {payroll_data.get('hours', {}).get('night_shift_hours', 0):.2f}
  Holiday Hours: {payroll_data.get('hours', {}).get('holiday_hours', 0):.2f}
  Total Hours: {payroll_data.get('hours', {}).get('total_hours', 0):.2f}

Earnings:
  Base Pay: ¥{payroll_data.get('amounts', {}).get('base_amount', 0):,.0f}
  Overtime Pay: ¥{payroll_data.get('amounts', {}).get('overtime_amount', 0):,.0f}
  Gross Pay: ¥{payroll_data.get('amounts', {}).get('gross_amount', 0):,.0f}

Deductions:
  Income Tax: ¥{payroll_data.get('deductions', {}).get('income_tax', 0):,.0f}
  Resident Tax: ¥{payroll_data.get('deductions', {}).get('resident_tax', 0):,.0f}
  Health Insurance: ¥{payroll_data.get('deductions', {}).get('health_insurance', 0):,.0f}
  Pension: ¥{payroll_data.get('deductions', {}).get('pension', 0):,.0f}
  Total Deductions: ¥{payroll_data.get('deductions', {}).get('total', 0):,.0f}

NET PAY: ¥{(payroll_data.get('amounts', {}).get('gross_amount', 0) - payroll_data.get('deductions', {}).get('total', 0)):,.0f}

Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
Note: This is a placeholder file. Install ReportLab for actual PDF generation.
"""

        with open(pdf_path.replace('.pdf', '.txt'), 'w', encoding='utf-8') as f:
            f.write(content)

        logger.info(f"Created placeholder payslip file: {pdf_path.replace('.pdf', '.txt')}")
