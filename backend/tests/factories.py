"""
Test data factories for UNS-ClaudeJP backend tests
Provides factory functions for creating test data
"""

from datetime import datetime, date, timedelta
from typing import Dict, Any, Optional
from faker import Faker

fake = Faker()


class UserFactory:
    """Factory for creating User test data."""

    @staticmethod
    def build(**kwargs) -> Dict[str, Any]:
        """Build user data dictionary."""
        return {
            "email": fake.email(),
            "username": fake.user_name(),
            "full_name": fake.name(),
            "password": "TestPassword123!",
            "is_active": True,
            "is_superuser": False,
            **kwargs
        }

    @staticmethod
    def build_admin(**kwargs) -> Dict[str, Any]:
        """Build admin user data."""
        return UserFactory.build(
            is_superuser=True,
            email="admin@example.com",
            username="admin",
            **kwargs
        )


class EmployeeFactory:
    """Factory for creating Employee test data."""

    @staticmethod
    def build(**kwargs) -> Dict[str, Any]:
        """Build employee data dictionary."""
        return {
            "employee_id": fake.bothify(text='EMP###'),
            "name": fake.name(),
            "email": fake.email(),
            "phone": fake.phone_number(),
            "position": fake.job(),
            "department": fake.random_element([
                "Engineering", "Design", "Management", 
                "Sales", "HR", "Finance"
            ]),
            "hire_date": fake.date_between(
                start_date='-2y', 
                end_date='today'
            ).isoformat(),
            "status": "active",
            "salary": fake.random_int(min=50000, max=150000),
            **kwargs
        }

    @staticmethod
    def build_batch(count: int = 5, **kwargs) -> list[Dict[str, Any]]:
        """Build multiple employee records."""
        return [EmployeeFactory.build(**kwargs) for _ in range(count)]


class CandidateFactory:
    """Factory for creating Candidate test data."""

    @staticmethod
    def build(**kwargs) -> Dict[str, Any]:
        """Build candidate data dictionary."""
        return {
            "name": fake.name(),
            "email": fake.email(),
            "phone": fake.phone_number(),
            "status": fake.random_element([
                "applied", "interviewing", "offered", "rejected", "hired"
            ]),
            "position_applied": fake.job(),
            "resume_url": fake.url(),
            "applied_date": fake.date_this_year().isoformat(),
            "notes": fake.text(max_nb_chars=200),
            **kwargs
        }

    @staticmethod
    def build_batch(count: int = 5, **kwargs) -> list[Dict[str, Any]]:
        """Build multiple candidate records."""
        return [CandidateFactory.build(**kwargs) for _ in range(count)]


class TimerCardFactory:
    """Factory for creating Timer Card test data."""

    @staticmethod
    def build(
        employee_id: Optional[str] = None,
        work_date: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Build timer card data dictionary."""
        if work_date is None:
            work_date = fake.date_this_month().isoformat()
        
        clock_in_hour = fake.random_int(min=8, max=9)
        clock_out_hour = fake.random_int(min=17, max=19)
        
        return {
            "employee_id": employee_id or str(fake.random_int(min=1, max=100)),
            "employee_name": fake.name(),
            "work_date": work_date,
            "clock_in": f"{clock_in_hour:02d}:00:00",
            "clock_out": f"{clock_out_hour:02d}:00:00",
            "break_minutes": 60,
            "work_hours": float(clock_out_hour - clock_in_hour - 1),
            "overtime_hours": 0.0,
            "status": fake.random_element(["pending", "approved", "rejected"]),
            **kwargs
        }

    @staticmethod
    def build_week(
        employee_id: str,
        start_date: Optional[date] = None
    ) -> list[Dict[str, Any]]:
        """Build a week of timer cards for an employee."""
        if start_date is None:
            start_date = date.today() - timedelta(days=7)
        
        cards = []
        for i in range(7):
            work_date = start_date + timedelta(days=i)
            # Skip weekends
            if work_date.weekday() < 5:
                cards.append(TimerCardFactory.build(
                    employee_id=employee_id,
                    work_date=work_date.isoformat()
                ))
        
        return cards


class PayrollFactory:
    """Factory for creating Payroll test data."""

    @staticmethod
    def build(
        employee_id: Optional[str] = None,
        period_start: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Build payroll data dictionary."""
        if period_start is None:
            today = date.today()
            period_start = date(today.year, today.month, 1)
        else:
            period_start = date.fromisoformat(period_start)
        
        # Calculate period end (last day of month)
        if period_start.month == 12:
            period_end = date(period_start.year + 1, 1, 1) - timedelta(days=1)
        else:
            period_end = date(period_start.year, period_start.month + 1, 1) - timedelta(days=1)
        
        base_salary = fake.random_int(min=50000, max=150000)
        overtime_pay = fake.random_int(min=0, max=5000)
        deductions = int(base_salary * 0.2)  # 20% deductions
        
        return {
            "employee_id": employee_id or str(fake.random_int(min=1, max=100)),
            "employee_name": fake.name(),
            "period_start": period_start.isoformat(),
            "period_end": period_end.isoformat(),
            "base_salary": base_salary,
            "overtime_pay": overtime_pay,
            "deductions": deductions,
            "net_pay": base_salary + overtime_pay - deductions,
            "status": fake.random_element(["pending", "processed", "paid"]),
            "payment_date": (period_end + timedelta(days=1)).isoformat(),
            **kwargs
        }


class ApartmentFactory:
    """Factory for creating Apartment test data (Yukyu workflow)."""

    @staticmethod
    def build(**kwargs) -> Dict[str, Any]:
        """Build apartment data dictionary."""
        floor = fake.random_int(min=1, max=10)
        unit = fake.random_int(min=1, max=20)
        
        return {
            "apartment_number": f"{floor}{unit:02d}",
            "building": fake.random_element(["Building A", "Building B", "Building C"]),
            "floor": floor,
            "rooms": fake.random_int(min=1, max=4),
            "rent": fake.random_int(min=80000, max=200000),
            "status": fake.random_element(["vacant", "occupied", "maintenance"]),
            "tenant_name": fake.name() if kwargs.get("status") == "occupied" else None,
            "lease_start": fake.date_this_year().isoformat() if kwargs.get("status") == "occupied" else None,
            "lease_end": (date.today() + timedelta(days=730)).isoformat() if kwargs.get("status") == "occupied" else None,
            **kwargs
        }

    @staticmethod
    def build_batch(count: int = 10, **kwargs) -> list[Dict[str, Any]]:
        """Build multiple apartment records."""
        return [ApartmentFactory.build(**kwargs) for _ in range(count)]


# Utility functions

def create_valid_email() -> str:
    """Create a valid email address."""
    return fake.email()


def create_valid_phone() -> str:
    """Create a valid phone number."""
    return fake.phone_number()


def create_past_date(days_ago: int = 30) -> str:
    """Create a date in the past."""
    return (date.today() - timedelta(days=days_ago)).isoformat()


def create_future_date(days_ahead: int = 30) -> str:
    """Create a date in the future."""
    return (date.today() + timedelta(days=days_ahead)).isoformat()


def create_datetime_str(days_ago: int = 0) -> str:
    """Create ISO format datetime string."""
    dt = datetime.now() - timedelta(days=days_ago)
    return dt.isoformat() + 'Z'
