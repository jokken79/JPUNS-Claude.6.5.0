#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Populate Workplaces Table from Excel File
==========================================
Reads the apartment Excel file and extracts unique workplaces,
then populates the workplaces table in the database.
"""

import sys
import os
import pandas as pd

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.models import Workplace, Region
from app.core.config import settings


def parse_workplace_name(workplace_str):
    """
    Parse workplace name to extract company and location.

    Examples:
        "高雄工業 岡山" -> company: "高雄工業", location: "岡山"
        "PATEC" -> company: "PATEC", location: None
        "名古屋" -> company: None, location: "名古屋"
    """
    wp_str = str(workplace_str).strip()

    # Check if it contains a space (company + location)
    if ' ' in wp_str or '　' in wp_str:  # Regular space or Japanese space
        parts = wp_str.replace('　', ' ').split(' ', 1)
        return parts[0], parts[1] if len(parts) > 1 else None

    # Single word workplaces
    # If it contains "工業", "株式会社", etc., it's likely a company
    company_keywords = ['工業', '株式会社', '製作所', 'PATEC', 'PMI', 'フォージ']
    if any(keyword in wp_str for keyword in company_keywords):
        return wp_str, None

    # Otherwise, treat as location
    return None, wp_str


def determine_workplace_type(workplace_name, company, location):
    """Determine the type of workplace"""
    name_lower = workplace_name.lower()

    if any(keyword in workplace_name for keyword in ['工業', '製作所', '株式会社']):
        return 'factory'
    elif any(keyword in workplace_name for keyword in ['本社', 'HQ', '本店']):
        return 'office'
    elif any(keyword in workplace_name for keyword in ['倉庫', 'warehouse']):
        return 'warehouse'
    elif any(keyword in workplace_name for keyword in ['切粉回収', '梱包', '運搬']):
        return 'service'
    else:
        return 'other'


def match_region(location_name, session):
    """Try to match location to existing region"""
    if not location_name:
        return None

    # Direct match
    region = session.query(Region).filter(
        Region.name.like(f'%{location_name}%')
    ).first()

    if region:
        return region.id

    # Try to match by prefecture keywords
    prefecture_map = {
        '岡山': '岡山県',
        '静岡': '静岡県',
        '名古屋': '愛知県',
        '愛知': '愛知県',
        '海南': '和歌山県',
        '春日井': '愛知県',
        '乙川': '愛知県',
        '亀崎': '愛知県',
        '堺': '大阪府',
        '御津': '愛知県',
        '新城': '愛知県',
        '鹿児島': '鹿児島県',
        '志紀': '大阪府'
    }

    for city, prefecture in prefecture_map.items():
        if city in location_name:
            region = session.query(Region).filter_by(name=prefecture).first()
            if region:
                return region.id

    # Default to "その他" region
    other_region = session.query(Region).filter_by(name='その他').first()
    return other_region.id if other_region else None


def populate_workplaces_from_excel(excel_path):
    """Main function to populate workplaces from Excel"""

    print("=" * 100)
    print("POPULATING WORKPLACES FROM EXCEL")
    print("=" * 100)

    # Create database connection
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()

    try:
        # Read Excel file
        print(f"\nReading Excel file: {excel_path}")
        df = pd.read_excel(excel_path, sheet_name='Sheet1', header=None)

        # Extract workplaces from column 3
        workplaces_raw = df[3].dropna()
        workplaces_raw = workplaces_raw[workplaces_raw != '職場']
        workplaces_raw = workplaces_raw[workplaces_raw != '家賃合計']

        unique_workplaces = workplaces_raw.unique()

        print(f"\nFound {len(unique_workplaces)} unique workplaces in Excel")
        print("\nProcessing workplaces...\n")

        added_count = 0
        skipped_count = 0

        for workplace_name in unique_workplaces:
            wp_str = str(workplace_name).strip()

            # Skip empty or invalid entries
            if not wp_str or wp_str == 'nan' or wp_str == '0':
                skipped_count += 1
                continue

            # Check if already exists
            existing = session.query(Workplace).filter_by(name=wp_str).first()
            if existing:
                print(f"  [SKIP] {wp_str:<50} (already exists)")
                skipped_count += 1
                continue

            # Parse workplace name
            company, location = parse_workplace_name(wp_str)
            workplace_type = determine_workplace_type(wp_str, company, location)
            region_id = match_region(location, session)

            # Create new workplace
            workplace = Workplace(
                name=wp_str,
                company_name=company,
                location_name=location,
                workplace_type=workplace_type,
                region_id=region_id,
                is_active=True
            )

            session.add(workplace)
            print(f"  [ADD]  {wp_str:<50} (type: {workplace_type}, region: {region_id})")
            added_count += 1

        # Commit changes
        session.commit()

        print("\n" + "=" * 100)
        print("SUMMARY")
        print("=" * 100)
        print(f"  Added:   {added_count}")
        print(f"  Skipped: {skipped_count}")
        print(f"  Total:   {len(unique_workplaces)}")

        # Show final count
        total_workplaces = session.query(Workplace).count()
        print(f"\n  Total workplaces in database: {total_workplaces}")
        print("=" * 100)

    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()
        session.rollback()
        sys.exit(1)
    finally:
        session.close()


if __name__ == "__main__":
    # Excel file path - try multiple locations
    possible_paths = [
        '/app/BASEDATEJP/家賃控除(社員№入力）.xlsx',  # Docker container path
        r'../BASEDATEJP/家賃控除(社員№入力）.xlsx',
        r'../../BASEDATEJP/家賃控除(社員№入力）.xlsx'
    ]

    excel_path = None
    for path in possible_paths:
        if os.path.exists(path):
            excel_path = path
            break

    if not excel_path:
        print(f"ERROR: Excel file not found in any of these locations:")
        for path in possible_paths:
            print(f"  - {path}")
        sys.exit(1)

    populate_workplaces_from_excel(excel_path)
