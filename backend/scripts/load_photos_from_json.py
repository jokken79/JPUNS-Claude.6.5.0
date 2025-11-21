#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Load photos from access_photo_mappings.json to PostgreSQL

This script reads the photo mappings JSON file (containing base64 photos)
and updates the candidates.photo_data_url column in PostgreSQL.
"""
import sys
import io
import json
from pathlib import Path

# Fix encoding for Windows console
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

import os
from dotenv import load_dotenv

# Detect if running on Windows or Docker
if os.name == 'nt':
    # Windows - use host path
    script_dir = Path(__file__).parent.parent.parent  # D:/UNS-ClaudeJP-5.4.1
    sys.path.insert(0, str(script_dir / 'backend'))
    json_file = script_dir / 'config' / 'access_photo_mappings.json'

    # Load .env from project root
    env_file = script_dir / '.env'
    if env_file.exists():
        load_dotenv(env_file)
        print(f"[OK] .env loaded from: {env_file}")
    else:
        print(f"[WARNING] .env not found at: {env_file}")
else:
    # Docker Linux
    sys.path.insert(0, '/app')
    json_file = Path('/app/config/access_photo_mappings.json')
    load_dotenv()

from app.core.database import SessionLocal
from app.models.models import Candidate

def load_photos_from_json():
    """Load photos from JSON and update PostgreSQL"""

    if not json_file.exists():
        print(f"""
╔════════════════════════════════════════════════════════════╗
║          ERROR: PHOTO MAPPINGS JSON NOT FOUND              ║
╚════════════════════════════════════════════════════════════╝
Expected path: {json_file}
EXISTS: {json_file.exists()}

SOLUTION: The JSON file should contain photo data in base64 format.
Run the photo extraction script first, or copy from a backup.
        """)
        return False

    print(f"""
╔════════════════════════════════════════════════════════════╗
║      LOADING PHOTOS FROM JSON TO POSTGRESQL                ║
╚════════════════════════════════════════════════════════════╝
Reading: {json_file}
Size: {json_file.stat().st_size / 1024 / 1024:.2f} MB
    """)

    try:
        # Load JSON file
        print("Loading JSON file...")
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        mappings = data.get('mappings', {})
        stats = data.get('statistics', {})

        print(f"\nJSON Statistics:")
        print(f"  Total records: {stats.get('total_records', 'N/A')}")
        print(f"  With photos: {stats.get('with_attachments', 'N/A')}")
        print(f"  Mappings in file: {len(mappings)}")

        # Connect to PostgreSQL
        print("\nConnecting to PostgreSQL...")
        db = SessionLocal()

        updated = 0
        skipped = 0
        errors = 0

        print("\nUpdating candidates...")

        for rirekisho_id, photo_data_url in mappings.items():
            try:
                # Skip if no photo data
                if not photo_data_url or not photo_data_url.startswith('data:image'):
                    skipped += 1
                    continue

                # Find candidate by rirekisho_id
                candidate = db.query(Candidate).filter(
                    Candidate.rirekisho_id == str(rirekisho_id)
                ).first()

                if candidate:
                    # Update photo_data_url
                    candidate.photo_data_url = photo_data_url
                    db.commit()
                    updated += 1

                    if updated % 100 == 0:
                        print(f"  [{updated}] Updated candidates...")
                else:
                    skipped += 1
                    if skipped <= 5:
                        print(f"  [SKIP] Candidate {rirekisho_id} not found in database")

            except Exception as e:
                errors += 1
                if errors <= 5:
                    print(f"  [ERROR] {rirekisho_id}: {str(e)[:100]}")

        db.close()

        print(f"""
╔════════════════════════════════════════════════════════════╗
║          PHOTO LOADING COMPLETED                           ║
╚════════════════════════════════════════════════════════════╝
[OK] Photos loaded:   {updated}
[SKIP] Skipped:       {skipped}
[ERROR] Errors:       {errors}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        """)

        return updated > 0

    except Exception as e:
        print(f"[ERROR] General error: {e}")
        print(f"   Type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = load_photos_from_json()
    sys.exit(0 if success else 1)
