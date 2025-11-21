"""
Test script to inspect photo column type in Access database
"""
import pyodbc
from pathlib import Path

db_path = Path("D:/UNS-ClaudeJP-5.4.1/BASEDATEJP/ユニバーサル企画㈱データベースv25.3.24_be.accdb")

conn_str = f'DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={db_path};'
conn = pyodbc.connect(conn_str)
cursor = conn.cursor()

# Get first record with photo
cursor.execute("SELECT TOP 5 履歴書ID, 写真 FROM T_履歴書 WHERE 写真 IS NOT NULL")

print("\n=== INSPECT PHOTO COLUMN ===\n")
print("Column descriptions:")
for col in cursor.description:
    print(f"  - {col[0]}: Type={col[1]}, Size={col[3]}")

print("\n=== SAMPLE DATA ===\n")
for row in cursor.fetchall():
    rirekisho_id = row[0]
    photo_data = row[1]

    print(f"ID: {rirekisho_id}")
    print(f"  Type: {type(photo_data).__name__}")

    if isinstance(photo_data, bytes):
        print(f"  Binary data length: {len(photo_data)} bytes")
        print(f"  First 50 bytes: {photo_data[:50]}")

        # Check if it's an image
        if photo_data.startswith(b'\xff\xd8\xff'):
            print("  Format: JPEG")
        elif photo_data.startswith(b'\x89PNG'):
            print("  Format: PNG")
        elif photo_data.startswith(b'GIF'):
            print("  Format: GIF")
        else:
            print("  Format: Unknown binary")
    elif isinstance(photo_data, str):
        print(f"  String data: {photo_data[:200]}")
    else:
        print(f"  Other type: {photo_data}")

    print()

conn.close()
print("Done!")
