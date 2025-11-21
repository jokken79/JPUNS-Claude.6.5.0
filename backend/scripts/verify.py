"""
Unified Verification Script
============================

This script consolidates all verification functionality into a single CLI tool.

Replaces:
- verify_data.py
- verify_system.py
- verify_all_photos.py
- full_verification.py

Features:
- Verify candidate/employee data integrity
- Verify photo import status and data quality
- Verify system health and services
- Run all verification checks
- Generate comprehensive reports

Usage:
    python verify.py data
    python verify.py photos
    python verify.py system
    python verify.py all

Author: Claude Code
Date: 2025-10-26
Version: 1.0
"""

import sys
import os
import json
import base64
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import create_engine, text, func
from sqlalchemy.orm import sessionmaker
from app.core.database import SessionLocal
from app.models.models import Candidate, Factory, Employee, User

# Image format markers
JPEG_MARKER = b'\xFF\xD8\xFF'
PNG_MARKER = b'\x89\x50\x4E\x47'


def print_header(text: str):
    """Print formatted header"""
    print(f"\n{'='*80}")
    print(f"  {text}")
    print(f"{'='*80}\n")


def print_section(text: str):
    """Print formatted section"""
    print(f"\n{'-'*80}")
    print(f"  {text}")
    print(f"{'-'*80}\n")


def verify_data() -> Dict[str, Any]:
    """Verify candidate and employee data integrity"""
    print_header("DATA VERIFICATION")

    db = SessionLocal()
    results = {
        'candidates': {},
        'employees': {},
        'factories': {},
        'integrity_issues': []
    }

    try:
        # Candidates verification
        print_section("1. Candidates Data")

        total_candidates = db.query(Candidate).count()
        print(f"Total candidates: {total_candidates}")

        if total_candidates > 0:
            # Status distribution
            by_status = db.query(Candidate.status, func.count(Candidate.id)) \
                .group_by(Candidate.status).all()

            print(f"\nCandidates by status:")
            for status, count in by_status:
                print(f"  - {status}: {count}")

            # Visa status distribution
            visa_statuses = db.query(Candidate.visa_status, func.count(Candidate.id)) \
                .group_by(Candidate.visa_status).all()

            print(f"\nVisa status distribution:")
            for visa, count in visa_statuses:
                print(f"  - {visa}: {count}")

            # Data completeness
            with_name = db.query(Candidate).filter(
                Candidate.seimei_romaji != '',
                Candidate.seimei_romaji.isnot(None)
            ).count()

            with_birth_date = db.query(Candidate).filter(
                Candidate.birth_date.isnot(None)
            ).count()

            print(f"\nData completeness:")
            print(f"  With name:       {with_name:4d} ({with_name*100//total_candidates}%)")
            print(f"  With birth date: {with_birth_date:4d} ({with_birth_date*100//total_candidates}%)")

            results['candidates'] = {
                'total': total_candidates,
                'with_name': with_name,
                'with_birth_date': with_birth_date
            }

        # Employees verification
        print_section("2. Employees Data")

        total_employees = db.query(Employee).count()
        print(f"Total employees: {total_employees}")

        if total_employees > 0:
            # By contract type
            haken = db.query(Employee).filter(Employee.contract_type == '派遣').count()
            ukeoi = db.query(Employee).filter(Employee.contract_type == '請負').count()
            staff = db.query(Employee).filter(Employee.contract_type == 'スタッフ').count()

            print(f"\nBy contract type:")
            print(f"  派遣社員 (Dispatch): {haken:4d}")
            print(f"  請負社員 (Contract): {ukeoi:4d}")
            print(f"  スタッフ (Staff):    {staff:4d}")

            # By status
            active = db.query(Employee).filter(Employee.is_active == True).count()
            inactive = db.query(Employee).filter(Employee.is_active == False).count()

            print(f"\nBy status:")
            print(f"  Activos:   {active:4d}")
            print(f"  Inactivos: {inactive:4d}")

            # Salary statistics
            avg_jikyu = db.query(func.avg(Employee.jikyu)).filter(Employee.jikyu > 0).scalar()
            min_jikyu = db.query(func.min(Employee.jikyu)).filter(Employee.jikyu > 0).scalar()
            max_jikyu = db.query(func.max(Employee.jikyu)).filter(Employee.jikyu > 0).scalar()

            if avg_jikyu:
                print(f"\nSalary statistics (時給):")
                print(f"  Average: ¥{int(avg_jikyu)}/h")
                print(f"  Minimum: ¥{int(min_jikyu)}/h")
                print(f"  Maximum: ¥{int(max_jikyu)}/h")

            # Factory assignments
            with_factory = db.query(Employee).filter(Employee.factory_id.isnot(None)).count()
            without_factory = db.query(Employee).filter(Employee.factory_id.is_(None)).count()

            print(f"\nFactory assignments:")
            print(f"  With factory_id:  {with_factory:4d}")
            print(f"  Without factory:  {without_factory:4d}")

            results['employees'] = {
                'total': total_employees,
                'active': active,
                'with_factory': with_factory
            }

        # Factories verification
        print_section("3. Factories Data")

        total_factories = db.query(Factory).count()
        active_factories = db.query(Factory).filter(Factory.is_active == True).count()

        print(f"Total factories: {total_factories}")
        print(f"Active factories: {active_factories}")

        # Check for empty names
        empty_names = db.query(Factory).filter(
            (Factory.name == '') | (Factory.name == '-') | (Factory.name.is_(None))
        ).count()

        if empty_names > 0:
            print(f"WARNING: {empty_names} factories with empty name")
            results['integrity_issues'].append(f"{empty_names} factories with empty names")

        results['factories'] = {
            'total': total_factories,
            'active': active_factories
        }

        # Data integrity checks
        print_section("4. Data Integrity Checks")

        # Check for duplicate employee IDs
        duplicate_ids = db.query(Employee.hakenmoto_id, func.count(Employee.hakenmoto_id)).group_by(
            Employee.hakenmoto_id
        ).having(func.count(Employee.hakenmoto_id) > 1).all()

        if duplicate_ids:
            print(f"WARNING: {len(duplicate_ids)} duplicate employee IDs")
            for emp_id, count in duplicate_ids[:5]:
                print(f"  ID {emp_id}: {count} records")
            results['integrity_issues'].append(f"{len(duplicate_ids)} duplicate employee IDs")
        else:
            print("OK: No duplicate employee IDs")

        # Check for invalid jikyu
        invalid_jikyu = db.query(Employee).filter(
            (Employee.jikyu < 0) | (Employee.jikyu > 10000)
        ).count()

        if invalid_jikyu > 0:
            print(f"WARNING: {invalid_jikyu} employees with invalid 時給")
            results['integrity_issues'].append(f"{invalid_jikyu} employees with invalid 時給")
        else:
            print("OK: All employees have valid 時給")

        # Check factory foreign key integrity
        employees_with_factory = db.query(Employee).filter(
            Employee.factory_id.isnot(None)
        ).all()

        invalid_factory_refs = 0
        for emp in employees_with_factory:
            factory_exists = db.query(Factory).filter(Factory.factory_id == emp.factory_id).first()
            if not factory_exists:
                invalid_factory_refs += 1

        if invalid_factory_refs > 0:
            print(f"WARNING: {invalid_factory_refs} employees with invalid factory_id")
            results['integrity_issues'].append(f"{invalid_factory_refs} invalid factory references")
        else:
            print("OK: All factory references are valid")

        # Sample employees
        print_section("5. Sample Employees")

        active_employees = db.query(Employee).filter(
            Employee.is_active == True,
            Employee.jikyu > 0
        ).limit(10).all()

        print(f"{'ID':>7} | {'Name':^30} | {'Type':^8} | {'Salary':>6} | {'Status':^10}")
        print("-" * 80)

        for e in active_employees:
            status = "ACTIVE" if e.is_active else "INACTIVE"
            name = e.full_name_kanji if hasattr(e, 'full_name_kanji') else 'N/A'
            print(f"{e.hakenmoto_id:7d} | {name:^30} | {e.contract_type:^8} | ¥{e.jikyu:5d} | {status:^10}")

    except Exception as e:
        print(f"ERROR: {e}")
        results['error'] = str(e)

    finally:
        db.close()

    return results


def verify_photos() -> Dict[str, Any]:
    """Verify photo import status and data quality"""
    print_header("PHOTO VERIFICATION")

    db = SessionLocal()
    results = {
        'candidates': {},
        'employees': {},
        'quality': {},
        'issues': []
    }

    try:
        # Candidates with photos
        print_section("1. Photo Coverage")

        candidates_with_photos = db.query(Candidate).filter(
            Candidate.photo_data_url.isnot(None),
            Candidate.photo_data_url != ''
        ).all()

        candidates_without_photos = db.query(Candidate).filter(
            (Candidate.photo_data_url.is_(None)) | (Candidate.photo_data_url == '')
        ).count()

        total_candidates = len(candidates_with_photos) + candidates_without_photos

        print(f"Candidates:")
        print(f"  Total candidates:  {total_candidates}")
        print(f"  With photos:       {len(candidates_with_photos)}")
        print(f"  Without photos:    {candidates_without_photos}")

        if total_candidates > 0:
            percentage = (len(candidates_with_photos) * 100) // total_candidates
            print(f"  Coverage:          {percentage}%")

        results['candidates'] = {
            'total': total_candidates,
            'with_photos': len(candidates_with_photos),
            'without_photos': candidates_without_photos,
            'coverage_percent': percentage if total_candidates > 0 else 0
        }

        # Employees with photos
        employees_with_photos = db.query(Employee).filter(
            Employee.photo_data_url.isnot(None),
            Employee.photo_data_url != ''
        ).count()

        print(f"\nEmployees:")
        print(f"  With photos:       {employees_with_photos}")

        results['employees'] = {
            'with_photos': employees_with_photos
        }

        # Photo quality verification
        print_section("2. Photo Quality Verification")

        valid_jpeg = 0
        valid_png = 0
        corrupted = 0
        corrupted_list = []

        print(f"Verifying {len(candidates_with_photos)} photos...")

        for i, candidate in enumerate(candidates_with_photos, 1):
            try:
                base64_data = candidate.photo_data_url.split(',', 1)[1] if ',' in candidate.photo_data_url else candidate.photo_data_url
                image_bytes = base64.b64decode(base64_data)

                if image_bytes.startswith(JPEG_MARKER):
                    valid_jpeg += 1
                elif image_bytes.startswith(PNG_MARKER):
                    valid_png += 1
                else:
                    corrupted += 1
                    first_4 = image_bytes[:4].hex()
                    corrupted_list.append((candidate.id, first_4))

                if i % 200 == 0:
                    print(f"  Checked: {i}/{len(candidates_with_photos)} | JPEG: {valid_jpeg} | PNG: {valid_png} | Corrupted: {corrupted}")

            except Exception as e:
                corrupted += 1
                corrupted_list.append((candidate.id, f"ERROR: {str(e)}"))

        print(f"\nPhoto Quality Results:")
        print(f"  Valid JPEG:        {valid_jpeg}")
        print(f"  Valid PNG:         {valid_png}")
        print(f"  Corrupted:         {corrupted}")

        results['quality'] = {
            'valid_jpeg': valid_jpeg,
            'valid_png': valid_png,
            'corrupted': corrupted
        }

        if corrupted_list:
            print(f"\nCORRUPTED PHOTOS:")
            for candidate_id, header in corrupted_list[:20]:
                print(f"  Candidate ID {candidate_id}: {header}")
            if len(corrupted_list) > 20:
                print(f"  ... and {len(corrupted_list) - 20} more")
            results['issues'] = corrupted_list
        else:
            print("\nALL PHOTOS ARE VALID!")

    except Exception as e:
        print(f"ERROR: {e}")
        results['error'] = str(e)

    finally:
        db.close()

    return results


def verify_system() -> Dict[str, Any]:
    """Verify system health and services"""
    print_header("SYSTEM VERIFICATION")

    results = {
        'database': False,
        'users': {},
        'config_files': {},
        'issues': []
    }

    try:
        # Database connection
        print_section("1. Database Connection")

        db = SessionLocal()
        result = db.execute(text("SELECT 1")).scalar()
        db.close()

        print("OK: Database connection successful")
        results['database'] = True

        # Users
        print_section("2. User Accounts")

        db = SessionLocal()
        total_users = db.query(User).count()
        print(f"Total users: {total_users}")

        admin = db.query(User).filter(User.username == "admin").first()
        if admin:
            print(f"OK: Admin user exists ({admin.email})")
            results['users']['admin_exists'] = True
        else:
            print("WARNING: Admin user not found")
            results['users']['admin_exists'] = False
            results['issues'].append("Admin user not found")

        if total_users > 0:
            print(f"\nAll users:")
            users = db.query(User).all()
            for user in users:
                print(f"  - {user.username} ({user.email}) - Role: {user.role}")

        results['users']['total'] = total_users
        db.close()

        # Configuration files
        print_section("3. Configuration Files")

        config_checks = {
            'company.json': '/app/config/company.json',
            'factories_index.json': '/app/config/factories_index.json',
            'employee_master.xlsm': '/app/config/employee_master.xlsm',
            'KaishaInfo.xlsx': '/app/config/KaishaInfo.xlsx'
        }

        for name, path in config_checks.items():
            if os.path.exists(path):
                size_mb = os.path.getsize(path) / (1024 * 1024)
                print(f"OK: {name} exists ({size_mb:.1f} MB)")
                results['config_files'][name] = True
            else:
                print(f"WARNING: {name} NOT FOUND")
                results['config_files'][name] = False
                results['issues'].append(f"{name} not found")

        # Factory directory
        print_section("4. Factory Configuration Files")

        factories_dir = Path("/app/config/factories")
        backup_dir = Path("/app/config/factories/backup")

        if factories_dir.exists():
            json_files = list(factories_dir.glob("*.json"))
            print(f"OK: Factories directory exists")
            print(f"  JSON files: {len(json_files)}")

            if len(json_files) > 0:
                print(f"\n  Sample factory files:")
                for f in json_files[:3]:
                    print(f"    - {f.name}")
            else:
                print(f"  WARNING: No factory files found")
                results['issues'].append("No factory JSON files")

            results['config_files']['factory_files'] = len(json_files)

        if backup_dir.exists():
            backup_files = list(backup_dir.glob("*.json"))
            print(f"\nOK: Backup directory exists")
            print(f"  Backup files: {len(backup_files)}")

        # Service URLs
        print_section("5. Service Endpoints")

        print("Expected service URLs:")
        print("  Frontend:    http://localhost:3000")
        print("  Backend API: http://localhost:8000")
        print("  API Docs:    http://localhost:8000/api/docs")
        print("  Adminer:     http://localhost:8080")

    except Exception as e:
        print(f"ERROR: {e}")
        results['error'] = str(e)

    return results


def verify_all():
    """Run all verification checks"""
    print(f"\n{'='*80}")
    print(f"  UNS-CLAUDEJP 5.0 - COMPLETE SYSTEM VERIFICATION")
    print(f"  Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*80}")

    results = {
        'data': verify_data(),
        'photos': verify_photos(),
        'system': verify_system()
    }

    # Final summary
    print_header("VERIFICATION SUMMARY")

    all_issues = []
    all_issues.extend(results['data'].get('integrity_issues', []))
    all_issues.extend(results['photos'].get('issues', []))
    all_issues.extend(results['system'].get('issues', []))

    if all_issues:
        print(f"WARNING: {len(all_issues)} issues found:")
        for issue in all_issues[:10]:
            print(f"  - {issue}")
        if len(all_issues) > 10:
            print(f"  ... and {len(all_issues) - 10} more issues")
    else:
        print("ALL SYSTEMS OPERATIONAL!")

    # Key statistics
    print(f"\nKey Statistics:")
    print(f"  Candidates:        {results['data']['candidates'].get('total', 0)}")
    print(f"  Employees:         {results['data']['employees'].get('total', 0)}")
    print(f"  Factories:         {results['data']['factories'].get('total', 0)}")
    print(f"  Photos (Candidates): {results['photos']['candidates'].get('with_photos', 0)}")
    print(f"  Valid Photos:      {results['photos']['quality'].get('valid_jpeg', 0) + results['photos']['quality'].get('valid_png', 0)}")
    print(f"  Users:             {results['system']['users'].get('total', 0)}")

    if results['system']['users'].get('admin_exists'):
        print(f"\nReady to use:")
        print(f"  1. Open http://localhost:3000")
        print(f"  2. Login with: admin / admin123")
        print(f"  3. Navigate to Candidatos to see imported data")

    print(f"\n{'='*80}\n")

    return results


# CLI Commands
import click

@click.group()
def cli():
    """Unified verification service for UNS-ClaudeJP 5.2"""
    pass


@cli.command()
def data():
    """Verify candidate/employee data integrity"""
    verify_data()


@cli.command()
def photos():
    """Verify photo import status and quality"""
    verify_photos()


@cli.command()
def system():
    """Verify system health and services"""
    verify_system()


@cli.command()
def all():
    """Run all verification checks"""
    verify_all()


if __name__ == '__main__':
    cli()
