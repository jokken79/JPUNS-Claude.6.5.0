#!/usr/bin/env python3
"""Fix employee photo data by removing garbage bytes before JPEG marker"""
import sys
sys.path.insert(0, '/app')

from app.core.database import SessionLocal
from app.models.models import Employee
import base64

db = SessionLocal()

# Get all employees with photos
employees = db.query(Employee).filter(
    Employee.photo_data_url.isnot(None),
    Employee.photo_data_url != ''
).all()

print(f'Found {len(employees)} employees with photos')

fixed_count = 0
error_count = 0

for employee in employees:
    try:
        photo = employee.photo_data_url

        # Skip if doesn't start with data:image
        if not photo.startswith('data:image'):
            print(f'Skipping employee {employee.id}: Invalid format')
            continue

        # Split prefix and base64 data
        parts = photo.split(',', 1)
        if len(parts) != 2:
            print(f'Skipping employee {employee.id}: No comma separator')
            continue

        prefix = parts[0]
        b64_data = parts[1]

        # Decode base64
        decoded = base64.b64decode(b64_data)

        # Find JPEG marker (FF D8)
        jpeg_start = decoded.find(b'\xff\xd8')

        if jpeg_start < 0:
            # Try PNG marker (89 50 4E 47)
            png_start = decoded.find(b'\x89PNG')
            if png_start >= 0:
                if png_start > 0:
                    print(f'Employee {employee.id}: Removing {png_start} garbage bytes before PNG')
                    clean_data = decoded[png_start:]
                    clean_b64 = base64.b64encode(clean_data).decode('ascii')
                    employee.photo_data_url = f'{prefix},{clean_b64}'
                    fixed_count += 1
                continue

            print(f'WARNING: Employee {employee.id}: No image marker found')
            continue

        # If garbage bytes exist before JPEG
        if jpeg_start > 0:
            print(f'Employee {employee.id}: Removing {jpeg_start} garbage bytes')

            # Extract clean JPEG data
            clean_jpeg = decoded[jpeg_start:]

            # Re-encode to base64
            clean_b64 = base64.b64encode(clean_jpeg).decode('ascii')

            # Update photo_data_url
            employee.photo_data_url = f'{prefix},{clean_b64}'
            fixed_count += 1

    except Exception as e:
        print(f'ERROR processing employee {employee.id}: {e}')
        error_count += 1

# Commit changes
if fixed_count > 0:
    db.commit()
    print(f'\n✅ Fixed {fixed_count} photos')
else:
    print('\nNo photos needed fixing')

if error_count > 0:
    print(f'⚠️  {error_count} errors encountered')

db.close()
print('\nDone!')
