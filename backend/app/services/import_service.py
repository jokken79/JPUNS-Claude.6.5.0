"""
Import Service for UNS-ClaudeJP 2.0
Mass import from Excel with validation
"""
import logging
from datetime import datetime, time
from pathlib import Path
from typing import Dict, List, Optional

import pandas as pd
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.models.models import Employee, Factory, TimerCard

logger = logging.getLogger(__name__)


class ImportService:
    """Servicio de importación masiva de datos desde archivos Excel/JSON.

    Permite importar grandes volúmenes de datos con validación automática:
    - Empleados desde Excel con validación de campos requeridos
    - Tarjetas de tiempo (timer cards) desde Excel
    - Configuraciones de fábrica desde archivos JSON

    Note:
        - Valida datos antes de importar
        - Retorna reporte detallado con éxitos y errores
        - Persiste cada registro con transacciones parciales
        - Maneja errores por fila para continuar importación

    Examples:
        >>> service = ImportService()
        >>> # "db" es una sesión SQLAlchemy obtenida de get_db()
        >>> result = service.import_employees_from_excel("employees.xlsx", db)
        >>> print(f"Importados: {result['imported']}")
        >>> print(f"Errores: {result['failed']}")
    """

    def import_employees_from_excel(self, file_path: str, db: Session) -> Dict:
        """
        Import employees from Excel file
        
        Expected columns:
        - 派遣元ID, 氏名, フリガナ, 生年月日, 性別, 国籍, 住所, 電話番号, etc.
        
        Args:
            file_path: Path to Excel file
            
        Returns:
            Dict with import results
        """
        logger.info(f"Importing employees from {file_path}")
        
        results = {
            "success": [],
            "errors": [],
            "warnings": [],
            "total_rows": 0,
            "imported": 0,
            "failed": 0
        }
        
        try:
            # Read Excel file
            df = pd.read_excel(file_path)
            results["total_rows"] = len(df)
            
            logger.info(f"Found {len(df)} rows in Excel")
            
            # Process each row
            for i, (_, row) in enumerate(df.iterrows()):
                try:
                    # Validate required fields
                    validation_errors = self._validate_employee_data(row)
                    
                    if validation_errors:
                        results["errors"].append({
                            "row": i + 2,  # +2 for Excel header
                            "errors": validation_errors
                        })
                        results["failed"] += 1
                        continue
                    
                    # Prepare employee data
                    employee_data = self._prepare_employee_data(row)

                    with db.begin_nested():
                        employee = self._upsert_employee(db, employee_data)

                    results["success"].append({
                        "row": i + 2,
                        "name": employee.full_name_kanji,
                        "id": employee.hakenmoto_id,
                    })
                    results["imported"] += 1

                except Exception as e:
                    logger.error(f"Error processing row {i + 2}: {e}")
                    results["errors"].append({
                        "row": i + 2,
                        "error": str(e)
                    })
                    results["failed"] += 1

            try:
                db.commit()
            except SQLAlchemyError as exc:
                logger.error(f"Failed to commit employee import: {exc}")
                db.rollback()
                results["failed"] += results["imported"]
                results["imported"] = 0
                results["success"].clear()
                results["errors"].append({
                    "row": None,
                    "error": "Database commit failed",
                })
            else:
                logger.info(
                    f"Import complete: {results['imported']} succeeded, {results['failed']} failed"
                )

            return results

        except Exception as e:
            logger.error(f"Failed to read Excel file: {e}")
            return {
                "success": [],
                "errors": [{"error": f"Failed to read file: {str(e)}"}],
                "warnings": [],
                "total_rows": 0,
                "imported": 0,
                "failed": 0
            }
    
    def _validate_employee_data(self, row: pd.Series) -> List[str]:
        """
        Validate employee data row
        
        Returns:
            List of validation error messages
        """
        errors = []
        
        # Required fields
        required_fields = {
            '派遣元ID': 'hakenmoto_id',
            '氏名': 'name',
            '生年月日': 'birthday'
        }
        
        for excel_col, field_name in required_fields.items():
            if excel_col not in row or pd.isna(row[excel_col]):
                errors.append(f"{excel_col} is required")
        
        # Validate birthday format
        if '生年月日' in row and not pd.isna(row['生年月日']):
            try:
                if isinstance(row['生年月日'], str):
                    datetime.strptime(row['生年月日'], '%Y-%m-%d')
                elif not isinstance(row['生年月日'], datetime):
                    errors.append("生年月日 must be date format")
            except ValueError:
                errors.append("生年月日 must be YYYY-MM-DD format")
        
        # Validate gender
        if '性別' in row and not pd.isna(row['性別']):
            if row['性別'] not in ['男性', '女性']:
                errors.append("性別 must be 男性 or 女性")
        
        return errors
    
    def _prepare_employee_data(self, row: pd.Series) -> Dict:
        """
        Prepare employee data from Excel row
        
        Returns:
            Dict with employee data
        """
        data = {}
        
        # Map Excel columns to database fields
        column_mapping = {
            '派遣元ID': 'hakenmoto_id',
            '氏名': 'full_name_kanji',
            'フリガナ': 'full_name_kana',
            '生年月日': 'date_of_birth',
            '性別': 'gender',
            '国籍': 'nationality',
            '郵便番号': 'postal_code',
            '住所': 'address',
            '携帯電話': 'phone',
            '電話番号': 'phone',
            'メール': 'email',
            '在留カード番号': 'zairyu_card_number',
            'ビザ種類': 'visa_type',
            'ビザ期限': 'zairyu_expire_date',
            '運転免許証番号': 'license_type',
            '運転免許証期限': 'license_expire_date',
            '緊急連絡先氏名': 'emergency_contact_name',
            '緊急連絡先続柄': 'emergency_contact_relationship',
            '緊急連絡先電話': 'emergency_contact_phone'
        }
        
        for excel_col, db_field in column_mapping.items():
            if excel_col in row and not pd.isna(row[excel_col]):
                value = self._sanitize_value(row[excel_col])

                # Convert dates
                if (
                    'date' in db_field
                    or 'expiry' in db_field
                    or db_field == 'date_of_birth'
                ) and value is not None:
                    if isinstance(value, str):
                        value = datetime.strptime(value.strip(), '%Y-%m-%d').date()
                    elif isinstance(value, datetime):
                        value = value.date()

                data[db_field] = value

        if 'address' in data and 'current_address' not in data:
            data['current_address'] = data['address']

        return data

    def import_timer_cards_from_excel(
        self,
        file_path: str,
        factory_id: str,
        year: int,
        month: int,
        db: Session,
    ) -> Dict:
        """
        Import timer cards from Excel
        
        Expected columns:
        - 日付, 社員ID, 社員名, 出勤時刻, 退勤時刻
        
        Args:
            file_path: Path to Excel file
            factory_id: Factory ID
            year: Year
            month: Month
            
        Returns:
            Dict with import results
        """
        logger.info(f"Importing timer cards from {file_path}")
        
        results = {
            "success": [],
            "errors": [],
            "total_rows": 0,
            "imported": 0,
            "failed": 0
        }
        
        try:
            df = pd.read_excel(file_path)
            results["total_rows"] = len(df)
            
            for i, (_, row) in enumerate(df.iterrows()):
                try:
                    # Validate required fields
                    required = ['日付', '社員ID', '出勤時刻', '退勤時刻']
                    missing = [f for f in required if f not in row or pd.isna(row[f])]
                    
                    if missing:
                        results["errors"].append({
                            "row": i + 2,
                            "error": f"Missing fields: {', '.join(missing)}"
                        })
                        results["failed"] += 1
                        continue
                    
                    # Prepare timer card data
                    timer_data = self._prepare_timer_card_data(
                        row,
                        factory_id=factory_id,
                        year=year,
                        month=month,
                        db=db,
                    )

                    with db.begin_nested():
                        timer_card = self._upsert_timer_card(db, timer_data)

                    results["success"].append({
                        "row": i + 2,
                        "employee_id": timer_card.hakenmoto_id or timer_card.employee_id,
                        "date": timer_card.work_date,
                    })
                    results["imported"] += 1

                except Exception as e:
                    logger.error(f"Error processing row {i + 2}: {e}")
                    results["errors"].append({
                        "row": i + 2,
                        "error": str(e)
                    })
                    results["failed"] += 1

            try:
                db.commit()
            except SQLAlchemyError as exc:
                logger.error(f"Failed to commit timer card import: {exc}")
                db.rollback()
                results["failed"] += results["imported"]
                results["imported"] = 0
                results["success"].clear()
                results["errors"].append({
                    "row": None,
                    "error": "Database commit failed",
                })
            else:
                logger.info(
                    f"Timer cards import: {results['imported']} succeeded, {results['failed']} failed"
                )

            return results

        except Exception as e:
            logger.error(f"Failed to import timer cards: {e}")
            return {
                "success": [],
                "errors": [{"error": str(e)}],
                "total_rows": 0,
                "imported": 0,
                "failed": 0
            }
    
    def import_factory_configs_from_json(self, directory_path: str, db: Session) -> Dict:
        """
        Import factory configurations from JSON files
        
        Args:
            directory_path: Directory containing factory JSON files
            
        Returns:
            Dict with import results
        """
        logger.info(f"Importing factory configs from {directory_path}")
        
        results = {
            "success": [],
            "errors": [],
            "total_files": 0,
            "imported": 0,
            "failed": 0
        }
        
        try:
            import json
            directory = Path(directory_path)
            json_files = list(directory.glob('*.json'))
            results["total_files"] = len(json_files)
            
            for json_file in json_files:
                try:
                    with open(json_file, 'r', encoding='utf-8') as f:
                        config = json.load(f)
                    
                    # Validate config structure
                    required = ['factory_id', 'client_company', 'plant', 'assignment', 'job']
                    missing = [f for f in required if f not in config]
                    
                    if missing:
                        results["errors"].append({
                            "file": json_file.name,
                            "error": f"Missing fields: {', '.join(missing)}"
                        })
                        results["failed"] += 1
                        continue
                    
                    with db.begin_nested():
                        factory = self._upsert_factory(db, config)

                    logger.info(f"Imported factory config: {factory.factory_id}")

                    results["success"].append({
                        "file": json_file.name,
                        "factory_id": factory.factory_id,
                        "name": factory.name,
                    })
                    results["imported"] += 1

                except Exception as e:
                    logger.error(f"Error importing {json_file.name}: {e}")
                    results["errors"].append({
                        "file": json_file.name,
                        "error": str(e)
                    })
                    results["failed"] += 1
            
            try:
                db.commit()
            except SQLAlchemyError as exc:
                logger.error(f"Failed to commit factory config import: {exc}")
                db.rollback()
                results["failed"] += results["imported"]
                results["imported"] = 0
                results["success"].clear()
                results["errors"].append({
                    "file": None,
                    "error": "Database commit failed",
                })
            else:
                logger.info(
                    f"Factory configs import: {results['imported']} succeeded, {results['failed']} failed"
                )

            return results
            
        except Exception as e:
            logger.error(f"Failed to import factory configs: {e}")
            return {
                "success": [],
                "errors": [{"error": str(e)}],
                "total_files": 0,
                "imported": 0,
                "failed": 0
            }

    def _sanitize_value(self, value):
        """Convert pandas/numpy data types into native Python equivalents."""

        if value is None:
            return None

        if isinstance(value, str):
            return value.strip()

        if isinstance(value, (datetime, time)):
            return value

        if hasattr(value, "item"):
            try:
                return value.item()
            except Exception:  # pragma: no cover - fallback for unexpected objects
                return value

        return value

    def _upsert_employee(self, db: Session, employee_data: Dict) -> Employee:
        """Insert or update an employee using the provided data."""

        hakenmoto_value = employee_data.get("hakenmoto_id")
        if hakenmoto_value is None:
            raise ValueError("派遣元ID is required")

        try:
            hakenmoto_id = int(str(hakenmoto_value).strip())
        except (TypeError, ValueError):
            digits = ''.join(ch for ch in str(hakenmoto_value) if ch.isdigit())
            if not digits:
                raise ValueError("派遣元ID must contain at least one digit")
            hakenmoto_id = int(digits)

        payload = employee_data.copy()
        payload.pop("hakenmoto_id", None)

        payload.setdefault("hakensaki_shain_id", str(hakenmoto_value))

        existing = db.execute(
            select(Employee).where(Employee.hakenmoto_id == hakenmoto_id)
        ).scalar_one_or_none()

        if existing:
            for field, value in payload.items():
                setattr(existing, field, value)
            db.flush()
            return existing

        employee = Employee(hakenmoto_id=hakenmoto_id, **payload)
        db.add(employee)
        db.flush()
        return employee

    def _prepare_timer_card_data(
        self,
        row: pd.Series,
        *,
        factory_id: str,
        year: int,
        month: int,
        db: Session,
    ) -> Dict:
        """Normalize timer card values from Excel rows."""

        employee_identifier = row.get('社員ID')
        if pd.isna(employee_identifier):
            raise ValueError("社員ID is required")

        try:
            hakenmoto_id = int(str(self._sanitize_value(employee_identifier)))
        except (TypeError, ValueError) as exc:
            raise ValueError("社員ID must be numeric") from exc

        work_date_raw = row.get('日付')
        if pd.isna(work_date_raw):
            raise ValueError("日付 is required")

        work_date = self._coerce_date(work_date_raw)

        clock_in = self._coerce_time(row.get('出勤時刻'))
        clock_out = self._coerce_time(row.get('退勤時刻'))

        employee = db.execute(
            select(Employee).where(Employee.hakenmoto_id == hakenmoto_id)
        ).scalar_one_or_none()

        return {
            "hakenmoto_id": hakenmoto_id,
            "employee_id": employee.id if employee else None,
            "factory_id": factory_id,
            "work_date": work_date,
            "clock_in": clock_in,
            "clock_out": clock_out,
            "year": year,
            "month": month,
        }

    def _upsert_timer_card(self, db: Session, timer_data: Dict) -> TimerCard:
        """Create or update timer cards by work date and employee."""

        existing = db.execute(
            select(TimerCard).where(
                TimerCard.work_date == timer_data["work_date"],
                TimerCard.hakenmoto_id == timer_data["hakenmoto_id"],
            )
        ).scalar_one_or_none()

        fields = {
            "employee_id": timer_data["employee_id"],
            "factory_id": timer_data["factory_id"],
            "clock_in": timer_data["clock_in"],
            "clock_out": timer_data["clock_out"],
        }

        if existing:
            for field, value in fields.items():
                setattr(existing, field, value)
            db.flush()
            return existing

        timer_card = TimerCard(
            hakenmoto_id=timer_data["hakenmoto_id"],
            work_date=timer_data["work_date"],
            **fields,
        )
        db.add(timer_card)
        db.flush()
        return timer_card

    def _upsert_factory(self, db: Session, config: Dict) -> Factory:
        """Insert or update factory configuration data."""

        factory_id = config.get("factory_id")
        if not factory_id:
            raise ValueError("factory_id is required in configuration")

        name = config.get("name") or f"{config.get('client_company', '')} {config.get('plant', '')}".strip()
        payload = {
            "factory_id": factory_id,
            "company_name": config.get("client_company"),
            "plant_name": config.get("plant"),
            "name": name or factory_id,
            "address": config.get("address"),
            "phone": config.get("phone"),
            "contact_person": config.get("contact_person"),
            "config": config,
        }

        existing = db.execute(
            select(Factory).where(Factory.factory_id == factory_id)
        ).scalar_one_or_none()

        if existing:
            for field, value in payload.items():
                setattr(existing, field, value)
            db.flush()
            return existing

        factory = Factory(**payload)
        db.add(factory)
        db.flush()
        return factory

    def _coerce_date(self, value) -> datetime.date:
        """Convert various date-like objects into a date."""

        if isinstance(value, datetime):
            return value.date()

        if isinstance(value, str):
            return datetime.strptime(value.strip(), "%Y-%m-%d").date()

        if hasattr(value, "to_pydatetime"):
            return value.to_pydatetime().date()

        raise ValueError("Unsupported date format")

    def _coerce_time(self, value: Optional[object]) -> Optional[time]:
        """Convert Excel time values into Python time objects."""

        if value is None or (isinstance(value, float) and pd.isna(value)) or pd.isna(value):
            return None

        if isinstance(value, time):
            return value

        if isinstance(value, datetime):
            return value.time()

        if hasattr(value, "to_pydatetime"):
            return value.to_pydatetime().time()

        value_str = str(value).strip()
        for fmt in ("%H:%M:%S", "%H:%M"):
            try:
                return datetime.strptime(value_str, fmt).time()
            except ValueError:
                continue

        raise ValueError(f"Unsupported time format: {value}")


# Global instance
import_service = ImportService()
