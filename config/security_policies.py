"""
Security Policies Module
UNS-CLAUDEJP 5.4 - Production Security Hardening

This module defines comprehensive security policies, compliance requirements,
and security controls for the production environment.
"""

import os
import re
import hashlib
import secrets
from typing import Dict, Any, List, Optional, Set, Tuple
from dataclasses import dataclass
from enum import Enum
from datetime import datetime, timedelta
import ipaddress

from .production_config import SecurityLevel


class PolicyType(Enum):
    """Types of security policies"""
    AUTHENTICATION = "authentication"
    AUTHORIZATION = "authorization"
    DATA_PROTECTION = "data_protection"
    NETWORK_SECURITY = "network_security"
    ACCESS_CONTROL = "access_control"
    AUDIT_LOGGING = "audit_logging"
    INCIDENT_RESPONSE = "incident_response"
    COMPLIANCE = "compliance"


class ComplianceStandard(Enum):
    """Compliance standards"""
    GDPR = "gdpr"
    ISO27001 = "iso27001"
    SOC2 = "soc2"
    PCI_DSS = "pci_dss"
    HIPAA = "hipaa"
    J_SOX = "j_sox"


@dataclass
class PasswordPolicy:
    """Password security policy"""
    min_length: int = 12
    max_length: int = 128
    require_uppercase: bool = True
    require_lowercase: bool = True
    require_numbers: bool = True
    require_special_chars: bool = True
    forbidden_patterns: List[str] = None
    forbidden_common_passwords: List[str] = None
    password_history_count: int = 12
    max_age_days: int = 90
    failed_attempts_lockout: int = 5
    lockout_duration_minutes: int = 30
    complexity_score_threshold: float = 0.7
    
    def __post_init__(self):
        if self.forbidden_patterns is None:
            self.forbidden_patterns = [
                r'.*password.*',
                r'.*123.*',
                r'.*qwerty.*',
                r'.*admin.*',
                r'.*uns.*',
                r'.*claude.*',
                r'(.)\1{2,}',  # Repeated characters
                r'.*(012|123|234|345|456|567|678|789|890).*'  # Sequential numbers
            ]
        
        if self.forbidden_common_passwords is None:
            self.forbidden_common_passwords = [
                'password', '123456', 'password123', 'admin', 'qwerty',
                'letmein', 'welcome', 'monkey', 'dragon', 'master',
                'sunshine', 'iloveyou', 'football', 'baseball'
            ]
    
    def validate_password(self, password: str, username: Optional[str] = None) -> Tuple[bool, List[str]]:
        """
        Validate password against policy
        
        Args:
            password: Password to validate
            username: Optional username for additional checks
            
        Returns:
            Tuple of (is_valid, error_messages)
        """
        errors = []
        
        # Length check
        if len(password) < self.min_length:
            errors.append(f"Password must be at least {self.min_length} characters long")
        
        if len(password) > self.max_length:
            errors.append(f"Password must not exceed {self.max_length} characters")
        
        # Character requirements
        if self.require_uppercase and not re.search(r'[A-Z]', password):
            errors.append("Password must contain at least one uppercase letter")
        
        if self.require_lowercase and not re.search(r'[a-z]', password):
            errors.append("Password must contain at least one lowercase letter")
        
        if self.require_numbers and not re.search(r'\d', password):
            errors.append("Password must contain at least one number")
        
        if self.require_special_chars and not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            errors.append("Password must contain at least one special character")
        
        # Forbidden patterns
        for pattern in self.forbidden_patterns:
            if re.search(pattern, password, re.IGNORECASE):
                errors.append("Password contains forbidden pattern")
                break
        
        # Common passwords
        if password.lower() in self.forbidden_common_passwords:
            errors.append("Password is too common")
        
        # Username similarity
        if username and len(username) >= 3:
            username_lower = username.lower()
            password_lower = password.lower()
            
            if username_lower in password_lower:
                errors.append("Password cannot contain username")
            
            # Check for partial username matches
            for i in range(len(username_lower) - 2):
                substring = username_lower[i:i+3]
                if substring in password_lower:
                    errors.append("Password cannot contain parts of username")
                    break
        
        # Calculate complexity score
        complexity_score = self._calculate_complexity(password)
        if complexity_score < self.complexity_score_threshold:
            errors.append(f"Password complexity score ({complexity_score:.2f}) is below threshold ({self.complexity_score_threshold})")
        
        return (len(errors) == 0, errors)
    
    def _calculate_complexity(self, password: str) -> float:
        """Calculate password complexity score"""
        score = 0.0
        
        # Length component (0-0.3)
        length_score = min(len(password) / 20.0, 1.0) * 0.3
        score += length_score
        
        # Character variety (0-0.4)
        char_types = 0
        if re.search(r'[a-z]', password):
            char_types += 1
        if re.search(r'[A-Z]', password):
            char_types += 1
        if re.search(r'\d', password):
            char_types += 1
        if re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            char_types += 1
        
        variety_score = (char_types / 4.0) * 0.4
        score += variety_score
        
        # Entropy component (0-0.3)
        unique_chars = len(set(password))
        entropy_score = min(unique_chars / len(password), 1.0) * 0.3
        score += entropy_score
        
        return score


@dataclass
class AccessControlPolicy:
    """Access control security policy"""
    principle_of_least_privilege: bool = True
    role_based_access: bool = True
    mandatory_access_control: bool = True
    discretionary_access_control: bool = False
    session_timeout_minutes: int = 30
    concurrent_sessions_limit: int = 3
    ip_whitelist_enabled: bool = True
    ip_whitelist: List[str] = None
    ip_blacklist_enabled: bool = True
    ip_blacklist: List[str] = None
    time_based_access: bool = True
    allowed_access_hours: Tuple[int, int] = (9, 17)  # 9 AM to 5 PM
    geo_restrictions_enabled: bool = False
    allowed_countries: List[str] = None
    device_fingerprinting: bool = True
    multi_factor_required: bool = True
    privileged_access_approval: bool = True
    emergency_access_procedures: bool = True
    
    def __post_init__(self):
        if self.ip_whitelist is None:
            self.ip_whitelist = [
                '192.168.0.0/16',
                '10.0.0.0/8',
                '172.16.0.0/12',
                '127.0.0.0/8'
            ]
        
        if self.ip_blacklist is None:
            self.ip_blacklist = [
                '0.0.0.0/8',      # Reserved
                '169.254.0.0/16', # Link-local
                '224.0.0.0/4'     # Multicast
            ]
        
        if self.allowed_countries is None:
            self.allowed_countries = ['JP', 'US']  # Japan and US
    
    def is_ip_allowed(self, ip_address: str) -> Tuple[bool, str]:
        """
        Check if IP address is allowed
        
        Args:
            ip_address: IP address to check
            
        Returns:
            Tuple of (is_allowed, reason)
        """
        try:
            ip_obj = ipaddress.ip_address(ip_address)
            
            # Check blacklist first
            if self.ip_blacklist_enabled:
                for blocked_network in self.ip_blacklist:
                    if ip_obj in ipaddress.ip_network(blocked_network):
                        return (False, f"IP address {ip_address} is in blacklist")
            
            # Check whitelist
            if self.ip_whitelist_enabled:
                for allowed_network in self.ip_whitelist:
                    if ip_obj in ipaddress.ip_network(allowed_network):
                        return (True, f"IP address {ip_address} is in whitelist")
                
                return (False, f"IP address {ip_address} is not in whitelist")
            
            return (True, "IP address is allowed")
        
        except ValueError:
            return (False, f"Invalid IP address: {ip_address}")
    
    def is_time_allowed(self, current_time: datetime = None) -> Tuple[bool, str]:
        """
        Check if current time is within allowed access hours
        
        Args:
            current_time: Current time (defaults to now)
            
        Returns:
            Tuple of (is_allowed, reason)
        """
        if not self.time_based_access:
            return (True, "Time-based access is disabled")
        
        if current_time is None:
            current_time = datetime.now()
        
        current_hour = current_time.hour
        start_hour, end_hour = self.allowed_access_hours
        
        if start_hour <= end_hour:
            # Same day range (e.g., 9 AM to 5 PM)
            is_allowed = start_hour <= current_hour < end_hour
        else:
            # Overnight range (e.g., 10 PM to 6 AM)
            is_allowed = current_hour >= start_hour or current_hour < end_hour
        
        if is_allowed:
            return (True, f"Current time {current_hour}:00 is within allowed hours")
        else:
            return (False, f"Current time {current_hour}:00 is outside allowed hours ({start_hour}:00 to {end_hour}:00)")


@dataclass
class DataProtectionPolicy:
    """Data protection security policy"""
    encryption_at_rest: bool = True
    encryption_in_transit: bool = True
    encryption_algorithm: str = "AES-256-GCM"
    key_management: str = "centralized"
    data_classification: bool = True
    retention_policy: bool = True
    data_minimization: bool = True
    anonymization_enabled: bool = True
    pseudonymization_enabled: bool = True
    data_loss_prevention: bool = True
    backup_encryption: bool = True
    secure_deletion: bool = True
    data_masking: bool = True
    field_level_encryption: bool = True
    
    # Data retention periods (in days)
    personal_data_retention_days: int = 2555  # 7 years
    financial_data_retention_days: int = 2555  # 7 years
    audit_log_retention_days: int = 2555  # 7 years
    system_log_retention_days: int = 365   # 1 year
    
    # Data classification levels
    classification_levels: List[str] = None
    
    def __post_init__(self):
        if self.classification_levels is None:
            self.classification_levels = [
                'PUBLIC',
                'INTERNAL',
                'CONFIDENTIAL',
                'RESTRICTED',
                'TOP_SECRET'
            ]
    
    def get_retention_period(self, data_type: str) -> int:
        """Get retention period for data type"""
        retention_mapping = {
            'personal_data': self.personal_data_retention_days,
            'financial_data': self.financial_data_retention_days,
            'audit_log': self.audit_log_retention_days,
            'system_log': self.system_log_retention_days
        }
        
        return retention_mapping.get(data_type, 365)  # Default to 1 year
    
    def requires_encryption(self, data_classification: str) -> bool:
        """Check if data classification requires encryption"""
        high_risk_classifications = ['CONFIDENTIAL', 'RESTRICTED', 'TOP_SECRET']
        return data_classification in high_risk_classifications


@dataclass
class NetworkSecurityPolicy:
    """Network security policy"""
    firewall_enabled: bool = True
    intrusion_detection: bool = True
    intrusion_prevention: bool = True
    ddos_protection: bool = True
    ssl_tls_required: bool = True
    min_tls_version: str = "TLSv1.2"
    allowed_ciphers: List[str] = None
    certificate_pinning: bool = True
    network_segmentation: bool = True
    vpn_required: bool = True
    wireless_security: str = "WPA3"  # WPA3, WPA2, WPA, WEP
    port_security: bool = True
    closed_ports_by_default: bool = True
    
    def __post_init__(self):
        if self.allowed_ciphers is None:
            self.allowed_ciphers = [
                'TLS_AES_256_GCM_SHA384',
                'TLS_CHACHA20_POLY1305_SHA256',
                'TLS_AES_128_GCM_SHA256',
                'TLS_AES_256_CBC_SHA256'
            ]
    
    def is_cipher_allowed(self, cipher: str) -> bool:
        """Check if cipher is allowed"""
        return cipher in self.allowed_ciphers
    
    def is_tls_version_allowed(self, version: str) -> bool:
        """Check if TLS version is allowed"""
        version_mapping = {
            'SSLv2': 0.0,
            'SSLv3': 0.0,
            'TLSv1.0': 0.0,
            'TLSv1.1': 0.0,
            'TLSv1.2': 1.0,
            'TLSv1.3': 1.0
        }
        
        min_version_score = version_mapping.get(self.min_tls_version, 1.0)
        current_version_score = version_mapping.get(version, 0.0)
        
        return current_version_score >= min_version_score


@dataclass
class AuditLoggingPolicy:
    """Audit logging security policy"""
    log_all_access: bool = True
    log_all_modifications: bool = True
    log_authentication_events: bool = True
    log_authorization_events: bool = True
    log_system_events: bool = True
    log_security_events: bool = True
    log_data_access: bool = True
    log_privileged_operations: bool = True
    tamper_evident_logs: bool = True
    log_integrity_verification: bool = True
    centralized_logging: bool = True
    log_backup: bool = True
    log_encryption: bool = True
    real_time_monitoring: bool = True
    alert_on_anomalies: bool = True
    
    # Log retention
    security_log_retention_days: int = 2555  # 7 years
    access_log_retention_days: int = 1095   # 3 years
    system_log_retention_days: int = 365    # 1 year
    
    # Alert thresholds
    failed_login_threshold: int = 5
    failed_login_window_minutes: int = 15
    privileged_access_threshold: int = 10
    privileged_access_window_hours: int = 24
    data_export_threshold: int = 1000
    data_export_window_hours: int = 1
    
    def get_log_retention_days(self, log_type: str) -> int:
        """Get retention period for log type"""
        retention_mapping = {
            'security': self.security_log_retention_days,
            'access': self.access_log_retention_days,
            'system': self.system_log_retention_days
        }
        
        return retention_mapping.get(log_type, 365)  # Default to 1 year


@dataclass
class IncidentResponsePolicy:
    """Incident response security policy"""
    incident_classification_levels: List[str] = None
    response_time_objectives: Dict[str, int] = None
    escalation_procedures: bool = True
    incident_reporting: bool = True
    forensic_preservation: bool = True
    communication_procedures: bool = True
    recovery_procedures: bool = True
    post_incident_review: bool = True
    incident_response_team: List[str] = None
    external_reporting_required: bool = True
    regulatory_reporting_timeframe_hours: int = 72
    
    def __post_init__(self):
        if self.incident_classification_levels is None:
            self.incident_classification_levels = [
                'LOW',
                'MEDIUM',
                'HIGH',
                'CRITICAL'
            ]
        
        if self.response_time_objectives is None:
            self.response_time_objectives = {
                'LOW': 72,      # 72 hours
                'MEDIUM': 24,    # 24 hours
                'HIGH': 8,       # 8 hours
                'CRITICAL': 1     # 1 hour
            }
        
        if self.incident_response_team is None:
            self.incident_response_team = [
                'security_manager',
                'system_administrator',
                'network_engineer',
                'database_administrator',
                'legal_counsel',
                'communications_officer'
            ]
    
    def get_response_time_objective(self, severity: str) -> int:
        """Get response time objective for severity level"""
        return self.response_time_objectives.get(severity.upper(), 24)


@dataclass
class CompliancePolicy:
    """Compliance security policy"""
    applicable_standards: List[ComplianceStandard] = None
    gdpr_compliance: bool = True
    data_protection_officer_required: bool = True
    privacy_impact_assessment: bool = True
    data_breach_notification: bool = True
    consent_management: bool = True
    data_subject_rights: bool = True
    cross_border_data_transfers: bool = True
    vendor_risk_management: bool = True
    regular_audits: bool = True
    compliance_reporting: bool = True
    documentation_requirements: bool = True
    
    def __post_init__(self):
        if self.applicable_standards is None:
            self.applicable_standards = [
                ComplianceStandard.GDPR,
                ComplianceStandard.ISO27001,
                ComplianceStandard.J_SOX
            ]
    
    def is_standard_applicable(self, standard: ComplianceStandard) -> bool:
        """Check if compliance standard is applicable"""
        return standard in self.applicable_standards
    
    def get_compliance_requirements(self, standard: ComplianceStandard) -> List[str]:
        """Get compliance requirements for standard"""
        requirements_mapping = {
            ComplianceStandard.GDPR: [
                'lawful_basis_for_processing',
                'data_minimization',
                'accuracy',
                'storage_limitation',
                'security',
                'accountability',
                'data_subject_rights',
                'breach_notification',
                'data_protection_officer',
                'international_transfers'
            ],
            ComplianceStandard.ISO27001: [
                'information_security_policies',
                'risk_assessment',
                'security_objectives',
                'asset_management',
                'access_control',
                'cryptography',
                'physical_security',
                'operations_security',
                'communications_security',
                'system_acquisition',
                'supplier_relationships',
                'incident_management',
                'business_continuity',
                'compliance'
            ],
            ComplianceStandard.J_SOX: [
                'internal_controls',
                'financial_reporting_accuracy',
                'audit_trail',
                'access_controls',
                'management_assessment',
                'external_auditor_review',
                'disclosure_controls',
                'monitoring_controls'
            ]
        }
        
        return requirements_mapping.get(standard, [])


class SecurityPolicyManager:
    """Manager for all security policies"""
    
    def __init__(self, security_level: SecurityLevel = SecurityLevel.HIGH):
        self.security_level = security_level
        
        # Initialize all policies
        self.password_policy = PasswordPolicy()
        self.access_control_policy = AccessControlPolicy()
        self.data_protection_policy = DataProtectionPolicy()
        self.network_security_policy = NetworkSecurityPolicy()
        self.audit_logging_policy = AuditLoggingPolicy()
        self.incident_response_policy = IncidentResponsePolicy()
        self.compliance_policy = CompliancePolicy()
        
        # Apply security level overrides
        self._apply_security_level_overrides()
    
    def _apply_security_level_overrides(self):
        """Apply security level specific overrides"""
        if self.security_level == SecurityLevel.CRITICAL:
            # Critical security level - maximum restrictions
            self.password_policy.min_length = 16
            self.password_policy.complexity_score_threshold = 0.8
            self.password_policy.max_age_days = 60
            
            self.access_control_policy.session_timeout_minutes = 15
            self.access_control_policy.concurrent_sessions_limit = 1
            self.access_control_policy.multi_factor_required = True
            
            self.data_protection_policy.encryption_algorithm = "AES-256-GCM"
            self.data_protection_policy.field_level_encryption = True
            
            self.audit_logging_policy.real_time_monitoring = True
            self.audit_logging_policy.tamper_evident_logs = True
            
            self.network_security_policy.min_tls_version = "TLSv1.3"
            
        elif self.security_level == SecurityLevel.HIGH:
            # High security level - strong restrictions
            self.password_policy.min_length = 12
            self.password_policy.complexity_score_threshold = 0.7
            self.password_policy.max_age_days = 90
            
            self.access_control_policy.session_timeout_minutes = 30
            self.access_control_policy.concurrent_sessions_limit = 3
            self.access_control_policy.multi_factor_required = True
            
            self.data_protection_policy.encryption_algorithm = "AES-256-GCM"
            
            self.audit_logging_policy.real_time_monitoring = True
            
            self.network_security_policy.min_tls_version = "TLSv1.2"
            
        elif self.security_level == SecurityLevel.MEDIUM:
            # Medium security level - moderate restrictions
            self.password_policy.min_length = 10
            self.password_policy.complexity_score_threshold = 0.6
            self.password_policy.max_age_days = 180
            
            self.access_control_policy.session_timeout_minutes = 60
            self.access_control_policy.concurrent_sessions_limit = 5
            self.access_control_policy.multi_factor_required = False
            
            self.data_protection_policy.encryption_algorithm = "AES-256-CBC"
            
            self.network_security_policy.min_tls_version = "TLSv1.2"
            
        elif self.security_level == SecurityLevel.LOW:
            # Low security level - basic restrictions
            self.password_policy.min_length = 8
            self.password_policy.complexity_score_threshold = 0.5
            self.password_policy.max_age_days = 365
            
            self.access_control_policy.session_timeout_minutes = 120
            self.access_control_policy.concurrent_sessions_limit = 10
            self.access_control_policy.multi_factor_required = False
            
            self.data_protection_policy.encryption_algorithm = "AES-128-CBC"
            
            self.network_security_policy.min_tls_version = "TLSv1.1"
    
    def validate_all_policies(self) -> Dict[str, Any]:
        """Validate all security policies"""
        validation_results = {
            'password_policy': self._validate_password_policy(),
            'access_control_policy': self._validate_access_control_policy(),
            'data_protection_policy': self._validate_data_protection_policy(),
            'network_security_policy': self._validate_network_security_policy(),
            'audit_logging_policy': self._validate_audit_logging_policy(),
            'incident_response_policy': self._validate_incident_response_policy(),
            'compliance_policy': self._validate_compliance_policy()
        }
        
        # Overall validation status
        all_valid = all(result['valid'] for result in validation_results.values())
        validation_results['overall_valid'] = all_valid
        validation_results['security_level'] = self.security_level.value
        validation_results['validation_timestamp'] = datetime.now().isoformat()
        
        return validation_results
    
    def _validate_password_policy(self) -> Dict[str, Any]:
        """Validate password policy"""
        issues = []
        
        if self.password_policy.min_length < 8:
            issues.append("Password minimum length should be at least 8 characters")
        
        if self.password_policy.max_age_days > 365:
            issues.append("Password maximum age should not exceed 365 days")
        
        if self.password_policy.failed_attempts_lockout < 3:
            issues.append("Failed login attempts lockout should be at least 3")
        
        if self.password_policy.lockout_duration_minutes < 5:
            issues.append("Lockout duration should be at least 5 minutes")
        
        return {
            'valid': len(issues) == 0,
            'issues': issues
        }
    
    def _validate_access_control_policy(self) -> Dict[str, Any]:
        """Validate access control policy"""
        issues = []
        
        if self.access_control_policy.session_timeout_minutes > 120:
            issues.append("Session timeout should not exceed 120 minutes")
        
        if self.access_control_policy.concurrent_sessions_limit > 10:
            issues.append("Concurrent sessions limit should not exceed 10")
        
        if not self.access_control_policy.principle_of_least_privilege:
            issues.append("Principle of least privilege should be enabled")
        
        return {
            'valid': len(issues) == 0,
            'issues': issues
        }
    
    def _validate_data_protection_policy(self) -> Dict[str, Any]:
        """Validate data protection policy"""
        issues = []
        
        if not self.data_protection_policy.encryption_at_rest:
            issues.append("Encryption at rest should be enabled")
        
        if not self.data_protection_policy.encryption_in_transit:
            issues.append("Encryption in transit should be enabled")
        
        if self.data_protection_policy.personal_data_retention_days > 2555:  # 7 years
            issues.append("Personal data retention should not exceed 7 years")
        
        return {
            'valid': len(issues) == 0,
            'issues': issues
        }
    
    def _validate_network_security_policy(self) -> Dict[str, Any]:
        """Validate network security policy"""
        issues = []
        
        if not self.network_security_policy.firewall_enabled:
            issues.append("Firewall should be enabled")
        
        if not self.network_security_policy.ssl_tls_required:
            issues.append("SSL/TLS should be required")
        
        if self.network_security_policy.min_tls_version in ['SSLv2', 'SSLv3', 'TLSv1.0', 'TLSv1.1']:
            issues.append("TLS version should be at least TLSv1.2")
        
        return {
            'valid': len(issues) == 0,
            'issues': issues
        }
    
    def _validate_audit_logging_policy(self) -> Dict[str, Any]:
        """Validate audit logging policy"""
        issues = []
        
        if not self.audit_logging_policy.log_all_access:
            issues.append("All access should be logged")
        
        if not self.audit_logging_policy.log_all_modifications:
            issues.append("All modifications should be logged")
        
        if not self.audit_logging_policy.tamper_evident_logs:
            issues.append("Logs should be tamper-evident")
        
        if self.audit_logging_policy.security_log_retention_days < 1095:  # 3 years
            issues.append("Security logs should be retained for at least 3 years")
        
        return {
            'valid': len(issues) == 0,
            'issues': issues
        }
    
    def _validate_incident_response_policy(self) -> Dict[str, Any]:
        """Validate incident response policy"""
        issues = []
        
        if not self.incident_response_policy.escalation_procedures:
            issues.append("Escalation procedures should be defined")
        
        if not self.incident_response_policy.incident_reporting:
            issues.append("Incident reporting procedures should be defined")
        
        if not self.incident_response_policy.recovery_procedures:
            issues.append("Recovery procedures should be defined")
        
        if self.incident_response_policy.regulatory_reporting_timeframe_hours > 72:
            issues.append("Regulatory reporting timeframe should not exceed 72 hours")
        
        return {
            'valid': len(issues) == 0,
            'issues': issues
        }
    
    def _validate_compliance_policy(self) -> Dict[str, Any]:
        """Validate compliance policy"""
        issues = []
        
        if not self.incident_response_policy.regular_audits:
            issues.append("Regular audits should be conducted")
        
        if not self.incident_response_policy.documentation_requirements:
            issues.append("Documentation requirements should be defined")
        
        return {
            'valid': len(issues) == 0,
            'issues': issues
        }
    
    def get_policy_summary(self) -> Dict[str, Any]:
        """Get summary of all security policies"""
        return {
            'security_level': self.security_level.value,
            'password_policy': {
                'min_length': self.password_policy.min_length,
                'require_complexity': True,
                'max_age_days': self.password_policy.max_age_days,
                'failed_attempts_lockout': self.password_policy.failed_attempts_lockout
            },
            'access_control': {
                'session_timeout_minutes': self.access_control_policy.session_timeout_minutes,
                'multi_factor_required': self.access_control_policy.multi_factor_required,
                'ip_restrictions': self.access_control_policy.ip_whitelist_enabled,
                'time_based_access': self.access_control_policy.time_based_access
            },
            'data_protection': {
                'encryption_at_rest': self.data_protection_policy.encryption_at_rest,
                'encryption_in_transit': self.data_protection_policy.encryption_in_transit,
                'encryption_algorithm': self.data_protection_policy.encryption_algorithm,
                'data_classification': self.data_protection_policy.data_classification
            },
            'network_security': {
                'firewall_enabled': self.network_security_policy.firewall_enabled,
                'min_tls_version': self.network_security_policy.min_tls_version,
                'intrusion_detection': self.network_security_policy.intrusion_detection
            },
            'audit_logging': {
                'real_time_monitoring': self.audit_logging_policy.real_time_monitoring,
                'tamper_evident_logs': self.audit_logging_policy.tamper_evident_logs,
                'log_retention_days': self.audit_logging_policy.security_log_retention_days
            },
            'compliance': {
                'applicable_standards': [s.value for s in self.compliance_policy.applicable_standards],
                'gdpr_compliance': self.compliance_policy.gdpr_compliance,
                'regular_audits': self.compliance_policy.regular_audits
            }
        }


def create_security_policy_manager(security_level: SecurityLevel = SecurityLevel.HIGH) -> SecurityPolicyManager:
    """Factory function to create security policy manager"""
    return SecurityPolicyManager(security_level)


def load_security_policies_from_config(config_path: str) -> SecurityPolicyManager:
    """Load security policies from configuration file"""
    import json
    
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            config_data = json.load(f)
        
        security_level = SecurityLevel(config_data.get('security_level', 'high'))
        manager = create_security_policy_manager(security_level)
        
        # Apply configuration overrides
        if 'password_policy' in config_data:
            password_config = config_data['password_policy']
            for key, value in password_config.items():
                if hasattr(manager.password_policy, key):
                    setattr(manager.password_policy, key, value)
        
        # Apply other policy overrides similarly...
        
        return manager
    
    except Exception as e:
        # Return default manager on error
        return create_security_policy_manager()