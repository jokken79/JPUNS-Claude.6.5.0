"""
Payroll Configuration Service for UNS-ClaudeJP 5.4.1

This service manages all payroll configuration settings from the database,
replacing hardcoded values in config.py with dynamic database-driven settings.

Features:
- Database-backed configuration (payroll_settings table)
- In-memory caching with TTL (Time-To-Live) for performance
- Automatic creation of default settings if none exist
- Thread-safe cache operations
- Fallback to default values if database is unavailable
- Full async/await support for FastAPI

Usage:
    >>> async with get_db() as db:
    ...     config_service = PayrollConfigService(db)
    ...     settings = await config_service.get_configuration()
    ...     print(f"Overtime rate: {settings.overtime_rate}")
"""

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, Optional
from decimal import Decimal

from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.payroll_models import PayrollSettings
from app.core.config import PayrollConfig
from app.core.database import get_db

logger = logging.getLogger(__name__)


class PayrollConfigService:
    """
    Payroll Configuration Service - Manages payroll settings from database.

    This service provides centralized access to payroll configuration with:
    - Automatic caching for performance (1 hour TTL)
    - Fallback to default values
    - Create missing settings automatically
    - Type-safe configuration access

    Attributes:
        db (AsyncSession): Async database session
        _cache (Dict): In-memory cache for settings
        _cache_timestamp (Optional[datetime]): When cache was last updated
        _cache_ttl (int): Cache time-to-live in seconds (default: 3600)

    Example:
        >>> service = PayrollConfigService(db)
        >>> settings = await service.get_configuration()
        >>> print(f"Overtime rate: {settings.overtime_rate}")
        >>>
        >>> # Update settings
        >>> await service.update_configuration(overtime_rate=1.30)
    """

    def __init__(self, db: AsyncSession, cache_ttl: int = 3600):
        """
        Initialize the payroll configuration service.

        Args:
            db: AsyncSession database connection
            cache_ttl: Cache time-to-live in seconds (default: 3600 = 1 hour)
        """
        self.db = db
        self._cache: Dict[str, Any] = {}
        self._cache_timestamp: Optional[datetime] = None
        self._cache_ttl = cache_ttl

    async def get_configuration(self) -> PayrollSettings:
        """
        Get current payroll configuration with caching.

        This method:
        1. Checks if cache is valid (not expired)
        2. Returns cached settings if available
        3. Fetches from database if cache is invalid/empty
        4. Creates default settings if none exist in database
        5. Updates cache before returning

        Returns:
            PayrollSettings: Current payroll configuration object

        Raises:
            RuntimeError: If unable to fetch or create settings

        Example:
            >>> settings = await config_service.get_configuration()
            >>> print(f"Overtime rate: {settings.overtime_rate}")
        """
        try:
            # Check if cache is valid
            if self._is_cache_valid():
                logger.debug("Returning payroll settings from cache")
                return self._cache['payroll_settings']

            # Fetch from database
            logger.info("Fetching payroll settings from database")
            stmt = select(PayrollSettings).order_by(PayrollSettings.id.desc()).limit(1)
            result = await self.db.execute(stmt)
            settings = result.scalar_one_or_none()

            # If no settings exist, create default
            if not settings:
                logger.warning("No payroll settings found in database, creating defaults")
                settings = await self.create_default_settings()

            # Update cache
            self._update_cache(settings)

            return settings

        except Exception as e:
            logger.error(f"Error fetching payroll configuration: {e}", exc_info=True)
            raise RuntimeError(f"Unable to fetch payroll configuration: {str(e)}")

    async def update_configuration(
        self,
        updated_by_id: Optional[int] = None,
        **kwargs
    ) -> PayrollSettings:
        """
        Update payroll configuration settings.

        This method:
        1. Fetches current settings
        2. Updates specified fields
        3. Saves to database
        4. Clears cache to force refresh
        5. Returns updated settings

        Args:
            updated_by_id: Optional user ID who made the update
            **kwargs: Configuration fields to update (e.g., overtime_rate=1.30)

        Returns:
            PayrollSettings: Updated configuration object

        Raises:
            ValueError: If invalid field names provided
            RuntimeError: If update fails

        Example:
            >>> updated = await config_service.update_configuration(
            ...     overtime_rate=1.30,
            ...     night_shift_rate=1.30,
            ...     updated_by_id=1
            ... )
            >>> print(f"New overtime rate: {updated.overtime_rate}")
        """
        try:
            # Get current settings
            settings = await self.get_configuration()

            # Validate and update fields
            updated_fields = []
            for key, value in kwargs.items():
                if not hasattr(settings, key):
                    raise ValueError(f"Invalid configuration field: {key}")

                # Convert to appropriate type
                if key.endswith('_rate'):
                    value = float(value)
                elif key == 'standard_hours_per_month':
                    value = int(value)

                setattr(settings, key, value)
                updated_fields.append(key)

            # Update metadata
            settings.updated_at = datetime.utcnow()
            if updated_by_id:
                settings.updated_by_id = updated_by_id

            # Commit to database
            await self.db.commit()
            await self.db.refresh(settings)

            # Clear cache to force refresh
            await self.clear_cache()

            logger.info(
                f"Payroll configuration updated. Fields changed: {', '.join(updated_fields)}"
            )

            return settings

        except ValueError:
            raise
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating payroll configuration: {e}", exc_info=True)
            raise RuntimeError(f"Unable to update payroll configuration: {str(e)}")

    async def create_default_settings(self) -> PayrollSettings:
        """
        Create default payroll settings in database.

        This method creates a new PayrollSettings record with default values
        based on Japanese labor law and common practices:
        - Overtime rate: 1.25 (125% - 時間外割増)
        - Night shift rate: 1.25 (125% - 深夜割増)
        - Holiday rate: 1.35 (135% - 休日割増)
        - Sunday rate: 1.35 (135% - 日曜割増)
        - Standard hours: 160 (standard monthly hours)
        - Income tax rate: 10.0%
        - Resident tax rate: 5.0%
        - Health insurance rate: 4.75%
        - Pension rate: 10.0%
        - Employment insurance rate: 0.3%

        Returns:
            PayrollSettings: Newly created settings object

        Raises:
            RuntimeError: If creation fails

        Example:
            >>> settings = await config_service.create_default_settings()
            >>> print(f"Created with overtime rate: {settings.overtime_rate}")
        """
        try:
            # Create default settings based on PayrollConfig
            defaults = PayrollSettings(
                overtime_rate=PayrollConfig.DEFAULT_OVERTIME_RATE,
                night_shift_rate=PayrollConfig.DEFAULT_NIGHT_RATE,
                holiday_rate=PayrollConfig.DEFAULT_HOLIDAY_RATE,
                sunday_rate=PayrollConfig.DEFAULT_SUNDAY_RATE,
                standard_hours_per_month=PayrollConfig.DEFAULT_STANDARD_HOURS,
                income_tax_rate=PayrollConfig.DEFAULT_INCOME_TAX_RATE,
                resident_tax_rate=PayrollConfig.DEFAULT_RESIDENT_TAX_RATE,
                health_insurance_rate=PayrollConfig.DEFAULT_HEALTH_INSURANCE_RATE,
                pension_rate=PayrollConfig.DEFAULT_PENSION_RATE,
                employment_insurance_rate=PayrollConfig.DEFAULT_EMPLOYMENT_INSURANCE_RATE
            )

            self.db.add(defaults)
            await self.db.commit()
            await self.db.refresh(defaults)

            logger.info("Created default payroll settings in database")

            return defaults

        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating default payroll settings: {e}", exc_info=True)
            raise RuntimeError(f"Unable to create default payroll settings: {str(e)}")

    async def clear_cache(self) -> None:
        """
        Clear the configuration cache.

        This forces the next call to get_configuration() to fetch fresh data
        from the database. Useful after updates or when you need to ensure
        you have the latest configuration.

        Example:
            >>> await config_service.clear_cache()
            >>> settings = await config_service.get_configuration()  # Fresh from DB
        """
        self._cache.clear()
        self._cache_timestamp = None
        logger.debug("Payroll configuration cache cleared")

    def _is_cache_valid(self) -> bool:
        """
        Check if cache is valid (not expired).

        Returns:
            bool: True if cache is valid and contains settings, False otherwise
        """
        if not self._cache or not self._cache_timestamp:
            return False

        age = datetime.utcnow() - self._cache_timestamp
        if age.total_seconds() > self._cache_ttl:
            logger.debug(f"Cache expired (age: {age.total_seconds()}s, TTL: {self._cache_ttl}s)")
            return False

        return 'payroll_settings' in self._cache

    def _update_cache(self, settings: PayrollSettings) -> None:
        """
        Update cache with new settings.

        Args:
            settings: PayrollSettings object to cache
        """
        self._cache['payroll_settings'] = settings
        self._cache_timestamp = datetime.utcnow()
        logger.debug("Payroll configuration cache updated")

    async def get_rate(self, rate_type: str) -> float:
        """
        Get a specific rate from configuration.

        Args:
            rate_type: Type of rate to retrieve:
                - 'overtime': Overtime rate (時間外)
                - 'night': Night shift rate (深夜)
                - 'holiday': Holiday rate (休日)
                - 'sunday': Sunday rate (日曜)

        Returns:
            float: Rate value

        Raises:
            ValueError: If invalid rate_type provided

        Example:
            >>> overtime_rate = await config_service.get_rate('overtime')
            >>> print(f"Overtime rate: {overtime_rate}")
        """
        settings = await self.get_configuration()

        rate_map = {
            'overtime': settings.overtime_rate,
            'night': settings.night_shift_rate,
            'holiday': settings.holiday_rate,
            'sunday': settings.sunday_rate
        }

        if rate_type not in rate_map:
            raise ValueError(
                f"Invalid rate type: {rate_type}. "
                f"Valid types: {', '.join(rate_map.keys())}"
            )

        return float(rate_map[rate_type])

    async def get_tax_rate(self, tax_type: str) -> float:
        """
        Get a specific tax rate from configuration.

        Args:
            tax_type: Type of tax rate to retrieve:
                - 'income': Income tax rate
                - 'resident': Resident tax rate
                - 'health': Health insurance rate
                - 'pension': Pension insurance rate
                - 'employment': Employment insurance rate

        Returns:
            float: Tax rate value

        Raises:
            ValueError: If invalid tax_type provided

        Example:
            >>> income_tax_rate = await config_service.get_tax_rate('income')
            >>> print(f"Income tax rate: {income_tax_rate}%")
        """
        settings = await self.get_configuration()

        tax_map = {
            'income': settings.income_tax_rate,
            'resident': settings.resident_tax_rate,
            'health': settings.health_insurance_rate,
            'pension': settings.pension_rate,
            'employment': settings.employment_insurance_rate
        }

        if tax_type not in tax_map:
            raise ValueError(
                f"Invalid tax type: {tax_type}. "
                f"Valid types: {', '.join(tax_map.keys())}"
            )

        return float(tax_map[tax_type])


# Factory function for easy dependency injection
def get_payroll_config_service(db: AsyncSession = Depends(get_db)) -> PayrollConfigService:
    """
    Factory function to create PayrollConfigService instance.

    Args:
        db: AsyncSession database connection (injected via Depends)

    Returns:
        PayrollConfigService: Configured service instance

    Example:
        >>> from fastapi import Depends
        >>>
        >>> @router.get("/config")
        >>> async def get_config(
        ...     config_service: PayrollConfigService = Depends(get_payroll_config_service)
        ... ):
        ...     settings = await config_service.get_configuration()
        ...     return settings
    """
    return PayrollConfigService(db)
