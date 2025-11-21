"""
Detailed inspection of photo data structure in Access
"""
import pyodbc
from pathlib import Path

db_path = Path("D:/UNS-ClaudeJP-5.4.1/BASEDATEJP/ユニバーサル企画㈱データベースv25.3.24_be.accdb")

conn_str = f'DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={db_path};'
conn = pyodbc.connect(conn_str)
cursor = conn.cursor()

print("\n=== DETAILED INSPECTION OF T_履歴書.写真 ===\n")

# Get sample data with different types
cursor.execute("""
    SELECT TOP 10
        履歴書ID,
        氏名,
        写真
    FROM T_履歴書
    WHERE 写真 IS NOT NULL
    ORDER BY 履歴書ID
""")

print("Sample data:")
for row in cursor.fetchall():
    rirekisho_id = row[0]
    name = row[1]
    photo = row[2]

    print(f"\nID: {rirekisho_id}, Name: {name}")
    print(f"  Photo column type: {type(photo).__name__}")
    print(f"  Photo value: {photo}")

    if isinstance(photo, bytes):
        print(f"  Binary length: {len(photo)}")
        print(f"  First 100 bytes: {photo[:100]}")
    elif isinstance(photo, int):
        print(f"  Integer value: {photo}")
        print(f"  This is likely a FOREIGN KEY to another table")

# Check if there's a related table for attachments
print("\n\n=== SEARCHING FOR ATTACHMENT TABLES ===\n")

tables = cursor.tables(tableType='TABLE').fetchall()
for table_info in tables:
    table_name = table_info[2]
    if '写真' in table_name or 'photo' in table_name.lower() or 'attach' in table_name.lower():
        print(f"Found related table: {table_name}")

        # Try to query it
        try:
            cursor.execute(f"SELECT TOP 5 * FROM [{table_name}]")
            cols = [col[0] for col in cursor.description]
            print(f"  Columns: {cols}")

            rows = cursor.fetchall()
            print(f"  Total rows: {len(rows)}")

            if rows:
                print(f"  Sample data:")
                for idx, row in enumerate(rows[:3], 1):
                    print(f"    Row {idx}: {row[:5]}")  # First 5 columns
        except Exception as e:
            print(f"  Error: {e}")

conn.close()
print("\nDone!")
