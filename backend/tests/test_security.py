"""
Security Tests Module
UNS-CLAUDEJP 5.4 - Production Security Hardening

This module provides comprehensive security tests for all security components,
including credential management, input validation, audit logging, and encryption.
"""

import unittest
import tempfile
import os
import json
import hashlib
import secrets
import time
import threading
from datetime import datetime, timedelta
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock

# Add backend to path
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from backend.security import (
        create_credential_manager,
        create_input_validator,
        create_security_audit_logger,
        create_encryption_manager,
        create_photo_encryption_manager,
        CredentialManager,
        InputValidator,
        SecurityAuditLogger,
        EncryptionManager,
        PhotoEncryptionManager,
        ValidationResult,
        EncryptionResult,
        DecryptionResult,
        AuditEvent,
        AuditEventType,
        AuditSeverity
    )
    from backend.utils.logging_utils import create_logger
    from config.production_config import ProductionConfig, SecurityLevel
    from config.security_policies import (
        create_security_policy_manager,
        PasswordPolicy,
        AccessControlPolicy,
        DataProtectionPolicy,
        NetworkSecurityPolicy,
        AuditLoggingPolicy,
        IncidentResponsePolicy,
        CompliancePolicy
    )
except ImportError as e:
    print(f"Error importing modules: {e}")
    sys.exit(1)


class TestCredentialManager(unittest.TestCase):
    """Test cases for credential manager"""
    
    def setUp(self):
        """Set up test environment"""
        self.logger = create_logger("test_credential_manager")
        self.credential_manager = create_credential_manager(self.logger)
        self.test_credential_name = "test_credential"
        self.test_credential_data = {
            "username": "test_user",
            "password": "test_password",
            "api_key": "test_api_key"
        }
    
    def tearDown(self):
        """Clean up test environment"""
        try:
            self.credential_manager.delete_credential(self.test_credential_name)
            self.credential_manager.secure_clear_memory()
        except Exception:
            pass
    
    def test_store_credential(self):
        """Test storing a credential"""
        result = self.credential_manager.store_credential(
            self.test_credential_name,
            self.test_credential_data
        )
        
        self.assertTrue(result, "Failed to store credential")
    
    def test_retrieve_credential(self):
        """Test retrieving a credential"""
        # First store the credential
        self.credential_manager.store_credential(
            self.test_credential_name,
            self.test_credential_data
        )
        
        # Then retrieve it
        retrieved_data = self.credential_manager.retrieve_credential(
            self.test_credential_name
        )
        
        self.assertIsNotNone(retrieved_data, "Failed to retrieve credential")
        self.assertEqual(
            retrieved_data["username"],
            self.test_credential_data["username"],
            "Retrieved username doesn't match stored username"
        )
        self.assertEqual(
            retrieved_data["password"],
            self.test_credential_data["password"],
            "Retrieved password doesn't match stored password"
        )
    
    def test_delete_credential(self):
        """Test deleting a credential"""
        # First store the credential
        self.credential_manager.store_credential(
            self.test_credential_name,
            self.test_credential_data
        )
        
        # Then delete it
        result = self.credential_manager.delete_credential(
            self.test_credential_name
        )
        
        self.assertTrue(result, "Failed to delete credential")
        
        # Verify it's deleted
        retrieved_data = self.credential_manager.retrieve_credential(
            self.test_credential_name
        )
        
        self.assertIsNone(retrieved_data, "Credential was not properly deleted")
    
    def test_rotate_credential(self):
        """Test rotating a credential"""
        # First store the credential
        self.credential_manager.store_credential(
            self.test_credential_name,
            self.test_credential_data
        )
        
        # Then rotate it
        new_credential_data = {
            "username": "test_user",
            "password": "new_test_password",
            "api_key": "new_test_api_key"
        }
        
        result = self.credential_manager.rotate_credential(
            self.test_credential_name,
            new_credential_data
        )
        
        self.assertTrue(result, "Failed to rotate credential")
        
        # Verify new data
        retrieved_data = self.credential_manager.retrieve_credential(
            self.test_credential_name
        )
        
        self.assertEqual(
            retrieved_data["password"],
            new_credential_data["password"],
            "Rotated password doesn't match new password"
        )
    
    def test_list_credentials(self):
        """Test listing credentials"""
        # Store a few credentials
        for i in range(3):
            self.credential_manager.store_credential(
                f"test_credential_{i}",
                {"test": f"data_{i}"}
            )
        
        # List credentials
        credentials = self.credential_manager.list_credentials()
        
        self.assertGreaterEqual(
            len(credentials),
            3,
            "Not enough credentials listed"
        )
    
    def test_cleanup_expired_credentials(self):
        """Test cleaning up expired credentials"""
        # Store an expired credential
        self.credential_manager.store_credential(
            "expired_credential",
            {"test": "data"},
            expires_in_hours=-1  # Already expired
        )
        
        # Clean up expired credentials
        cleaned_count = self.credential_manager.cleanup_expired_credentials()
        
        self.assertGreater(
            cleaned_count,
            0,
            "No expired credentials were cleaned up"
        )
    
    def test_secure_clear_memory(self):
        """Test secure memory clearing"""
        # This test is more about ensuring the method doesn't raise errors
        try:
            self.credential_manager.secure_clear_memory()
        except Exception as e:
            self.fail(f"Secure memory clearing raised an exception: {e}")


class TestInputValidator(unittest.TestCase):
    """Test cases for input validator"""
    
    def setUp(self):
        """Set up test environment"""
        self.logger = create_logger("test_input_validator")
        self.input_validator = create_input_validator(self.logger)
    
    def test_validate_string_valid(self):
        """Test validating a valid string"""
        result = self.input_validator.validate_string(
            "valid_string",
            "test_field",
            max_length=100,
            min_length=1
        )
        
        self.assertTrue(result.is_valid, "Valid string was marked as invalid")
        self.assertEqual(
            result.sanitized_value,
            "valid_string",
            "Sanitized value doesn't match original"
        )
    
    def test_validate_string_too_long(self):
        """Test validating a string that's too long"""
        result = self.input_validator.validate_string(
            "x" * 200,  # 200 characters
            "test_field",
            max_length=100
        )
        
        self.assertFalse(result.is_valid, "String that's too long was marked as valid")
        self.assertIn(
            "exceeds maximum length",
            " ".join(result.error_messages),
            "Error message doesn't mention length issue"
        )
    
    def test_validate_string_empty(self):
        """Test validating an empty string"""
        result = self.input_validator.validate_string(
            "",
            "test_field",
            allow_empty=False
        )
        
        self.assertFalse(result.is_valid, "Empty string was marked as valid")
        self.assertIn(
            "cannot be empty",
            " ".join(result.error_messages),
            "Error message doesn't mention empty string"
        )
    
    def test_validate_string_sql_injection(self):
        """Test detecting SQL injection in string"""
        result = self.input_validator.validate_string(
            "'; DROP TABLE users; --",
            "test_field"
        )
        
        self.assertFalse(result.is_valid, "SQL injection was not detected")
        self.assertIn(
            "SQL injection",
            " ".join(result.error_messages),
            "Error message doesn't mention SQL injection"
        )
    
    def test_validate_string_xss(self):
        """Test detecting XSS in string"""
        result = self.input_validator.validate_string(
            "<script>alert('xss')</script>",
            "test_field"
        )
        
        self.assertFalse(result.is_valid, "XSS was not detected")
        self.assertIn(
            "XSS",
            " ".join(result.error_messages),
            "Error message doesn't mention XSS"
        )
    
    def test_validate_file_path_valid(self):
        """Test validating a valid file path"""
        with tempfile.TemporaryDirectory() as temp_dir:
            test_file = Path(temp_dir) / "test_file.txt"
            test_file.touch()
            
            result = self.input_validator.validate_file_path(
                str(test_file),
                "test_file",
                base_path=temp_dir
            )
            
            self.assertTrue(result.is_valid, "Valid file path was marked as invalid")
    
    def test_validate_file_path_traversal(self):
        """Test detecting path traversal"""
        result = self.input_validator.validate_file_path(
            "../../../etc/passwd",
            "test_file"
        )
        
        self.assertFalse(result.is_valid, "Path traversal was not detected")
        self.assertIn(
            "path traversal",
            " ".join(result.error_messages),
            "Error message doesn't mention path traversal"
        )
    
    def test_validate_json_input_valid(self):
        """Test validating valid JSON input"""
        test_json = {"key": "value", "number": 123}
        result = self.input_validator.validate_json_input(
            json.dumps(test_json),
            required_fields=["key"]
        )
        
        self.assertTrue(result.is_valid, "Valid JSON was marked as invalid")
    
    def test_validate_json_input_invalid(self):
        """Test validating invalid JSON input"""
        result = self.input_validator.validate_json_input(
            "invalid json",
            required_fields=["key"]
        )
        
        self.assertFalse(result.is_valid, "Invalid JSON was marked as valid")
        self.assertIn(
            "Invalid JSON format",
            " ".join(result.error_messages),
            "Error message doesn't mention invalid JSON"
        )
    
    def test_validate_email_valid(self):
        """Test validating a valid email"""
        result = self.input_validator.validate_email(
            "test@example.com",
            "test_email"
        )
        
        self.assertTrue(result.is_valid, "Valid email was marked as invalid")
    
    def test_validate_email_invalid(self):
        """Test validating an invalid email"""
        result = self.input_validator.validate_email(
            "invalid-email",
            "test_email"
        )
        
        self.assertFalse(result.is_valid, "Invalid email was marked as valid")
        self.assertIn(
            "not a valid email address",
            " ".join(result.error_messages),
            "Error message doesn't mention invalid email"
        )


class TestSecurityAuditLogger(unittest.TestCase):
    """Test cases for security audit logger"""
    
    def setUp(self):
        """Set up test environment"""
        self.logger = create_logger("test_audit_logger")
        self.audit_config = Mock()
        self.audit_config.enable_file_logging = False
        self.audit_config.enable_database_logging = False
        self.audit_config.enable_tamper_detection = False
        self.audit_config.real_time_monitoring = False
        
        self.audit_logger = create_security_audit_logger(
            self.logger,
            self.audit_config
        )
    
    def test_log_event(self):
        """Test logging an audit event"""
        event_id = self.audit_logger.log_event(
            event_type=AuditEventType.AUTHENTICATION,
            severity=AuditSeverity.MEDIUM,
            action="login",
            outcome="success",
            user_id="test_user",
            ip_address="192.168.1.1",
            resource="system",
            details={"method": "password"}
        )
        
        self.assertIsNotNone(event_id, "Event ID was not returned")
        self.assertGreater(len(event_id), 0, "Event ID is empty")
    
    def test_search_events(self):
        """Test searching audit events"""
        # Log a few events
        for i in range(3):
            self.audit_logger.log_event(
                event_type=AuditEventType.DATA_ACCESS,
                severity=AuditSeverity.LOW,
                action="read",
                outcome="success",
                user_id=f"test_user_{i}",
                details={"record_id": i}
            )
        
        # Search events
        events = self.audit_logger.search_events(
            event_type=AuditEventType.DATA_ACCESS,
            limit=10
        )
        
        self.assertGreaterEqual(
            len(events),
            3,
            "Not enough events returned from search"
        )
    
    def test_verify_integrity(self):
        """Test audit log integrity verification"""
        # This test is more about ensuring the method doesn't raise errors
        try:
            result = self.audit_logger.verify_integrity()
            self.assertIsInstance(
                result,
                dict,
                "Integrity verification should return a dictionary"
            )
            self.assertIn(
                "verified",
                result,
                "Result should contain verification status"
            )
        except Exception as e:
            self.fail(f"Integrity verification raised an exception: {e}")
    
    def test_get_audit_statistics(self):
        """Test getting audit statistics"""
        # Log a few events
        for i in range(5):
            self.audit_logger.log_event(
                event_type=AuditEventType.SYSTEM_EVENT,
                severity=AuditSeverity.LOW,
                action="test",
                outcome="success",
                details={"test_id": i}
            )
        
        # Get statistics
        stats = self.audit_logger.get_audit_statistics(days=1)
        
        self.assertIsInstance(
            stats,
            dict,
            "Statistics should be a dictionary"
        )
        self.assertIn(
            "total_events",
            stats,
            "Statistics should contain total events"
        )
        self.assertGreater(
            stats["total_events"],
            0,
            "Statistics should show events were logged"
        )


class TestEncryptionManager(unittest.TestCase):
    """Test cases for encryption manager"""
    
    def setUp(self):
        """Set up test environment"""
        self.logger = create_logger("test_encryption_manager")
        self.encryption_manager = create_encryption_manager(self.logger)
        self.test_data = b"This is test data for encryption"
    
    def tearDown(self):
        """Clean up test environment"""
        try:
            self.encryption_manager.secure_clear_memory()
        except Exception:
            pass
    
    def test_generate_symmetric_key(self):
        """Test generating a symmetric key"""
        key_id = self.encryption_manager.generate_symmetric_key()
        
        self.assertIsNotNone(key_id, "Key ID was not returned")
        self.assertGreater(len(key_id), 0, "Key ID is empty")
    
    def test_encrypt_decrypt_data(self):
        """Test encrypting and decrypting data"""
        # Generate a key
        key_id = self.encryption_manager.generate_symmetric_key()
        
        # Encrypt data
        encrypt_result = self.encryption_manager.encrypt_data(
            self.test_data,
            key_id
        )
        
        self.assertTrue(encrypt_result.success, "Data encryption failed")
        self.assertIsNotNone(encrypt_result.encrypted_data, "Encrypted data is None")
        
        # Decrypt data
        decrypt_result = self.encryption_manager.decrypt_data(
            encrypt_result.encrypted_data,
            key_id
        )
        
        self.assertTrue(decrypt_result.success, "Data decryption failed")
        self.assertEqual(
            decrypt_result.decrypted_data,
            self.test_data,
            "Decrypted data doesn't match original data"
        )
    
    def test_encrypt_decrypt_asymmetric(self):
        """Test asymmetric encryption and decryption"""
        # Generate a key pair
        key_id = self.encryption_manager.generate_asymmetric_key_pair()
        
        # Encrypt data
        encrypt_result = self.encryption_manager.encrypt_asymmetric(
            self.test_data,
            key_id
        )
        
        self.assertTrue(encrypt_result.success, "Asymmetric encryption failed")
        self.assertIsNotNone(encrypt_result.encrypted_data, "Encrypted data is None")
        
        # Decrypt data
        decrypt_result = self.encryption_manager.decrypt_asymmetric(
            encrypt_result.encrypted_data,
            key_id
        )
        
        self.assertTrue(decrypt_result.success, "Asymmetric decryption failed")
        self.assertEqual(
            decrypt_result.decrypted_data,
            self.test_data,
            "Decrypted data doesn't match original data"
        )
    
    def test_encrypt_decrypt_file(self):
        """Test file encryption and decryption"""
        # Generate a key
        key_id = self.encryption_manager.generate_symmetric_key()
        
        # Create a test file
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            temp_file.write(self.test_data)
            temp_file_path = temp_file.name
        
        try:
            # Encrypt file
            encrypt_result = self.encryption_manager.encrypt_file(
                temp_file_path,
                key_id
            )
            
            self.assertTrue(encrypt_result.success, "File encryption failed")
            
            # Decrypt file
            decrypt_result = self.encryption_manager.decrypt_file(
                encrypt_result.metadata["output_path"],
                key_id
            )
            
            self.assertTrue(decrypt_result.success, "File decryption failed")
            
            # Verify decrypted content
            with open(decrypt_result.metadata["output_path"], 'rb') as f:
                decrypted_data = f.read()
            
            self.assertEqual(
                decrypted_data,
                self.test_data,
                "Decrypted file content doesn't match original"
            )
        
        finally:
            # Clean up temporary files
            try:
                os.unlink(temp_file_path)
                if encrypt_result.success:
                    os.unlink(encrypt_result.metadata["output_path"])
                if decrypt_result.success:
                    os.unlink(decrypt_result.metadata["output_path"])
            except Exception:
                pass
    
    def test_hash_data(self):
        """Test data hashing"""
        hash_value = self.encryption_manager.hash_data(
            self.test_data,
            algorithm="SHA256"
        )
        
        self.assertIsNotNone(hash_value, "Hash value is None")
        self.assertEqual(len(hash_value), 64, "SHA256 hash should be 64 characters")
    
    def test_verify_data_integrity(self):
        """Test data integrity verification"""
        hash_value = self.encryption_manager.hash_data(self.test_data)
        
        # Verify with correct hash
        is_valid = self.encryption_manager.verify_data_integrity(
            self.test_data,
            hash_value
        )
        
        self.assertTrue(is_valid, "Data integrity verification failed with correct hash")
        
        # Verify with incorrect hash
        is_valid = self.encryption_manager.verify_data_integrity(
            self.test_data,
            "incorrect_hash"
        )
        
        self.assertFalse(is_valid, "Data integrity verification passed with incorrect hash")
    
    def test_key_rotation(self):
        """Test key rotation"""
        # Generate a key
        key_id = self.encryption_manager.generate_symmetric_key()
        
        # Rotate key
        new_key_id = self.encryption_manager.rotate_key(key_id)
        
        self.assertIsNotNone(new_key_id, "New key ID was not returned")
        self.assertNotEqual(key_id, new_key_id, "New key ID is the same as old key ID")
    
    def test_cleanup_expired_keys(self):
        """Test cleaning up expired keys"""
        # Generate an expired key
        self.encryption_manager.generate_symmetric_key(
            expires_in_hours=-1  # Already expired
        )
        
        # Clean up expired keys
        cleaned_count = self.encryption_manager.cleanup_expired_keys()
        
        self.assertGreater(
            cleaned_count,
            0,
            "No expired keys were cleaned up"
        )


class TestPhotoEncryptionManager(unittest.TestCase):
    """Test cases for photo encryption manager"""
    
    def setUp(self):
        """Set up test environment"""
        self.logger = create_logger("test_photo_encryption_manager")
        self.photo_encryption_manager = create_photo_encryption_manager(self.logger)
        self.test_photo_data = b"This is test photo data"
        self.test_photo_id = "test_photo_123"
    
    def tearDown(self):
        """Clean up test environment"""
        try:
            self.photo_encryption_manager.secure_clear_memory()
        except Exception:
            pass
    
    def test_encrypt_decrypt_photo_data(self):
        """Test encrypting and decrypting photo data"""
        # Generate a key
        key_id = self.photo_encryption_manager.generate_symmetric_key()
        
        # Encrypt photo data
        encrypt_result = self.photo_encryption_manager.encrypt_photo_data(
            self.test_photo_data,
            self.test_photo_id,
            key_id
        )
        
        self.assertTrue(encrypt_result.success, "Photo data encryption failed")
        self.assertEqual(
            encrypt_result.metadata["photo_id"],
            self.test_photo_id,
            "Photo ID in metadata doesn't match original"
        )
        
        # Decrypt photo data
        decrypt_result = self.photo_encryption_manager.decrypt_photo_data(
            encrypt_result.encrypted_data,
            key_id,
            self.test_photo_id
        )
        
        self.assertTrue(decrypt_result.success, "Photo data decryption failed")
        self.assertEqual(
            decrypt_result.decrypted_data,
            self.test_photo_data,
            "Decrypted photo data doesn't match original"
        )
        self.assertEqual(
            decrypt_result.metadata["photo_id"],
            self.test_photo_id,
            "Photo ID in decrypted metadata doesn't match original"
        )


class TestSecurityPolicies(unittest.TestCase):
    """Test cases for security policies"""
    
    def setUp(self):
        """Set up test environment"""
        self.security_policy_manager = create_security_policy_manager()
    
    def test_password_policy_validation(self):
        """Test password policy validation"""
        # Test valid password
        is_valid, errors = self.security_policy_manager.password_policy.validate_password(
            "SecurePass123!",
            "testuser"
        )
        
        self.assertTrue(is_valid, "Valid password was marked as invalid")
        self.assertEqual(len(errors), 0, "Valid password has errors")
        
        # Test invalid password (too short)
        is_valid, errors = self.security_policy_manager.password_policy.validate_password(
            "short",
            "testuser"
        )
        
        self.assertFalse(is_valid, "Short password was marked as valid")
        self.assertGreater(len(errors), 0, "Short password has no errors")
    
    def test_access_control_policy_ip_allowed(self):
        """Test IP address validation in access control policy"""
        # Test allowed IP
        is_allowed, reason = self.security_policy_manager.access_control_policy.is_ip_allowed(
            "192.168.1.100"
        )
        
        self.assertTrue(is_allowed, "Allowed IP was marked as not allowed")
        
        # Test blocked IP
        is_allowed, reason = self.security_policy_manager.access_control_policy.is_ip_allowed(
            "0.0.0.0"
        )
        
        self.assertFalse(is_allowed, "Blocked IP was marked as allowed")
    
    def test_access_control_policy_time_allowed(self):
        """Test time-based access validation"""
        # Test allowed time (10 AM)
        is_allowed, reason = self.security_policy_manager.access_control_policy.is_time_allowed(
            datetime(2023, 1, 1, 10, 0, 0)
        )
        
        self.assertTrue(is_allowed, "Allowed time was marked as not allowed")
        
        # Test disallowed time (8 PM)
        is_allowed, reason = self.security_policy_manager.access_control_policy.is_time_allowed(
            datetime(2023, 1, 1, 20, 0, 0)
        )
        
        self.assertFalse(is_allowed, "Disallowed time was marked as allowed")
    
    def test_data_protection_policy_retention(self):
        """Test data retention periods"""
        # Test personal data retention
        retention_days = self.security_policy_manager.data_protection_policy.get_retention_period(
            "personal_data"
        )
        
        self.assertEqual(
            retention_days,
            2555,  # 7 years
            "Personal data retention period is incorrect"
        )
        
        # Test financial data retention
        retention_days = self.security_policy_manager.data_protection_policy.get_retention_period(
            "financial_data"
        )
        
        self.assertEqual(
            retention_days,
            2555,  # 7 years
            "Financial data retention period is incorrect"
        )
    
    def test_network_security_policy_cipher_allowed(self):
        """Test cipher validation in network security policy"""
        # Test allowed cipher
        is_allowed = self.security_policy_manager.network_security_policy.is_cipher_allowed(
            "TLS_AES_256_GCM_SHA384"
        )
        
        self.assertTrue(is_allowed, "Allowed cipher was marked as not allowed")
        
        # Test disallowed cipher
        is_allowed = self.security_policy_manager.network_security_policy.is_cipher_allowed(
            "TLS_RSA_WITH_RC4_128_SHA"
        )
        
        self.assertFalse(is_allowed, "Disallowed cipher was marked as allowed")
    
    def test_network_security_policy_tls_version_allowed(self):
        """Test TLS version validation in network security policy"""
        # Test allowed TLS version
        is_allowed = self.security_policy_manager.network_security_policy.is_tls_version_allowed(
            "TLSv1.3"
        )
        
        self.assertTrue(is_allowed, "Allowed TLS version was marked as not allowed")
        
        # Test disallowed TLS version
        is_allowed = self.security_policy_manager.network_security_policy.is_tls_version_allowed(
            "TLSv1.0"
        )
        
        self.assertFalse(is_allowed, "Disallowed TLS version was marked as allowed")
    
    def test_validate_all_policies(self):
        """Test validation of all security policies"""
        validation_results = self.security_policy_manager.validate_all_policies()
        
        self.assertIsInstance(
            validation_results,
            dict,
            "Validation results should be a dictionary"
        )
        self.assertIn(
            "overall_valid",
            validation_results,
            "Validation results should contain overall validity"
        )
        self.assertIn(
            "password_policy",
            validation_results,
            "Validation results should contain password policy"
        )
        self.assertIn(
            "access_control_policy",
            validation_results,
            "Validation results should contain access control policy"
        )
        self.assertIn(
            "data_protection_policy",
            validation_results,
            "Validation results should contain data protection policy"
        )
        self.assertIn(
            "network_security_policy",
            validation_results,
            "Validation results should contain network security policy"
        )
    
    def test_get_policy_summary(self):
        """Test getting policy summary"""
        summary = self.security_policy_manager.get_policy_summary()
        
        self.assertIsInstance(
            summary,
            dict,
            "Policy summary should be a dictionary"
        )
        self.assertIn(
            "security_level",
            summary,
            "Policy summary should contain security level"
        )
        self.assertIn(
            "password_policy",
            summary,
            "Policy summary should contain password policy"
        )
        self.assertIn(
            "access_control",
            summary,
            "Policy summary should contain access control"
        )
        self.assertIn(
            "data_protection",
            summary,
            "Policy summary should contain data protection"
        )
        self.assertIn(
            "network_security",
            summary,
            "Policy summary should contain network security"
        )


class TestProductionConfig(unittest.TestCase):
    """Test cases for production configuration"""
    
    def test_load_production_config_from_dict(self):
        """Test loading production config from dictionary"""
        config_data = {
            "environment": "production",
            "security": {
                "enable_authentication": True,
                "enable_audit_logging": True,
                "session_timeout_minutes": 15
            },
            "performance": {
                "enable_caching": True,
                "max_connections": 100
            },
            "logging": {
                "level": "WARNING",
                "enable_file_logging": True
            }
        }
        
        config = ProductionConfig.from_dict(config_data)
        
        self.assertEqual(
            config.environment.value,
            "production",
            "Environment not set correctly"
        )
        self.assertTrue(
            config.security.enable_authentication,
            "Authentication not enabled"
        )
        self.assertTrue(
            config.security.enable_audit_logging,
            "Audit logging not enabled"
        )
        self.assertEqual(
            config.security.session_timeout_minutes,
            15,
            "Session timeout not set correctly"
        )
    
    def test_production_config_validation(self):
        """Test production config validation"""
        # Test valid config
        config_data = {
            "environment": "production",
            "security": {
                "enable_authentication": True,
                "enable_audit_logging": True,
                "security_level": "high"
            },
            "debug_enabled": False
        }
        
        config = ProductionConfig.from_dict(config_data)
        
        # Should not raise an exception
        self.assertIsInstance(config, ProductionConfig)
        
        # Test invalid config (debug enabled in production)
        config_data["debug_enabled"] = True
        
        with self.assertRaises(ValueError):
            ProductionConfig.from_dict(config_data)
    
    def test_production_config_to_dict(self):
        """Test converting production config to dictionary"""
        config = ProductionConfig(environment="production")
        config_dict = config.to_dict()
        
        self.assertIsInstance(
            config_dict,
            dict,
            "Config to dict should return a dictionary"
        )
        self.assertIn(
            "environment",
            config_dict,
            "Config dict should contain environment"
        )
        self.assertIn(
            "security",
            config_dict,
            "Config dict should contain security"
        )
        self.assertIn(
            "performance",
            config_dict,
            "Config dict should contain performance"
        )
    
    def test_production_config_is_production(self):
        """Test production environment check"""
        config = ProductionConfig(environment="production")
        self.assertTrue(config.is_production(), "Production check failed")
        
        config = ProductionConfig(environment="development")
        self.assertFalse(config.is_production(), "Non-production check failed")


class TestSecurityIntegration(unittest.TestCase):
    """Integration tests for security components"""
    
    def setUp(self):
        """Set up test environment"""
        self.logger = create_logger("test_security_integration")
        self.temp_dir = tempfile.mkdtemp()
        
        # Create test config
        self.config_file = os.path.join(self.temp_dir, "test_config.json")
        config_data = {
            "environment": "production",
            "security": {
                "enable_authentication": True,
                "enable_audit_logging": True,
                "session_timeout_minutes": 15
            },
            "logging": {
                "level": "INFO",
                "enable_file_logging": True,
                "log_directory": os.path.join(self.temp_dir, "logs")
            }
        }
        
        with open(self.config_file, 'w') as f:
            json.dump(config_data, f)
    
    def tearDown(self):
        """Clean up test environment"""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)
    
    def test_security_components_integration(self):
        """Test integration of security components"""
        # Load config
        config = ProductionConfig.from_file(self.config_file)
        
        # Create security components
        credential_manager = create_credential_manager(self.logger)
        input_validator = create_input_validator(self.logger)
        audit_logger = create_security_audit_logger(self.logger, config.get_audit_config())
        encryption_manager = create_encryption_manager(self.logger)
        
        # Test credential storage and retrieval
        credential_name = "integration_test_credential"
        credential_data = {"test": "data"}
        
        store_result = credential_manager.store_credential(
            credential_name,
            credential_data
        )
        self.assertTrue(store_result, "Failed to store credential in integration test")
        
        retrieve_result = credential_manager.retrieve_credential(credential_name)
        self.assertIsNotNone(retrieve_result, "Failed to retrieve credential in integration test")
        self.assertEqual(
            retrieve_result["test"],
            "data",
            "Retrieved credential data doesn't match in integration test"
        )
        
        # Test input validation
        validation_result = input_validator.validate_string(
            "integration_test_string",
            "test_field"
        )
        self.assertTrue(validation_result.is_valid, "Valid string failed validation in integration test")
        
        # Test audit logging
        event_id = audit_logger.log_event(
            event_type=AuditEventType.AUTHENTICATION,
            severity=AuditSeverity.MEDIUM,
            action="integration_test",
            outcome="success",
            user_id="integration_test_user"
        )
        self.assertIsNotNone(event_id, "Failed to log event in integration test")
        
        # Test encryption
        key_id = encryption_manager.generate_symmetric_key()
        test_data = b"integration test data"
        
        encrypt_result = encryption_manager.encrypt_data(test_data, key_id)
        self.assertTrue(encrypt_result.success, "Failed to encrypt in integration test")
        
        decrypt_result = encryption_manager.decrypt_data(
            encrypt_result.encrypted_data,
            key_id
        )
        self.assertTrue(decrypt_result.success, "Failed to decrypt in integration test")
        self.assertEqual(
            decrypt_result.decrypted_data,
            test_data,
            "Decrypted data doesn't match in integration test"
        )
    
    def test_security_workflow(self):
        """Test complete security workflow"""
        # Load config
        config = ProductionConfig.from_file(self.config_file)
        
        # Create security components
        credential_manager = create_credential_manager(self.logger)
        input_validator = create_input_validator(self.logger)
        audit_logger = create_security_audit_logger(self.logger, config.get_audit_config())
        encryption_manager = create_encryption_manager(self.logger)
        
        # Simulate user login workflow
        username = "workflow_test_user"
        password = "workflow_test_password"
        
        # Validate input
        username_result = input_validator.validate_string(username, "username")
        password_result = input_validator.validate_string(password, "password")
        
        self.assertTrue(username_result.is_valid, "Username validation failed in workflow test")
        self.assertTrue(password_result.is_valid, "Password validation failed in workflow test")
        
        # Check credentials (simplified)
        if username == "workflow_test_user" and password == "workflow_test_password":
            # Log successful authentication
            event_id = audit_logger.log_event(
                event_type=AuditEventType.AUTHENTICATION,
                severity=AuditSeverity.MEDIUM,
                action="login",
                outcome="success",
                user_id=username,
                details={"method": "password"}
            )
            
            self.assertIsNotNone(event_id, "Failed to log authentication in workflow test")
            
            # Store user session (simplified)
            session_data = {
                "user_id": username,
                "login_time": datetime.now().isoformat(),
                "session_id": secrets.token_hex(16)
            }
            
            # Encrypt session data
            key_id = encryption_manager.generate_symmetric_key()
            encrypt_result = encryption_manager.encrypt_data(
                json.dumps(session_data).encode(),
                key_id
            )
            
            self.assertTrue(encrypt_result.success, "Failed to encrypt session in workflow test")
            
            # Store encrypted session (simplified)
            credential_manager.store_credential(
                f"session_{username}",
                {"encrypted_session": encrypt_result.encrypted_data.hex()}
            )
            
            # Log session creation
            session_event_id = audit_logger.log_event(
                event_type=AuditEventType.AUTHORIZATION,
                severity=AuditSeverity.LOW,
                action="session_created",
                outcome="success",
                user_id=username,
                details={"session_id": session_data["session_id"]}
            )
            
            self.assertIsNotNone(session_event_id, "Failed to log session creation in workflow test")
        else:
            # Log failed authentication
            event_id = audit_logger.log_event(
                event_type=AuditEventType.AUTHENTICATION,
                severity=AuditSeverity.HIGH,
                action="login",
                outcome="failure",
                user_id=username,
                details={"reason": "invalid_credentials"}
            )
            
            self.assertIsNotNone(event_id, "Failed to log failed authentication in workflow test")


if __name__ == '__main__':
    unittest.main()
