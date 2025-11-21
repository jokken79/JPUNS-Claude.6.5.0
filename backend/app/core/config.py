"""Configuration settings for UNS-ClaudeJP 6.0.0."""

import logging
import os
from typing import Optional

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    # App Info
    APP_NAME: str = "UNS-ClaudeJP"
    APP_VERSION: str = "6.0.0"
    COMPANY_NAME: str = "UNS-Kikaku"
    COMPANY_WEBSITE: str = "https://uns-kikaku.com"
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

    # Database - REQUIRED, no defaults
    DATABASE_URL: str

    # Redis Cache (Optional - app works without it)
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # Security - REQUIRED, no defaults
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 horas
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7  # 7 días - refresh tokens expire after 7 days
    JWT_AUDIENCE: str = "uns-claudejp::api"
    JWT_ISSUER: str = "uns-claudejp"

    # Cookie Settings (for HttpOnly JWT cookies)
    COOKIE_SECURE: bool = os.getenv("ENVIRONMENT", "development") == "production"  # True in production (HTTPS only)
    COOKIE_HTTPONLY: bool = True  # Always true - prevents XSS attacks
    COOKIE_SAMESITE: str = "lax"  # "strict", "lax", or "none" - CSRF protection
    COOKIE_DOMAIN: Optional[str] = None  # None = current domain only
    ACCESS_TOKEN_COOKIE_NAME: str = "access_token"
    REFRESH_TOKEN_COOKIE_NAME: str = "refresh_token"

    # Rate Limiting Configuration
    RATE_LIMIT_ENABLED: bool = True  # Enable/disable rate limiting globally
    RATE_LIMIT_GLOBAL: str = "100/minute"  # Global limit for all endpoints (100 requests per minute)
    RATE_LIMIT_AUTH_LOGIN: str = "5/minute"  # Login endpoint (stricter)
    RATE_LIMIT_AUTH_REGISTER: str = "3/hour"  # Registration endpoint (very strict)
    RATE_LIMIT_AUTH_REFRESH: str = "10/minute"  # Token refresh endpoint
    RATE_LIMIT_UPLOAD: str = "10/minute"  # File upload endpoints (OCR, timer cards)
    RATE_LIMIT_SENSITIVE: str = "20/minute"  # Sensitive endpoints (candidates, employees CRUD)
    RATE_LIMIT_READ: str = "60/minute"  # Read-only endpoints (GET requests)

    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v):
        if not v or v in ["your-secret-key-change-in-production", "CHANGE_THIS"]:
            raise ValueError(
                "SECRET_KEY must be set to a secure random value. "
                "Generate one with: python -c 'import secrets; print(secrets.token_urlsafe(64))'"
            )
        if len(v) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters long")
        return v

    @field_validator("DATABASE_URL")
    @classmethod
    def validate_database_url(cls, v):
        if not v or "CHANGE_THIS" in v:
            raise ValueError("DATABASE_URL must be properly configured")
        return v

    # File Upload
    MAX_UPLOAD_SIZE: int = 10485760  # 10MB
    ALLOWED_EXTENSIONS: list[str] = ["pdf", "jpg", "jpeg", "png", "xlsx", "xls"]
    UPLOAD_DIR: str = "/app/uploads"

    @field_validator("ALLOWED_EXTENSIONS", mode="before")
    @classmethod
    def _parse_allowed_extensions(cls, v):
        if isinstance(v, str):
            return [item.strip() for item in v.split(",")]
        return v
    
    # OCR Settings
    OCR_ENABLED: bool = True
    TESSERACT_LANG: str = "jpn+eng"

    # Gemini API (Primary OCR method)
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY")

    # Google Cloud Vision API (Backup OCR method)
    GOOGLE_CLOUD_VISION_ENABLED: bool = os.getenv("GOOGLE_CLOUD_VISION_ENABLED", "false").lower() == "true"
    GOOGLE_CLOUD_VISION_API_KEY: Optional[str] = os.getenv("GOOGLE_CLOUD_VISION_API_KEY")
    GOOGLE_APPLICATION_CREDENTIALS: Optional[str] = None

    # Azure Computer Vision API
    AZURE_COMPUTER_VISION_ENDPOINT: Optional[str] = os.getenv("AZURE_COMPUTER_VISION_ENDPOINT")
    AZURE_COMPUTER_VISION_KEY: Optional[str] = os.getenv("AZURE_COMPUTER_VISION_KEY")
    AZURE_COMPUTER_VISION_API_VERSION: str = os.getenv("AZURE_COMPUTER_VISION_API_VERSION", "2023-02-01-preview")

    @field_validator("OCR_ENABLED")
    @classmethod
    def validate_ocr_enabled(cls, v, info):
        if v:
            values = info.data
            # Check if at least one OCR provider is configured
            azure_available = bool(values.get('AZURE_COMPUTER_VISION_ENDPOINT') and values.get('AZURE_COMPUTER_VISION_KEY'))
            if not azure_available:
                logger.warning("OCR_ENABLED=True but no OCR providers configured. OCR will fall back to EasyOCR/Tesseract.")
        return v

    # Email/SMTP Settings (for notifications)
    SMTP_SERVER: str = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: Optional[str] = os.getenv("SMTP_USER")
    SMTP_PASSWORD: Optional[str] = os.getenv("SMTP_PASSWORD")
    SMTP_FROM: str = os.getenv("SMTP_FROM", "noreply@uns-kikaku.com")
    
    # LINE Notification (Optional)
    LINE_CHANNEL_ACCESS_TOKEN: Optional[str] = os.getenv("LINE_CHANNEL_ACCESS_TOKEN")
    
    # WhatsApp (Optional)
    WHATSAPP_ENABLED: bool = False
    WHATSAPP_TOKEN: Optional[str] = os.getenv("WHATSAPP_TOKEN")
    WHATSAPP_PHONE_ID: Optional[str] = os.getenv("WHATSAPP_PHONE_ID")
    
    # ID Configuration
    RIREKISHO_ID_PREFIX: str = "UNS-"
    RIREKISHO_ID_START: int = 1000
    FACTORY_ID_PREFIX: str = "Factory-"
    FACTORY_ID_START: int = 1
    
    # Salary Calculation (DEPRECATED - Use PayrollSettings from database)
    # These values are kept for backward compatibility and as fallbacks only
    # The system now uses PayrollSettings table in the database for dynamic configuration
    OVERTIME_RATE_25: float = 0.25
    OVERTIME_RATE_35: float = 0.35
    NIGHT_SHIFT_PREMIUM: float = 0.25
    HOLIDAY_WORK_PREMIUM: float = 0.35
    
    # Yukyu Settings
    YUKYU_INITIAL_DAYS: int = 10
    YUKYU_AFTER_MONTHS: int = 6
    YUKYU_MAX_DAYS: int = 20
    HANKYU_ENABLED: bool = True
    
    # Apartment Management
    APARTMENT_CALC_ENABLED: bool = True
    APARTMENT_PRORATE_BY_DAY: bool = True
    
    # Reports Settings
    REPORTS_DIR: str = "/app/reports"
    REPORTS_LOGO_PATH: Optional[str] = None
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "/app/logs/uns-claudejp.log"

    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"

    # Telemetry / Observability
    ENABLE_TELEMETRY: bool = os.getenv("ENABLE_TELEMETRY", "true").lower() == "true"
    OTEL_SERVICE_NAME: str = os.getenv("OTEL_SERVICE_NAME", "uns-claudejp-backend")
    OTEL_EXPORTER_OTLP_ENDPOINT: str = os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://otel-collector:4317")
    OTEL_EXPORTER_OTLP_METRICS_ENDPOINT: str = os.getenv("OTEL_EXPORTER_OTLP_METRICS_ENDPOINT", "http://otel-collector:4317")
    OTEL_METRICS_EXPORT_INTERVAL_MS: int = int(os.getenv("OTEL_METRICS_EXPORT_INTERVAL_MS", "60000"))
    PROMETHEUS_METRICS_PATH: str = os.getenv("PROMETHEUS_METRICS_PATH", "/metrics")

    # CORS
    BACKEND_CORS_ORIGINS: list[str] | str = os.getenv(
        "BACKEND_CORS_ORIGINS",
        "http://localhost,http://localhost:3000,http://127.0.0.1:3000",
    )
    ADDITIONAL_TRUSTED_HOSTS: list[str] | str = os.getenv("ADDITIONAL_TRUSTED_HOSTS", "")
    
    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def _parse_cors_origins(cls, value):
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    @field_validator("ADDITIONAL_TRUSTED_HOSTS", mode="before")
    @classmethod
    def _parse_trusted_hosts(cls, value):
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore",  # Ignorar variables de entorno adicionales
    )


settings = Settings()


class PayrollConfig:
    """
    Payroll Configuration - Dynamic values from database.

    These are DEFAULT values used as fallbacks when:
    1. Database is not available
    2. PayrollSettings table is empty
    3. Initial system setup

    The actual system uses PayrollSettings table from the database,
    managed by PayrollConfigService (backend/app/services/config_service.py).

    DO NOT change these values directly. Use the database settings instead:
    - Access via: PayrollConfigService.get_configuration()
    - Update via: PayrollConfigService.update_configuration(**kwargs)

    These default values follow Japanese labor law:
    - Overtime (時間外): 125% (1.25)
    - Night shift (深夜): 125% (1.25)
    - Holiday (休日): 135% (1.35)
    - Sunday (日曜): 135% (1.35)
    - Standard hours: 160 per month
    """

    # ==================== Hour Rates (時間単価) ====================
    # These rates are multipliers for base hourly wage

    DEFAULT_OVERTIME_RATE: float = 1.25  # 125% - 時間外割増 (Overtime premium)
    DEFAULT_NIGHT_RATE: float = 1.25     # 125% - 深夜割増 (Night shift premium)
    DEFAULT_HOLIDAY_RATE: float = 1.35   # 135% - 休日割増 (Holiday premium)
    DEFAULT_SUNDAY_RATE: float = 1.35    # 135% - 日曜割増 (Sunday premium)

    # Standard working hours per month (標準労働時間)
    DEFAULT_STANDARD_HOURS: int = 160    # 160 hours/month (8h/day × 20 days)

    # ==================== Tax & Insurance Rates (%) ====================
    # These are percentage rates applied to gross salary

    DEFAULT_INCOME_TAX_RATE: float = 10.0           # 所得税 (Income tax)
    DEFAULT_RESIDENT_TAX_RATE: float = 5.0          # 住民税 (Resident tax)
    DEFAULT_HEALTH_INSURANCE_RATE: float = 4.75     # 健康保険 (Health insurance)
    DEFAULT_PENSION_RATE: float = 10.0              # 厚生年金 (Pension insurance)
    DEFAULT_EMPLOYMENT_INSURANCE_RATE: float = 0.3  # 雇用保険 (Employment insurance)

    # ==================== Documentation ====================
    @classmethod
    def get_all_defaults(cls) -> dict:
        """
        Get all default configuration values as a dictionary.

        Returns:
            dict: All default configuration values

        Example:
            >>> defaults = PayrollConfig.get_all_defaults()
            >>> print(defaults['DEFAULT_OVERTIME_RATE'])
            1.25
        """
        return {
            'overtime_rate': cls.DEFAULT_OVERTIME_RATE,
            'night_shift_rate': cls.DEFAULT_NIGHT_RATE,
            'holiday_rate': cls.DEFAULT_HOLIDAY_RATE,
            'sunday_rate': cls.DEFAULT_SUNDAY_RATE,
            'standard_hours_per_month': cls.DEFAULT_STANDARD_HOURS,
            'income_tax_rate': cls.DEFAULT_INCOME_TAX_RATE,
            'resident_tax_rate': cls.DEFAULT_RESIDENT_TAX_RATE,
            'health_insurance_rate': cls.DEFAULT_HEALTH_INSURANCE_RATE,
            'pension_rate': cls.DEFAULT_PENSION_RATE,
            'employment_insurance_rate': cls.DEFAULT_EMPLOYMENT_INSURANCE_RATE
        }
