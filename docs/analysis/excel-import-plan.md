# Excel Employee Master File Analysis & Import Plan

**File:** `【新】社員台帳(UNS)T　2022.04.05～.xlsm`
**Analysis Date:** 2025-11-17
**Analyst:** @data-engineer

---

## 📊 EXECUTIVE SUMMARY

The Excel file contains **10 sheets** with employee data spanning multiple categories:
- **派遣社員 (Dispatch Workers)**: 1,050 records
- **請負社員 (Contract Workers)**: 143 records
- **スタッフ (Staff)**: 22 records
- **Total Potential Records**: 1,215+ employees

### Key Findings
✅ **Well-structured data** with consistent column headers
✅ **Multiple data sources**: DB sheets (DBGenzaiX, DBUkeoiX, DBStaffX) and display sheets (派遣社員, 請負社員, スタッフ)
⚠️ **Data duplication**: Display sheets duplicate DB sheets with formatting differences
⚠️ **Date format issues**: Some dates stored as Excel serial numbers (e.g., 20017, 32394)
⚠️ **Empty columns**: Many columns have no headers or sparse data
⚠️ **Status field critical**: "現在" column indicates active/退社 status

---

## 📁 SHEET STRUCTURE ANALYSIS

### Sheet Summary

| Sheet Name | Rows | Columns | Purpose | Import Priority |
|-----------|------|---------|---------|----------------|
| **DBGenzaiX** | 1,050 | 42 | Dispatch workers (DB) | ⭐⭐⭐ HIGH |
| **派遣社員** | 1,051 | 42 | Dispatch workers (Display) | ⚠️ DUPLICATE |
| **DBUkeoiX** | 100 | 33 | Contract workers (DB) | ⭐⭐⭐ HIGH |
| **請負社員** | 143 | 42 | Contract workers (Display) | ⚠️ DUPLICATE |
| **DBStaffX** | 16 | 17 | Staff (DB) | ⭐⭐ MEDIUM |
| **スタッフ** | 22 | 25 | Staff (Display) | ⚠️ DUPLICATE |
| **DBTaishaX** | 2 | 27 | Retired employees | ⭐ LOW |
| **愛知23** | 87 | 11 | Regional data (Aichi) | ⭐ LOW |
| **Sheet1** | 1 | 1 | Empty | ❌ SKIP |
| **Sheet2** | 1,050 | 42 | Another copy of DBGenzaiX | ❌ SKIP |

### Recommended Import Strategy
1. **Import DBGenzaiX** → `employees` table (dispatch workers)
2. **Import DBUkeoiX** → `contract_workers` table (contract workers)
3. **Import DBStaffX** → `staff` table (office staff)
4. **Skip display sheets** (派遣社員, 請負社員, スタッフ) - they're formatted versions of DB sheets

---

## 🔍 DETAILED SHEET ANALYSIS

### 1. DBGenzaiX (派遣社員 - Dispatch Workers) ⭐⭐⭐

**Target Table:** `employees`
**Records:** 1,050 rows (including header)
**Columns:** 42

#### Column Mapping (DBGenzaiX → PostgreSQL employees table)

| # | Excel Column (Japanese) | Excel Column (English) | PostgreSQL Field | Data Type | Notes |
|---|------------------------|------------------------|------------------|-----------|-------|
| 1 | 現在 | Status | `is_active` | Boolean | "在職中" → True, "退社" → False |
| 2 | 社員№ | Employee ID | `hakenmoto_id` | Integer | Unique employee number |
| 3 | 派遣先ID | Factory ID | `factory_id` | String | Foreign key to factories |
| 4 | 派遣先 | Factory Name | `company_name` | String | Denormalized company name |
| 5 | 配属先 | Assignment Location | `assignment_location` | String | Department/location |
| 6 | 配属ライン | Assignment Line | `assignment_line` | String | Production line |
| 7 | 仕事内容 | Job Description | `job_description` | Text | Work responsibilities |
| 8 | 氏名 | Full Name (Kanji) | `full_name_kanji` | String | **REQUIRED** |
| 9 | カナ | Full Name (Kana) | `full_name_kana` | String | Katakana pronunciation |
| 10 | 性別 | Gender | `gender` | String | 男/女 → Male/Female |
| 11 | 国籍 | Nationality | `nationality` | String | ベトナム, 日本, etc. |
| 12 | 生年月日 | Date of Birth | `date_of_birth` | Date | Convert Excel date serial |
| 13 | 年齢 | Age | - | - | **SKIP** (calculated field) |
| 14 | 時給 | Hourly Rate | `jikyu` | Integer | Hourly wage (¥/hour) |
| 15 | 時給改定 | Rate Revision | `jikyu_revision_date` | Date | Parse date from text |
| 16 | 請求単価 | Billing Rate | `hourly_rate_charged` | Integer | Charged to client |
| 17 | 請求改定 | Billing Revision | `billing_revision_date` | Date | Parse date from text |
| 18 | 差額利益 | Profit Margin | `profit_difference` | Integer | Difference between billing and rate |
| 19 | 標準報酬 | Standard Compensation | `standard_compensation` | Integer | Social insurance basis |
| 20 | 健康保険 | Health Insurance | `health_insurance` | Integer | Monthly premium |
| 21 | 介護保険 | Nursing Insurance | `nursing_insurance` | Integer | Monthly premium |
| 22 | 厚生年金 | Pension Insurance | `pension_insurance` | Integer | Monthly premium |
| 23 | ビザ期限 | Visa Expiry | `zairyu_expire_date` | Date | Residence card expiry |
| 24 | アラート(ビザ更新) | Visa Renewal Alert | `visa_renewal_alert` | Boolean | True if alert triggered |
| 25 | ビザ種類 | Visa Type | `visa_type` | String | 特定技能, 技能実習, etc. |
| 26 | 〒 | Postal Code | `postal_code` | String | 7-digit postal code |
| 27 | 住所 | Address | `address` | Text | Full address |
| 28 | アパート | Apartment | `apartment_id` | Integer | Foreign key (requires mapping) |
| 29 | 入居 | Move-in Date | `apartment_start_date` | Date | Apartment start date |
| 30 | 入社日 | Hire Date | `hire_date` | Date | **REQUIRED** |
| 31 | 退社日 | Termination Date | `termination_date` | Date | If 現在 = "退社" |
| 32 | 退去 | Move-out Date | `apartment_move_out_date` | Date | Apartment end date |
| 33 | 社保加入 | Social Insurance Join | `social_insurance_date` | Date | Date enrolled in insurance |
| 34 | 入社依頼 | Entry Request | `entry_request_date` | Date | Date of hire request |
| 35 | 備考 | Notes | `notes` | Text | Miscellaneous notes |
| 36 | 現入社 | Current Hire Date | `current_hire_date` | Date | Date started current assignment |
| 37 | 免許種類 | License Type | `license_type` | String | Driver's license class |
| 38 | 免許期限 | License Expiry | `license_expire_date` | Date | License expiration |
| 39 | 通勤方法 | Commute Method | `commute_method` | String | Car, train, bicycle, etc. |
| 40 | 任意保険期限 | Optional Insurance | `optional_insurance_expire` | Date | Voluntary car insurance |
| 41 | 日本語検定 | Japanese Level | `japanese_level` | String | JLPT level (N1-N5) |
| 42 | キャリアアップ5年目 | Career Up 5th Year | `career_up_5years` | Boolean | Special status flag |

#### Sample Data (Row 2 - First Employee)
```
現在: 退社
社員№: 200805
派遣先: ピーエムアイ
氏名: VI THI HUE
カナ: ヴィ　ティ　フェ
性別: 女
国籍: ベトナム
生年月日: 1994-01-25
時給: 1300
```

#### Data Quality Issues (DBGenzaiX)
- ⚠️ **Status field critical**: "現在" = "在職中" (active) or "退社" (terminated)
- ⚠️ **派遣先ID**: Many have value "0" (needs default factory mapping)
- ⚠️ **配属先, 配属ライン, 仕事内容**: Many have value "0" (treat as NULL)
- ⚠️ **時給改定, 請求改定**: Free-text format with arrows (e.g., "2020/11/21 1200⇒1250")
  - Need to parse latest date and extract revision date
- ⚠️ **Apartment mapping**: アパート column contains apartment names, need to match with `apartments` table

---

### 2. DBUkeoiX (請負社員 - Contract Workers) ⭐⭐⭐

**Target Table:** `contract_workers`
**Records:** 100 rows (including header)
**Columns:** 33

#### Column Mapping (DBUkeoiX → PostgreSQL contract_workers table)

| # | Excel Column (Japanese) | Excel Column (English) | PostgreSQL Field | Data Type | Notes |
|---|------------------------|------------------------|------------------|-----------|-------|
| 1 | 現在 | Status | `is_active` | Boolean | "在職中" → True, "退社" → False |
| 2 | 社員№ | Employee ID | `hakenmoto_id` | Integer | Unique employee number |
| 3 | 請負業務 | Contract Work | `contract_work_type` | String | Type of contract work |
| 4 | 氏名 | Full Name (Kanji) | `full_name_kanji` | String | **REQUIRED** |
| 5 | カナ | Full Name (Kana) | `full_name_kana` | String | Katakana pronunciation |
| 6 | 性別 | Gender | `gender` | String | 男/女 |
| 7 | 国籍 | Nationality | `nationality` | String | |
| 8 | 生年月日 | Date of Birth | `date_of_birth` | Date | ⚠️ Excel serial number format |
| 9 | 年齢 | Age | - | - | **SKIP** (calculated) |
| 10 | 時給 | Hourly Rate | `jikyu` | Integer | |
| 11 | 時給改定 | Rate Revision | `jikyu_revision_date` | Date | |
| 12 | 標準報酬 | Standard Compensation | `standard_compensation` | Integer | |
| 13 | 健康保険 | Health Insurance | `health_insurance` | Integer | |
| 14 | 介護保険 | Nursing Insurance | `nursing_insurance` | Integer | |
| 15 | 厚生年金 | Pension Insurance | `pension_insurance` | Integer | |
| 16 | 通勤距離 | Commute Distance | `commute_distance` | Integer | Distance in km |
| 17 | 交通費 | Transportation Cost | `transportation_allowance` | Integer | Monthly allowance |
| 18 | 差額利益 | Profit Margin | `profit_difference` | Integer | |
| 19 | ビザ期限 | Visa Expiry | `zairyu_expire_date` | Date | |
| 20 | アラート(ビザ更新) | Visa Alert | - | - | **SKIP** (calculated) |
| 21 | ビザ種類 | Visa Type | `visa_type` | String | |
| 22 | 〒 | Postal Code | `postal_code` | String | |
| 23 | 住所 | Address | `address` | Text | |
| 24 | アパート | Apartment | `apartment_id` | Integer | Foreign key (requires mapping) |
| 25 | 入居 | Move-in Date | `apartment_start_date` | Date | |
| 26 | 入社日 | Hire Date | `hire_date` | Date | **REQUIRED** |
| 27 | 退社日 | Termination Date | `termination_date` | Date | |
| 28 | 退去 | Move-out Date | `apartment_move_out_date` | Date | |
| 29 | 社保加入 | Social Insurance | `social_insurance_date` | Date | |
| 30 | 口座名義 | Account Holder | `bank_account_name` | String | Bank account name |
| 31 | 銀行名 | Bank Name | `bank_name` | String | |
| 32 | 支店番号 | Branch Number | `bank_branch_code` | String | |
| 33 | 支店名 | Branch Name | `bank_branch_name` | String | |

#### Sample Data (Row 2 - First Contract Worker)
```
現在: 在職中
社員№: 030801
請負業務: 切粉回収
氏名: 西岡　守
カナ: ニシオカ　マモル
性別: 男
国籍: 日本
生年月日: 20017  ⚠️ Excel serial number (1954-10-16)
年齢: 71
時給: 1020
```

#### Data Quality Issues (DBUkeoiX)
- ⚠️ **生年月日 (DOB)**: Stored as Excel serial numbers (20017, 32394) - needs conversion
  - Formula: `date = datetime(1899, 12, 30) + timedelta(days=serial_number)`
- ⚠️ **請負業務**: Describes type of contract work (切粉回収, etc.) - NEW field for contract_workers
- ⚠️ **Bank fields**: Specific to contract workers (columns 30-33)

---

### 3. DBStaffX (スタッフ - Office Staff) ⭐⭐

**Target Table:** `staff`
**Records:** 16 rows (including header)
**Columns:** 17

#### Column Mapping (DBStaffX → PostgreSQL staff table)

| # | Excel Column (Japanese) | Excel Column (English) | PostgreSQL Field | Data Type | Notes |
|---|------------------------|------------------------|------------------|-----------|-------|
| 1 | № | Status | `is_active` | Boolean | "在職中" → True |
| 2 | 社員№ | Employee ID | `staff_id` | Integer | Unique staff number |
| 3 | 事務所 | Office | `office_location` | String | 名古屋, 東京, etc. |
| 4 | 氏名 | Full Name (Kanji) | `full_name_kanji` | String | **REQUIRED** |
| 5 | カナ | Full Name (Kana) | `full_name_kana` | String | |
| 6 | 性別 | Gender | `gender` | String | |
| 7 | 国籍 | Nationality | `nationality` | String | |
| 8 | 生年月日 | Date of Birth | `date_of_birth` | Date | ⚠️ Excel serial number |
| 9 | 年齢 | Age | - | - | **SKIP** |
| 10 | ビザ期限 | Visa Expiry | `visa_expiry` | Date | ⚠️ Excel serial number |
| 11 | ビザ種類 | Visa Type | `visa_type` | String | 経営, 永住者, etc. |
| 12 | 配偶者 | Spouse | `marital_status` | String | 有/無 → Married/Single |
| 13 | 〒 | Postal Code | `postal_code` | String | |
| 14 | 住所 | Address | `address` | Text | |
| 15 | 建物名 | Building Name | `building_name` | String | |
| 16 | 入社日 | Hire Date | `hire_date` | Date | |
| 17 | 退社日 | Termination Date | `termination_date` | Date | |

#### Sample Data (Row 2 - First Staff)
```
№: 在職中
社員№: 1
事務所: 名古屋
氏名: VU THI SAU
カナ: ヴゥ　ティ　サウ
性別: 女
国籍: ベトナム
生年月日: 32394  ⚠️ Excel serial number (1988-08-20)
ビザ種類: 経営
配偶者: 有
```

#### Data Quality Issues (DBStaffX)
- ⚠️ **生年月日, ビザ期限**: Excel serial numbers (32394, 45986) - needs conversion
- ⚠️ **建物名**: Has value "0" for some records - treat as NULL
- ⚠️ **Limited fields**: Only 17 columns compared to employees (42) and contract workers (33)

---

## 🔧 DATA TRANSFORMATION REQUIREMENTS

### 1. Date Conversion
**Problem:** Excel stores dates as serial numbers (days since 1899-12-30)

**Examples:**
- `20017` → 1954-10-16
- `32394` → 1988-08-20
- `45986` → 2025-11-03

**Solution (Python):**
```python
from datetime import datetime, timedelta

def convert_excel_date(serial_number):
    """Convert Excel serial number to Python date"""
    if serial_number is None or serial_number == 0:
        return None
    if isinstance(serial_number, datetime):
        return serial_number.date()

    try:
        # Excel epoch: 1899-12-30
        base_date = datetime(1899, 12, 30)
        return (base_date + timedelta(days=int(serial_number))).date()
    except:
        return None
```

### 2. Status Field Conversion
**Problem:** "現在" column has Japanese text values

**Mapping:**
- `"在職中"` → `is_active = True`
- `"退社"` → `is_active = False`
- `NULL` or empty → `is_active = True` (default)

**Solution:**
```python
def convert_status(status_value):
    """Convert Japanese status to boolean"""
    if status_value is None:
        return True
    status_str = str(status_value).strip()
    if status_str == "退社":
        return False
    return True  # "在職中" or other
```

### 3. Gender Conversion
**Problem:** Gender stored as Japanese characters

**Mapping:**
- `"男"` → `"Male"` or `"M"`
- `"女"` → `"Female"` or `"F"`
- `NULL` or empty → `NULL`

### 4. Marital Status Conversion (Staff only)
**Problem:** "配偶者" column uses Japanese

**Mapping:**
- `"有"` → `"Married"` or `True`
- `"無"` → `"Single"` or `False`
- `NULL` → `NULL`

### 5. Parse Revision Dates
**Problem:** "時給改定" and "請求改定" contain free-text revision history

**Example:**
```
"2020/11/21 1200⇒1250　2021/2/21　1250⇒1300"
```

**Solution:**
```python
import re
from datetime import datetime

def extract_latest_revision_date(revision_text):
    """Extract latest revision date from free text"""
    if not revision_text:
        return None

    # Find all dates in format YYYY/M/D or YYYY/MM/DD
    pattern = r'(\d{4})/(\d{1,2})/(\d{1,2})'
    matches = re.findall(pattern, str(revision_text))

    if not matches:
        return None

    # Convert to dates and return latest
    dates = []
    for year, month, day in matches:
        try:
            dates.append(datetime(int(year), int(month), int(day)).date())
        except:
            continue

    return max(dates) if dates else None
```

### 6. Apartment Name → apartment_id Mapping
**Problem:** アパート column contains apartment names (strings), but we need `apartment_id` (integer)

**Solution:**
```python
def map_apartment_name_to_id(apartment_name, session):
    """Map apartment name to apartment_id"""
    if not apartment_name or apartment_name == "0":
        return None

    # Query apartments table by name
    apartment = session.query(Apartment).filter(
        Apartment.name.ilike(f"%{apartment_name}%")
    ).first()

    if apartment:
        return apartment.id
    else:
        # Log unmapped apartment for manual review
        print(f"WARNING: Apartment '{apartment_name}' not found in database")
        return None
```

### 7. Factory ID Mapping
**Problem:** 派遣先ID has value "0" for many records, but 派遣先 (factory name) is populated

**Solution:**
```python
def map_factory_name_to_id(factory_name, session):
    """Map factory name to factory_id"""
    if not factory_name or factory_name == "0":
        return None

    # Query factories table by company_name or plant_name
    factory = session.query(Factory).filter(
        (Factory.company_name.ilike(f"%{factory_name}%")) |
        (Factory.plant_name.ilike(f"%{factory_name}%"))
    ).first()

    if factory:
        return factory.factory_id
    else:
        # Create new factory or log for manual review
        print(f"WARNING: Factory '{factory_name}' not found in database")
        return None
```

### 8. Handle "0" Values
**Problem:** Many fields have literal string "0" instead of NULL

**Fields Affected:**
- 派遣先ID, 配属先, 配属ライン, 仕事内容 (DBGenzaiX)
- 建物名 (DBStaffX)

**Solution:**
```python
def clean_zero_values(value):
    """Convert '0' string to None"""
    if value is None:
        return None
    if str(value).strip() == "0":
        return None
    return value
```

---

## 📋 IMPORT PLAN

### Phase 1: Pre-Import Validation ⏱️ 1 hour

1. **Database Schema Validation**
   - ✅ Verify `employees` table exists with all required columns
   - ✅ Verify `contract_workers` table exists
   - ✅ Verify `staff` table exists (or create if doesn't exist)
   - ✅ Verify foreign key tables exist: `factories`, `apartments`

2. **Reference Data Preparation**
   - ✅ Extract unique factory names from Excel
   - ✅ Match with existing `factories` table
   - ✅ Create mapping dictionary: `{excel_factory_name: factory_id}`
   - ✅ Extract unique apartment names
   - ✅ Match with existing `apartments` table
   - ✅ Create mapping dictionary: `{excel_apartment_name: apartment_id}`

3. **Data Quality Check**
   - ✅ Count total records per sheet
   - ✅ Identify records with missing required fields (氏名, 社員№)
   - ✅ Identify duplicate hakenmoto_id values
   - ✅ Validate date formats and ranges
   - ✅ Check for invalid enum values (gender, nationality, etc.)

### Phase 2: Import DBGenzaiX → employees ⏱️ 2 hours

**Target:** 1,050 records → `employees` table

**Steps:**
1. ✅ Load DBGenzaiX sheet with openpyxl
2. ✅ Skip header row (row 1)
3. ✅ For each data row (rows 2-1050):
   - ✅ Extract all 42 columns
   - ✅ Apply transformations:
     - Convert dates (生年月日, ビザ期限, 入社日, 退社日, etc.)
     - Parse revision dates (時給改定, 請求改定)
     - Map status (現在 → is_active)
     - Map gender (性別)
     - Map factory (派遣先 → factory_id)
     - Map apartment (アパート → apartment_id)
     - Clean "0" values
   - ✅ Validate required fields:
     - `hakenmoto_id` (社員№) - REQUIRED, UNIQUE
     - `full_name_kanji` (氏名) - REQUIRED
     - `hire_date` (入社日) - REQUIRED
   - ✅ Create Employee object
   - ✅ Add to session
4. ✅ Commit in batches (100 records per batch)
5. ✅ Log errors and skipped records
6. ✅ Generate import summary report

**Error Handling:**
- Skip records with missing required fields (log as ERROR)
- Skip records with duplicate hakenmoto_id (log as WARNING)
- Continue import on non-critical errors
- Rollback batch on database constraint violations

### Phase 3: Import DBUkeoiX → contract_workers ⏱️ 1 hour

**Target:** 100 records → `contract_workers` table

**Steps:**
1. ✅ Load DBUkeoiX sheet
2. ✅ Skip header row
3. ✅ For each data row:
   - ✅ Extract all 33 columns
   - ✅ Apply transformations (same as Phase 2, plus):
     - Convert Excel serial dates (生年月日)
     - Extract bank information (口座名義, 銀行名, 支店番号, 支店名)
   - ✅ Validate required fields
   - ✅ Create ContractWorker object
   - ✅ Commit in batches
4. ✅ Generate import summary

### Phase 4: Import DBStaffX → staff ⏱️ 30 minutes

**Target:** 16 records → `staff` table

**Prerequisites:**
- ⚠️ Verify if `staff` table exists in schema
- ⚠️ If not exists, create migration to add `staff` table

**Steps:**
1. ✅ Check if `staff` table exists
2. ✅ If not, create table with schema:
   ```sql
   CREATE TABLE staff (
       id SERIAL PRIMARY KEY,
       staff_id INTEGER UNIQUE NOT NULL,
       office_location VARCHAR(100),
       full_name_kanji VARCHAR(100) NOT NULL,
       full_name_kana VARCHAR(100),
       gender VARCHAR(10),
       nationality VARCHAR(50),
       date_of_birth DATE,
       visa_expiry DATE,
       visa_type VARCHAR(50),
       marital_status VARCHAR(20),
       postal_code VARCHAR(10),
       address TEXT,
       building_name VARCHAR(100),
       hire_date DATE,
       termination_date DATE,
       is_active BOOLEAN DEFAULT TRUE,
       created_at TIMESTAMP DEFAULT NOW(),
       updated_at TIMESTAMP
   );
   ```
3. ✅ Load DBStaffX sheet
4. ✅ For each data row:
   - ✅ Convert Excel serial dates (生年月日, ビザ期限)
   - ✅ Map status (№ column)
   - ✅ Map marital status (配偶者)
   - ✅ Create Staff object
5. ✅ Commit all records

### Phase 5: Post-Import Validation ⏱️ 30 minutes

1. **Record Counts**
   ```sql
   SELECT COUNT(*) FROM employees;          -- Expected: ~1,050
   SELECT COUNT(*) FROM contract_workers;   -- Expected: ~100
   SELECT COUNT(*) FROM staff;              -- Expected: ~16
   ```

2. **Data Quality Checks**
   ```sql
   -- Check for missing required fields
   SELECT COUNT(*) FROM employees WHERE full_name_kanji IS NULL;
   SELECT COUNT(*) FROM employees WHERE hakenmoto_id IS NULL;

   -- Check for orphaned foreign keys
   SELECT COUNT(*) FROM employees WHERE factory_id IS NOT NULL
       AND factory_id NOT IN (SELECT factory_id FROM factories);

   -- Check date ranges
   SELECT MIN(hire_date), MAX(hire_date) FROM employees;
   SELECT MIN(date_of_birth), MAX(date_of_birth) FROM employees;
   ```

3. **Generate Import Report**
   - Total records imported per table
   - Number of errors/warnings
   - Records skipped with reasons
   - Foreign key mapping success rate
   - Data quality metrics

---

## 🚨 CRITICAL ISSUES & RISKS

### 🔴 HIGH PRIORITY

1. **Excel Serial Date Conversion**
   - **Issue:** DBUkeoiX and DBStaffX use Excel serial numbers for dates
   - **Impact:** Incorrect birthdates and visa expiry dates
   - **Solution:** Implement robust date conversion function
   - **Test Case:** `20017 → 1954-10-16`, `32394 → 1988-08-20`

2. **Duplicate hakenmoto_id**
   - **Issue:** Some employee IDs may appear in multiple sheets
   - **Impact:** Database unique constraint violation
   - **Solution:** Use UPSERT logic (ON CONFLICT DO UPDATE)
   - **Risk:** Overwriting existing employee data

3. **Factory & Apartment Mapping**
   - **Issue:** Excel contains names, DB requires IDs
   - **Impact:** Unmapped foreign keys result in NULL values
   - **Solution:** Pre-build mapping dictionaries
   - **Fallback:** Create new factories/apartments if not found (with approval)

4. **Missing Required Fields**
   - **Issue:** Some records may lack 氏名 or 社員№
   - **Impact:** Records cannot be imported
   - **Solution:** Skip records, log errors for manual review

### 🟡 MEDIUM PRIORITY

5. **Revision Date Parsing**
   - **Issue:** Free-text format for 時給改定 and 請求改定
   - **Impact:** Data loss if parsing fails
   - **Solution:** Extract latest date with regex, log unparseable values

6. **"0" Value Handling**
   - **Issue:** Literal "0" used instead of NULL
   - **Impact:** Invalid data in optional fields
   - **Solution:** Convert "0" to NULL for specific fields

7. **Character Encoding**
   - **Issue:** Japanese characters (Kanji, Katakana, Hiragana)
   - **Impact:** Potential encoding errors
   - **Solution:** Use UTF-8 encoding throughout, test with real data

### 🟢 LOW PRIORITY

8. **Sheet Duplication**
   - **Issue:** Display sheets (派遣社員, 請負社員, スタッフ) duplicate DB sheets
   - **Impact:** Confusion, potential double-import
   - **Solution:** Only import DB sheets (DBGenzaiX, DBUkeoiX, DBStaffX)

9. **Calculated Fields**
   - **Issue:** 年齢 (age) is stored but should be calculated
   - **Impact:** Stale data if birthdates change
   - **Solution:** Skip age column during import, calculate dynamically

---

## 📝 IMPORT SCRIPT SKELETON

```python
#!/usr/bin/env python3
"""
Import Employee Master Data from Excel to PostgreSQL
File: backend/scripts/import_employee_master.py
"""
import openpyxl
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import re
import sys

from app.models.models import Employee, ContractWorker, Staff, Factory, Apartment
from app.core.config import settings

# Configuration
EXCEL_FILE = "/app/BASEDATEJP/【新】社員台帳(UNS)T　2022.04.05～.xlsm"
BATCH_SIZE = 100

# Statistics
stats = {
    "employees": {"imported": 0, "skipped": 0, "errors": 0},
    "contract_workers": {"imported": 0, "skipped": 0, "errors": 0},
    "staff": {"imported": 0, "skipped": 0, "errors": 0},
}

def convert_excel_date(serial_number):
    """Convert Excel serial number to Python date"""
    if serial_number is None or serial_number == 0:
        return None
    if isinstance(serial_number, datetime):
        return serial_number.date()

    try:
        base_date = datetime(1899, 12, 30)
        return (base_date + timedelta(days=int(serial_number))).date()
    except:
        return None

def convert_status(status_value):
    """Convert Japanese status to boolean"""
    if status_value is None:
        return True
    status_str = str(status_value).strip()
    return status_str != "退社"

def extract_latest_revision_date(revision_text):
    """Extract latest revision date from free text"""
    if not revision_text:
        return None

    pattern = r'(\d{4})/(\d{1,2})/(\d{1,2})'
    matches = re.findall(pattern, str(revision_text))

    if not matches:
        return None

    dates = []
    for year, month, day in matches:
        try:
            dates.append(datetime(int(year), int(month), int(day)).date())
        except:
            continue

    return max(dates) if dates else None

def clean_zero_values(value):
    """Convert '0' string to None"""
    if value is None:
        return None
    if str(value).strip() == "0":
        return None
    return value

def map_factory_name_to_id(factory_name, factory_cache):
    """Map factory name to factory_id using cache"""
    if not factory_name or factory_name == "0":
        return None

    # Search in cache (case-insensitive)
    factory_name_lower = factory_name.lower()
    for name, factory_id in factory_cache.items():
        if factory_name_lower in name.lower():
            return factory_id

    return None

def map_apartment_name_to_id(apartment_name, apartment_cache):
    """Map apartment name to apartment_id using cache"""
    if not apartment_name or apartment_name == "0":
        return None

    apartment_name_lower = apartment_name.lower()
    for name, apartment_id in apartment_cache.items():
        if apartment_name_lower in name.lower():
            return apartment_id

    return None

def build_factory_cache(session):
    """Build factory name → ID mapping"""
    factories = session.query(Factory).all()
    cache = {}
    for factory in factories:
        if factory.company_name:
            cache[factory.company_name] = factory.factory_id
        if factory.plant_name:
            cache[factory.plant_name] = factory.factory_id
    return cache

def build_apartment_cache(session):
    """Build apartment name → ID mapping"""
    apartments = session.query(Apartment).all()
    cache = {}
    for apt in apartments:
        if apt.name:
            cache[apt.name] = apt.id
    return cache

def import_dbgenzai_sheet(wb, session, factory_cache, apartment_cache):
    """Import DBGenzaiX sheet to employees table"""
    ws = wb["DBGenzaiX"]

    print("\n" + "=" * 80)
    print("IMPORTING DBGenzaiX → employees")
    print("=" * 80)

    header_row = 1
    batch = []

    for row_idx in range(header_row + 1, ws.max_row + 1):
        try:
            # Extract row data
            row_data = {}
            for col_idx, col_name in enumerate(DBGENZAI_COLUMNS, start=1):
                cell_value = ws.cell(row=row_idx, column=col_idx).value
                row_data[col_name] = cell_value

            # Validate required fields
            if not row_data["社員№"] or not row_data["氏名"]:
                stats["employees"]["skipped"] += 1
                print(f"  Row {row_idx}: SKIP - Missing required fields")
                continue

            # Transform data
            employee_data = {
                "hakenmoto_id": int(row_data["社員№"]),
                "full_name_kanji": row_data["氏名"],
                "full_name_kana": row_data["カナ"],
                "gender": row_data["性別"],
                "nationality": row_data["国籍"],
                "date_of_birth": convert_excel_date(row_data["生年月日"]),
                "jikyu": row_data["時給"],
                "jikyu_revision_date": extract_latest_revision_date(row_data["時給改定"]),
                "hourly_rate_charged": row_data["請求単価"],
                "billing_revision_date": extract_latest_revision_date(row_data["請求改定"]),
                "profit_difference": row_data["差額利益"],
                "standard_compensation": row_data["標準報酬"],
                "health_insurance": row_data["健康保険"],
                "nursing_insurance": row_data["介護保険"],
                "pension_insurance": row_data["厚生年金"],
                "zairyu_expire_date": convert_excel_date(row_data["ビザ期限"]),
                "visa_type": row_data["ビザ種類"],
                "postal_code": row_data["〒"],
                "address": row_data["住所"],
                "hire_date": convert_excel_date(row_data["入社日"]),
                "termination_date": convert_excel_date(row_data["退社日"]),
                "social_insurance_date": convert_excel_date(row_data["社保加入"]),
                "current_hire_date": convert_excel_date(row_data["現入社"]),
                "license_type": row_data["免許種類"],
                "license_expire_date": convert_excel_date(row_data["免許期限"]),
                "commute_method": row_data["通勤方法"],
                "optional_insurance_expire": convert_excel_date(row_data["任意保険期限"]),
                "japanese_level": row_data["日本語検定"],
                "career_up_5years": row_data["キャリアアップ5年目"] == "○",
                "entry_request_date": convert_excel_date(row_data["入社依頼"]),
                "notes": row_data["備考"],
                "is_active": convert_status(row_data["現在"]),
                "factory_id": map_factory_name_to_id(row_data["派遣先"], factory_cache),
                "company_name": row_data["派遣先"],
                "assignment_location": clean_zero_values(row_data["配属先"]),
                "assignment_line": clean_zero_values(row_data["配属ライン"]),
                "job_description": clean_zero_values(row_data["仕事内容"]),
                "apartment_id": map_apartment_name_to_id(row_data["アパート"], apartment_cache),
                "apartment_start_date": convert_excel_date(row_data["入居"]),
                "apartment_move_out_date": convert_excel_date(row_data["退去"]),
            }

            # Create Employee object
            employee = Employee(**employee_data)
            batch.append(employee)

            # Commit in batches
            if len(batch) >= BATCH_SIZE:
                session.bulk_save_objects(batch)
                session.commit()
                stats["employees"]["imported"] += len(batch)
                print(f"  Imported {stats['employees']['imported']} employees...")
                batch = []

        except Exception as e:
            stats["employees"]["errors"] += 1
            print(f"  Row {row_idx}: ERROR - {str(e)}")
            session.rollback()

    # Commit remaining
    if batch:
        session.bulk_save_objects(batch)
        session.commit()
        stats["employees"]["imported"] += len(batch)

    print(f"\n✅ Employees imported: {stats['employees']['imported']}")
    print(f"⚠️  Employees skipped: {stats['employees']['skipped']}")
    print(f"❌ Employees errors: {stats['employees']['errors']}")

# Column definitions
DBGENZAI_COLUMNS = [
    "現在", "社員№", "派遣先ID", "派遣先", "配属先", "配属ライン", "仕事内容",
    "氏名", "カナ", "性別", "国籍", "生年月日", "年齢", "時給", "時給改定",
    "請求単価", "請求改定", "差額利益", "標準報酬", "健康保険", "介護保険",
    "厚生年金", "ビザ期限", "ｱﾗｰﾄ(ﾋﾞｻﾞ更新)", "ビザ種類", "〒", "住所",
    "ｱﾊﾟｰﾄ", "入居", "入社日", "退社日", "退去", "社保加入", "入社依頼",
    "備考", "現入社", "免許種類", "免許期限", "通勤方法", "任意保険期限",
    "日本語検定", "キャリアアップ5年目"
]

def main():
    """Main import function"""
    print("=" * 80)
    print("EMPLOYEE MASTER IMPORT SCRIPT")
    print("=" * 80)

    # Load workbook
    print(f"\nLoading: {EXCEL_FILE}")
    wb = openpyxl.load_workbook(EXCEL_FILE, read_only=True, data_only=True)

    # Create database session
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()

    # Build reference caches
    print("\nBuilding reference data caches...")
    factory_cache = build_factory_cache(session)
    apartment_cache = build_apartment_cache(session)
    print(f"  Factories: {len(factory_cache)}")
    print(f"  Apartments: {len(apartment_cache)}")

    # Import sheets
    import_dbgenzai_sheet(wb, session, factory_cache, apartment_cache)
    # TODO: import_dbukeoi_sheet(wb, session, factory_cache, apartment_cache)
    # TODO: import_dbstaff_sheet(wb, session)

    # Close
    wb.close()
    session.close()

    # Final report
    print("\n" + "=" * 80)
    print("IMPORT COMPLETE")
    print("=" * 80)
    print(f"\nEmployees: {stats['employees']}")
    print(f"Contract Workers: {stats['contract_workers']}")
    print(f"Staff: {stats['staff']}")

if __name__ == "__main__":
    main()
```

---

## ✅ SUCCESS CRITERIA

1. **Data Completeness**
   - ✅ All records from DBGenzaiX imported to `employees`
   - ✅ All records from DBUkeoiX imported to `contract_workers`
   - ✅ All records from DBStaffX imported to `staff`
   - ✅ Import success rate > 95%

2. **Data Quality**
   - ✅ No NULL values in required fields (hakenmoto_id, full_name_kanji, hire_date)
   - ✅ All dates in valid range (1900-2100)
   - ✅ Foreign keys mapped correctly (factory_id, apartment_id)
   - ✅ No duplicate hakenmoto_id values

3. **Traceability**
   - ✅ Detailed import log with timestamps
   - ✅ Error log with row numbers and reasons
   - ✅ Summary report with statistics
   - ✅ Unmapped factory/apartment list for manual review

4. **Rollback Capability**
   - ✅ Can rollback import if critical errors found
   - ✅ Database backup created before import
   - ✅ Transaction-based import (commit in batches)

---

## 🎯 NEXT STEPS

### Immediate (Phase 0)
1. ✅ **Review this analysis** with stakeholders
2. ✅ **Create database backup** before import
3. ✅ **Verify database schema** matches requirements
4. ✅ **Test date conversion** with sample data

### Short-term (Phases 1-5)
1. ✅ Implement import script (`backend/scripts/import_employee_master.py`)
2. ✅ Test with DBGenzaiX (first 10 rows)
3. ✅ Run full import for DBGenzaiX → employees
4. ✅ Validate results in database
5. ✅ Implement DBUkeoiX → contract_workers import
6. ✅ Implement DBStaffX → staff import (check if table exists)

### Long-term
1. ✅ Create web UI for data import (frontend page)
2. ✅ Add support for incremental updates (UPSERT logic)
3. ✅ Implement data synchronization with Excel file
4. ✅ Add audit logging for all imports
5. ✅ Create automated import schedule (e.g., weekly)

---

## 📞 CONTACT

**Questions or Issues?**
- Contact: @data-engineer
- Related Agents: @database-admin, @backend-developer
- Documentation: `docs/guides/data-import.md`

---

**Generated by:** @data-engineer
**Date:** 2025-11-17
**Version:** 1.0
