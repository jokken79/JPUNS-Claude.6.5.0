"""
Production Configuration Module
UNS-CLAUDEJP 5.4 - Production Security Hardening

This module provides production-ready configuration with security policies,
performance tuning, and operational parameters.
"""

import os
import json
import logging
from typing import Dict, Any, List, Optional, Union
from dataclasses import dataclass, field
from pathlib import Path
from enum import Enum

from backend.security import (
    AuditConfiguration,
    create_security_audit_logger
)
from backend.utils.logging_utils import create_logger
from backend.config.photo_extraction_config import PhotoExtractionConfig


class Environment(Enum):
    """Environment types"""
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"


class SecurityLevel(Enum):
    """Security levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class SecurityConfig:
    """Security configuration settings"""
    enable_authentication: bool = True
    enable_authorization: bool = True
    enable_input_validation: bool = True
    enable_output_sanitization: bool = True
    enable_audit_logging: bool = True
    enable_encryption: bool = True
    enable_rate_limiting: bool = True
    enable_cors_protection: bool = True
    enable_csrf_protection: bool = True
    enable_security_headers: bool = True
    session_timeout_minutes: int = 30
    max_login_attempts: int = 5
    lockout_duration_minutes: int = 15
    password_min_length: int = 12
    password_require_special_chars: bool = True
    password_require_numbers: bool = True
    password_require_uppercase: bool = True
    password_require_lowercase: bool = True
    enable_2fa: bool = True
    allowed_ip_ranges: List[str] = field(default_factory=list)
    blocked_ip_ranges: List[str] = field(default_factory=list)
    security_level: SecurityLevel = SecurityLevel.HIGH


@dataclass
class PerformanceConfig:
    """Performance configuration settings"""
    enable_caching: bool = True
    cache_ttl_seconds: int = 3600
    enable_connection_pooling: bool = True
    max_connections: int = 100
    connection_timeout_seconds: int = 30
    enable_compression: bool = True
    compression_level: int = 6
    enable_async_processing: bool = True
    max_workers: int = 4
    worker_timeout_seconds: int = 300
    enable_monitoring: bool = True
    metrics_retention_days: int = 30
    enable_profiling: bool = False
    memory_limit_mb: int = 2048
    cpu_limit_percent: float = 80.0


@dataclass
class DatabaseConfig:
    """Database configuration settings"""
    connection_pool_size: int = 20
    connection_pool_timeout: int = 30
    connection_pool_recycle: int = 3600
    connection_pool_pre_ping: bool = True
    echo_sql: bool = False
    echo_pool: bool = False
    enable_query_logging: bool = True
    slow_query_threshold_seconds: float = 1.0
    enable_connection_ssl: bool = True
    ssl_cert_path: Optional[str] = None
    ssl_key_path: Optional[str] = None
    ssl_ca_path: Optional[str] = None
    enable_backup: bool = True
    backup_interval_hours: int = 6
    backup_retention_days: int = 30


@dataclass
class LoggingConfig:
    """Logging configuration settings"""
    level: str = "INFO"
    enable_file_logging: bool = True
    enable_console_logging: bool = True
    enable_structured_logging: bool = True
    log_rotation_mb: int = 100
    log_retention_days: int = 90
    enable_compression: bool = True
    log_directory: str = "./logs"
    audit_log_directory: str = "./audit_logs"
    error_log_directory: str = "./error_logs"
    access_log_directory: str = "./access_logs"
    enable_log_aggregation: bool = True
    log_aggregation_interval_minutes: int = 5
    enable_log_shipping: bool = False
    log_shipping_endpoint: Optional[str] = None
    log_shipping_format: str = "json"


@dataclass
class MonitoringConfig:
    """Monitoring configuration settings"""
    enable_health_checks: bool = True
    health_check_interval_seconds: int = 30
    enable_metrics_collection: bool = True
    metrics_collection_interval_seconds: int = 60
    enable_alerting: bool = True
    alert_email_recipients: List[str] = field(default_factory=list)
    alert_webhook_urls: List[str] = field(default_factory=list)
    enable_performance_monitoring: bool = True
    enable_resource_monitoring: bool = True
    enable_security_monitoring: bool = True
    enable_business_metrics: bool = True
    dashboard_enabled: bool = True
    dashboard_port: int = 8080
    enable_prometheus: bool = True
    prometheus_port: int = 9090
    enable_grafana: bool = True
    grafana_port: int = 3000


@dataclass
class BackupConfig:
    """Backup configuration settings"""
    enable_automated_backup: bool = True
    backup_interval_hours: int = 6
    backup_retention_days: int = 30
    backup_directory: str = "./backups"
    enable_encryption: bool = True
    compression_enabled: bool = True
    enable_offsite_backup: bool = False
    offsite_backup_endpoint: Optional[str] = None
    offsite_backup_credentials: Optional[str] = None
    backup_verification_enabled: bool = True
    backup_verification_interval_hours: int = 24


@dataclass
class ProductionConfig:
    """Main production configuration"""
    environment: Environment
    security: SecurityConfig = field(default_factory=SecurityConfig)
    performance: PerformanceConfig = field(default_factory=PerformanceConfig)
    database: DatabaseConfig = field(default_factory=DatabaseConfig)
    logging: LoggingConfig = field(default_factory=LoggingConfig)
    monitoring: MonitoringConfig = field(default_factory=MonitoringConfig)
    backup: BackupConfig = field(default_factory=BackupConfig)
    
    # Photo extraction specific
    photo_extraction: PhotoExtractionConfig = field(default_factory=PhotoExtractionConfig)
    
    # General settings
    debug_enabled: bool = False
    maintenance_mode: bool = False
    timezone: str = "Asia/Tokyo"
    locale: str = "ja_JP.UTF-8"
    
    def __post_init__(self):
        """Post-initialization validation and setup"""
        self._validate_config()
        self._setup_directories()
        self._apply_environment_overrides()
    
    def _validate_config(self):
        """Validate configuration parameters"""
        if self.environment == Environment.PRODUCTION:
            # Production-specific validations
            if self.security.security_level not in [SecurityLevel.HIGH, SecurityLevel.CRITICAL]:
                raise ValueError("Production environment requires HIGH or CRITICAL security level")
            
            if self.debug_enabled:
                raise ValueError("Debug mode must be disabled in production")
            
            if not self.security.enable_authentication:
                raise ValueError("Authentication must be enabled in production")
            
            if not self.security.enable_audit_logging:
                raise ValueError("Audit logging must be enabled in production")
            
            if not self.backup.enable_automated_backup:
                raise ValueError("Automated backup must be enabled in production")
        
        # Performance validations
        if self.performance.max_workers <= 0:
            raise ValueError("max_workers must be positive")
        
        if self.performance.memory_limit_mb <= 0:
            raise ValueError("memory_limit_mb must be positive")
        
        # Security validations
        if self.security.password_min_length < 8:
            raise ValueError("password_min_length must be at least 8")
        
        if self.security.session_timeout_minutes <= 0:
            raise ValueError("session_timeout_minutes must be positive")
    
    def _setup_directories(self):
        """Create necessary directories"""
        directories = [
            Path(self.logging.log_directory),
            Path(self.logging.audit_log_directory),
            Path(self.logging.error_log_directory),
            Path(self.logging.access_log_directory),
            Path(self.backup.backup_directory),
            Path("./monitoring_data"),
            Path("./temp"),
            Path("./cache")
        ]
        
        for directory in directories:
            try:
                directory.mkdir(parents=True, exist_ok=True)
                
                # Set secure permissions in production
                if self.environment == Environment.PRODUCTION:
                    directory.chmod(0o750)
            
            except Exception as e:
                logging.warning(f"Could not create directory {directory}: {e}")
    
    def _apply_environment_overrides(self):
        """Apply environment-specific overrides"""
        if self.environment == Environment.PRODUCTION:
            # Production overrides
            self.logging.level = "WARNING"
            self.performance.enable_profiling = False
            self.database.echo_sql = False
            self.database.echo_pool = False
            
            # Tighten security
            self.security.session_timeout_minutes = 15
            self.security.max_login_attempts = 3
            self.security.lockout_duration_minutes = 30
            
            # Optimize performance
            self.performance.cache_ttl_seconds = 7200  # 2 hours
            self.performance.max_connections = 200
            
        elif self.environment == Environment.STAGING:
            # Staging overrides
            self.logging.level = "INFO"
            self.performance.enable_profiling = True
            self.database.echo_sql = False
            
            # Moderate security
            self.security.session_timeout_minutes = 60
            self.security.max_login_attempts = 5
            self.security.lockout_duration_minutes = 15
            
        elif self.environment == Environment.DEVELOPMENT:
            # Development overrides
            self.logging.level = "DEBUG"
            self.performance.enable_profiling = True
            self.database.echo_sql = True
            self.database.echo_pool = True
            
            # Relaxed security for development
            self.security.enable_2fa = False
            self.security.session_timeout_minutes = 120
            self.security.max_login_attempts = 10
            self.security.lockout_duration_minutes = 5
    
    @classmethod
    def from_file(cls, config_path: str) -> 'ProductionConfig':
        """Load configuration from JSON file"""
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                config_data = json.load(f)
            
            return cls.from_dict(config_data)
        
        except FileNotFoundError:
            logging.warning(f"Config file not found: {config_path}, using defaults")
            return cls(environment=Environment.DEVELOPMENT)
        
        except json.JSONDecodeError as e:
            logging.error(f"Invalid JSON in config file {config_path}: {e}")
            return cls(environment=Environment.DEVELOPMENT)
    
    @classmethod
    def from_dict(cls, config_data: Dict[str, Any]) -> 'ProductionConfig':
        """Create configuration from dictionary"""
        # Extract main environment
        environment = Environment(config_data.get('environment', 'development'))
        
        # Extract sub-configurations
        security_data = config_data.get('security', {})
        performance_data = config_data.get('performance', {})
        database_data = config_data.get('database', {})
        logging_data = config_data.get('logging', {})
        monitoring_data = config_data.get('monitoring', {})
        backup_data = config_data.get('backup', {})
        photo_extraction_data = config_data.get('photo_extraction', {})
        
        # Create configuration objects
        security_config = SecurityConfig(**security_data)
        performance_config = PerformanceConfig(**performance_data)
        database_config = DatabaseConfig(**database_data)
        logging_config = LoggingConfig(**logging_data)
        monitoring_config = MonitoringConfig(**monitoring_data)
        backup_config = BackupConfig(**backup_data)
        photo_extraction_config = PhotoExtractionConfig.from_dict(photo_extraction_data)
        
        return cls(
            environment=environment,
            security=security_config,
            performance=performance_config,
            database=database_config,
            logging=logging_config,
            monitoring=monitoring_config,
            backup=backup_config,
            photo_extraction=photo_extraction_config,
            debug_enabled=config_data.get('debug_enabled', False),
            maintenance_mode=config_data.get('maintenance_mode', False),
            timezone=config_data.get('timezone', 'Asia/Tokyo'),
            locale=config_data.get('locale', 'ja_JP.UTF-8')
        )
    
    @classmethod
    def from_environment(cls) -> 'ProductionConfig':
        """Load configuration from environment variables"""
        # Determine environment
        env_str = os.getenv('UNS_ENVIRONMENT', 'development').lower()
        environment = Environment(env_str)
        
        # Security settings
        security_config = SecurityConfig(
            enable_authentication=os.getenv('UNS_ENABLE_AUTH', 'true').lower() == 'true',
            enable_authorization=os.getenv('UNS_ENABLE_AUTHZ', 'true').lower() == 'true',
            enable_input_validation=os.getenv('UNS_ENABLE_INPUT_VALIDATION', 'true').lower() == 'true',
            enable_audit_logging=os.getenv('UNS_ENABLE_AUDIT', 'true').lower() == 'true',
            enable_encryption=os.getenv('UNS_ENABLE_ENCRYPTION', 'true').lower() == 'true',
            session_timeout_minutes=int(os.getenv('UNS_SESSION_TIMEOUT', '30')),
            max_login_attempts=int(os.getenv('UNS_MAX_LOGIN_ATTEMPTS', '5')),
            lockout_duration_minutes=int(os.getenv('UNS_LOCKOUT_DURATION', '15')),
            password_min_length=int(os.getenv('UNS_PASSWORD_MIN_LENGTH', '12')),
            security_level=SecurityLevel(os.getenv('UNS_SECURITY_LEVEL', 'high'))
        )
        
        # Performance settings
        performance_config = PerformanceConfig(
            enable_caching=os.getenv('UNS_ENABLE_CACHE', 'true').lower() == 'true',
            cache_ttl_seconds=int(os.getenv('UNS_CACHE_TTL', '3600')),
            max_connections=int(os.getenv('UNS_MAX_CONNECTIONS', '100')),
            max_workers=int(os.getenv('UNS_MAX_WORKERS', '4')),
            memory_limit_mb=int(os.getenv('UNS_MEMORY_LIMIT', '2048')),
            cpu_limit_percent=float(os.getenv('UNS_CPU_LIMIT', '80.0'))
        )
        
        # Database settings
        database_config = DatabaseConfig(
            connection_pool_size=int(os.getenv('UNS_DB_POOL_SIZE', '20')),
            connection_timeout_seconds=int(os.getenv('UNS_DB_TIMEOUT', '30')),
            enable_query_logging=os.getenv('UNS_DB_QUERY_LOGGING', 'true').lower() == 'true',
            enable_backup=os.getenv('UNS_DB_BACKUP', 'true').lower() == 'true'
        )
        
        # Logging settings
        logging_config = LoggingConfig(
            level=os.getenv('UNS_LOG_LEVEL', 'INFO'),
            enable_file_logging=os.getenv('UNS_LOG_FILE', 'true').lower() == 'true',
            enable_console_logging=os.getenv('UNS_LOG_CONSOLE', 'true').lower() == 'true',
            log_rotation_mb=int(os.getenv('UNS_LOG_ROTATION_MB', '100')),
            log_retention_days=int(os.getenv('UNS_LOG_RETENTION_DAYS', '90'))
        )
        
        # Monitoring settings
        monitoring_config = MonitoringConfig(
            enable_health_checks=os.getenv('UNS_HEALTH_CHECKS', 'true').lower() == 'true',
            enable_metrics_collection=os.getenv('UNS_METRICS', 'true').lower() == 'true',
            enable_alerting=os.getenv('UNS_ALERTS', 'true').lower() == 'true',
            dashboard_enabled=os.getenv('UNS_DASHBOARD', 'true').lower() == 'true',
            dashboard_port=int(os.getenv('UNS_DASHBOARD_PORT', '8080'))
        )
        
        # Backup settings
        backup_config = BackupConfig(
            enable_automated_backup=os.getenv('UNS_AUTO_BACKUP', 'true').lower() == 'true',
            backup_interval_hours=int(os.getenv('UNS_BACKUP_INTERVAL', '6')),
            backup_retention_days=int(os.getenv('UNS_BACKUP_RETENTION', '30')),
            enable_encryption=os.getenv('UNS_BACKUP_ENCRYPTION', 'true').lower() == 'true'
        )
        
        return cls(
            environment=environment,
            security=security_config,
            performance=performance_config,
            database=database_config,
            logging=logging_config,
            monitoring=monitoring_config,
            backup=backup_config,
            debug_enabled=os.getenv('UNS_DEBUG', 'false').lower() == 'true',
            maintenance_mode=os.getenv('UNS_MAINTENANCE', 'false').lower() == 'true',
            timezone=os.getenv('UNS_TIMEZONE', 'Asia/Tokyo'),
            locale=os.getenv('UNS_LOCALE', 'ja_JP.UTF-8')
        )
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert configuration to dictionary"""
        return {
            'environment': self.environment.value,
            'security': {
                'enable_authentication': self.security.enable_authentication,
                'enable_authorization': self.security.enable_authorization,
                'enable_input_validation': self.security.enable_input_validation,
                'enable_audit_logging': self.security.enable_audit_logging,
                'enable_encryption': self.security.enable_encryption,
                'session_timeout_minutes': self.security.session_timeout_minutes,
                'max_login_attempts': self.security.max_login_attempts,
                'lockout_duration_minutes': self.security.lockout_duration_minutes,
                'password_min_length': self.security.password_min_length,
                'security_level': self.security.security_level.value
            },
            'performance': {
                'enable_caching': self.performance.enable_caching,
                'cache_ttl_seconds': self.performance.cache_ttl_seconds,
                'max_connections': self.performance.max_connections,
                'max_workers': self.performance.max_workers,
                'memory_limit_mb': self.performance.memory_limit_mb,
                'cpu_limit_percent': self.performance.cpu_limit_percent
            },
            'database': {
                'connection_pool_size': self.database.connection_pool_size,
                'connection_timeout_seconds': self.database.connection_timeout_seconds,
                'enable_query_logging': self.database.enable_query_logging,
                'enable_backup': self.database.enable_backup
            },
            'logging': {
                'level': self.logging.level,
                'enable_file_logging': self.logging.enable_file_logging,
                'enable_console_logging': self.logging.enable_console_logging,
                'log_rotation_mb': self.logging.log_rotation_mb,
                'log_retention_days': self.logging.log_retention_days
            },
            'monitoring': {
                'enable_health_checks': self.monitoring.enable_health_checks,
                'enable_metrics_collection': self.monitoring.enable_metrics_collection,
                'enable_alerting': self.monitoring.enable_alerting,
                'dashboard_enabled': self.monitoring.dashboard_enabled,
                'dashboard_port': self.monitoring.dashboard_port
            },
            'backup': {
                'enable_automated_backup': self.backup.enable_automated_backup,
                'backup_interval_hours': self.backup.backup_interval_hours,
                'backup_retention_days': self.backup.backup_retention_days,
                'enable_encryption': self.backup.enable_encryption
            },
            'debug_enabled': self.debug_enabled,
            'maintenance_mode': self.maintenance_mode,
            'timezone': self.timezone,
            'locale': self.locale
        }
    
    def save_to_file(self, config_path: str):
        """Save configuration to JSON file"""
        try:
            config_path = Path(config_path)
            config_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(config_path, 'w', encoding='utf-8') as f:
                json.dump(self.to_dict(), f, indent=2, ensure_ascii=False)
            
            # Set secure permissions
            if self.environment == Environment.PRODUCTION:
                config_path.chmod(0o600)
            
            logging.info(f"Configuration saved to: {config_path}")
        
        except Exception as e:
            logging.error(f"Failed to save configuration to {config_path}: {e}")
            raise
    
    def get_audit_config(self) -> AuditConfiguration:
        """Get audit configuration"""
        return AuditConfiguration(
            enable_file_logging=self.logging.enable_file_logging,
            enable_database_logging=True,
            enable_tamper_detection=self.security.security_level == SecurityLevel.CRITICAL,
            enable_compression=self.logging.enable_compression,
            log_retention_days=self.logging.log_retention_days,
            max_log_file_size_mb=self.logging.log_rotation_mb,
            database_path="./audit.db",
            log_directory=self.logging.audit_log_directory,
            real_time_monitoring=self.monitoring.enable_security_monitoring
        )
    
    def is_production(self) -> bool:
        """Check if running in production mode"""
        return self.environment == Environment.PRODUCTION
    
    def is_development(self) -> bool:
        """Check if running in development mode"""
        return self.environment == Environment.DEVELOPMENT
    
    def is_staging(self) -> bool:
        """Check if running in staging mode"""
        return self.environment == Environment.STAGING


def load_production_config(config_path: Optional[str] = None) -> ProductionConfig:
    """
    Load production configuration from multiple sources with priority:
    1. Configuration file (if provided)
    2. Environment variables
    3. Default values
    """
    # Try to load from file first
    if config_path and Path(config_path).exists():
        return ProductionConfig.from_file(config_path)
    
    # Try environment variables
    if os.getenv('UNS_ENVIRONMENT'):
        return ProductionConfig.from_environment()
    
    # Default to development
    return ProductionConfig(environment=Environment.DEVELOPMENT)


def create_production_logger(config: ProductionConfig) -> logging.Logger:
    """Create logger based on production configuration"""
    logger = logging.getLogger('uns_production')
    logger.setLevel(getattr(logging, config.logging.level.upper()))
    
    # Clear existing handlers
    logger.handlers.clear()
    
    # Console handler
    if config.logging.enable_console_logging:
        console_handler = logging.StreamHandler()
        console_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        console_handler.setFormatter(console_formatter)
        logger.addHandler(console_handler)
    
    # File handler
    if config.logging.enable_file_logging:
        from logging.handlers import RotatingFileHandler
        
        log_file = Path(config.logging.log_directory) / 'uns_production.log'
        file_handler = RotatingFileHandler(
            log_file,
            maxBytes=config.logging.log_rotation_mb * 1024 * 1024,
            backupCount=5,
            encoding='utf-8'
        )
        
        if config.logging.enable_structured_logging:
            file_formatter = logging.Formatter(
                '{"timestamp": "%(asctime)s", "level": "%(levelname)s", "logger": "%(name)s", "message": "%(message)s"}'
            )
        else:
            file_formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
        
        file_handler.setFormatter(file_formatter)
        logger.addHandler(file_handler)
    
    return logger


# Default configuration file paths
DEFAULT_CONFIG_PATHS = [
    "./config/production_config.json",
    "./production_config.json",
    "../config/production_config.json"
]


def find_config_file() -> Optional[str]:
    """Find configuration file in default locations"""
    for config_path in DEFAULT_CONFIG_PATHS:
        if Path(config_path).exists():
            return config_path
    return None