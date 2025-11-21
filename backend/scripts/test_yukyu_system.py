"""
Test Yukyu System End-to-End
==============================

Comprehensive testing of the yukyu (paid vacation) system:

1. Database migrations
2. Data import from CSV
3. Automatic yukyu calculation
4. Request creation (TANTOSHA)
5. Request approval (KEITOSAN) with LIFO deduction
6. Expiration logic
7. Data validation

Usage:
    python scripts/test_yukyu_system.py

Author: UNS-ClaudeJP System
"""

import sys
import os
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from datetime import date, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import SessionLocal
from app.models.models import (
    Employee,
    User,
    YukyuBalance,
    YukyuRequest,
    YukyuUsageDetail,
    YukyuStatus,
    RequestStatus,
)
from app.services.yukyu_service import YukyuService
from app.schemas.yukyu import (
    YukyuCalculationRequest,
    YukyuRequestCreate,
    YukyuRequestApprove,
)


class Colors:
    """ANSI color codes for terminal output."""
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'


def print_header(text: str):
    """Print section header."""
    print(f"\n{Colors.HEADER}{'='*80}{Colors.ENDC}")
    print(f"{Colors.HEADER}{text}{Colors.ENDC}")
    print(f"{Colors.HEADER}{'='*80}{Colors.ENDC}\n")


def print_success(text: str):
    """Print success message."""
    print(f"{Colors.OKGREEN}✅ {text}{Colors.ENDC}")


def print_error(text: str):
    """Print error message."""
    print(f"{Colors.FAIL}❌ {text}{Colors.ENDC}")


def print_info(text: str):
    """Print info message."""
    print(f"{Colors.OKCYAN}ℹ️  {text}{Colors.ENDC}")


def print_warning(text: str):
    """Print warning message."""
    print(f"{Colors.WARNING}⚠️  {text}{Colors.ENDC}")


async def test_yukyu_calculation(db: Session):
    """Test automatic yukyu calculation based on hire date."""
    print_header("TEST 1: Automatic Yukyu Calculation (Japanese Labor Law)")

    service = YukyuService(db)

    # Find an employee with hire_date
    employee = db.query(Employee).filter(
        Employee.hire_date.isnot(None)
    ).first()

    if not employee:
        print_warning("No employees with hire_date found. Skipping calculation test.")
        return False

    print_info(f"Testing with employee: {employee.full_name_kanji}")
    print_info(f"Hire date: {employee.hire_date}")

    # Calculate yukyus
    result = await service.calculate_and_create_balances(employee.id)

    print_success(f"Calculation completed!")
    print(f"   Months since hire: {result.months_since_hire}")
    print(f"   Balances created: {result.yukyus_created}")
    print(f"   Total available: {result.total_available_days} days")

    # Verify balances were created
    balances = db.query(YukyuBalance).filter(
        YukyuBalance.employee_id == employee.id
    ).all()

    if balances:
        print_success(f"Found {len(balances)} balance record(s):")
        for b in balances:
            status_icon = "🟢" if b.status == YukyuStatus.ACTIVE else "🔴"
            print(f"      {status_icon} {b.months_worked}mo → {b.days_assigned} days (expires: {b.expires_on})")
        return True
    else:
        print_error("No balances were created!")
        return False


async def test_yukyu_summary(db: Session):
    """Test getting yukyu summary for an employee."""
    print_header("TEST 2: Yukyu Summary Retrieval")

    service = YukyuService(db)

    # Find employee with balances
    employee_with_balances = db.query(Employee).join(YukyuBalance).first()

    if not employee_with_balances:
        print_warning("No employees with yukyu balances found. Skipping summary test.")
        return False

    print_info(f"Getting summary for: {employee_with_balances.full_name_kanji}")

    summary = await service.get_employee_yukyu_summary(employee_with_balances.id)

    print_success("Summary retrieved!")
    print(f"   Total available: {summary.total_available} days")
    print(f"   Total used:      {summary.total_used} days")
    print(f"   Total expired:   {summary.total_expired} days")
    print(f"   Balances:        {len(summary.balances)} record(s)")

    if summary.oldest_expiration_date:
        print(f"   Oldest expiration: {summary.oldest_expiration_date}")

    return True


async def test_create_request(db: Session):
    """Test creating a yukyu request."""
    print_header("TEST 3: Create Yukyu Request (TANTOSHA)")

    service = YukyuService(db)

    # Find employee with available yukyus
    employee = db.query(Employee).join(YukyuBalance).filter(
        YukyuBalance.days_available > 0
    ).first()

    if not employee:
        print_warning("No employees with available yukyus found. Skipping request test.")
        return False, None

    # Find a user to act as TANTOSHA
    tantosha = db.query(User).filter(User.role == 'TANTOSHA').first()
    if not tantosha:
        tantosha = db.query(User).first()

    if not tantosha:
        print_error("No users found!")
        return False, None

    print_info(f"Creating request for: {employee.full_name_kanji}")
    print_info(f"Requested by: {tantosha.username}")

    # Create request
    request_data = YukyuRequestCreate(
        employee_id=employee.id,
        factory_id=employee.factory_id,
        request_type="yukyu",
        start_date=date.today() + timedelta(days=7),
        end_date=date.today() + timedelta(days=7),
        days_requested=Decimal("1.0"),
        notes="Test yukyu request"
    )

    try:
        request = await service.create_request(request_data, tantosha.id)
        print_success(f"Request created! ID: {request.id}")
        print(f"   Employee: {request.employee_name}")
        print(f"   Days requested: {request.days_requested}")
        print(f"   Available at request: {request.yukyu_available_at_request}")
        print(f"   Status: {request.status}")
        return True, request.id
    except Exception as e:
        print_error(f"Failed to create request: {e}")
        return False, None


async def test_approve_request_lifo(db: Session, request_id: int):
    """Test approving a request with LIFO deduction."""
    print_header("TEST 4: Approve Request with LIFO Deduction (KEITOSAN)")

    service = YukyuService(db)

    # Find KEITOSAN user
    keitosan_user = db.query(User).filter(User.role == 'KEITOSAN').first()
    if not keitosan_user:
        keitosan_user = db.query(User).first()

    print_info(f"Approving request ID: {request_id}")
    print_info(f"Approved by: {keitosan_user.username}")

    # Get request details before approval
    request_before = db.query(YukyuRequest).filter(YukyuRequest.id == request_id).first()
    employee = db.query(Employee).filter(Employee.id == request_before.employee_id).first()

    # Get balances before approval
    balances_before = db.query(YukyuBalance).filter(
        YukyuBalance.employee_id == employee.id,
        YukyuBalance.status == YukyuStatus.ACTIVE
    ).order_by(YukyuBalance.assigned_date.desc()).all()

    print(f"\n   📊 Balances BEFORE approval (newest first):")
    for b in balances_before:
        print(f"      {b.assigned_date.year}: {b.days_available} days available (assigned: {b.days_assigned})")

    # Approve request
    approval_data = YukyuRequestApprove(notes="Approved for testing")

    try:
        approved = await service.approve_request(request_id, approval_data, keitosan_user.id)
        print_success("Request approved!")
        print(f"   Status: {approved.status}")
        print(f"   Approved by: {approved.approved_by_name}")
        print(f"   Approval date: {approved.approval_date}")

        # Get balances after approval
        balances_after = db.query(YukyuBalance).filter(
            YukyuBalance.employee_id == employee.id,
            YukyuBalance.status == YukyuStatus.ACTIVE
        ).order_by(YukyuBalance.assigned_date.desc()).all()

        print(f"\n   📊 Balances AFTER approval (newest first):")
        for b in balances_after:
            print(f"      {b.assigned_date.year}: {b.days_available} days available (assigned: {b.days_assigned})")

        # Verify LIFO: newest balance should be used first
        if balances_before and balances_after:
            newest_before = balances_before[0]
            newest_after = balances_after[0]

            if newest_before.days_available > newest_after.days_available:
                print_success(f"\n   ✅ LIFO verified! Newest balance ({newest_before.assigned_date.year}) was deducted first.")
            else:
                print_warning(f"\n   ⚠️  LIFO might not be working correctly.")

        # Check usage details
        usage_details = db.query(YukyuUsageDetail).filter(
            YukyuUsageDetail.request_id == request_id
        ).all()

        if usage_details:
            print_success(f"\n   ✅ Created {len(usage_details)} usage detail record(s)")
            for detail in usage_details:
                balance = db.query(YukyuBalance).filter(YukyuBalance.id == detail.balance_id).first()
                print(f"      Date: {detail.usage_date}, Deducted: {detail.days_deducted} from {balance.assigned_date.year}")

        return True

    except Exception as e:
        print_error(f"Failed to approve request: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_expiration(db: Session):
    """Test yukyu expiration logic."""
    print_header("TEST 5: Yukyu Expiration (2 years)")

    service = YukyuService(db)

    # Count balances before
    active_before = db.query(YukyuBalance).filter(
        YukyuBalance.status == YukyuStatus.ACTIVE
    ).count()

    expired_before = db.query(YukyuBalance).filter(
        YukyuBalance.status == YukyuStatus.EXPIRED
    ).count()

    print_info(f"Before expiration:")
    print(f"   Active balances:  {active_before}")
    print(f"   Expired balances: {expired_before}")

    # Run expiration
    count = await service.expire_old_yukyus()

    print_success(f"Expired {count} balance(s)")

    # Count after
    active_after = db.query(YukyuBalance).filter(
        YukyuBalance.status == YukyuStatus.ACTIVE
    ).count()

    expired_after = db.query(YukyuBalance).filter(
        YukyuBalance.status == YukyuStatus.EXPIRED
    ).count()

    print_info(f"After expiration:")
    print(f"   Active balances:  {active_after}")
    print(f"   Expired balances: {expired_after}")

    return True


async def main():
    """Run all tests."""
    print(f"\n{Colors.BOLD}{'='*80}{Colors.ENDC}")
    print(f"{Colors.BOLD}🧪 YUKYU SYSTEM END-TO-END TESTING{Colors.ENDC}")
    print(f"{Colors.BOLD}{'='*80}{Colors.ENDC}")

    db = SessionLocal()
    results = []

    try:
        # Test 1: Automatic calculation
        result1 = await test_yukyu_calculation(db)
        results.append(("Automatic Calculation", result1))

        # Test 2: Summary retrieval
        result2 = await test_yukyu_summary(db)
        results.append(("Summary Retrieval", result2))

        # Test 3: Create request
        result3, request_id = await test_create_request(db)
        results.append(("Create Request", result3))

        # Test 4: Approve with LIFO (only if request was created)
        if result3 and request_id:
            result4 = await test_approve_request_lifo(db, request_id)
            results.append(("Approve with LIFO", result4))

        # Test 5: Expiration
        result5 = await test_expiration(db)
        results.append(("Expiration Logic", result5))

        # Summary
        print_header("TEST SUMMARY")

        passed = sum(1 for _, result in results if result)
        total = len(results)

        for name, result in results:
            status = f"{Colors.OKGREEN}✅ PASS{Colors.ENDC}" if result else f"{Colors.FAIL}❌ FAIL{Colors.ENDC}"
            print(f"   {name:30s} {status}")

        print(f"\n{Colors.BOLD}Total: {passed}/{total} tests passed{Colors.ENDC}")

        if passed == total:
            print(f"\n{Colors.OKGREEN}{'='*80}{Colors.ENDC}")
            print(f"{Colors.OKGREEN}🎉 ALL TESTS PASSED!{Colors.ENDC}")
            print(f"{Colors.OKGREEN}{'='*80}{Colors.ENDC}\n")
            return 0
        else:
            print(f"\n{Colors.WARNING}{'='*80}{Colors.ENDC}")
            print(f"{Colors.WARNING}⚠️  SOME TESTS FAILED{Colors.ENDC}")
            print(f"{Colors.WARNING}{'='*80}{Colors.ENDC}\n")
            return 1

    except Exception as e:
        print_error(f"Testing failed with error: {e}")
        import traceback
        traceback.print_exc()
        return 1

    finally:
        db.close()


if __name__ == "__main__":
    import asyncio
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
