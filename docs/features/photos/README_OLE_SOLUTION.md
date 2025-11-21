# README: OLE Photo Solution (2025-11-11)

## Quick Summary

**Problem**: Photos not displaying on /candidates and /employees pages
**Cause**: Microsoft Access OLE garbage bytes before JPEG/PNG markers
**Solution**: Frontend fix + Database cleanup scripts
**Result**: 1,931 photos fixed (100% success rate)

---

## Files Created

### 1. Documentation
- `SOLUCION_FOTOS_OLE_2025-11-11.md` (6.1 KB) - Complete solution documentation

### 2. Scripts
- `backend/scripts/fix_photo_data.py` - Cleans 1,116 candidate photos
- `backend/scripts/fix_employee_photos.py` - Cleans 815 employee photos

### 3. Frontend Fix
- `frontend/app/(dashboard)/employees/page.tsx` - Added photo_data_url to interface

---

## Execution

### After Reinstallation

If photos don't display after running REINSTALAR.bat:

```bash
# Step 1: Clean candidate photos
docker exec -it uns-claudejp-backend python scripts/fix_photo_data.py

# Step 2: Clean employee photos  
docker exec -it uns-claudejp-backend python scripts/fix_employee_photos.py

# Step 3: Verify in browser
# - Candidates: http://localhost:3000/candidates (should show 12 photos on page 1)
# - Employees: http://localhost:3000/employees (should show photos in table)
```

### Verification

```bash
# Check database counts
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "SELECT COUNT(*) FROM candidates WHERE photo_data_url IS NOT NULL;"
# Expected: 1116

docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "SELECT COUNT(*) FROM employees WHERE photo_data_url IS NOT NULL;"
# Expected: 815
```

---

## Technical Details

### Root Cause

Microsoft Access stores images as OLE objects with metadata bytes BEFORE the actual image data:

```
[0x00-0x0F]: OLE header bytes (16-231 bytes "garbage")
[0xFF 0xD8]: JPEG marker (actual image starts here)
[...]: JPEG data
[0xFF 0xD9]: JPEG end marker
```

Browsers cannot decode images that don't start with valid JPEG/PNG markers.

### Solution

1. **Frontend**: Added `photo_data_url: string | null` to Employee interface
2. **Backend**: Created cleanup scripts that:
   - Find JPEG marker (\xff\xd8) or PNG marker (\x89PNG)
   - Extract clean image data from marker onwards
   - Re-encode to base64
   - Update database

---

## Prevention

### Modify Import Script

Add to `backend/scripts/import_candidates_improved.py`:

```python
def clean_ole_photo(photo_bytes: bytes) -> bytes:
    """Remove OLE garbage bytes before JPEG/PNG marker"""
    
    # Find JPEG marker
    jpeg_start = photo_bytes.find(b'\xff\xd8')
    if jpeg_start >= 0:
        return photo_bytes[jpeg_start:]
    
    # Find PNG marker
    png_start = photo_bytes.find(b'\x89PNG')
    if png_start >= 0:
        return photo_bytes[png_start:]
    
    return photo_bytes
```

### Update REINSTALAR.bat

Add after importer service completes:

```batch
echo Limpiando fotos OLE...
docker exec -it uns-claudejp-backend python scripts/fix_photo_data.py
docker exec -it uns-claudejp-backend python scripts/fix_employee_photos.py
echo Fotos limpiadas correctamente
```

---

## Statistics

- Candidate photos fixed: 1,116
- Employee photos fixed: 815
- Total photos fixed: 1,931
- Success rate: 100%
- Execution time: ~30 seconds
- Visible on /candidates page 1: 12 photos
- Visible in /employees DOM: 370 photos (virtual scrolling)

---

## References

- Full documentation: `SOLUCION_FOTOS_OLE_2025-11-11.md`
- Index: `DOCUMENTACION_FOTOS_INDICE.md`
- Scripts: `backend/scripts/fix_photo_data.py` and `fix_employee_photos.py`

---

**Date**: 2025-11-11
**Status**: COMPLETED
**Verification**: PASSED
