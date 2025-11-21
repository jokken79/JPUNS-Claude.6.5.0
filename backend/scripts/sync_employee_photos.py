"""
Sync Photos from Candidates to Employees

Synchronizes photo_data_url from candidates table to employees table
by matching full_name_roman and date_of_birth.

This handles the case where:
- Candidates table has photos (photo_data_url populated)
- Employees table is missing photos (photo_data_url is NULL)
- A candidate can have multiple employees (one per factory assignment)

Usage:
    python sync_employee_photos.py

Requirements:
    - PostgreSQL running
    - SQLAlchemy, psycopg2
"""

import sys
import os
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Tuple
from dotenv import load_dotenv

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'sync_employee_photos_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# PostgreSQL Configuration from environment
POSTGRES_USER = os.getenv('POSTGRES_USER', 'uns_admin')
POSTGRES_PASSWORD = os.getenv('POSTGRES_PASSWORD', '')
POSTGRES_DB = os.getenv('POSTGRES_DB', 'uns_claudejp')
POSTGRES_PORT = os.getenv('POSTGRES_PORT', '5432')

if os.path.exists('/.dockerenv'):
    POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'db')
    logger.info("Running in Docker - using 'db' as hostname")
else:
    POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'localhost')
    logger.info("Running on host - using 'localhost' as hostname")

POSTGRES_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"


def sync_employee_photos() -> Dict[str, Any]:
    """
    Synchronize photos from candidates to employees by name and DOB matching

    Returns:
        Statistics dictionary
    """

    logger.info("=" * 80)
    logger.info("SYNCING PHOTOS FROM CANDIDATES TO EMPLOYEES")
    logger.info("=" * 80)

    # Connect to PostgreSQL
    logger.info(f"\nConnecting to PostgreSQL...")
    try:
        engine = create_engine(POSTGRES_URL)
        Session = sessionmaker(bind=engine)
        db = Session()
    except Exception as e:
        logger.error(f"Failed to connect to PostgreSQL: {e}")
        return {}

    # Statistics
    sync_stats = {
        'total_employees_without_photo': 0,
        'successfully_synced': 0,
        'not_found': 0,
        'errors': 0
    }

    try:
        # Step 1: Get all employees without photos
        logger.info("\nStep 1: Finding employees without photos...")
        sql_get_employees = text("""
            SELECT id, full_name_roman, date_of_birth
            FROM employees
            WHERE photo_data_url IS NULL
            AND full_name_roman IS NOT NULL
            AND date_of_birth IS NOT NULL
            ORDER BY id
        """)

        result = db.execute(sql_get_employees)
        employees_without_photo = result.fetchall()
        sync_stats['total_employees_without_photo'] = len(employees_without_photo)

        logger.info(f"Found {len(employees_without_photo)} employees without photos")

        if not employees_without_photo:
            logger.info("No employees to sync!")
            db.close()
            return sync_stats

        # Step 2: For each employee, find matching candidate and copy photo
        logger.info("\nStep 2: Syncing photos by name and date of birth matching...")

        for employee_id, emp_name, emp_dob in employees_without_photo:
            try:
                # Find candidate with matching name and DOB
                sql_find_candidate = text("""
                    SELECT photo_data_url
                    FROM candidates
                    WHERE TRIM(LOWER(full_name_roman)) = TRIM(LOWER(:name))
                    AND date_of_birth = :dob
                    AND photo_data_url IS NOT NULL
                    LIMIT 1
                """)

                result = db.execute(sql_find_candidate, {
                    'name': emp_name,
                    'dob': emp_dob
                })
                candidate_row = result.fetchone()

                if candidate_row:
                    photo_data_url = candidate_row[0]

                    # Update employee with photo
                    sql_update_employee = text("""
                        UPDATE employees
                        SET photo_data_url = :photo_data_url
                        WHERE id = :employee_id
                    """)

                    update_result = db.execute(sql_update_employee, {
                        'photo_data_url': photo_data_url,
                        'employee_id': employee_id
                    })
                    db.commit()

                    if update_result.rowcount > 0:
                        sync_stats['successfully_synced'] += 1
                        if sync_stats['successfully_synced'] % 50 == 0:
                            logger.info(f"  ✓ Synced: {sync_stats['successfully_synced']} photos")
                else:
                    sync_stats['not_found'] += 1
                    logger.debug(f"No matching candidate found for: {emp_name} ({emp_dob})")

            except Exception as e:
                sync_stats['errors'] += 1
                db.rollback()
                logger.error(f"Error syncing employee {employee_id}: {e}")

        db.close()

        # Summary
        logger.info("\n" + "=" * 80)
        logger.info("SYNC SUMMARY")
        logger.info("=" * 80)
        logger.info(f"Total employees without photo:   {sync_stats['total_employees_without_photo']}")
        logger.info(f"Successfully synced:             {sync_stats['successfully_synced']}")
        logger.info(f"Candidates not found:            {sync_stats['not_found']}")
        logger.info(f"Errors:                          {sync_stats['errors']}")

        if sync_stats['total_employees_without_photo'] > 0:
            success_rate = (sync_stats['successfully_synced'] * 100) // sync_stats['total_employees_without_photo']
            logger.info(f"Success rate:                    {success_rate}%")

        logger.info("=" * 80 + "\n")

        return sync_stats

    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        db.close()
        return sync_stats


def main():
    """Main entry point"""
    sync_employee_photos()


if __name__ == '__main__':
    main()
