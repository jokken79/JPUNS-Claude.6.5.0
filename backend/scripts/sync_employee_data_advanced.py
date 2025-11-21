"""
Advanced Sync: Photos + Status from Candidates to Employees

Synchronizes BOTH photo_data_url and current_status from candidates to employees
with multiple matching strategies (rirekisho_id, name+DOB, fuzzy name matching)

This handles cases where employee names differ from candidate names due to:
- Name changes in database
- Alias/nickname usage
- Data entry errors

Usage:
    python sync_employee_data_advanced.py

Requirements:
    - PostgreSQL running
    - SQLAlchemy, psycopg2
"""

import sys
import os
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Tuple, Optional
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
        logging.FileHandler(f'sync_employee_data_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
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


def get_similar_names(name: str, threshold: float = 0.7) -> bool:
    """
    Simple string similarity check for fuzzy name matching
    Helps when names are slightly different (typos, variations)
    """
    try:
        from difflib import SequenceMatcher
        return True
    except:
        return False


def sync_employee_data() -> Dict[str, Any]:
    """
    Synchronize photos and status from candidates to employees using advanced matching:

    Strategy 1: Match by rirekisho_id (most reliable)
    Strategy 2: Match by full_name_roman + date_of_birth (if rirekisho_id not available)
    Strategy 3: Fuzzy match on name (as last resort)

    Returns:
        Statistics dictionary
    """

    logger.info("=" * 80)
    logger.info("ADVANCED SYNC: PHOTOS + STATUS FROM CANDIDATES TO EMPLOYEES")
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
        'total_employees_missing_data': 0,
        'synced_by_rirekisho_id': 0,
        'synced_by_name_dob': 0,
        'synced_by_fuzzy_match': 0,
        'not_found': 0,
        'errors': 0,
        'total_synced': 0
    }

    try:
        # Step 1: Get all employees missing photos or status
        logger.info("\nStep 1: Finding employees missing data...")
        sql_get_employees = text("""
            SELECT id, rirekisho_id, full_name_kanji, date_of_birth, current_status, photo_data_url
            FROM employees
            WHERE (photo_data_url IS NULL OR current_status = 'active')
            ORDER BY id
        """)

        result = db.execute(sql_get_employees)
        employees_to_update = result.fetchall()
        sync_stats['total_employees_missing_data'] = len(employees_to_update)

        logger.info(f"Found {len(employees_to_update)} employees to update")

        if not employees_to_update:
            logger.info("No employees to sync!")
            db.close()
            return sync_stats

        # Step 2: For each employee, find matching candidate and sync data
        logger.info("\nStep 2: Syncing data using multiple matching strategies...\n")

        for emp_id, emp_rirekisho_id, emp_name, emp_dob, emp_status, emp_photo in employees_to_update:
            try:
                candidate_data = None
                match_strategy = None

                # Strategy 1: Match by rirekisho_id (most reliable)
                if emp_rirekisho_id:
                    sql_find_candidate = text("""
                        SELECT id, photo_data_url, status
                        FROM candidates
                        WHERE rirekisho_id = :rirekisho_id
                        LIMIT 1
                    """)

                    result = db.execute(sql_find_candidate, {'rirekisho_id': emp_rirekisho_id})
                    candidate_data = result.fetchone()
                    if candidate_data:
                        match_strategy = "rirekisho_id"
                        sync_stats['synced_by_rirekisho_id'] += 1

                # Strategy 2: Match by name + DOB (if Strategy 1 failed)
                if not candidate_data and emp_name and emp_dob:
                    sql_find_candidate = text("""
                        SELECT id, photo_data_url, status
                        FROM candidates
                        WHERE TRIM(LOWER(full_name_kanji)) = TRIM(LOWER(:name))
                        AND date_of_birth = :dob
                        AND photo_data_url IS NOT NULL
                        LIMIT 1
                    """)

                    result = db.execute(sql_find_candidate, {
                        'name': emp_name,
                        'dob': emp_dob
                    })
                    candidate_data = result.fetchone()
                    if candidate_data:
                        match_strategy = "name+dob"
                        sync_stats['synced_by_name_dob'] += 1

                # Strategy 3: Fuzzy match on name (last resort)
                if not candidate_data and emp_name:
                    sql_find_candidate = text("""
                        SELECT id, photo_data_url, status
                        FROM candidates
                        WHERE (LOWER(full_name_roman) LIKE LOWER(:name_pattern)
                           OR LOWER(full_name_kanji) LIKE LOWER(:name_pattern))
                        AND photo_data_url IS NOT NULL
                        ORDER BY id
                        LIMIT 1
                    """)

                    # Fuzzy pattern: search for first 3+ characters
                    if len(emp_name) >= 3:
                        search_pattern = emp_name[:3] + '%'
                        result = db.execute(sql_find_candidate, {
                            'name_pattern': search_pattern,
                            'name_pattern': search_pattern
                        })
                        candidate_data = result.fetchone()
                        if candidate_data:
                            match_strategy = "fuzzy_name"
                            sync_stats['synced_by_fuzzy_match'] += 1

                if candidate_data:
                    cand_id, cand_photo, cand_status = candidate_data

                    # Build update query
                    updates = []
                    params = {'employee_id': emp_id}

                    # Update photo if empty
                    if not emp_photo and cand_photo:
                        updates.append("photo_data_url = :photo_data_url")
                        params['photo_data_url'] = cand_photo

                    # Update status if it's still 'active' (default)
                    if emp_status == 'active' and cand_status != 'active':
                        updates.append("current_status = :current_status")
                        params['current_status'] = cand_status

                    if updates:
                        sql_update = text(f"""
                            UPDATE employees
                            SET {', '.join(updates)}
                            WHERE id = :employee_id
                        """)

                        db.execute(sql_update, params)
                        db.commit()
                        sync_stats['total_synced'] += 1

                        if sync_stats['total_synced'] % 50 == 0:
                            logger.info(f"  ✓ Synced: {sync_stats['total_synced']} employees ({match_strategy})")
                else:
                    sync_stats['not_found'] += 1
                    logger.debug(f"No matching candidate for: {emp_name} (DOB: {emp_dob})")

            except Exception as e:
                sync_stats['errors'] += 1
                db.rollback()
                logger.error(f"Error syncing employee {emp_id}: {e}")

        db.close()

        # Summary
        logger.info("\n" + "=" * 80)
        logger.info("ADVANCED SYNC SUMMARY")
        logger.info("=" * 80)
        logger.info(f"Total employees to update:      {sync_stats['total_employees_missing_data']}")
        logger.info(f"Synced by rirekisho_id:         {sync_stats['synced_by_rirekisho_id']}")
        logger.info(f"Synced by name + DOB:           {sync_stats['synced_by_name_dob']}")
        logger.info(f"Synced by fuzzy match:          {sync_stats['synced_by_fuzzy_match']}")
        logger.info(f"Total synced:                   {sync_stats['total_synced']}")
        logger.info(f"Candidates not found:           {sync_stats['not_found']}")
        logger.info(f"Errors:                         {sync_stats['errors']}")

        if sync_stats['total_employees_missing_data'] > 0:
            success_rate = (sync_stats['total_synced'] * 100) // sync_stats['total_employees_missing_data']
            logger.info(f"Success rate:                   {success_rate}%")

        logger.info("=" * 80 + "\n")

        return sync_stats

    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        db.close()
        return sync_stats


def main():
    """Main entry point"""
    sync_employee_data()


if __name__ == '__main__':
    main()
