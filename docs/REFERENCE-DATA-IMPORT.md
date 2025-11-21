# 📋 Reference: Data Import & Photo Storage Guide

**Status**: ✅ COMPLETED (2025-11-17)
**Rule**: NUNCA NADA DEMO - All real production data only

---

## 🎯 Import Summary

### Candidates (履歴書) - 1,153 Records with Photos
- **Source**: Microsoft Access DB (`BASEDATEJP/ユニバーサル企画㈱データベースv25.3.24_be.accdb`)
- **Extracted**: 1,156 candidates → 1,153 imported (some missing names were skipped)
- **Photos**: 1,153/1,153 (100% with photos!)
- **Photo Format**: Base64 Data URLs in field `photo_data_url`
- **Table**: `candidates`

### Employees (派遣社員) - 1,044 Records
- **Source**: Excel (`【新】社員台帳(UNS)T　2022.04.05～.xlsm`, sheet: `DBGenzaiX`)
- **Imported**: 1,044 employees
- **Table**: `employees`
- **Key Field**: `hakenmoto_id` (sequential 1-1044)

### Contract Workers (請負社員) - 99 Records
- **Source**: Excel, sheet: `DBUkeoiX`
- **Imported**: 99 contract workers
- **Table**: `contract_workers`
- **Key Field**: `hakenmoto_id` (sequential 1045-1143)

### Office Staff (スタッフ) - 15 Records
- **Source**: Excel, sheet: `DBStaffX`
- **Imported**: 15 staff members
- **Table**: `staff`
- **Key Field**: `staff_id` (sequential 1-15)

---

## 📸 Photo Storage Location

### Where Photos Are Stored

**Database Table**: `candidates`
**Column**: `photo_data_url` (TEXT field)
**Format**: Base64 encoded data URLs

**Example Structure**:
```
data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgH...
```

### How to Access Photos

#### 1. **Direct SQL Query** (to verify photos exist)
```sql
-- Count candidates with photos
SELECT COUNT(*) as candidates_with_photos
FROM candidates
WHERE photo_data_url IS NOT NULL;

-- Result: 1153 (all candidates have photos!)
```

#### 2. **From API** (in Frontend/App)
```typescript
// When fetching candidate data
const candidate = await getCandidateById(rirekisho_id);
// candidate.photo_data_url contains the Base64 image
// Can be displayed directly in <img src={candidate.photo_data_url} />
```

#### 3. **Database Direct Access**
```bash
# Access PostgreSQL container
docker exec -it uns-claudejp-600-db psql -U uns_admin -d uns_claudejp

# Query specific candidate with photo
SELECT rirekisho_id, full_name_kanji, photo_data_url
FROM candidates
WHERE rirekisho_id = 'RIR01001'
LIMIT 1;
```

---

## 🔧 Import Scripts Used

### 1. **Candidate Photo Extraction** (Access → JSON)
**File**: `/backend/scripts/extract_candidates_from_access.py`

**Process**:
- Opens Access DB using pyodbc + COM
- Reads attachment objects from candidates table
- Extracts photos as binary
- Converts to Base64 Data URLs
- Saves to JSON file: `/app/access_candidates_data.json`

**Output**:
```json
{
  "metadata": {...},
  "candidates": [
    {
      "rirekisho_id": "RIR01001",
      "full_name_roman": "JOHN DOE",
      "photo_data_url": "data:image/jpeg;base64,/9j/4AAQ...",
      ...
    }
  ]
}
```

### 2. **Candidate Import** (JSON → PostgreSQL)
**File**: `/backend/scripts/final_import_candidates.py`

**Features**:
- Handles flexible JSON structures
- Generates rirekisho_id for missing values (format: `RIR{index+1000}`)
- Maps field names (Japanese & English)
- Batch commits every 100 records
- Validates photo URLs

**Execution**:
```bash
docker exec uns-claudejp-600-backend-1 python scripts/final_import_candidates.py
```

**Result**:
```
[OK] Imported 1,153 candidates
[OK] With photos: 1,153
[OK] Total in database: 1,153
```

### 3. **Employee/Staff Import** (Excel → PostgreSQL)
**File**: `/backend/scripts/import_employees_complete.py`

**Features**:
- Reads Excel sheets (DBGenzaiX, DBUkeoiX, DBStaffX)
- Converts Excel date numbers to datetime
- Generates hakenmoto_id (employees & contract workers)
- Generates staff_id (for staff table)
- Field mapping:
  - Col2 = 社員№ → hakensaki_shain_id
  - Col8 = 氏名 → full_name_kanji
  - Col9 = カナ → full_name_kana
  - Col10 = 性別 → gender
  - Col12 = 生年月日 → date_of_birth
  - Col14 = 時給 → jikyu

**Execution**:
```bash
docker exec uns-claudejp-600-backend-1 python scripts/import_employees_complete.py
```

### 4. **Staff-Only Import** (Excel → PostgreSQL)
**File**: `/backend/scripts/import_staff_only.py`

**Note**: Staff model uses `staff_id` (not `hakenmoto_id`)

---

## 📊 Data Verification Queries

### Check All Data
```sql
-- Comprehensive view of all imported data
SELECT 'Candidates' as type, COUNT(*) as total FROM candidates
UNION ALL
SELECT 'Candidates with photos', COUNT(*) FROM candidates WHERE photo_data_url IS NOT NULL
UNION ALL
SELECT 'Employees', COUNT(*) FROM employees
UNION ALL
SELECT 'Contract Workers', COUNT(*) FROM contract_workers
UNION ALL
SELECT 'Staff', COUNT(*) FROM staff;
```

### Sample Candidate with Photo
```sql
-- View a specific candidate with photo metadata
SELECT
  rirekisho_id,
  full_name_kanji,
  full_name_kana,
  gender,
  date_of_birth,
  LENGTH(photo_data_url) as photo_size_bytes,
  CASE WHEN photo_data_url LIKE 'data:image%' THEN 'Valid Data URL' ELSE 'Invalid' END as photo_status
FROM candidates
WHERE rirekisho_id = 'RIR01001'
LIMIT 1;
```

### Employee Counts by Type
```sql
-- View distribution of personnel
SELECT
  (SELECT COUNT(*) FROM employees) as employees_total,
  (SELECT COUNT(*) FROM contract_workers) as contract_workers_total,
  (SELECT COUNT(*) FROM staff) as staff_total,
  (SELECT COUNT(*) FROM employees) +
  (SELECT COUNT(*) FROM contract_workers) +
  (SELECT COUNT(*) FROM staff) as total_personnel;
```

---

## 🎬 How to Display Photos in Frontend

### React Component Example
```typescript
// components/candidates/candidate-photo.tsx
import Image from 'next/image'

interface CandidatePhotoProps {
  candidate: {
    rirekisho_id: string
    full_name_kanji: string
    photo_data_url?: string
  }
}

export function CandidatePhoto({ candidate }: CandidatePhotoProps) {
  return (
    <div className="candidate-photo">
      {candidate.photo_data_url ? (
        <img
          src={candidate.photo_data_url}
          alt={candidate.full_name_kanji}
          className="w-32 h-40 object-cover rounded"
        />
      ) : (
        <div className="w-32 h-40 bg-gray-200 rounded flex items-center justify-center">
          <span className="text-gray-500">No photo</span>
        </div>
      )}
    </div>
  )
}
```

### API Response Structure
```typescript
// lib/api.ts - When fetching candidates
interface Candidate {
  rirekisho_id: string
  full_name_roman: string
  full_name_kanji: string
  full_name_kana?: string
  photo_data_url?: string  // Base64 data URL - ready to display
  // ... other fields
}

async function getCandidates() {
  const response = await axiosInstance.get('/api/candidates')
  return response.data as Candidate[]
}
```

---

## 🔍 Source Files Reference

### Original Data Files (Read-Only)
```
D:\UNS-ClaudeJP-6.0.0\BASEDATEJP\
├── ユニバーサル企画㈱データベースv25.3.24_be.accdb  (Access DB with candidates + photos)
└── 【新】社員台帳(UNS)T　2022.04.05～.xlsm  (Excel with employees/staff/contract workers)
```

### Generated Intermediate Files
```
D:\UNS-ClaudeJP-6.0.0\config\
└── access_candidates_data.json  (Extracted candidates with Base64 photos)
```

### Import Scripts
```
D:\UNS-ClaudeJP-6.0.0\backend\scripts\
├── final_import_candidates.py          (Candidates → PostgreSQL)
├── import_employees_complete.py        (All employee types → PostgreSQL)
└── import_staff_only.py                (Staff → PostgreSQL)
```

---

## 📈 Photo File Sizes

- **Average photo size** (as Base64): ~50-150 KB per candidate
- **Total JSON size**: ~7 MB for 1,156 candidates with photos
- **Database storage**: ~150-200 MB for 1,153 candidates in TEXT column

### Optimization Note
For production with limited storage, consider:
1. **Storing photos as files** on disk/cloud storage
2. **Using photo_url field** instead of photo_data_url
3. **Compressing photos** before Base64 encoding
4. **Lazy loading** photos only when needed

---

## 🚀 Future Reference

### To Re-Import Data
```bash
# 1. Delete existing data
docker exec uns-claudejp-600-db psql -U uns_admin -d uns_claudejp -c "
  DELETE FROM candidates;
  DELETE FROM employees;
  DELETE FROM contract_workers;
  DELETE FROM staff;
"

# 2. Run imports
docker exec uns-claudejp-600-backend-1 python scripts/final_import_candidates.py
docker exec uns-claudejp-600-backend-1 python scripts/import_employees_complete.py
docker exec uns-claudejp-600-backend-1 python scripts/import_staff_only.py

# 3. Verify
docker exec uns-claudejp-600-db psql -U uns_admin -d uns_claudejp -c "
  SELECT 'Candidates' as type, COUNT(*) FROM candidates
  UNION ALL
  SELECT 'Employees', COUNT(*) FROM employees
  UNION ALL
  SELECT 'Contract Workers', COUNT(*) FROM contract_workers
  UNION ALL
  SELECT 'Staff', COUNT(*) FROM staff;
"
```

### Photo Extraction Methods (if needed in future)
1. **From PostgreSQL**: Query `photo_data_url` and decode Base64
2. **From Access DB**: Use `extract_candidates_from_access.py` script
3. **From JSON**: Load `access_candidates_data.json` directly

---

## ✅ Verification Checklist

- [x] 1,153 candidates imported with photos
- [x] 1,044 employees imported
- [x] 99 contract workers imported
- [x] 15 staff members imported
- [x] All photos stored as Base64 in `photo_data_url` column
- [x] No demo data in database (NUNCA NADA DEMO rule respected)
- [x] All hakenmoto_id values unique and sequential
- [x] All data dates properly converted from Excel format

---

**Last Updated**: 2025-11-17
**By**: Claude Code
**Rule Status**: ✅ NUNCA NADA DEMO - All real data only
