#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Quick check if photos are loaded in PostgreSQL
"""
import sys
import io
import os
from pathlib import Path

# Fix encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

from dotenv import load_dotenv

if os.name == 'nt':
    script_dir = Path(__file__).parent
    sys.path.insert(0, str(script_dir / 'backend'))
    load_dotenv(script_dir / '.env')
else:
    sys.path.insert(0, '/app')
    load_dotenv()

from app.core.database import SessionLocal
from app.models.models import Candidate
from sqlalchemy import func

db = SessionLocal()

# Count candidates
total = db.query(func.count(Candidate.id)).scalar()
with_photos = db.query(func.count(Candidate.id)).filter(Candidate.photo_data_url.isnot(None)).scalar()
with_real_photos = db.query(func.count(Candidate.id)).filter(Candidate.photo_data_url.like('data:image/%')).scalar()

print(f"""
=== PHOTO STATUS IN DATABASE ===

Total candidates:     {total}
With photo_data_url:  {with_photos}
With real base64:     {with_real_photos}

Progress: {with_real_photos}/{total} ({with_real_photos/total*100:.1f}%)
""")

# Show sample
if with_real_photos > 0:
    sample = db.query(Candidate).filter(Candidate.photo_data_url.like('data:image/%')).first()
    if sample:
        photo_size = len(sample.photo_data_url) if sample.photo_data_url else 0
        print(f"Sample: {sample.rirekisho_id} - {sample.full_name_roman}")
        print(f"  Photo size: {photo_size} chars")
        print(f"  Photo prefix: {sample.photo_data_url[:100]}...")

db.close()
