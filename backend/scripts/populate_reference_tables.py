#!/usr/bin/env python3
"""
Populate Reference Tables with Default Data
============================================
This script populates the reference tables (regions, departments,
residence_types, residence_statuses) with initial data.
"""

import sys
import os

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.models import Region, Department, ResidenceType, ResidenceStatus
from app.core.config import settings


def populate_residence_types(session):
    """Populate residence_types table with default data"""
    print("\n📝 Populating residence_types...")

    residence_types_data = [
        {'name': 'アパート', 'description': 'Apartment/Studio'},
        {'name': 'マンション', 'description': 'Mansion/Condo'},
        {'name': '一軒家', 'description': 'Detached House'},
        {'name': '寮', 'description': 'Company Dormitory'},
        {'name': 'その他', 'description': 'Other'}
    ]

    for data in residence_types_data:
        existing = session.query(ResidenceType).filter_by(name=data['name']).first()
        if not existing:
            residence_type = ResidenceType(**data)
            session.add(residence_type)
            print(f"  ✅ Added: {data['name']}")
        else:
            print(f"  ⏭️  Skipped (exists): {data['name']}")

    session.commit()


def populate_residence_statuses(session):
    """Populate residence_statuses table with default data"""
    print("\n📝 Populating residence_statuses...")

    residence_statuses_data = [
        {
            'name': '技術・人文知識・国際業務',
            'code': 'TECH_HUMANITIES_INTL',
            'description': 'Engineer/Specialist in Humanities/Int\'l Services',
            'max_duration_months': 60
        },
        {
            'name': '特定技能',
            'code': 'SPECIFIED_SKILLS',
            'description': 'Specified Skilled Worker',
            'max_duration_months': 60
        },
        {
            'name': '留学',
            'code': 'STUDENT',
            'description': 'Student',
            'max_duration_months': 24
        },
        {
            'name': '家族滞在',
            'code': 'DEPENDENT',
            'description': 'Dependent Visa',
            'max_duration_months': 36
        },
        {
            'name': '日本人の配偶者等',
            'code': 'SPOUSE_JAPANESE',
            'description': 'Spouse of Japanese National',
            'max_duration_months': 60
        },
        {
            'name': '永住者',
            'code': 'PERMANENT_RESIDENT',
            'description': 'Permanent Resident',
            'max_duration_months': None
        },
        {
            'name': '定住者',
            'code': 'SETTLED_RESIDENT',
            'description': 'Settled Resident',
            'max_duration_months': 60
        },
        {
            'name': '短期滞在',
            'code': 'TEMPORARY_VISITOR',
            'description': 'Temporary Visitor',
            'max_duration_months': 3
        }
    ]

    for data in residence_statuses_data:
        existing = session.query(ResidenceStatus).filter_by(code=data['code']).first()
        if not existing:
            residence_status = ResidenceStatus(**data)
            session.add(residence_status)
            print(f"  ✅ Added: {data['name']} ({data['code']})")
        else:
            print(f"  ⏭️  Skipped (exists): {data['name']}")

    session.commit()


def populate_regions(session):
    """Populate regions table with default data"""
    print("\n📝 Populating regions...")

    regions_data = [
        {'name': '愛知県', 'description': 'Aichi Prefecture'},
        {'name': '東京都', 'description': 'Tokyo Metropolis'},
        {'name': '大阪府', 'description': 'Osaka Prefecture'},
        {'name': '神奈川県', 'description': 'Kanagawa Prefecture'},
        {'name': '埼玉県', 'description': 'Saitama Prefecture'},
        {'name': '千葉県', 'description': 'Chiba Prefecture'},
        {'name': 'その他', 'description': 'Other Regions'}
    ]

    for data in regions_data:
        existing = session.query(Region).filter_by(name=data['name']).first()
        if not existing:
            region = Region(**data)
            session.add(region)
            print(f"  ✅ Added: {data['name']}")
        else:
            print(f"  ⏭️  Skipped (exists): {data['name']}")

    session.commit()


def populate_departments(session):
    """Populate departments table with default data"""
    print("\n📝 Populating departments...")

    departments_data = [
        {'name': '総務部', 'description': 'General Affairs'},
        {'name': '人事部', 'description': 'Human Resources'},
        {'name': '営業部', 'description': 'Sales Department'},
        {'name': '経理部', 'description': 'Accounting Department'},
        {'name': '製造部', 'description': 'Manufacturing Department'},
        {'name': '品質管理部', 'description': 'Quality Control'},
        {'name': 'その他', 'description': 'Other Departments'}
    ]

    for data in departments_data:
        existing = session.query(Department).filter_by(name=data['name']).first()
        if not existing:
            department = Department(**data)
            session.add(department)
            print(f"  ✅ Added: {data['name']}")
        else:
            print(f"  ⏭️  Skipped (exists): {data['name']}")

    session.commit()


def main():
    """Main function to populate all reference tables"""
    print("=" * 80)
    print("🚀 Populating Reference Tables with Default Data")
    print("=" * 80)

    # Create database connection
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()

    try:
        # Populate each table
        populate_residence_types(session)
        populate_residence_statuses(session)
        populate_regions(session)
        populate_departments(session)

        print("\n" + "=" * 80)
        print("✅ All reference tables populated successfully!")
        print("=" * 80)

        # Show counts
        print("\n📊 Summary:")
        print(f"  - Residence Types: {session.query(ResidenceType).count()}")
        print(f"  - Residence Statuses: {session.query(ResidenceStatus).count()}")
        print(f"  - Regions: {session.query(Region).count()}")
        print(f"  - Departments: {session.query(Department).count()}")
        print()

    except Exception as e:
        print(f"\n❌ Error: {e}")
        session.rollback()
        sys.exit(1)
    finally:
        session.close()


if __name__ == "__main__":
    main()
