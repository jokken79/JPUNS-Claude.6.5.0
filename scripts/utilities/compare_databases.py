"""
Compare the two Access databases to understand the difference
"""
import pyodbc
from pathlib import Path

# Current database (v5.4.1) - _be suffix
db_current = Path("D:/UNS-ClaudeJP-5.4.1/BASEDATEJP/ユニバーサル企画㈱データベースv25.3.24_be.accdb")

# Check if original database (without _be suffix) exists
db_original = Path("D:/UNS-ClaudeJP-5.4.1/BASEDATEJP/ユニバーサル企画㈱データベースv25.3.24.accdb")

print("\n=== COMPARING ACCESS DATABASES ===\n")

if db_original.exists():
    print(f"[OK] Original database found: {db_original}")
    print(f"  Size: {db_original.stat().st_size / 1024 / 1024:.2f} MB")
else:
    print(f"[NOT FOUND] Original database NOT found: {db_original}")

print(f"\n[OK] Backend database found: {db_current}")
print(f"  Size: {db_current.stat().st_size / 1024 / 1024:.2f} MB")

if db_original.exists():
    print("\n--- Comparing photo field in ORIGINAL database ---")

    conn_str = f'DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={db_original};'
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()

    cursor.execute("""
        SELECT TOP 5
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
            # Check if it's an image
            if photo.startswith(b'\xff\xd8\xff'):
                print(f"  [JPEG] CONTAINS JPEG DATA!")
            elif photo.startswith(b'\x89PNG'):
                print(f"  [PNG] CONTAINS PNG DATA!")
            elif len(photo) > 100:
                print(f"  First 100 bytes: {photo[:100]}")
        elif isinstance(photo, int):
            print(f"  Photo value: {photo}")
        else:
            print(f"  Photo value: {str(photo)[:100]}")

    conn.close()

print("\n--- Comparing photo field in BACKEND (_be) database ---")

conn_str = f'DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={db_current};'
conn = pyodbc.connect(conn_str)
cursor = conn.cursor()

cursor.execute("""
    SELECT TOP 5
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
        # Check if it's an image
        if photo.startswith(b'\xff\xd8\xff'):
            print(f"  [JPEG] CONTAINS JPEG DATA!")
        elif photo.startswith(b'\x89PNG'):
            print(f"  [PNG] CONTAINS PNG DATA!")
        elif len(photo) > 100:
            print(f"  First 100 bytes: {photo[:100]}")
    elif isinstance(photo, int):
        print(f"  Photo value: {photo}")
    else:
        print(f"  Photo value: {str(photo)[:100]}")

conn.close()

print("\n=== CONCLUSION ===")
if db_original.exists():
    print("\nBoth databases exist. Check the output above to see the difference.")
    print("If ORIGINAL has BYTES and BACKEND has INT, then:")
    print("  → Photos were extracted from ORIGINAL")
    print("  → BACKEND database was cleaned/modified")
    print("  → Need to use ORIGINAL database for extraction!")
else:
    print("\nOnly BACKEND database exists.")
    print("The _be suffix might indicate 'backend' version with photos removed.")
    print("Check if original database exists in another location.")

print("\nDone!")
