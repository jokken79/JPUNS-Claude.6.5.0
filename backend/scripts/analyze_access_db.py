"""
Analyze Access Database Structure
Investigates tables, fields, and photo storage in the Access database
"""

import pyodbc
import sys
from pathlib import Path

# Fix Windows console encoding
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Database path
DB_PATH = r"D:\UNS-ClaudeJP-6.0.0\BASEDATEJP\ユニバーサル企画㈱データベースv25.3.24_be.accdb"

def get_access_connection():
    """Create connection to Access database"""
    try:
        # Try with Microsoft Access Driver
        conn_str = (
            r'DRIVER={Microsoft Access Driver (*.mdb, *.accdb)};'
            f'DBQ={DB_PATH};'
        )
        conn = pyodbc.connect(conn_str)
        return conn
    except pyodbc.Error as e:
        print(f"❌ Error connecting to Access database: {e}")
        print("\n📋 Available ODBC drivers:")
        for driver in pyodbc.drivers():
            print(f"   - {driver}")
        sys.exit(1)

def analyze_database_structure():
    """Analyze complete database structure"""
    print("=" * 80)
    print("🔍 ANALYZING ACCESS DATABASE STRUCTURE")
    print("=" * 80)
    print(f"\n📁 Database: {DB_PATH}\n")

    conn = get_access_connection()
    cursor = conn.cursor()

    # 1. List all tables
    print("\n" + "=" * 80)
    print("📋 TABLES IN DATABASE")
    print("=" * 80)

    tables = []
    for table_info in cursor.tables(tableType='TABLE'):
        table_name = table_info.table_name
        # Skip system tables
        if not table_name.startswith('MSys') and not table_name.startswith('~'):
            tables.append(table_name)
            print(f"\n✅ Table: {table_name}")

    # 2. Analyze each table
    print("\n" + "=" * 80)
    print("📊 DETAILED TABLE ANALYSIS")
    print("=" * 80)

    candidate_tables = []

    for table_name in tables:
        print(f"\n{'─' * 80}")
        print(f"📋 TABLE: {table_name}")
        print(f"{'─' * 80}")

        # Get columns
        columns = []
        photo_fields = []

        try:
            cursor.execute(f"SELECT TOP 1 * FROM [{table_name}]")
            columns_info = cursor.description

            print("\n📝 Fields:")
            for col in columns_info:
                col_name = col[0]
                col_type = col[1].__name__ if col[1] else "Unknown"
                columns.append(col_name)

                # Detect photo fields
                col_name_lower = col_name.lower()
                if any(keyword in col_name_lower for keyword in ['photo', 'image', 'picture', '写真', '顔写真', 'img']):
                    photo_fields.append(col_name)
                    print(f"   📷 {col_name} ({col_type}) ⭐ PHOTO FIELD")
                else:
                    print(f"   • {col_name} ({col_type})")

            # Count records
            cursor.execute(f"SELECT COUNT(*) FROM [{table_name}]")
            total_records = cursor.fetchone()[0]
            print(f"\n📊 Total records: {total_records}")

            # If photo fields exist, count records with photos
            if photo_fields:
                candidate_tables.append({
                    'name': table_name,
                    'photo_fields': photo_fields,
                    'columns': columns,
                    'total_records': total_records
                })

                for photo_field in photo_fields:
                    cursor.execute(f"SELECT COUNT(*) FROM [{table_name}] WHERE [{photo_field}] IS NOT NULL")
                    records_with_photos = cursor.fetchone()[0]
                    print(f"   📷 Records with {photo_field}: {records_with_photos}")

            # Show sample data (first 3 records)
            print("\n📄 Sample data (first 3 records):")
            cursor.execute(f"SELECT TOP 3 * FROM [{table_name}]")
            rows = cursor.fetchall()

            for i, row in enumerate(rows, 1):
                print(f"\n   Record {i}:")
                for col_name, value in zip(columns, row):
                    # For binary/photo fields, show type and size
                    if isinstance(value, bytes):
                        print(f"      {col_name}: <binary data, {len(value)} bytes>")
                    elif value is None:
                        print(f"      {col_name}: NULL")
                    else:
                        # Truncate long values
                        str_value = str(value)
                        if len(str_value) > 50:
                            str_value = str_value[:50] + "..."
                        print(f"      {col_name}: {str_value}")

        except Exception as e:
            print(f"   ❌ Error analyzing table: {e}")

    # 3. Summary of candidate tables
    print("\n" + "=" * 80)
    print("📋 SUMMARY - TABLES WITH PHOTO FIELDS")
    print("=" * 80)

    if candidate_tables:
        for table_info in candidate_tables:
            print(f"\n✅ {table_info['name']}")
            print(f"   📷 Photo fields: {', '.join(table_info['photo_fields'])}")
            print(f"   📊 Total records: {table_info['total_records']}")
            print(f"   📝 Total fields: {len(table_info['columns'])}")
            print(f"   🗂️  Fields: {', '.join(table_info['columns'][:10])}")
            if len(table_info['columns']) > 10:
                print(f"             ... and {len(table_info['columns']) - 10} more")
    else:
        print("\n❌ No tables with photo fields found!")

    # 4. Detect photo storage format
    print("\n" + "=" * 80)
    print("🔍 PHOTO STORAGE FORMAT ANALYSIS")
    print("=" * 80)

    if candidate_tables:
        for table_info in candidate_tables:
            table_name = table_info['name']
            for photo_field in table_info['photo_fields']:
                print(f"\n📷 Analyzing {table_name}.{photo_field}")

                try:
                    cursor.execute(f"SELECT TOP 1 [{photo_field}] FROM [{table_name}] WHERE [{photo_field}] IS NOT NULL")
                    row = cursor.fetchone()

                    if row and row[0]:
                        photo_data = row[0]

                        if isinstance(photo_data, bytes):
                            # Analyze binary data
                            size = len(photo_data)
                            print(f"   ✅ Storage type: Binary (BLOB)")
                            print(f"   📊 Size: {size:,} bytes ({size/1024:.2f} KB)")

                            # Detect image format by magic bytes
                            if photo_data[:2] == b'\xff\xd8':
                                print(f"   🖼️  Format: JPEG")
                            elif photo_data[:8] == b'\x89PNG\r\n\x1a\n':
                                print(f"   🖼️  Format: PNG")
                            elif photo_data[:2] == b'BM':
                                print(f"   🖼️  Format: BMP")
                            elif photo_data[:4] == b'GIF8':
                                print(f"   🖼️  Format: GIF")
                            else:
                                print(f"   🖼️  Format: Unknown (first 16 bytes: {photo_data[:16].hex()})")

                        elif isinstance(photo_data, str):
                            print(f"   ✅ Storage type: String/Path")
                            print(f"   📁 Value: {photo_data}")

                        else:
                            print(f"   ❓ Storage type: {type(photo_data)}")
                            print(f"   📄 Value: {photo_data}")

                except Exception as e:
                    print(f"   ❌ Error analyzing photo field: {e}")

    conn.close()

    print("\n" + "=" * 80)
    print("✅ ANALYSIS COMPLETE")
    print("=" * 80)

if __name__ == "__main__":
    try:
        analyze_database_structure()
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
