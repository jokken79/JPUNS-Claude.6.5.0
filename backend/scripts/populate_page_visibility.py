#!/usr/bin/env python3
"""
Script to populate Page Visibility Settings
Controls which pages are visible to users in UNS-ClaudeJP
"""
import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from datetime import datetime

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.core.database import Base, engine
from app.models.models import PageVisibility

# Page definitions
PAGES = [
    # Dashboard & Core
    {
        'page_key': 'dashboard',
        'page_name': 'ダッシュボード',
        'page_name_en': 'Dashboard',
        'is_enabled': True,
        'path': '/dashboard',
        'description': 'Main dashboard with statistics and overview',
    },
    {
        'page_key': 'candidates',
        'page_name': '候補者管理',
        'page_name_en': 'Candidates',
        'is_enabled': True,
        'path': '/candidates',
        'description': 'Manage job candidates and applications',
    },
    {
        'page_key': 'employees',
        'page_name': '従業員管理',
        'page_name_en': 'Employees',
        'is_enabled': True,
        'path': '/employees',
        'description': 'Manage dispatched employees',
    },
    {
        'page_key': 'factories',
        'page_name': '工場管理',
        'page_name_en': 'Factories',
        'is_enabled': True,
        'path': '/factories',
        'description': 'Manage client factories and work sites',
    },
    {
        'page_key': 'apartments',
        'page_name': '住宅管理',
        'page_name_en': 'Apartments',
        'is_enabled': True,
        'path': '/apartments',
        'description': 'Manage employee housing and apartments',
    },
    {
        'page_key': 'timercards',
        'page_name': 'タイムカード',
        'page_name_en': 'Time Cards',
        'is_enabled': True,
        'path': '/timercards',
        'description': 'Attendance tracking and time management',
    },
    {
        'page_key': 'salary',
        'page_name': '給与管理',
        'page_name_en': 'Salary',
        'is_enabled': True,
        'path': '/salary',
        'description': 'Payroll calculations and salary management',
    },
    {
        'page_key': 'requests',
        'page_name': '申請管理',
        'page_name_en': 'Requests',
        'is_enabled': True,
        'path': '/requests',
        'description': 'Leave requests and workflow management',
    },

    # Reports & Analytics
    {
        'page_key': 'reports',
        'page_name': 'レポート',
        'page_name_en': 'Reports',
        'is_enabled': True,
        'path': '/reports',
        'description': 'Analytics and reporting dashboard',
    },

    # Additional Pages
    {
        'page_key': 'design-system',
        'page_name': 'デザインシステム',
        'page_name_en': 'Design System',
        'is_enabled': True,
        'path': '/design-system',
        'description': 'UI components and design system showcase',
    },
    {
        'page_key': 'examples-forms',
        'page_name': 'フォーム例',
        'page_name_en': 'Examples - Forms',
        'is_enabled': True,
        'path': '/examples/forms',
        'description': 'Example forms and input components',
    },
    {
        'page_key': 'support',
        'page_name': 'サポート',
        'page_name_en': 'Support',
        'is_enabled': True,
        'path': '/support',
        'description': 'Help and support documentation',
    },
    {
        'page_key': 'help',
        'page_name': 'ヘルプ',
        'page_name_en': 'Help',
        'is_enabled': True,
        'path': '/help',
        'description': 'User help and guides',
    },
    {
        'page_key': 'privacy',
        'page_name': 'プライバシーポリシー',
        'page_name_en': 'Privacy Policy',
        'is_enabled': True,
        'path': '/privacy',
        'description': 'Privacy policy and data handling',
    },
    {
        'page_key': 'terms',
        'page_name': '利用規約',
        'page_name_en': 'Terms of Service',
        'is_enabled': True,
        'path': '/terms',
        'description': 'Terms and conditions of use',
    },
]

def populate_page_visibility():
    """Populate the page_visibility table with all pages"""
    try:
        # Create engine and session
        engine = create_engine(
            "postgresql://uns_admin:uns_password@uns-claudejp-db:5432/uns_claudejp",
            echo=False
        )

        SessionLocal = sessionmaker(bind=engine)
        db = SessionLocal()

        # Check if table exists and has data
        result = db.execute(text("SELECT COUNT(*) FROM page_visibility"))
        count = result.scalar()

        if count > 0:
            print(f"✅ Table already has {count} pages. Skipping population.")
            db.close()
            return

        # Insert all pages
        for page_data in PAGES:
            page = PageVisibility(**page_data)
            db.add(page)

        db.commit()
        print(f"✅ Successfully populated {len(PAGES)} pages in page_visibility table")

        # Verify insertion
        result = db.execute(text("SELECT COUNT(*) FROM page_visibility"))
        final_count = result.scalar()
        print(f"✅ Total pages in database: {final_count}")

        db.close()

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    print("🚀 Populating Page Visibility Settings...")
    populate_page_visibility()
    print("✨ Done!")
