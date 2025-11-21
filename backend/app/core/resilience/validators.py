"""Pre-import validators for data integrity."""

import json
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
import pandas as pd
from datetime import datetime, date

logger = logging.getLogger(__name__)


class PreImportValidator:
    """Base validator class."""
    
    def validate(self, data: Any) -> tuple[bool, Optional[str]]:
        """Validate data. Returns (is_valid, error_message)."""
        raise NotImplementedError


class FileValidator(PreImportValidator):
    """Validate that files exist and are readable."""
    
    def validate(self, file_path: str) -> tuple[bool, Optional[str]]:
        """Check if file exists and is readable."""
        path = Path(file_path)
        
        if not path.exists():
            msg = f"File not found: {file_path}"
            logger.error(msg)
            return False, msg
        
        if not path.is_file():
            msg = f"Path is not a file: {file_path}"
            logger.error(msg)
            return False, msg
        
        if not path.stat().st_size > 0:
            msg = f"File is empty: {file_path}"
            logger.error(msg)
            return False, msg
        
        try:
            # Test readability
            with open(path, 'rb') as f:
                f.read(1)
        except IOError as e:
            msg = f"Cannot read file {file_path}: {e}"
            logger.error(msg)
            return False, msg
        
        logger.info(f"✓ File validation passed: {file_path}")
        return True, None


class ExcelStructureValidator(PreImportValidator):
    """Validate Excel file structure and required sheets/columns."""
    
    def __init__(self, required_sheets: List[str], required_columns: Dict[str, List[str]]):
        """
        Initialize validator.
        
        Args:
            required_sheets: List of required sheet names
            required_columns: Dict mapping sheet names to required column names
        """
        self.required_sheets = required_sheets
        self.required_columns = required_columns
    
    def validate(self, file_path: str) -> tuple[bool, Optional[str]]:
        """Validate Excel structure."""
        try:
            xls = pd.ExcelFile(file_path)
            
            # Check sheets
            missing_sheets = [s for s in self.required_sheets if s not in xls.sheet_names]
            if missing_sheets:
                msg = f"Missing required sheets: {missing_sheets}. Available: {xls.sheet_names}"
                logger.error(msg)
                return False, msg
            
            # Check columns per sheet
            for sheet_name, required_cols in self.required_columns.items():
                try:
                    df = pd.read_excel(file_path, sheet_name=sheet_name, nrows=0)
                    missing_cols = [c for c in required_cols if c not in df.columns]
                    if missing_cols:
                        msg = f"Sheet '{sheet_name}' missing columns: {missing_cols}"
                        logger.error(msg)
                        return False, msg
                except Exception as e:
                    msg = f"Error reading sheet '{sheet_name}': {e}"
                    logger.error(msg)
                    return False, msg
            
            logger.info(f"✓ Excel structure validation passed: {file_path}")
            return True, None
        
        except Exception as e:
            msg = f"Excel validation failed: {e}"
            logger.error(msg)
            return False, msg


class JsonSchemaValidator(PreImportValidator):
    """Validate JSON against schema."""
    
    def __init__(self, schema: Dict[str, Any]):
        """
        Initialize validator.
        
        Args:
            schema: JSON schema (simplified)
        """
        self.schema = schema
    
    def validate(self, file_path: str) -> tuple[bool, Optional[str]]:
        """Validate JSON file."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Simple validation
            if 'factories' not in data:
                msg = f"JSON missing required key 'factories'"
                logger.error(msg)
                return False, msg
            
            if not isinstance(data['factories'], list):
                msg = f"'factories' must be a list"
                logger.error(msg)
                return False, msg
            
            if len(data['factories']) == 0:
                msg = f"'factories' list is empty"
                logger.error(msg)
                return False, msg
            
            # Validate each factory has required fields
            for idx, factory in enumerate(data['factories']):
                if 'factory_id' not in factory:
                    msg = f"Factory #{idx} missing 'factory_id'"
                    logger.error(msg)
                    return False, msg
            
            logger.info(f"✓ JSON schema validation passed: {file_path}")
            return True, None
        
        except json.JSONDecodeError as e:
            msg = f"Invalid JSON at line {e.lineno}, col {e.colno}: {e.msg}"
            logger.error(msg)
            return False, msg
        except Exception as e:
            msg = f"JSON validation failed: {e}"
            logger.error(msg)
            return False, msg


class ForeignKeyValidator(PreImportValidator):
    """Validate foreign key references exist."""
    
    def __init__(self, db, model, field_name: str):
        """
        Initialize validator.
        
        Args:
            db: Database session
            model: SQLAlchemy model
            field_name: Field name to check
        """
        self.db = db
        self.model = model
        self.field_name = field_name
    
    def validate(self, value: Any) -> tuple[bool, Optional[str]]:
        """Check if FK reference exists."""
        if value is None:
            return True, None
        
        try:
            exists = self.db.query(self.model).filter(
                getattr(self.model, self.field_name) == value
            ).first()
            
            if not exists:
                msg = f"Foreign key {self.field_name}='{value}' not found in {self.model.__tablename__}"
                logger.warning(msg)
                return False, msg
            
            return True, None
        except Exception as e:
            msg = f"FK validation error: {e}"
            logger.error(msg)
            return False, msg


class DataIntegrityValidator(PreImportValidator):
    """Validate data integrity constraints."""
    
    @staticmethod
    def validate_required_field(value: Any, field_name: str) -> tuple[bool, Optional[str]]:
        """Check required field is not empty."""
        if value is None or (isinstance(value, str) and not value.strip()):
            msg = f"Required field '{field_name}' is empty"
            return False, msg
        return True, None
    
    @staticmethod
    def validate_numeric_range(
        value: Any,
        field_name: str,
        min_val: Optional[int] = None,
        max_val: Optional[int] = None
    ) -> tuple[bool, Optional[str]]:
        """Validate numeric value is in range."""
        try:
            num_val = int(float(value))
            
            if min_val is not None and num_val < min_val:
                msg = f"Field '{field_name}' value {num_val} below minimum {min_val}"
                return False, msg
            
            if max_val is not None and num_val > max_val:
                msg = f"Field '{field_name}' value {num_val} above maximum {max_val}"
                return False, msg
            
            return True, None
        except (ValueError, TypeError) as e:
            msg = f"Field '{field_name}' is not numeric: {e}"
            return False, msg
    
    @staticmethod
    def validate_date_not_future(
        value: Optional[date],
        field_name: str
    ) -> tuple[bool, Optional[str]]:
        """Validate date is not in future."""
        if value is None:
            return True, None
        
        if value > date.today():
            msg = f"Field '{field_name}' date {value} is in the future"
            return False, msg
        
        return True, None
    
    @staticmethod
    def validate_date_reasonable(
        value: Optional[date],
        field_name: str,
        min_year: int = 1900,
        max_year: int = None
    ) -> tuple[bool, Optional[str]]:
        """Validate date is in reasonable range."""
        if value is None:
            return True, None
        
        if max_year is None:
            max_year = datetime.now().year
        
        if value.year < min_year or value.year > max_year:
            msg = f"Field '{field_name}' year {value.year} outside range [{min_year}, {max_year}]"
            return False, msg
        
        return True, None
