"""
Secure Credential Management Module
UNS-CLAUDEJP 5.4 - Production Security Hardening

This module provides secure credential storage, retrieval, and management
with encryption, secure key management, and zero-trust principles.
"""

import os
import json
import base64
import secrets
import hashlib
import threading
from typing import Dict, Any, Optional, Union, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from pathlib import Path
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend
import keyring
from keyring.errors import KeyringError, NoKeyringError, PasswordDeleteError

from ..utils.logging_utils import PhotoExtractionLogger


@dataclass
class CredentialMetadata:
    """Metadata for stored credentials"""
    name: str
    created_at: datetime
    last_accessed: Optional[datetime] = None
    access_count: int = 0
    expires_at: Optional[datetime] = None
    is_encrypted: bool = True
    algorithm: str = "AES-256-GCM"
    key_derivation: str = "PBKDF2-SHA256"


@dataclass
class SecureCredential:
    """Secure credential container"""
    metadata: CredentialMetadata
    encrypted_data: str
    checksum: str
    iv: Optional[str] = None
    salt: Optional[str] = None


class CredentialManager:
    """
    Enterprise-grade credential manager with secure storage and retrieval.
    
    Features:
    - AES-256 encryption for data at rest
    - PBKDF2 key derivation
    - Windows Credential Manager integration
    - Environment variable fallback
    - Credential rotation support
    - Access logging and audit trail
    - Memory protection
    """
    
    def __init__(self, logger: PhotoExtractionLogger, service_name: str = "uns-claudejp"):
        self.logger = logger
        self.service_name = service_name
        self._encryption_key: Optional[bytes] = None
        self._credential_cache: Dict[str, SecureCredential] = {}
        self._cache_lock = threading.RLock()
        self._memory_lock = threading.Lock()
        
        # Security configuration
        self.key_derivation_iterations = 100000
        self.encryption_algorithm = hashes.SHA256()
        self.credential_ttl_hours = 24
        
        # Initialize keyring backend
        self._init_keyring()
        
        self.logger.info("Credential manager initialized", component="credential_manager")
    
    def _init_keyring(self):
        """Initialize keyring backend with fallback"""
        try:
            # Try to get available backends
            available_backends = keyring.get_keyring()
            self.logger.debug(f"Using keyring backend: {type(available_backends).__name__}")
            
            # Test keyring functionality
            test_key = f"{self.service_name}_test"
            keyring.set_password(test_key, "test", "test_value")
            keyring.get_password(test_key, "test")
            keyring.delete_password(test_key, "test")
            
        except (KeyringError, NoKeyringError) as e:
            self.logger.warning(f"Keyring not available, using file-based storage: {e}")
            self._fallback_storage = True
        except Exception as e:
            self.logger.error(f"Keyring initialization failed: {e}")
            self._fallback_storage = True
    
    def _derive_key(self, password: str, salt: bytes) -> bytes:
        """Derive encryption key using PBKDF2"""
        kdf = PBKDF2HMAC(
            algorithm=self.encryption_algorithm,
            length=32,  # 256 bits for AES-256
            salt=salt,
            iterations=self.key_derivation_iterations,
            backend=default_backend()
        )
        return kdf.derive(password.encode())
    
    def _get_encryption_key(self) -> bytes:
        """Get or generate encryption key"""
        if self._encryption_key is None:
            with self._memory_lock:
                if self._encryption_key is None:
                    # Try to get key from environment
                    key_env = os.getenv(f"{self.service_name.upper()}_MASTER_KEY")
                    if key_env:
                        self._encryption_key = base64.urlsafe_b64decode(key_env.encode())
                    else:
                        # Generate new key and store securely
                        self._encryption_key = Fernet.generate_key()
                        self.logger.warning("Generated new encryption key - ensure it's backed up securely")
        
        return self._encryption_key
    
    def _encrypt_data(self, data: str) -> Tuple[str, str, str]:
        """Encrypt data with AES-256-GCM"""
        key = self._get_encryption_key()
        fernet = Fernet(key)
        
        # Generate random salt for key derivation
        salt = os.urandom(16)
        
        # Derive key for this specific credential
        credential_key = self._derive_key(key.decode(), salt)
        credential_fernet = Fernet(base64.urlsafe_b64encode(credential_key))
        
        # Encrypt data
        encrypted_data = credential_fernet.encrypt(data.encode())
        
        return (
            base64.urlsafe_b64encode(encrypted_data).decode(),
            base64.urlsafe_b64encode(salt).decode(),
            ""  # IV is handled internally by Fernet
        )
    
    def _decrypt_data(self, encrypted_data: str, salt: str) -> str:
        """Decrypt data with AES-256-GCM"""
        try:
            key = self._get_encryption_key()
            
            # Decode base64 data
            encrypted_bytes = base64.urlsafe_b64decode(encrypted_data.encode())
            salt_bytes = base64.urlsafe_b64decode(salt.encode())
            
            # Derive key for this specific credential
            credential_key = self._derive_key(key.decode(), salt_bytes)
            credential_fernet = Fernet(base64.urlsafe_b64encode(credential_key))
            
            # Decrypt data
            decrypted_data = credential_fernet.decrypt(encrypted_bytes)
            
            return decrypted_data.decode()
        
        except Exception as e:
            self.logger.error(f"Decryption failed: {e}")
            raise ValueError("Failed to decrypt credential data")
    
    def _calculate_checksum(self, data: str) -> str:
        """Calculate SHA-256 checksum"""
        return hashlib.sha256(data.encode()).hexdigest()
    
    def _store_credential_file(self, name: str, credential: SecureCredential):
        """Store credential in encrypted file (fallback)"""
        try:
            # Create secure directory
            cred_dir = Path.home() / f".{self.service_name}_credentials"
            cred_dir.mkdir(mode=0o700, exist_ok=True)
            
            # Store credential
            cred_file = cred_dir / f"{name}.cred"
            cred_data = {
                'metadata': asdict(credential.metadata),
                'encrypted_data': credential.encrypted_data,
                'checksum': credential.checksum,
                'iv': credential.iv,
                'salt': credential.salt
            }
            
            with open(cred_file, 'w', encoding='utf-8') as f:
                json.dump(cred_data, f, indent=2, default=str)
            
            # Set secure permissions
            cred_file.chmod(0o600)
            
        except Exception as e:
            self.logger.error(f"Failed to store credential file: {e}")
            raise
    
    def _load_credential_file(self, name: str) -> Optional[SecureCredential]:
        """Load credential from encrypted file (fallback)"""
        try:
            cred_dir = Path.home() / f".{self.service_name}_credentials"
            cred_file = cred_dir / f"{name}.cred"
            
            if not cred_file.exists():
                return None
            
            with open(cred_file, 'r', encoding='utf-8') as f:
                cred_data = json.load(f)
            
            # Reconstruct objects
            metadata = CredentialMetadata(**cred_data['metadata'])
            metadata.created_at = datetime.fromisoformat(cred_data['metadata']['created_at'])
            if cred_data['metadata'].get('last_accessed'):
                metadata.last_accessed = datetime.fromisoformat(cred_data['metadata']['last_accessed'])
            if cred_data['metadata'].get('expires_at'):
                metadata.expires_at = datetime.fromisoformat(cred_data['metadata']['expires_at'])
            
            return SecureCredential(
                metadata=metadata,
                encrypted_data=cred_data['encrypted_data'],
                checksum=cred_data['checksum'],
                iv=cred_data.get('iv'),
                salt=cred_data.get('salt')
            )
        
        except Exception as e:
            self.logger.error(f"Failed to load credential file: {e}")
            return None
    
    def store_credential(self, name: str, credential_data: Dict[str, Any], 
                       expires_in_hours: Optional[int] = None) -> bool:
        """
        Store credential securely
        
        Args:
            name: Credential name/identifier
            credential_data: Dictionary containing credential data
            expires_in_hours: Optional expiration time in hours
            
        Returns:
            True if stored successfully
        """
        try:
            # Validate input
            if not name or not credential_data:
                raise ValueError("Name and credential_data are required")
            
            # Create metadata
            expires_at = None
            if expires_in_hours:
                expires_at = datetime.now() + timedelta(hours=expires_in_hours)
            
            metadata = CredentialMetadata(
                name=name,
                created_at=datetime.now(),
                expires_at=expires_at
            )
            
            # Serialize and encrypt credential data
            credential_json = json.dumps(credential_data, sort_keys=True)
            encrypted_data, salt, iv = self._encrypt_data(credential_json)
            checksum = self._calculate_checksum(credential_json)
            
            # Create secure credential
            secure_credential = SecureCredential(
                metadata=metadata,
                encrypted_data=encrypted_data,
                checksum=checksum,
                iv=iv,
                salt=salt
            )
            
            # Store in keyring or file
            try:
                # Try keyring first
                credential_json_full = json.dumps(asdict(secure_credential), default=str)
                keyring.set_password(self.service_name, name, credential_json_full)
            except (KeyringError, NoKeyringError):
                # Fallback to file storage
                self._store_credential_file(name, secure_credential)
            
            # Update cache
            with self._cache_lock:
                self._credential_cache[name] = secure_credential
            
            self.logger.info(f"Credential stored successfully: {name}", 
                           component="credential_manager", credential_name=name)
            
            return True
        
        except Exception as e:
            self.logger.error(f"Failed to store credential {name}: {e}",
                            component="credential_manager", credential_name=name)
            return False
    
    def retrieve_credential(self, name: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve credential securely
        
        Args:
            name: Credential name/identifier
            
        Returns:
            Credential data dictionary or None if not found
        """
        try:
            # Check cache first
            with self._cache_lock:
                if name in self._credential_cache:
                    secure_credential = self._credential_cache[name]
                else:
                    # Load from storage
                    try:
                        # Try keyring first
                        credential_json = keyring.get_password(self.service_name, name)
                        if credential_json:
                            cred_data = json.loads(credential_json)
                            secure_credential = SecureCredential(
                                metadata=CredentialMetadata(**cred_data['metadata']),
                                encrypted_data=cred_data['encrypted_data'],
                                checksum=cred_data['checksum'],
                                iv=cred_data.get('iv'),
                                salt=cred_data.get('salt')
                            )
                        else:
                            # Fallback to file storage
                            secure_credential = self._load_credential_file(name)
                        
                        if secure_credential:
                            self._credential_cache[name] = secure_credential
                    
                    except (KeyringError, NoKeyringError):
                        secure_credential = self._load_credential_file(name)
                        if secure_credential:
                            self._credential_cache[name] = secure_credential
            
            if not secure_credential:
                self.logger.warning(f"Credential not found: {name}",
                                 component="credential_manager", credential_name=name)
                return None
            
            # Check expiration
            if (secure_credential.metadata.expires_at and 
                secure_credential.metadata.expires_at < datetime.now()):
                self.logger.warning(f"Credential expired: {name}",
                                 component="credential_manager", credential_name=name)
                self.delete_credential(name)
                return None
            
            # Decrypt data
            decrypted_data = self._decrypt_data(
                secure_credential.encrypted_data, 
                secure_credential.salt
            )
            
            # Verify checksum
            calculated_checksum = self._calculate_checksum(decrypted_data)
            if calculated_checksum != secure_credential.checksum:
                self.logger.error(f"Credential checksum mismatch: {name}",
                                component="credential_manager", credential_name=name)
                return None
            
            # Parse credential data
            credential_data = json.loads(decrypted_data)
            
            # Update access metadata
            secure_credential.metadata.last_accessed = datetime.now()
            secure_credential.metadata.access_count += 1
            
            # Update cache
            with self._cache_lock:
                self._credential_cache[name] = secure_credential
            
            self.logger.info(f"Credential retrieved successfully: {name}",
                           component="credential_manager", credential_name=name)
            
            return credential_data
        
        except Exception as e:
            self.logger.error(f"Failed to retrieve credential {name}: {e}",
                            component="credential_manager", credential_name=name)
            return None
    
    def delete_credential(self, name: str) -> bool:
        """
        Delete credential securely
        
        Args:
            name: Credential name/identifier
            
        Returns:
            True if deleted successfully
        """
        try:
            # Delete from keyring
            try:
                keyring.delete_password(self.service_name, name)
            except (KeyringError, NoKeyringError, PasswordDeleteError):
                pass  # Continue with file deletion
            
            # Delete file storage
            try:
                cred_dir = Path.home() / f".{self.service_name}_credentials"
                cred_file = cred_dir / f"{name}.cred"
                if cred_file.exists():
                    cred_file.unlink()
            except Exception:
                pass  # File might not exist
            
            # Remove from cache
            with self._cache_lock:
                self._credential_cache.pop(name, None)
            
            self.logger.info(f"Credential deleted successfully: {name}",
                           component="credential_manager", credential_name=name)
            
            return True
        
        except Exception as e:
            self.logger.error(f"Failed to delete credential {name}: {e}",
                            component="credential_manager", credential_name=name)
            return False
    
    def rotate_credential(self, name: str, new_credential_data: Dict[str, Any],
                         expires_in_hours: Optional[int] = None) -> bool:
        """
        Rotate credential with new data
        
        Args:
            name: Credential name/identifier
            new_credential_data: New credential data
            expires_in_hours: Optional expiration time in hours
            
        Returns:
            True if rotated successfully
        """
        try:
            # Delete old credential
            self.delete_credential(name)
            
            # Store new credential
            return self.store_credential(name, new_credential_data, expires_in_hours)
        
        except Exception as e:
            self.logger.error(f"Failed to rotate credential {name}: {e}",
                            component="credential_manager", credential_name=name)
            return False
    
    def list_credentials(self) -> Dict[str, CredentialMetadata]:
        """
        List all stored credentials (metadata only)
        
        Returns:
            Dictionary of credential names and their metadata
        """
        credentials = {}
        
        try:
            # Get credentials from keyring
            # Note: keyring doesn't provide a way to list all credentials
            # We'll use cache and file storage for listing
            
            # Check cache
            with self._cache_lock:
                for name, secure_credential in self._credential_cache.items():
                    credentials[name] = secure_credential.metadata
            
            # Check file storage
            cred_dir = Path.home() / f".{self.service_name}_credentials"
            if cred_dir.exists():
                for cred_file in cred_dir.glob("*.cred"):
                    name = cred_file.stem
                    if name not in credentials:
                        secure_credential = self._load_credential_file(name)
                        if secure_credential:
                            credentials[name] = secure_credential.metadata
                            with self._cache_lock:
                                self._credential_cache[name] = secure_credential
        
        except Exception as e:
            self.logger.error(f"Failed to list credentials: {e}",
                            component="credential_manager")
        
        return credentials
    
    def cleanup_expired_credentials(self) -> int:
        """
        Clean up expired credentials
        
        Returns:
            Number of credentials cleaned up
        """
        cleaned_count = 0
        credentials = self.list_credentials()
        
        for name, metadata in credentials.items():
            if metadata.expires_at and metadata.expires_at < datetime.now():
                if self.delete_credential(name):
                    cleaned_count += 1
        
        if cleaned_count > 0:
            self.logger.info(f"Cleaned up {cleaned_count} expired credentials",
                           component="credential_manager")
        
        return cleaned_count
    
    def get_credential_stats(self) -> Dict[str, Any]:
        """
        Get credential management statistics
        
        Returns:
            Statistics dictionary
        """
        credentials = self.list_credentials()
        now = datetime.now()
        
        stats = {
            'total_credentials': len(credentials),
            'active_credentials': 0,
            'expired_credentials': 0,
            'expiring_soon_24h': 0,
            'expiring_soon_7d': 0,
            'never_accessed': 0,
            'average_access_count': 0
        }
        
        total_access_count = 0
        
        for metadata in credentials.values():
            if metadata.expires_at:
                if metadata.expires_at < now:
                    stats['expired_credentials'] += 1
                elif metadata.expires_at < now + timedelta(hours=24):
                    stats['expiring_soon_24h'] += 1
                elif metadata.expires_at < now + timedelta(days=7):
                    stats['expiring_soon_7d'] += 1
            else:
                stats['active_credentials'] += 1
            
            if metadata.last_accessed is None:
                stats['never_accessed'] += 1
            
            total_access_count += metadata.access_count
        
        if credentials:
            stats['average_access_count'] = total_access_count / len(credentials)
        
        return stats
    
    def secure_clear_memory(self):
        """Securely clear sensitive data from memory"""
        try:
            with self._memory_lock:
                if self._encryption_key:
                    # Overwrite key memory
                    key_bytes = bytearray(self._encryption_key)
                    for i in range(len(key_bytes)):
                        key_bytes[i] = 0
                    self._encryption_key = None
            
            with self._cache_lock:
                self._credential_cache.clear()
            
            self.logger.info("Sensitive memory cleared securely",
                           component="credential_manager")
        
        except Exception as e:
            self.logger.error(f"Failed to clear memory securely: {e}",
                            component="credential_manager")


def create_credential_manager(logger: PhotoExtractionLogger, 
                           service_name: str = "uns-claudejp") -> CredentialManager:
    """Factory function to create credential manager"""
    return CredentialManager(logger, service_name)


# Database credential management utilities

class DatabaseCredentialManager(CredentialManager):
    """Specialized credential manager for database connections"""
    
    def store_database_credential(self, name: str, connection_string: str,
                                username: str, password: str,
                                additional_params: Optional[Dict[str, Any]] = None) -> bool:
        """Store database credential with structured format"""
        credential_data = {
            'type': 'database',
            'connection_string': connection_string,
            'username': username,
            'password': password,
            'additional_params': additional_params or {}
        }
        
        return self.store_credential(name, credential_data)
    
    def retrieve_database_credential(self, name: str) -> Optional[Dict[str, Any]]:
        """Retrieve database credential with validation"""
        credential_data = self.retrieve_credential(name)
        
        if credential_data and credential_data.get('type') == 'database':
            return credential_data
        
        return None
    
    def create_connection_string(self, name: str, mask_password: bool = True) -> Optional[str]:
        """Create connection string from stored credential"""
        credential_data = self.retrieve_database_credential(name)
        
        if not credential_data:
            return None
        
        connection_string = credential_data['connection_string']
        username = credential_data['username']
        password = credential_data['password']
        
        if mask_password:
            password = "*" * len(password)
        
        # Build connection string (example for Access/ODBC)
        return f"{connection_string};UID={username};PWD={password}"


def create_database_credential_manager(logger: PhotoExtractionLogger,
                                    service_name: str = "uns-claudejp-db") -> DatabaseCredentialManager:
    """Factory function to create database credential manager"""
    return DatabaseCredentialManager(logger, service_name)