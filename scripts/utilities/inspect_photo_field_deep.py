"""
Deep inspection of T_履歴書.写真 field
"""
import pyodbc
from pathlib import Path
import struct

db_path = Path("D:/UNS-ClaudeJP-5.4.1/BASEDATEJP/ユニバーサル企画㈱データベースv25.3.24_be.accdb")

conn_str = f'DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={db_path};'
conn = pyodbc.connect(conn_str)
cursor = conn.cursor()

print("\n=== DEEP INSPECTION OF PHOTO FIELD ===\n")

# Try different ways to read the photo field
print("Method 1: Direct SELECT")
cursor.execute("SELECT TOP 5 履歴書ID, 写真 FROM T_履歴書 WHERE 写真 IS NOT NULL")

for row in cursor.fetchall():
    rirekisho_id, photo = row
    print(f"\nID: {rirekisho_id}")
    print(f"  Type: {type(photo).__name__}")
    print(f"  Value: {photo}")

    if isinstance(photo, int):
        print(f"  Integer: {photo}")
        print(f"  Hex: {hex(photo)}")
        print(f"  Binary: {bin(photo)}")

print("\n" + "="*60)
print("Method 2: Using CAST to get binary data")

try:
    # Try to force reading as binary
    cursor.execute("""
        SELECT TOP 3
            履歴書ID,
            写真
        FROM T_履歴書
        WHERE 写真 IS NOT NULL
    """)

    for row in cursor.fetchall():
        print(f"\nID: {row[0]}, Photo data type: {type(row[1])}")

except Exception as e:
    print(f"Error: {e}")

print("\n" + "="*60)
print("Method 3: Check if 写真 refers to another table")

# The INT values might be foreign keys to an attachment table
print("\nSearching for tables that might store attachments...")

tables = cursor.tables(tableType='TABLE').fetchall()
for table_info in tables:
    table_name = table_info[2]

    # Look for attachment-related tables
    if any(word in table_name for word in ['写真', 'photo', 'attach', 'file', 'image', '画像']):
        print(f"  Found: {table_name}")

        try:
            cursor.execute(f"SELECT TOP 3 * FROM [{table_name}]")
            rows = cursor.fetchall()
            if rows:
                print(f"    Rows: {len(rows)}")
        except:
            pass

# Check for system attachment tables
print("\nChecking for Access 2007+ attachment system tables...")
try:
    # Access 2007+ stores attachments in special system tables
    # Try to access the hidden attachment table
    cursor.execute("SELECT * FROM MSysAccessObjects WHERE Type = 1 AND Name LIKE '%写真%'")
    attachment_tables = cursor.fetchall()

    if attachment_tables:
        print("  Found attachment tables:")
        for table in attachment_tables:
            print(f"    {table}")
except Exception as e:
    print(f"  Cannot access system tables: {e}")

conn.close()
print("\nDone!")
