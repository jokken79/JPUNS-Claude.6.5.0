# 🖼️ Quick Photo Reference Guide

**TL;DR - Where are the photos?**

## 📍 Location
- **Database**: PostgreSQL `candidates` table
- **Column**: `photo_data_url`
- **Format**: Base64 encoded data URLs (`data:image/jpeg;base64,/9j/4AAQ...`)
- **Count**: 1,153 photos (all candidates have photos!)

## 🔍 Quick Lookup

### View a Photo (SQL)
```sql
SELECT rirekisho_id, full_name_kanji, photo_data_url
FROM candidates
WHERE rirekisho_id = 'RIR01001'
LIMIT 1;
```

### Display in Frontend
```typescript
<img src={candidate.photo_data_url} alt={candidate.full_name_kanji} />
```

### Count Photos
```sql
SELECT COUNT(*) FROM candidates WHERE photo_data_url IS NOT NULL;
-- Result: 1153
```

---

## 📂 Source Data Files

| Source | Location | Format |
|--------|----------|--------|
| **Candidates with photos** | `BASEDATEJP/ユニバーサル企画㈱データベースv25.3.24_be.accdb` | Access DB (OLE attachments) |
| **Extracted JSON** | `config/access_candidates_data.json` | JSON with Base64 photos |
| **Database** | PostgreSQL container | `candidates.photo_data_url` |

---

## 🛠️ Import Scripts

**What to run if photos need to be re-imported:**

```bash
# 1. Extract photos from Access DB → JSON
python /backend/scripts/extract_candidates_from_access.py

# 2. Import candidates with photos → PostgreSQL
python /backend/scripts/final_import_candidates.py
```

---

## 📊 Photo Statistics

- **Total candidates**: 1,153
- **With photos**: 1,153 (100%)
- **Average size**: 50-150 KB per Base64
- **Total storage**: ~150-200 MB in database

---

## 🎯 Data Import Timeline

**2025-11-17**:
- ✅ Extracted 1,156 candidates from Access DB
- ✅ Converted photos to Base64 (1,153 successful)
- ✅ Imported to PostgreSQL with proper rirekisho_id mapping
- ✅ Imported 1,044 employees from Excel
- ✅ Imported 99 contract workers from Excel
- ✅ Imported 15 staff from Excel

**Rule Applied**: NUNCA NADA DEMO (No demo data)

---

## 📖 Full Documentation

**See**: `docs/REFERENCE-DATA-IMPORT.md`

For detailed information about:
- How photos were extracted
- Field mappings
- Excel date conversions
- Future re-import procedures
- Frontend integration examples

---

## ⚡ Common Tasks

### "Show me all candidates with their photos"
```python
# In API endpoint
from app.models.models import Candidate
candidates = session.query(Candidate).filter(
    Candidate.photo_data_url != None
).all()
# Each candidate.photo_data_url contains the Base64 image
```

### "Export a candidate's photo"
```sql
-- Get Base64 photo
SELECT photo_data_url FROM candidates WHERE rirekisho_id = 'RIR01001';

-- Then decode the Base64 in your application
```

### "Check if photos were imported correctly"
```sql
SELECT COUNT(*) as total,
       COUNT(CASE WHEN photo_data_url IS NOT NULL THEN 1 END) as with_photos,
       COUNT(CASE WHEN photo_data_url IS NULL THEN 1 END) as without_photos
FROM candidates;
```

---

**Last Updated**: 2025-11-17
**Status**: ✅ All 1,153 candidates have photos in database
