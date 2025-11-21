# Excel Import - Quick Reference Summary

**File:** `【新】社員台帳(UNS)T　2022.04.05～.xlsm`
**Analysis Date:** 2025-11-17

---

## 📊 DATA OVERVIEW

```
┌─────────────────────────────────────────────────────────────┐
│                    EXCEL FILE STRUCTURE                     │
├─────────────────────┬────────┬─────────┬────────────────────┤
│ Sheet Name          │ Rows   │ Columns │ Target Table       │
├─────────────────────┼────────┼─────────┼────────────────────┤
│ DBGenzaiX ⭐⭐⭐      │ 1,050  │ 42      │ employees          │
│ DBUkeoiX ⭐⭐⭐       │ 100    │ 33      │ contract_workers   │
│ DBStaffX ⭐⭐        │ 16     │ 17      │ staff              │
│ 派遣社員 ⚠️         │ 1,051  │ 42      │ (duplicate)        │
│ 請負社員 ⚠️         │ 143    │ 42      │ (duplicate)        │
│ スタッフ ⚠️         │ 22     │ 25      │ (duplicate)        │
│ Other sheets        │ -      │ -       │ (skip)             │
└─────────────────────┴────────┴─────────┴────────────────────┘

Total importable records: ~1,166 employees
```

---

## 🔑 KEY FIELD MAPPINGS

### 1. DBGenzaiX → employees (42 columns)

| Japanese | English | PostgreSQL Field | Transform |
|----------|---------|------------------|-----------|
| 現在 | Status | `is_active` | "退社" → False |
| 社員№ | Employee ID | `hakenmoto_id` | Required, Unique |
| 氏名 | Full Name | `full_name_kanji` | Required |
| カナ | Kana | `full_name_kana` | - |
| 性別 | Gender | `gender` | 男→Male, 女→Female |
| 国籍 | Nationality | `nationality` | - |
| 生年月日 | Birth Date | `date_of_birth` | Excel date |
| 時給 | Hourly Rate | `jikyu` | Integer (¥/hour) |
| 派遣先 | Factory | `factory_id` | Map name→ID |
| アパート | Apartment | `apartment_id` | Map name→ID |
| 入社日 | Hire Date | `hire_date` | Excel date |
| 退社日 | Term. Date | `termination_date` | Excel date |
| ビザ期限 | Visa Expiry | `zairyu_expire_date` | Excel date |

### 2. DBUkeoiX → contract_workers (33 columns)

Same as employees, PLUS:
- **請負業務** → `contract_work_type` (type of contract work)
- **通勤距離** → `commute_distance` (km)
- **交通費** → `transportation_allowance` (¥/month)
- **口座名義** → `bank_account_name`
- **銀行名** → `bank_name`
- **支店番号** → `bank_branch_code`
- **支店名** → `bank_branch_name`

### 3. DBStaffX → staff (17 columns)

Minimal fields:
- **事務所** → `office_location` (Nagoya, Tokyo, etc.)
- **配偶者** → `marital_status` (有→Married, 無→Single)
- **建物名** → `building_name`

---

## ⚠️ CRITICAL TRANSFORMATIONS

### Date Conversion (Excel Serial Numbers)

```python
# Excel stores dates as days since 1899-12-30
Examples:
  20017 → 1954-10-16
  32394 → 1988-08-20
  45986 → 2025-11-03

def convert_excel_date(serial):
    base = datetime(1899, 12, 30)
    return (base + timedelta(days=int(serial))).date()
```

### Parse Revision Dates (Free Text)

```
Input:  "2020/11/21 1200⇒1250　2021/2/21　1250⇒1300"
Output: 2021-02-21 (latest date)

Pattern: \d{4}/\d{1,2}/\d{1,2}
```

### Handle "0" Values

```python
# Many fields use "0" instead of NULL
Fields affected:
  - 派遣先ID, 配属先, 配属ライン, 仕事内容
  - 建物名

if value == "0":
    return None
```

### Status Conversion

```python
"在職中" → is_active = True
"退社"   → is_active = False
```

---

## 🚨 DATA QUALITY ISSUES

### High Priority
- ⚠️ **Excel serial dates**: DBUkeoiX and DBStaffX use serial numbers
- ⚠️ **Factory mapping**: Many records have factory_id = 0
- ⚠️ **Apartment mapping**: Names need to be matched with IDs
- ⚠️ **Duplicate sheets**: 派遣社員/請負社員/スタッフ duplicate DB sheets

### Medium Priority
- ⚠️ **Revision dates**: Free-text format needs parsing
- ⚠️ **"0" values**: Used instead of NULL in many fields
- ⚠️ **Missing data**: Some required fields may be empty

### Validation Rules
```python
# Required fields (cannot be NULL)
employees:
  - hakenmoto_id (社員№)
  - full_name_kanji (氏名)
  - hire_date (入社日)

# Unique constraints
employees:
  - hakenmoto_id (must be unique)

# Foreign keys (need mapping)
employees:
  - factory_id → factories.factory_id
  - apartment_id → apartments.id
```

---

## 📋 IMPORT WORKFLOW

### Phase 1: Pre-Import (1 hour)
```
1. ✅ Backup database
2. ✅ Verify schema (employees, contract_workers, staff tables)
3. ✅ Build factory mapping (name → factory_id)
4. ✅ Build apartment mapping (name → apartment_id)
5. ✅ Validate Excel file integrity
```

### Phase 2: Import DBGenzaiX (2 hours)
```
1. Load DBGenzaiX sheet
2. Skip header row (row 1)
3. Process rows 2-1050:
   ✅ Extract 42 columns
   ✅ Apply transformations
   ✅ Validate required fields
   ✅ Create Employee objects
   ✅ Commit in batches (100 records)
4. Log errors and generate report

Expected result: ~1,050 employees imported
```

### Phase 3: Import DBUkeoiX (1 hour)
```
Same process as Phase 2
Target: contract_workers table
Expected result: ~100 contract workers imported
```

### Phase 4: Import DBStaffX (30 min)
```
Check if staff table exists → create if needed
Import 16 staff records
Expected result: ~16 staff imported
```

### Phase 5: Validation (30 min)
```sql
-- Verify counts
SELECT COUNT(*) FROM employees;          -- ~1,050
SELECT COUNT(*) FROM contract_workers;   -- ~100
SELECT COUNT(*) FROM staff;              -- ~16

-- Check data quality
SELECT COUNT(*) FROM employees WHERE full_name_kanji IS NULL;  -- 0
SELECT COUNT(*) FROM employees WHERE hakenmoto_id IS NULL;     -- 0
SELECT MIN(hire_date), MAX(hire_date) FROM employees;

-- Check foreign keys
SELECT COUNT(*) FROM employees
WHERE factory_id IS NOT NULL
  AND factory_id NOT IN (SELECT factory_id FROM factories);
```

---

## 📁 FILES CREATED

### Analysis Documents
- `EXCEL_ANALYSIS_AND_IMPORT_PLAN.md` (detailed 25,000+ word analysis)
- `EXCEL_IMPORT_SUMMARY.md` (this quick reference)

### Import Scripts (to be created)
- `backend/scripts/import_employee_master.py` (main import script)
- `backend/scripts/validate_import.py` (validation script)
- `backend/scripts/generate_factory_mapping.py` (factory mapping)
- `backend/scripts/generate_apartment_mapping.py` (apartment mapping)

### Log Files (after import)
- `import_log_YYYYMMDD_HHMMSS.txt` (detailed log)
- `import_errors_YYYYMMDD_HHMMSS.txt` (errors only)
- `import_report_YYYYMMDD_HHMMSS.json` (statistics)

---

## 🎯 SUCCESS CRITERIA

✅ **Completeness**: >95% of records imported
✅ **Quality**: Zero NULL in required fields
✅ **Integrity**: All foreign keys mapped
✅ **Traceability**: Detailed logs generated
✅ **Rollback**: Can restore from backup

---

## 🔗 RELATED DOCUMENTS

- Full Analysis: `EXCEL_ANALYSIS_AND_IMPORT_PLAN.md`
- Database Schema: `backend/app/models/models.py`
- Import Script: `backend/scripts/import_employee_master.py` (to be created)
- Troubleshooting: `docs/guides/data-import-troubleshooting.md`

---

## 📞 SUPPORT

**Need Help?**
- Technical: @data-engineer
- Database: @database-admin
- Backend: @backend-developer

**Documentation:**
- Project: `CLAUDE.md`
- Architecture: `docs/architecture/`
- Guides: `docs/guides/`

---

**Generated:** 2025-11-17 by @data-engineer
**Status:** Analysis Complete ✅ | Ready for Import 🚀
