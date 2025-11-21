"""
Check if v5.2 database has photos as BYTES
"""
import pyodbc
from pathlib import Path

db_v52 = Path("D:/UNS-ClaudeJP-5.2/JPUNS-CLAUDE5.2/UNS-ClaudeJP-5.2/BASEDATEJP/ユニバーサル企画㈱データベースv25.3.24_be.accdb")
db_v54 = Path("D:/UNS-ClaudeJP-5.4.1/BASEDATEJP/ユニバーサル企画㈱データベースv25.3.24_be.accdb")

print("\n=== COMPARING v5.2 vs v5.4 DATABASES ===\n")

print("v5.2 database:")
print(f"  Exists: {db_v52.exists()}")
if db_v52.exists():
    print(f"  Size: {db_v52.stat().st_size / 1024 / 1024:.2f} MB")
    print(f"  Modified: {db_v52.stat().st_mtime}")

print("\nv5.4 database:")
print(f"  Exists: {db_v54.exists()}")
if db_v54.exists():
    print(f"  Size: {db_v54.stat().st_size / 1024 / 1024:.2f} MB")
    print(f"  Modified: {db_v54.stat().st_mtime}")

if db_v52.exists():
    print("\n--- Checking v5.2 photo field ---")

    conn_str = f'DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={db_v52};'
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()

    cursor.execute("""
        SELECT TOP 3
            履歴書ID,
            氏名,
            写真
        FROM T_履歴書
        WHERE 写真 IS NOT NULL
        ORDER BY 履歴書ID
    """)

    for row in cursor.fetchall():
        rirekisho_id, name, photo = row
        print(f"\nID: {rirekisho_id}, Name: {name}")
        print(f"  Photo type: {type(photo).__name__}")

        if isinstance(photo, bytes):
            print(f"  Photo size: {len(photo)} bytes")
            if photo.startswith(b'\xff\xd8\xff'):
                print(f"  [JPEG] CONTAINS JPEG DATA!")
            elif photo.startswith(b'\x89PNG'):
                print(f"  [PNG] CONTAINS PNG DATA!")
            else:
                print(f"  First 20 bytes: {photo[:20]}")
        elif isinstance(photo, int):
            print(f"  Photo value (INT): {photo}")
        else:
            print(f"  Photo value: {str(photo)[:100]}")

    conn.close()

print("\n=== CONCLUSION ===")
print("\nIf v5.2 has BYTES: Extract from v5.2 database")
print("If v5.2 has INT too: Photos might be in a backup or external location")
print("\nDone!")
