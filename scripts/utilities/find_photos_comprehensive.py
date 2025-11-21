"""
Comprehensive search for photo data in Access database
Checks ALL tables and ALL columns for binary/OLE data
"""
import pyodbc
from pathlib import Path

db_path = Path("D:/UNS-ClaudeJP-5.4.1/BASEDATEJP/ユニバーサル企画㈱データベースv25.3.24_be.accdb")

conn_str = f'DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={db_path};'
conn = pyodbc.connect(conn_str)
cursor = conn.cursor()

print("\n=== COMPREHENSIVE PHOTO SEARCH ===\n")
print("Searching for:")
print("  - OLE/Attachment fields")
print("  - Binary columns (LONGBINARY, VARBINARY, IMAGE)")
print("  - Large text fields that might contain base64")
print("  - Multi-value fields (Access 2007+ attachments)")
print()

# Get all tables
tables = cursor.tables(tableType='TABLE').fetchall()
photo_candidates = []

for table_info in tables:
    table_name = table_info[2]

    # Skip system tables
    if table_name.startswith('MSys'):
        continue

    try:
        # Get columns with detailed type info
        columns = cursor.columns(table=table_name).fetchall()

        for col_info in columns:
            col_name = col_info[3]
            data_type = col_info[5]  # SQL data type code
            type_name = col_info[6]  # Type name string
            column_size = col_info[7]

            # Check for binary types:
            # -4 = LONGVARBINARY
            # -3 = VARBINARY
            # -2 = BINARY
            # -1 = LONGVARCHAR (sometimes used for OLE)
            # 12 = VARCHAR
            is_binary = data_type in [-4, -3, -2]
            is_long_text = data_type == -1 and (column_size is None or column_size > 1000000)
            is_attachment = 'attachment' in str(type_name).lower() if type_name and isinstance(type_name, str) else False

            # Look for photo-related column names
            has_photo_name = any(keyword in col_name.lower() for keyword in ['写真', 'photo', '画像', 'image', 'picture', 'foto'])

            if is_binary or is_long_text or is_attachment or (has_photo_name and data_type not in [4, 3, 5]):  # Exclude INT types
                photo_candidates.append({
                    'table': table_name,
                    'column': col_name,
                    'data_type': data_type,
                    'type_name': type_name,
                    'size': column_size
                })

                print(f"✓ Found candidate: {table_name}.{col_name}")
                print(f"  Type: {type_name} (SQL type: {data_type})")
                print(f"  Size: {column_size if column_size else 'unlimited'}")

                # Try to get a sample
                try:
                    cursor.execute(f"SELECT TOP 1 [{col_name}] FROM [{table_name}] WHERE [{col_name}] IS NOT NULL")
                    sample = cursor.fetchone()

                    if sample and sample[0]:
                        value = sample[0]
                        if isinstance(value, bytes):
                            print(f"  Sample: <binary {len(value)} bytes>")
                            # Check if it's an image
                            if value.startswith(b'\xff\xd8\xff'):
                                print(f"  ✓✓✓ CONTAINS JPEG DATA! ✓✓✓")
                            elif value.startswith(b'\x89PNG'):
                                print(f"  ✓✓✓ CONTAINS PNG DATA! ✓✓✓")
                        elif isinstance(value, str) and len(value) > 100:
                            print(f"  Sample: <string {len(value)} chars>")
                            if value.startswith('data:image'):
                                print(f"  ✓✓✓ CONTAINS BASE64 IMAGE! ✓✓✓")
                        else:
                            print(f"  Sample: {type(value).__name__} = {str(value)[:100]}")
                except Exception as e:
                    print(f"  Error reading sample: {e}")

                print()

    except Exception as e:
        print(f"Error accessing {table_name}: {e}")

print("=" * 60)
print(f"\nTotal photo candidates found: {len(photo_candidates)}")

if photo_candidates:
    print("\nSUMMARY OF CANDIDATES:")
    for candidate in photo_candidates:
        print(f"  {candidate['table']}.{candidate['column']} ({candidate['type_name']})")
else:
    print("\nNO PHOTO DATA FOUND IN THIS DATABASE")
    print("\nPossible reasons:")
    print("  1. Photos were already extracted and removed")
    print("  2. Photos are stored in external files")
    print("  3. This is a different version of the database")

conn.close()
print("\nDone!")
