"""
Inspect Access Database Photo Field - EXACT LOCATION
====================================================

The user confirmed the photo field is BETWEEN:
- 生年月日 (date of birth)
- 国籍 (nationality)

And it has an ATTACHMENT ICON (paperclip).

This script identifies the EXACT field name and type.
"""

import pyodbc
from pathlib import Path
import sys

# Configuration
project_root = Path(__file__).parent.parent.parent
db_path = project_root / "BASEDATEJP" / "ユニバーサル企画㈱データベースv25.3.24_be.accdb"
table_name = "T_履歴書"

print("=" * 80)
print("INSPECTING ACCESS DATABASE - PHOTO FIELD EXACT LOCATION")
print("=" * 80)
print(f"Database: {db_path}")
print(f"Table: {table_name}")
print()

if not db_path.exists():
    print(f"ERROR: Database file not found: {db_path}")
    sys.exit(1)

try:
    # Connect to Access
    conn_str = f'DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={db_path};'
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()

    # Get all columns
    cursor.execute(f"SELECT * FROM [{table_name}] WHERE 1=0")
    columns = [desc[0] for desc in cursor.description]

    print(f"Total columns: {len(columns)}")
    print()

    # Find position of 生年月日 and 国籍
    dob_index = -1
    nationality_index = -1

    for i, col in enumerate(columns):
        if "生年月日" in col:
            dob_index = i
            print(f"[{i:3d}] 生年月日 (Date of Birth) = {col}")
        elif "国籍" in col:
            nationality_index = i
            print(f"[{i:3d}] 国籍 (Nationality) = {col}")

    print()
    print("=" * 80)
    print("FIELDS BETWEEN 生年月日 AND 国籍:")
    print("=" * 80)

    if dob_index >= 0 and nationality_index >= 0:
        if dob_index < nationality_index:
            start_idx = dob_index
            end_idx = nationality_index
        else:
            start_idx = nationality_index
            end_idx = dob_index

        print(f"Range: Index {start_idx} to {end_idx}")
        print()

        for i in range(start_idx, end_idx + 1):
            col_name = columns[i]

            # Mark special fields
            marker = ""
            if i == dob_index:
                marker = " <-- 生年月日 (Date of Birth)"
            elif i == nationality_index:
                marker = " <-- 国籍 (Nationality)"
            elif start_idx < i < end_idx:
                marker = " <-- ★ PHOTO FIELD LIKELY HERE ★"

            print(f"  [{i:3d}] {col_name}{marker}")

        print()
        print("=" * 80)

        # Get detailed column info using sys tables (if Access allows)
        try:
            # Try to get column types from schema
            cursor.execute(f"""
                SELECT MSysObjects.Name AS TableName,
                       MSysObjects.Type,
                       MSysColumns.Name AS ColumnName,
                       MSysColumns.Type AS ColumnType
                FROM MSysObjects
                INNER JOIN MSysColumns ON MSysObjects.Id = MSysColumns.ObjectId
                WHERE MSysObjects.Name = '{table_name}'
                ORDER BY MSysColumns.Order
            """)

            print("DETAILED COLUMN INFORMATION:")
            print("-" * 80)
            for row in cursor.fetchall():
                print(f"Column: {row.ColumnName}, Type: {row.ColumnType}")
        except Exception as e:
            print(f"Note: Could not access system tables (normal for Access): {e}")

        print()
        print("=" * 80)
        print("PHOTO FIELD CANDIDATES (between 生年月日 and 国籍):")
        print("=" * 80)

        candidates = []
        for i in range(start_idx + 1, end_idx):
            col_name = columns[i]
            # Check if name suggests photo/image
            if any(keyword in col_name.lower() for keyword in ['photo', '写真', 'picture', 'image', 'foto', 'img']):
                candidates.append((i, col_name, "EXACT MATCH (name contains photo keyword)"))
            else:
                candidates.append((i, col_name, "Possible (position-based)"))

        if candidates:
            for idx, name, reason in candidates:
                print(f"  [{idx:3d}] {name}")
                print(f"        Reason: {reason}")
                print()
        else:
            print("  No obvious photo field found by name.")
            print("  The field might have a different name or be empty.")
            print()
            print("  Fields in range:")
            for i in range(start_idx + 1, end_idx):
                print(f"    [{i:3d}] {columns[i]}")

        print()
        print("=" * 80)
        print("RECOMMENDED ACTION:")
        print("=" * 80)

        if candidates:
            best_candidate = candidates[0]
            print(f"Use field: {best_candidate[1]} (index {best_candidate[0]})")
            print(f"This field is located between 生年月日 and 国籍 as confirmed.")
        else:
            print("Manually inspect the Access database in Microsoft Access.")
            print("Look for the field with the paperclip/attachment icon.")

        print()

    else:
        print("ERROR: Could not find 生年月日 or 国籍 columns")
        print()
        print("All columns:")
        for i, col in enumerate(columns):
            print(f"  [{i:3d}] {col}")

    conn.close()

    print()
    print("=" * 80)
    print("INSPECTION COMPLETED")
    print("=" * 80)

except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
