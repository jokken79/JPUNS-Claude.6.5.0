#!/usr/bin/env python3
"""
Integration Validation Script
UNS-CLAUDEJP 5.4 - Production Security Hardening

This script validates the integration of all security components,
ensuring they work together correctly in a production environment.
"""

import sys
import os
import json
import argparse
import importlib
import traceback
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path
from datetime import datetime

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'backend'))

try:
    from backend.security import (
        create_credential_manager,
        create_input_validator,
        create_security_audit_logger,
        create_encryption_manager,
        create_photo_encryption_manager
    )
    from backend.utils.logging_utils import create_logger
    from config.production_config import load_production_config
    from config.security_policies import create_security_policy_manager
except ImportError as e:
    print(f"Error importing modules: {e}")
    sys.exit(1)


class IntegrationValidator:
    """Validator for security component integration"""
    
    def __init__(self):
        self.logger = create_logger("integration_validator")
        self.validation_results: Dict[str, Any] = {}
        self.errors: List[str] = []
        self.warnings: List[str] = []
    
    def validate_all(self) -> Dict[str, Any]:
        """Validate all security components and their integration"""
        self.logger.info("Starting integration validation", component="integration_validator")
        
        # Validate module imports
        self._validate_module_imports()
        
        # Validate configuration
        self._validate_configuration()
        
        # Validate security components
        self._validate_credential_manager()
        self._validate_input_validator()
        self._validate_audit_logger()
        self._validate_encryption_manager()
        self._validate_photo_encryption_manager()
        
        # Validate security policies
        self._validate_security_policies()
        
        # Validate integration scenarios
        self._validate_integration_scenarios()
        
        # Compile results
        self._compile_results()
        
        self.logger.info("Integration validation completed", component="integration_validator")
        
        return self.validation_results
    
    def _validate_module_imports(self):
        """Validate that all security modules can be imported"""
        self.logger.info("Validating module imports", component="integration_validator")
        
        result = {
            'status': 'success',
            'errors': [],
            'warnings': []
        }
        
        try:
            # Test credential manager import
            importlib.import_module('backend.security.credential_manager')
        except ImportError as e:
            result['status'] = 'error'
            result['errors'].append(f"Failed to import credential_manager: {e}")
        
        try:
            # Test input validator import
            importlib.import_module('backend.security.input_validator')
        except ImportError as e:
            result['status'] = 'error'
            result['errors'].append(f"Failed to import input_validator: {e}")
        
        try:
            # Test audit logger import
            importlib.import_module('backend.security.audit_logger')
        except ImportError as e:
            result['status'] = 'error'
            result['errors'].append(f"Failed to import audit_logger: {e}")
        
        try:
            # Test encryption utils import
            importlib.import_module('backend.security.encryption_utils')
        except ImportError as e:
            result['status'] = 'error'
            result['errors'].append(f"Failed to import encryption_utils: {e}")
        
        self.validation_results['module_imports'] = result
        
        if result['status'] == 'error':
            self.errors.extend(result['errors'])
    
    def _validate_configuration(self):
        """Validate production configuration"""
        self.logger.info("Validating production configuration", component="integration_validator")
        
        result = {
            'status': 'success',
            'errors': [],
            'warnings': []
        }
        
        try:
            # Load production config
            config = load_production_config()
            
            # Validate required settings
            if not hasattr(config, 'security'):
                result['status'] = 'error'
                result['errors'].append("Security configuration not found")
            
            if not hasattr(config, 'logging'):
                result['status'] = 'error'
                result['errors'].append("Logging configuration not found")
            
            # Validate security settings
            if hasattr(config, 'security'):
                security = config.security
                
                if not security.enable_authentication:
                    result['warnings'].append("Authentication is disabled")
                
                if not security.enable_audit_logging:
                    result['warnings'].append("Audit logging is disabled")
                
                if not security.enable_encryption:
                    result['warnings'].append("Encryption is disabled")
            
            # Validate logging settings
            if hasattr(config, 'logging'):
                logging = config.logging
                
                if not logging.enable_file_logging:
                    result['warnings'].append("File logging is disabled")
                
                if logging.level not in ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']:
                    result['warnings'].append(f"Invalid log level: {logging.level}")
        
        except Exception as e:
            result['status'] = 'error'
            result['errors'].append(f"Configuration validation failed: {e}")
        
        self.validation_results['configuration'] = result
        
        if result['status'] == 'error':
            self.errors.extend(result['errors'])
        else:
            self.warnings.extend(result['warnings'])
    
    def _validate_credential_manager(self):
        """Validate credential manager functionality"""
        self.logger.info("Validating credential manager", component="integration_validator")
        
        result = {
            'status': 'success',
            'errors': [],
            'warnings': []
        }
        
        try:
            # Create credential manager
            cred_manager = create_credential_manager(self.logger)
            
            # Test credential storage
            test_name = "integration_test_credential"
            test_data = {"test": "data"}
            
            store_result = cred_manager.store_credential(test_name, test_data)
            if not store_result:
                result['status'] = 'error'
                result['errors'].append("Failed to store test credential")
            
            # Test credential retrieval
            retrieved_data = cred_manager.retrieve_credential(test_name)
            if not retrieved_data or retrieved_data.get("test") != "data":
                result['status'] = 'error'
                result['errors'].append("Failed to retrieve test credential")
            
            # Test credential deletion
            delete_result = cred_manager.delete_credential(test_name)
            if not delete_result:
                result['warnings'].append("Failed to delete test credential")
            
            # Test credential listing
            credentials = cred_manager.list_credentials()
            if not isinstance(credentials, dict):
                result['status'] = 'error'
                result['errors'].append("Credential listing returned invalid type")
            
            # Test credential statistics
            stats = cred_manager.get_credential_stats()
            if not isinstance(stats, dict):
                result['warnings'].append("Credential statistics returned invalid type")
        
        except Exception as e:
            result['status'] = 'error'
            result['errors'].append(f"Credential manager validation failed: {e}")
        
        self.validation_results['credential_manager'] = result
        
        if result['status'] == 'error':
            self.errors.extend(result['errors'])
        else:
            self.warnings.extend(result['warnings'])
    
    def _validate_input_validator(self):
        """Validate input validator functionality"""
        self.logger.info("Validating input validator", component="integration_validator")
        
        result = {
            'status': 'success',
            'errors': [],
            'warnings': []
        }
        
        try:
            # Create input validator
            input_validator = create_input_validator(self.logger)
            
            # Test string validation
            valid_result = input_validator.validate_string("valid_string", "test_field")
            if not valid_result.is_valid:
                result['status'] = 'error'
                result['errors'].append("Valid string validation failed")
            
            # Test SQL injection detection
            sql_result = input_validator.validate_string("'; DROP TABLE users; --", "test_field")
            if sql_result.is_valid:
                result['status'] = 'error'
                result['errors'].append("SQL injection detection failed")
            
            # Test XSS detection
            xss_result = input_validator.validate_string("<script>alert('xss')</script>", "test_field")
            if xss_result.is_valid:
                result['status'] = 'error'
                result['errors'].append("XSS detection failed")
            
            # Test file path validation
            path_result = input_validator.validate_file_path("../../../etc/passwd", "test_file")
            if path_result.is_valid:
                result['status'] = 'error'
                result['errors'].append("Path traversal detection failed")
            
            # Test JSON validation
            json_result = input_validator.validate_json_input('{"key": "value"}')
            if not json_result.is_valid:
                result['warnings'].append("Valid JSON validation failed")
            
            # Test email validation
            email_result = input_validator.validate_email("test@example.com")
            if not email_result.is_valid:
                result['warnings'].append("Valid email validation failed")
        
        except Exception as e:
            result['status'] = 'error'
            result['errors'].append(f"Input validator validation failed: {e}")
        
        self.validation_results['input_validator'] = result
        
        if result['status'] == 'error':
            self.errors.extend(result['errors'])
        else:
            self.warnings.extend(result['warnings'])
    
    def _validate_audit_logger(self):
        """Validate audit logger functionality"""
        self.logger.info("Validating audit logger", component="integration_validator")
        
        result = {
            'status': 'success',
            'errors': [],
            'warnings': []
        }
        
        try:
            # Create audit logger with minimal config
            from backend.security.audit_logger import AuditConfiguration
            audit_config = AuditConfiguration(
                enable_file_logging=False,
                enable_database_logging=False,
                enable_tamper_detection=False,
                real_time_monitoring=False
            )
            
            audit_logger = create_security_audit_logger(self.logger, audit_config)
            
            # Test event logging
            event_id = audit_logger.log_event(
                event_type=audit_logger.AuditEventType.SYSTEM_EVENT,
                severity=audit_logger.AuditSeverity.LOW,
                action="integration_test",
                outcome="success",
                details={"test": "data"}
            )
            
            if not event_id:
                result['status'] = 'error'
                result['errors'].append("Failed to log audit event")
            
            # Test event search
            events = audit_logger.search_events(limit=10)
            if not isinstance(events, list):
                result['warnings'].append("Event search returned invalid type")
            
            # Test statistics
            stats = audit_logger.get_audit_statistics()
            if not isinstance(stats, dict):
                result['warnings'].append("Statistics returned invalid type")
            
            # Test integrity verification
            integrity_result = audit_logger.verify_integrity()
            if not isinstance(integrity_result, dict):
                result['warnings'].append("Integrity verification returned invalid type")
        
        except Exception as e:
            result['status'] = 'error'
            result['errors'].append(f"Audit logger validation failed: {e}")
        
        self.validation_results['audit_logger'] = result
        
        if result['status'] == 'error':
            self.errors.extend(result['errors'])
        else:
            self.warnings.extend(result['warnings'])
    
    def _validate_encryption_manager(self):
        """Validate encryption manager functionality"""
        self.logger.info("Validating encryption manager", component="integration_validator")
        
        result = {
            'status': 'success',
            'errors': [],
            'warnings': []
        }
        
        try:
            # Create encryption manager
            encryption_manager = create_encryption_manager(self.logger)
            
            # Test key generation
            key_id = encryption_manager.generate_symmetric_key()
            if not key_id:
                result['status'] = 'error'
                result['errors'].append("Failed to generate symmetric key")
            
            # Test data encryption/decryption
            test_data = b"integration test data"
            encrypt_result = encryption_manager.encrypt_data(test_data, key_id)
            
            if not encrypt_result.success:
                result['status'] = 'error'
                result['errors'].append("Failed to encrypt data")
            
            decrypt_result = encryption_manager.decrypt_data(
                encrypt_result.encrypted_data,
                key_id
            )
            
            if not decrypt_result.success or decrypt_result.decrypted_data != test_data:
                result['status'] = 'error'
                result['errors'].append("Failed to decrypt data")
            
            # Test asymmetric encryption
            asym_key_id = encryption_manager.generate_asymmetric_key_pair()
            if not asym_key_id:
                result['warnings'].append("Failed to generate asymmetric key pair")
            
            if asym_key_id:
                asym_encrypt_result = encryption_manager.encrypt_asymmetric(test_data, asym_key_id)
                
                if not asym_encrypt_result.success:
                    result['warnings'].append("Failed to encrypt data asymmetrically")
                else:
                    asym_decrypt_result = encryption_manager.decrypt_asymmetric(
                        asym_encrypt_result.encrypted_data,
                        asym_key_id
                    )
                    
                    if not asym_decrypt_result.success or asym_decrypt_result.decrypted_data != test_data:
                        result['warnings'].append("Failed to decrypt data asymmetrically")
            
            # Test file encryption
            with tempfile.NamedTemporaryFile(delete=False) as temp_file:
                temp_file.write(test_data)
                temp_file_path = temp_file.name
                
                file_encrypt_result = encryption_manager.encrypt_file(temp_file_path, key_id)
                
                if not file_encrypt_result.success:
                    result['warnings'].append("Failed to encrypt file")
                else:
                    file_decrypt_result = encryption_manager.decrypt_file(
                        file_encrypt_result.metadata["output_path"],
                        key_id
                    )
                    
                    if not file_decrypt_result.success:
                        result['warnings'].append("Failed to decrypt file")
                
                # Clean up
                os.unlink(temp_file_path)
                if file_encrypt_result.success:
                    os.unlink(file_encrypt_result.metadata["output_path"])
                if file_decrypt_result.success:
                    os.unlink(file_decrypt_result.metadata["output_path"])
            
            # Test data hashing
            hash_value = encryption_manager.hash_data(test_data)
            if not hash_value or len(hash_value) != 64:  # SHA256 should be 64 chars
                result['warnings'].append("Data hashing failed")
            
            # Test data integrity verification
            is_valid = encryption_manager.verify_data_integrity(test_data, hash_value)
            if not is_valid:
                result['warnings'].append("Data integrity verification failed")
            
            # Test key listing
            keys = encryption_manager.list_keys()
            if not isinstance(keys, list):
                result['warnings'].append("Key listing returned invalid type")
            
            # Test key info
            if key_id:
                key_info = encryption_manager.get_key_info(key_id)
                if not isinstance(key_info, dict):
                    result['warnings'].append("Key info returned invalid type")
        
        except Exception as e:
            result['status'] = 'error'
            result['errors'].append(f"Encryption manager validation failed: {e}")
        
        self.validation_results['encryption_manager'] = result
        
        if result['status'] == 'error':
            self.errors.extend(result['errors'])
        else:
            self.warnings.extend(result['warnings'])
    
    def _validate_photo_encryption_manager(self):
        """Validate photo encryption manager functionality"""
        self.logger.info("Validating photo encryption manager", component="integration_validator")
        
        result = {
            'status': 'success',
            'errors': [],
            'warnings': []
        }
        
        try:
            # Create photo encryption manager
            photo_encryption_manager = create_photo_encryption_manager(self.logger)
            
            # Test photo data encryption/decryption
            test_photo_data = b"integration test photo data"
            photo_id = "test_photo_123"
            key_id = photo_encryption_manager.generate_symmetric_key()
            
            encrypt_result = photo_encryption_manager.encrypt_photo_data(
                test_photo_data,
                photo_id,
                key_id
            )
            
            if not encrypt_result.success:
                result['status'] = 'error'
                result['errors'].append("Failed to encrypt photo data")
            
            decrypt_result = photo_encryption_manager.decrypt_photo_data(
                encrypt_result.encrypted_data,
                key_id,
                photo_id
            )
            
            if not decrypt_result.success or decrypt_result.decrypted_data != test_photo_data:
                result['status'] = 'error'
                result['errors'].append("Failed to decrypt photo data")
            
            # Verify metadata
            if encrypt_result.metadata.get("photo_id") != photo_id:
                result['warnings'].append("Photo ID not preserved in encryption metadata")
            
            if decrypt_result.metadata.get("photo_id") != photo_id:
                result['warnings'].append("Photo ID not preserved in decryption metadata")
        
        except Exception as e:
            result['status'] = 'error'
            result['errors'].append(f"Photo encryption manager validation failed: {e}")
        
        self.validation_results['photo_encryption_manager'] = result
        
        if result['status'] == 'error':
            self.errors.extend(result['errors'])
        else:
            self.warnings.extend(result['warnings'])
    
    def _validate_security_policies(self):
        """Validate security policies"""
        self.logger.info("Validating security policies", component="integration_validator")
        
        result = {
            'status': 'success',
            'errors': [],
            'warnings': []
        }
        
        try:
            # Create security policy manager
            policy_manager = create_security_policy_manager()
            
            # Test policy validation
            validation_results = policy_manager.validate_all_policies()
            
            if not validation_results.get('overall_valid', False):
                result['status'] = 'error'
                result['errors'].append("Security policy validation failed")
            
            # Test policy summary
            summary = policy_manager.get_policy_summary()
            if not isinstance(summary, dict):
                result['warnings'].append("Policy summary returned invalid type")
            
            # Test password policy
            password_policy = policy_manager.password_policy
            is_valid, errors = password_policy.validate_password("SecurePass123!", "testuser")
            
            if not is_valid:
                result['warnings'].append("Valid password failed password policy validation")
            
            # Test access control policy
            access_policy = policy_manager.access_control_policy
            is_allowed, reason = access_policy.is_ip_allowed("192.168.1.100")
            
            if not is_allowed:
                result['warnings'].append(f"Allowed IP failed access control: {reason}")
            
            # Test data protection policy
            data_policy = policy_manager.data_protection_policy
            retention_days = data_policy.get_retention_period("personal_data")
            
            if retention_days <= 0:
                result['warnings'].append("Invalid retention period for personal data")
        
        except Exception as e:
            result['status'] = 'error'
            result['errors'].append(f"Security policies validation failed: {e}")
        
        self.validation_results['security_policies'] = result
        
        if result['status'] == 'error':
            self.errors.extend(result['errors'])
        else:
            self.warnings.extend(result['warnings'])
    
    def _validate_integration_scenarios(self):
        """Validate integration scenarios between components"""
        self.logger.info("Validating integration scenarios", component="integration_validator")
        
        result = {
            'status': 'success',
            'errors': [],
            'warnings': []
        }
        
        try:
            # Scenario 1: Secure credential storage and retrieval
            self._validate_credential_storage_scenario(result)
            
            # Scenario 2: Input validation and audit logging
            self._validate_input_audit_scenario(result)
            
            # Scenario 3: Data encryption and integrity verification
            self._validate_encryption_integrity_scenario(result)
            
            # Scenario 4: Photo processing with security
            self._validate_photo_processing_scenario(result)
        
        except Exception as e:
            result['status'] = 'error'
            result['errors'].append(f"Integration scenario validation failed: {e}")
        
        self.validation_results['integration_scenarios'] = result
        
        if result['status'] == 'error':
            self.errors.extend(result['errors'])
        else:
            self.warnings.extend(result['warnings'])
    
    def _validate_credential_storage_scenario(self, result: Dict[str, Any]):
        """Validate secure credential storage and retrieval scenario"""
        try:
            # Create components
            cred_manager = create_credential_manager(self.logger)
            encryption_manager = create_encryption_manager(self.logger)
            
            # Generate encryption key
            key_id = encryption_manager.generate_symmetric_key()
            
            # Store encrypted credential
            credential_name = "scenario_test_credential"
            credential_data = {"username": "test_user", "password": "test_password"}
            
            store_result = cred_manager.store_credential(credential_name, credential_data)
            if not store_result:
                result['errors'].append("Failed to store credential in scenario")
                return
            
            # Retrieve credential
            retrieved_data = cred_manager.retrieve_credential(credential_name)
            if not retrieved_data:
                result['errors'].append("Failed to retrieve credential in scenario")
                return
            
            # Verify data integrity
            if (retrieved_data.get("username") != credential_data["username"] or
                retrieved_data.get("password") != credential_data["password"]):
                result['errors'].append("Credential data integrity failed in scenario")
        
        except Exception as e:
            result['errors'].append(f"Credential storage scenario failed: {e}")
    
    def _validate_input_audit_scenario(self, result: Dict[str, Any]):
        """Validate input validation and audit logging scenario"""
        try:
            # Create components
            input_validator = create_input_validator(self.logger)
            audit_config = Mock()
            audit_config.enable_file_logging = False
            audit_config.enable_database_logging = False
            audit_config.enable_tamper_detection = False
            audit_config.real_time_monitoring = False
            
            audit_logger = create_security_audit_logger(self.logger, audit_config)
            
            # Test malicious input
            malicious_input = "'; DROP TABLE users; --"
            validation_result = input_validator.validate_string(malicious_input, "test_input")
            
            if validation_result.is_valid:
                result['errors'].append("Malicious input passed validation in scenario")
                return
            
            # Log security event
            event_id = audit_logger.log_event(
                event_type=audit_logger.AuditEventType.SECURITY_VIOLATION,
                severity=audit_logger.AuditSeverity.HIGH,
                action="input_validation",
                outcome="blocked",
                details={
                    "input": malicious_input,
                    "reason": "SQL injection attempt"
                }
            )
            
            if not event_id:
                result['warnings'].append("Failed to log security event in scenario")
        
        except Exception as e:
            result['errors'].append(f"Input audit scenario failed: {e}")
    
    def _validate_encryption_integrity_scenario(self, result: Dict[str, Any]):
        """Validate data encryption and integrity verification scenario"""
        try:
            # Create components
            encryption_manager = create_encryption_manager(self.logger)
            
            # Generate key and encrypt data
            key_id = encryption_manager.generate_symmetric_key()
            original_data = b"scenario test data"
            
            encrypt_result = encryption_manager.encrypt_data(original_data, key_id)
            if not encrypt_result.success:
                result['errors'].append("Failed to encrypt data in scenario")
                return
            
            # Calculate original hash
            original_hash = encryption_manager.hash_data(original_data)
            
            # Decrypt data
            decrypt_result = encryption_manager.decrypt_data(
                encrypt_result.encrypted_data,
                key_id
            )
            
            if not decrypt_result.success:
                result['errors'].append("Failed to decrypt data in scenario")
                return
            
            # Verify integrity
            is_valid = encryption_manager.verify_data_integrity(
                decrypt_result.decrypted_data,
                original_hash
            )
            
            if not is_valid:
                result['errors'].append("Data integrity verification failed in scenario")
        
        except Exception as e:
            result['errors'].append(f"Encryption integrity scenario failed: {e}")
    
    def _validate_photo_processing_scenario(self, result: Dict[str, Any]):
        """Validate photo processing with security scenario"""
        try:
            # Create components
            photo_encryption_manager = create_photo_encryption_manager(self.logger)
            input_validator = create_input_validator(self.logger)
            
            # Test photo ID validation
            valid_photo_id = "candidate_123"
            photo_id_result = input_validator.validate_string(valid_photo_id, "photo_id")
            
            if not photo_id_result.is_valid:
                result['errors'].append("Valid photo ID failed validation in scenario")
                return
            
            # Test malicious photo ID
            malicious_photo_id = "'; DROP TABLE photos; --"
            malicious_result = input_validator.validate_string(malicious_photo_id, "photo_id")
            
            if malicious_result.is_valid:
                result['errors'].append("Malicious photo ID passed validation in scenario")
                return
            
            # Test photo data encryption
            test_photo_data = b"scenario test photo data"
            key_id = photo_encryption_manager.generate_symmetric_key()
            
            encrypt_result = photo_encryption_manager.encrypt_photo_data(
                test_photo_data,
                valid_photo_id,
                key_id
            )
            
            if not encrypt_result.success:
                result['errors'].append("Failed to encrypt photo data in scenario")
                return
            
            # Test photo data decryption
            decrypt_result = photo_encryption_manager.decrypt_photo_data(
                encrypt_result.encrypted_data,
                key_id,
                valid_photo_id
            )
            
            if not decrypt_result.success or decrypt_result.decrypted_data != test_photo_data:
                result['errors'].append("Failed to decrypt photo data in scenario")
        
        except Exception as e:
            result['errors'].append(f"Photo processing scenario failed: {e}")
    
    def _compile_results(self):
        """Compile validation results"""
        overall_status = 'success' if not self.errors else 'error'
        
        self.validation_results.update({
            'overall_status': overall_status,
            'total_errors': len(self.errors),
            'total_warnings': len(self.warnings),
            'validation_timestamp': datetime.now().isoformat(),
            'errors': self.errors,
            'warnings': self.warnings
        })
        
        # Log results
        if overall_status == 'success':
            self.logger.info("Integration validation passed", component="integration_validator")
        else:
            self.logger.error("Integration validation failed", component="integration_validator")
        
        for error in self.errors:
            self.logger.error(f"Validation error: {error}", component="integration_validator")
        
        for warning in self.warnings:
            self.logger.warning(f"Validation warning: {warning}", component="integration_validator")
    
    def save_results(self, output_file: str):
        """Save validation results to file"""
        try:
            with open(output_file, 'w') as f:
                json.dump(self.validation_results, f, indent=2, default=str)
            
            self.logger.info(f"Validation results saved to: {output_file}",
                           component="integration_validator")
        
        except Exception as e:
            self.logger.error(f"Failed to save validation results: {e}",
                            component="integration_validator")
    
    def print_summary(self):
        """Print validation summary"""
        print("\n" + "=" * 60)
        print("UNS-CLAUDEJP 5.4 - Integration Validation Results")
        print("=" * 60)
        print(f"Overall Status: {self.validation_results.get('overall_status', 'unknown').upper()}")
        print(f"Total Errors: {self.validation_results.get('total_errors', 0)}")
        print(f"Total Warnings: {self.validation_results.get('total_warnings', 0)}")
        print(f"Validation Timestamp: {self.validation_results.get('validation_timestamp', 'unknown')}")
        
        # Print component results
        components = [
            'module_imports',
            'configuration',
            'credential_manager',
            'input_validator',
            'audit_logger',
            'encryption_manager',
            'photo_encryption_manager',
            'security_policies',
            'integration_scenarios'
        ]
        
        for component in components:
            if component in self.validation_results:
                result = self.validation_results[component]
                status = result.get('status', 'unknown').upper()
                errors = len(result.get('errors', []))
                warnings = len(result.get('warnings', []))
                
                print(f"\n{component.replace('_', ' ').title()}:")
                print(f"  Status: {status}")
                print(f"  Errors: {errors}")
                print(f"  Warnings: {warnings}")
        
        # Print errors and warnings
        if self.errors:
            print("\nErrors:")
            for i, error in enumerate(self.errors, 1):
                print(f"  {i}. {error}")
        
        if self.warnings:
            print("\nWarnings:")
            for i, warning in enumerate(self.warnings, 1):
                print(f"  {i}. {warning}")
        
        print("\n" + "=" * 60)


def signal_handler(signum, frame):
    """Handle interrupt signals"""
    print("\nIntegration validation interrupted by user")
    sys.exit(130)


def main():
    """Main integration validation execution"""
    # Register signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    parser = argparse.ArgumentParser(
        description="Integration Validation for UNS-CLAUDEJP 5.4",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    %(prog)s                                    # Run validation with default settings
    %(prog)s --output results.json              # Save results to file
    %(prog)s --verbose                          # Show detailed output
        """
    )
    
    parser.add_argument(
        '--output',
        type=str,
        help='Output file for validation results'
    )
    
    parser.add_argument(
        '--verbose',
        action='store_true',
        help='Show detailed output'
    )
    
    args = parser.parse_args()
    
    try:
        # Create validator
        validator = IntegrationValidator()
        
        # Run validation
        results = validator.validate_all()
        
        # Save results if requested
        if args.output:
            validator.save_results(args.output)
        
        # Print summary
        validator.print_summary()
        
        # Return appropriate exit code
        return 0 if results['overall_status'] == 'success' else 1
    
    except KeyboardInterrupt:
        print("\nIntegration validation interrupted by user")
        return 130
    except Exception as e:
        print(f"ERROR: {e}")
        traceback.print_exc()
        return 1


if __name__ == '__main__':
    exit_code = main()
    sys.exit(exit_code)