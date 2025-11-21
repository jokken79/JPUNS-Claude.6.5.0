"""
Security Module
UNS-CLAUDEJP 5.4 - Production Security Hardening

This module provides comprehensive security components including:
- Credential management with secure storage
- Input validation and sanitization
- Security audit logging with tamper detection
- Encryption utilities for data protection
"""

from .credential_manager import (
    CredentialManager,
    DatabaseCredentialManager,
    create_credential_manager,
    create_database_credential_manager
)

from .input_validator import (
    InputValidator,
    PhotoExtractionValidator,
    ValidationResult,
    create_input_validator,
    create_photo_extraction_validator
)

from .audit_logger import (
    SecurityAuditLogger,
    AuditEvent,
    AuditEventType,
    AuditSeverity,
    AuditConfiguration,
    create_security_audit_logger
)

from .encryption_utils import (
    EncryptionManager,
    PhotoEncryptionManager,
    EncryptionResult,
    DecryptionResult,
    KeyMetadata,
    create_encryption_manager,
    create_photo_encryption_manager
)

__all__ = [
    # Credential Management
    'CredentialManager',
    'DatabaseCredentialManager',
    'create_credential_manager',
    'create_database_credential_manager',
    
    # Input Validation
    'InputValidator',
    'PhotoExtractionValidator',
    'ValidationResult',
    'create_input_validator',
    'create_photo_extraction_validator',
    
    # Audit Logging
    'SecurityAuditLogger',
    'AuditEvent',
    'AuditEventType',
    'AuditSeverity',
    'AuditConfiguration',
    'create_security_audit_logger',
    
    # Encryption Utilities
    'EncryptionManager',
    'PhotoEncryptionManager',
    'EncryptionResult',
    'DecryptionResult',
    'KeyMetadata',
    'create_encryption_manager',
    'create_photo_encryption_manager'
]

# Version information
__version__ = "1.0.0"
__author__ = "UNS-CLAUDEJP Security Team"
__description__ = "Enterprise-grade security components for UNS-CLAUDEJP 5.4"