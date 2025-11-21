"""
Clear all candidates from database
===================================

WARNING: This script deletes ALL candidates from the database!
Use with caution.

Usage:
    docker exec -it uns-claudejp-backend python scripts/clear_candidates.py
"""

import sys
sys.path.insert(0, '/app')

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.models import Candidate

def clear_candidates():
    """Delete all candidates from database"""
    db = SessionLocal()
    try:
        count = db.query(Candidate).count()
        if count == 0:
            print("✓ No candidates to delete")
            return 0

        print(f"⚠️  WARNING: About to delete {count} candidates!")
        print("   Press Ctrl+C to cancel...")
        print()

        import time
        for i in range(5, 0, -1):
            print(f"   Deleting in {i}...")
            time.sleep(1)

        db.query(Candidate).delete()
        db.commit()

        print()
        print(f"✅ Successfully deleted {count} candidates")
        return count

    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return 0
    finally:
        db.close()

if __name__ == "__main__":
    clear_candidates()
