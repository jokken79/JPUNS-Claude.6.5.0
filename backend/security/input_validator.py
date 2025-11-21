"""
Input Validation and Sanitization Module
UNS-CLAUDEJP 5.4 - Production Security Hardening

This module provides comprehensive input validation, sanitization, and security
checks to prevent injection attacks, path traversal, and other security vulnerabilities.
"""

import re
import os
import html
import json
import base64
import hashlib
import ipaddress
import urllib.parse
from typing import Dict, Any, List, Optional, Union, Tuple, Set
from dataclasses import dataclass
from pathlib import Path, PurePath
from datetime import datetime
import unicodedata

from ..utils.logging_utils import PhotoExtractionLogger


@dataclass
class ValidationResult:
    """Result of input validation"""
    is_valid: bool
    sanitized_value: Any
    error_messages: List[str]
    warning_messages: List[str]
    security_flags: List[str]
    risk_score: float = 0.0
    
    def add_error(self, message: str):
        """Add error message"""
        self.error_messages.append(message)
        self.is_valid = False
    
    def add_warning(self, message: str):
        """Add warning message"""
        self.warning_messages.append(message)
    
    def add_security_flag(self, flag: str):
        """Add security flag"""
        self.security_flags.append(flag)
        self.risk_score += 10.0


class InputValidator:
    """
    Comprehensive input validator with security-focused validation rules.
    
    Features:
    - SQL injection detection
    - XSS prevention
    - Path traversal protection
    - File upload validation
    - Data type validation
    - Unicode normalization
    - Rate limiting preparation
    - Content security policies
    """
    
    def __init__(self, logger: PhotoExtractionLogger):
        self.logger = logger
        
        # Security patterns
        self.sql_injection_patterns = [
            r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)",
            r"(--|#|/\*|\*/)",
            r"(\bOR\b.*=.*\bOR\b)",
            r"(\bAND\b.*=.*\bAND\b)",
            r"(\bWHERE\b.*\bOR\b)",
            r"(\bWHERE\b.*\bAND\b)",
            r"(;|'|\"|`|\\)",
            r"(\bWAITFOR\b.*\bDELAY\b)",
            r"(\bBENCHMARK\b)",
            r"(\bSLEEP\b)",
            r"(\bPG_SLEEP\b)",
            r"(\bXP_CMDShell\b)"
        ]
        
        self.xss_patterns = [
            r"<script[^>]*>.*?</script>",
            r"javascript:",
            r"vbscript:",
            r"onload\s*=",
            r"onerror\s*=",
            r"onclick\s*=",
            r"onmouseover\s*=",
            r"onfocus\s*=",
            r"onblur\s*=",
            r"onchange\s*=",
            r"onsubmit\s*=",
            r"<iframe[^>]*>",
            r"<object[^>]*>",
            r"<embed[^>]*>",
            r"<link[^>]*>",
            r"<meta[^>]*>",
            r"expression\s*\(",
            r"@import",
            r"<style[^>]*>.*?</style>"
        ]
        
        self.path_traversal_patterns = [
            r"\.\.[\\/]",
            r"\.[\\/]\.[\\/]",
            r"[\\/]\.[\\/]",
            r"[\\/]\.[\\/]\.[\\/]",
            r"%2e%2e[\\/]",
            r"%2e%2e%2f",
            r"..%2f",
            r"..%5c",
            r"\.\.%c0%af",
            r"\.\.%c1%9c"
        ]
        
        self.command_injection_patterns = [
            r"[;&|`$(){}[\]]",
            r"\b(curl|wget|nc|netcat|telnet|ssh|ftp|sftp)\b",
            r"\b(rm|mv|cp|cat|ls|ps|kill|chmod|chown)\b",
            r"\b(python|perl|ruby|bash|sh|cmd|powershell)\b",
            r"\b(echo|printf|cat|type)\b"
        ]
        
        self.compiled_sql_patterns = [re.compile(pattern, re.IGNORECASE) 
                                  for pattern in self.sql_injection_patterns]
        self.compiled_xss_patterns = [re.compile(pattern, re.IGNORECASE | re.DOTALL) 
                                    for pattern in self.xss_patterns]
        self.compiled_path_patterns = [re.compile(pattern, re.IGNORECASE) 
                                     for pattern in self.path_traversal_patterns]
        self.compiled_command_patterns = [re.compile(pattern, re.IGNORECASE) 
                                       for pattern in self.command_injection_patterns]
        
        # Allowed file extensions
        self.allowed_image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'}
        self.allowed_document_extensions = {'.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt'}
        self.allowed_extensions = self.allowed_image_extensions.union(self.allowed_document_extensions)
        
        # Dangerous file extensions
        self.dangerous_extensions = {
            '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
            '.app', '.deb', '.pkg', '.dmg', '.rpm', '.deb', '.msi', '.msp',
            '.msm', '.dll', '.ocx', '.cpl', '.drv', '.sys', '.inf'
        }
        
        self.logger.info("Input validator initialized", component="input_validator")
    
    def validate_string(self, value: str, field_name: str = "input",
                     max_length: int = 1000, min_length: int = 0,
                     allow_empty: bool = False, 
                     allowed_chars: Optional[str] = None) -> ValidationResult:
        """
        Validate string input with comprehensive security checks
        
        Args:
            value: String value to validate
            field_name: Name of the field for error messages
            max_length: Maximum allowed length
            min_length: Minimum allowed length
            allow_empty: Whether empty strings are allowed
            allowed_chars: Optional regex pattern for allowed characters
            
        Returns:
            ValidationResult with validation details
        """
        result = ValidationResult(is_valid=True, sanitized_value=value, 
                               error_messages=[], warning_messages=[], 
                               security_flags=[])
        
        try:
            # Type check
            if not isinstance(value, str):
                result.add_error(f"{field_name} must be a string")
                return result
            
            # Empty check
            if not value.strip():
                if not allow_empty:
                    result.add_error(f"{field_name} cannot be empty")
                else:
                    result.sanitized_value = ""
                return result
            
            # Length check
            if len(value) > max_length:
                result.add_error(f"{field_name} exceeds maximum length of {max_length}")
                result.sanitized_value = value[:max_length]
            
            if len(value) < min_length:
                result.add_error(f"{field_name} is below minimum length of {min_length}")
            
            # Unicode normalization
            normalized_value = unicodedata.normalize('NFKC', value)
            
            # HTML encoding check
            if value != normalized_value:
                result.add_warning(f"{field_name} contains unusual Unicode characters")
                result.sanitized_value = normalized_value
            
            # SQL injection detection
            for i, pattern in enumerate(self.compiled_sql_patterns):
                if pattern.search(normalized_value):
                    result.add_security_flag("SQL_INJECTION")
                    result.add_error(f"{field_name} contains potential SQL injection")
                    break
            
            # XSS detection
            for i, pattern in enumerate(self.compiled_xss_patterns):
                if pattern.search(normalized_value):
                    result.add_security_flag("XSS")
                    result.add_error(f"{field_name} contains potential XSS")
                    break
            
            # Command injection detection
            for i, pattern in enumerate(self.compiled_command_patterns):
                if pattern.search(normalized_value):
                    result.add_security_flag("COMMAND_INJECTION")
                    result.add_error(f"{field_name} contains potential command injection")
                    break
            
            # Allowed characters check
            if allowed_chars:
                if not re.fullmatch(allowed_chars, normalized_value):
                    result.add_error(f"{field_name} contains invalid characters")
            
            # Basic sanitization
            sanitized = html.escape(normalized_value)
            if sanitized != normalized_value:
                result.add_warning(f"{field_name} contained HTML special characters")
                result.sanitized_value = sanitized
            
            # Check for suspicious patterns
            suspicious_patterns = [
                r'\b(admin|root|password|secret|token|key)\b',
                r'\b(test|debug|demo)\b',
                r'[<>"]',
                r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]'  # Control characters
            ]
            
            for pattern in suspicious_patterns:
                if re.search(pattern, normalized_value, re.IGNORECASE):
                    result.add_warning(f"{field_name} contains suspicious pattern")
                    break
            
        except Exception as e:
            result.add_error(f"Validation error for {field_name}: {str(e)}")
            self.logger.error(f"String validation error: {e}", 
                           component="input_validator", field_name=field_name)
        
        return result
    
    def validate_file_path(self, file_path: str, field_name: str = "file_path",
                         base_path: Optional[str] = None,
                         allow_absolute: bool = False,
                         check_existence: bool = False) -> ValidationResult:
        """
        Validate file path with security checks
        
        Args:
            file_path: File path to validate
            field_name: Name of the field for error messages
            base_path: Base directory to restrict paths to
            allow_absolute: Whether absolute paths are allowed
            check_existence: Whether to check if file exists
            
        Returns:
            ValidationResult with validation details
        """
        result = ValidationResult(is_valid=True, sanitized_value=file_path,
                               error_messages=[], warning_messages=[],
                               security_flags=[])
        
        try:
            # Basic string validation
            string_result = self.validate_string(file_path, field_name, max_length=1000)
            if not string_result.is_valid:
                result.error_messages.extend(string_result.error_messages)
                result.is_valid = False
                return result
            
            normalized_path = string_result.sanitized_value
            
            # Path traversal detection
            for pattern in self.compiled_path_patterns:
                if pattern.search(normalized_path):
                    result.add_security_flag("PATH_TRAVERSAL")
                    result.add_error(f"{field_name} contains path traversal attempt")
                    break
            
            # Convert to Path object for validation
            try:
                path_obj = Path(normalized_path)
            except Exception as e:
                result.add_error(f"{field_name} contains invalid path: {str(e)}")
                return result
            
            # Absolute path check
            if path_obj.is_absolute() and not allow_absolute:
                result.add_error(f"{field_name} cannot be an absolute path")
                result.sanitized_value = str(path_obj.relative_to(Path.cwd()))
            
            # Base path restriction
            if base_path:
                base_path_obj = Path(base_path).resolve()
                try:
                    resolved_path = path_obj.resolve()
                    if not str(resolved_path).startswith(str(base_path_obj)):
                        result.add_security_flag("PATH_RESTRICTION_VIOLATION")
                        result.add_error(f"{field_name} is outside allowed directory")
                except Exception:
                    result.add_error(f"{field_name} cannot be resolved to absolute path")
            
            # File extension check
            if path_obj.suffix.lower() in self.dangerous_extensions:
                result.add_security_flag("DANGEROUS_FILE_EXTENSION")
                result.add_error(f"{field_name} has dangerous file extension")
            
            # File existence check
            if check_existence:
                if not path_obj.exists():
                    result.add_error(f"{field_name} does not exist")
                elif not path_obj.is_file():
                    result.add_error(f"{field_name} is not a file")
            
            # Normalize path separators
            normalized_path = str(path_obj).replace('\\', '/')
            result.sanitized_value = normalized_path
            
        except Exception as e:
            result.add_error(f"Path validation error for {field_name}: {str(e)}")
            self.logger.error(f"Path validation error: {e}",
                           component="input_validator", field_name=field_name)
        
        return result
    
    def validate_file_upload(self, file_data: bytes, filename: str,
                          max_size_mb: int = 10, 
                          allowed_extensions: Optional[Set[str]] = None) -> ValidationResult:
        """
        Validate uploaded file with security checks
        
        Args:
            file_data: Raw file data
            filename: Original filename
            max_size_mb: Maximum file size in MB
            allowed_extensions: Set of allowed file extensions
            
        Returns:
            ValidationResult with validation details
        """
        result = ValidationResult(is_valid=True, sanitized_value=filename,
                               error_messages=[], warning_messages=[],
                               security_flags=[])
        
        try:
            # Validate filename
            filename_result = self.validate_string(filename, "filename", max_length=255)
            if not filename_result.is_valid:
                result.error_messages.extend(filename_result.error_messages)
                result.is_valid = False
                return result
            
            # File size check
            file_size = len(file_data)
            max_size_bytes = max_size_mb * 1024 * 1024
            
            if file_size > max_size_bytes:
                result.add_error(f"File size ({file_size / (1024*1024):.1f}MB) exceeds maximum ({max_size_mb}MB)")
            
            if file_size == 0:
                result.add_error("File is empty")
            
            # File extension check
            file_ext = Path(filename).suffix.lower()
            allowed_exts = allowed_extensions or self.allowed_extensions
            
            if file_ext not in allowed_exts:
                result.add_error(f"File extension '{file_ext}' is not allowed")
            
            # Magic number validation (file type detection)
            if file_data:
                detected_type = self._detect_file_type(file_data)
                if detected_type:
                    # Check if detected type matches extension
                    expected_types = {
                        '.jpg': 'jpeg', '.jpeg': 'jpeg', '.png': 'png',
                        '.gif': 'gif', '.pdf': 'pdf', '.txt': 'text'
                    }
                    
                    if file_ext in expected_types:
                        if detected_type != expected_types[file_ext]:
                            result.add_security_flag("FILE_TYPE_MISMATCH")
                            result.add_warning(f"File type mismatch: expected {expected_types[file_ext]}, got {detected_type}")
            
            # Content scanning for malicious patterns
            if self._scan_file_content(file_data):
                result.add_security_flag("MALICIOUS_CONTENT")
                result.add_error("File contains potentially malicious content")
            
        except Exception as e:
            result.add_error(f"File validation error: {str(e)}")
            self.logger.error(f"File validation error: {e}",
                           component="input_validator", filename=filename)
        
        return result
    
    def validate_json_input(self, json_data: Union[str, Dict, List],
                          max_size: int = 1024*1024,  # 1MB
                          required_fields: Optional[List[str]] = None) -> ValidationResult:
        """
        Validate JSON input with security checks
        
        Args:
            json_data: JSON string or parsed object
            max_size: Maximum JSON size in bytes
            required_fields: List of required field names
            
        Returns:
            ValidationResult with validation details
        """
        result = ValidationResult(is_valid=True, sanitized_value=json_data,
                               error_messages=[], warning_messages=[],
                               security_flags=[])
        
        try:
            # Parse JSON if it's a string
            if isinstance(json_data, str):
                # Size check
                if len(json_data.encode('utf-8')) > max_size:
                    result.add_error(f"JSON size exceeds maximum of {max_size} bytes")
                    return result
                
                try:
                    parsed_json = json.loads(json_data)
                except json.JSONDecodeError as e:
                    result.add_error(f"Invalid JSON format: {str(e)}")
                    return result
            else:
                parsed_json = json_data
            
            # Validate structure
            if not isinstance(parsed_json, (dict, list)):
                result.add_error("JSON must be an object or array")
                return result
            
            # Check required fields
            if required_fields and isinstance(parsed_json, dict):
                missing_fields = [field for field in required_fields if field not in parsed_json]
                if missing_fields:
                    result.add_error(f"Missing required fields: {', '.join(missing_fields)}")
            
            # Recursive validation of JSON content
            validation_result = self._validate_json_content(parsed_json)
            if not validation_result[0]:  # is_valid
                result.is_valid = False
                result.error_messages.extend(validation_result[1])
                result.security_flags.extend(validation_result[2])
            
            result.sanitized_value = parsed_json
            
        except Exception as e:
            result.add_error(f"JSON validation error: {str(e)}")
            self.logger.error(f"JSON validation error: {e}",
                           component="input_validator")
        
        return result
    
    def validate_database_input(self, query: str, params: Optional[List] = None,
                             max_length: int = 10000) -> ValidationResult:
        """
        Validate database query and parameters
        
        Args:
            query: SQL query string
            params: Query parameters
            max_length: Maximum query length
            
        Returns:
            ValidationResult with validation details
        """
        result = ValidationResult(is_valid=True, sanitized_value=query,
                               error_messages=[], warning_messages=[],
                               security_flags=[])
        
        try:
            # Basic string validation
            string_result = self.validate_string(query, "query", max_length=max_length)
            if not string_result.is_valid:
                result.error_messages.extend(string_result.error_messages)
                result.is_valid = False
                return result
            
            # Enhanced SQL injection detection
            normalized_query = string_result.sanitized_value.upper()
            
            # Check for dangerous SQL keywords
            dangerous_keywords = [
                'DROP', 'DELETE', 'UPDATE', 'INSERT', 'CREATE', 'ALTER',
                'EXEC', 'EXECUTE', 'UNION', 'SCRIPT', 'XP_CMDSHELL',
                'SP_OACREATE', 'BENCHMARK', 'SLEEP', 'PG_SLEEP'
            ]
            
            for keyword in dangerous_keywords:
                if keyword in normalized_query:
                    result.add_security_flag("DANGEROUS_SQL_KEYWORD")
                    result.add_warning(f"Query contains potentially dangerous keyword: {keyword}")
            
            # Check for multiple statements
            if ';' in normalized_query and normalized_query.count(';') > 1:
                result.add_security_flag("MULTIPLE_STATEMENTS")
                result.add_error("Multiple SQL statements detected")
            
            # Validate parameters
            if params:
                for i, param in enumerate(params):
                    if isinstance(param, str):
                        param_result = self.validate_string(param, f"param_{i}")
                        if not param_result.is_valid:
                            result.error_messages.extend(param_result.error_messages)
                            result.is_valid = False
            
        except Exception as e:
            result.add_error(f"Database validation error: {str(e)}")
            self.logger.error(f"Database validation error: {e}",
                           component="input_validator")
        
        return result
    
    def validate_email(self, email: str, field_name: str = "email") -> ValidationResult:
        """
        Validate email address with security checks
        
        Args:
            email: Email address to validate
            field_name: Name of the field for error messages
            
        Returns:
            ValidationResult with validation details
        """
        result = ValidationResult(is_valid=True, sanitized_value=email,
                               error_messages=[], warning_messages=[],
                               security_flags=[])
        
        try:
            # Basic string validation
            string_result = self.validate_string(email, field_name, max_length=254)
            if not string_result.is_valid:
                result.error_messages.extend(string_result.error_messages)
                result.is_valid = False
                return result
            
            # Email format validation
            email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(email_pattern, email):
                result.add_error(f"{field_name} is not a valid email address")
                return result
            
            # Security checks
            if '..' in email:
                result.add_security_flag("SUSPICIOUS_EMAIL_FORMAT")
                result.add_warning(f"{field_name} contains suspicious email format")
            
            # Check for dangerous characters in email
            dangerous_chars = ['<', '>', '"', "'", ';', '\\', '|']
            for char in dangerous_chars:
                if char in email:
                    result.add_security_flag("DANGEROUS_EMAIL_CHARS")
                    result.add_error(f"{field_name} contains dangerous characters")
                    break
            
        except Exception as e:
            result.add_error(f"Email validation error: {str(e)}")
            self.logger.error(f"Email validation error: {e}",
                           component="input_validator", field_name=field_name)
        
        return result
    
    def _detect_file_type(self, file_data: bytes) -> Optional[str]:
        """Detect file type from magic numbers"""
        if not file_data:
            return None
        
        # Common file signatures
        signatures = {
            b'\xFF\xD8\xFF': 'jpeg',
            b'\x89PNG\r\n\x1A\n': 'png',
            b'GIF87a': 'gif',
            b'GIF89a': 'gif',
            b'%PDF': 'pdf',
            b'PK\x03\x04': 'zip',  # Office documents
            b'\xD0\xCF\x11\xE0': 'ole',  # Old Office documents
        }
        
        for signature, file_type in signatures.items():
            if file_data.startswith(signature):
                return file_type
        
        return None
    
    def _scan_file_content(self, file_data: bytes) -> bool:
        """Scan file content for malicious patterns"""
        try:
            # Convert to string for pattern matching
            content = file_data.decode('utf-8', errors='ignore')
            
            # Check for script content
            script_patterns = [
                r'<script[^>]*>',
                r'javascript:',
                r'vbscript:',
                r'eval\s*\(',
                r'exec\s*\(',
                r'system\s*\('
            ]
            
            for pattern in script_patterns:
                if re.search(pattern, content, re.IGNORECASE):
                    return True
            
            # Check for suspicious content
            suspicious_patterns = [
                r'base64_decode',
                r'shell_exec',
                r'passthru',
                r'file_get_contents',
                r'fopen\s*\(',
                r'fwrite\s*\('
            ]
            
            for pattern in suspicious_patterns:
                if re.search(pattern, content, re.IGNORECASE):
                    return True
            
        except Exception:
            # If we can't decode as text, do binary checks
            pass
        
        return False
    
    def _validate_json_content(self, json_obj: Any, depth: int = 0) -> Tuple[bool, List[str], List[str]]:
        """Recursively validate JSON content"""
        if depth > 10:  # Prevent deep recursion attacks
            return False, ["JSON structure too deep"], ["DEEP_RECURSION"]
        
        errors = []
        flags = []
        
        if isinstance(json_obj, str):
            # Validate string values
            result = self.validate_string(json_obj, "json_string", max_length=10000)
            if not result.is_valid:
                errors.extend(result.error_messages)
                flags.extend(result.security_flags)
        
        elif isinstance(json_obj, dict):
            # Check for too many keys (potential DoS)
            if len(json_obj) > 1000:
                errors.append("JSON object has too many keys")
                flags.append("LARGE_JSON_OBJECT")
            
            # Recursively validate values
            for key, value in json_obj.items():
                if isinstance(key, str):
                    key_result = self.validate_string(key, "json_key", max_length=100)
                    if not key_result.is_valid:
                        errors.extend(key_result.error_messages)
                        flags.extend(key_result.security_flags)
                
                value_result = self._validate_json_content(value, depth + 1)
                if not value_result[0]:
                    errors.extend(value_result[1])
                    flags.extend(value_result[2])
        
        elif isinstance(json_obj, list):
            # Check for too many items (potential DoS)
            if len(json_obj) > 10000:
                errors.append("JSON array has too many items")
                flags.append("LARGE_JSON_ARRAY")
            
            # Recursively validate items
            for item in json_obj:
                item_result = self._validate_json_content(item, depth + 1)
                if not item_result[0]:
                    errors.extend(item_result[1])
                    flags.extend(item_result[2])
        
        return (len(errors) == 0, errors, flags)
    
    def get_validation_summary(self, results: List[ValidationResult]) -> Dict[str, Any]:
        """Get summary of validation results"""
        total_valid = sum(1 for r in results if r.is_valid)
        total_invalid = len(results) - total_valid
        
        all_errors = []
        all_warnings = []
        all_flags = []
        total_risk_score = 0.0
        
        for result in results:
            all_errors.extend(result.error_messages)
            all_warnings.extend(result.warning_messages)
            all_flags.extend(result.security_flags)
            total_risk_score += result.risk_score
        
        return {
            'total_validations': len(results),
            'valid_count': total_valid,
            'invalid_count': total_invalid,
            'validity_rate': (total_valid / len(results) * 100) if results else 0,
            'total_errors': len(all_errors),
            'total_warnings': len(all_warnings),
            'total_security_flags': len(all_flags),
            'average_risk_score': total_risk_score / len(results) if results else 0,
            'unique_security_flags': list(set(all_flags)),
            'most_common_errors': self._get_most_common_items(all_errors),
            'most_common_warnings': self._get_most_common_items(all_warnings),
            'most_common_flags': self._get_most_common_items(all_flags)
        }
    
    def _get_most_common_items(self, items: List[str], limit: int = 5) -> List[Dict[str, Any]]:
        """Get most common items from a list"""
        from collections import Counter
        
        if not items:
            return []
        
        counter = Counter(items)
        return [
            {'item': item, 'count': count}
            for item, count in counter.most_common(limit)
        ]


def create_input_validator(logger: PhotoExtractionLogger) -> InputValidator:
    """Factory function to create input validator"""
    return InputValidator(logger)


# Specialized validators for specific use cases

class PhotoExtractionValidator(InputValidator):
    """Specialized validator for photo extraction operations"""
    
    def validate_photo_id(self, photo_id: str) -> ValidationResult:
        """Validate photo ID format"""
        result = self.validate_string(photo_id, "photo_id", max_length=50, min_length=1)
        
        if result.is_valid:
            # Check for valid ID patterns
            id_patterns = [
                r'^candidate_\d+$',
                r'^employee_\d+$',
                r'^UNS-\d+$',
                r'^\d+$'
            ]
            
            if not any(re.match(pattern, photo_id) for pattern in id_patterns):
                result.add_warning("Photo ID format is unusual")
        
        return result
    
    def validate_database_path(self, db_path: str) -> ValidationResult:
        """Validate database file path"""
        result = self.validate_file_path(
            db_path, "database_path", 
            allow_absolute=True, check_existence=True
        )
        
        if result.is_valid:
            # Check for Access database extensions
            allowed_extensions = {'.accdb', '.mdb'}
            file_ext = Path(db_path).suffix.lower()
            
            if file_ext not in allowed_extensions:
                result.add_error("Database file must be .accdb or .mdb")
        
        return result


def create_photo_extraction_validator(logger: PhotoExtractionLogger) -> PhotoExtractionValidator:
    """Factory function to create photo extraction validator"""
    return PhotoExtractionValidator(logger)