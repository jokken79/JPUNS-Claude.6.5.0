# 🧪 Yukyu System Testing Guide

Complete guide for testing the yukyu (有給休暇 - paid vacation) system.

## 📋 Overview

The yukyu system has been fully implemented with:
- ✅ Database models and migrations
- ✅ Business logic service (YukyuService)
- ✅ REST API endpoints
- ✅ LIFO deduction algorithm
- ✅ Automatic expiration (2 years)
- ✅ Japanese labor law calculations

## 🚀 Quick Start

### Option 1: Automated Testing (Recommended)

Run all tests automatically with a single command:

```bash
docker exec -it uns-claudejp-541-backend bash /app/scripts/setup_and_test_yukyu.sh
```

This will:
1. Apply database migrations (create yukyu tables)
2. Import historical data from CSV
3. Run comprehensive end-to-end tests

### Option 2: Step-by-Step Testing

#### Step 1: Apply Migrations

```bash
docker exec -it uns-claudejp-541-backend bash -c "cd /app && alembic upgrade head"
```

This creates 3 new tables:
- `yukyu_balances`: Tracks yukyus by fiscal year
- `yukyu_requests`: TANTOSHA → KEIRI workflow
- `yukyu_usage_details`: LIFO deduction tracking

#### Step 2: Import Historical Data (Optional)

```bash
docker exec -it uns-claudejp-541-backend python /app/scripts/import_yukyu_data.py
```

This imports historical yukyu data from `yukyu_data.csv` (1,776 records).

**Note:** This step may show warnings if employee names don't match the database. This is normal.

#### Step 3: Run Tests

```bash
docker exec -it uns-claudejp-541-backend python /app/scripts/test_yukyu_system.py
```

This runs 5 comprehensive tests:

| Test # | Name | Description |
|--------|------|-------------|
| 1 | Automatic Calculation | Tests Japanese labor law calculations (6mo=10d, etc.) |
| 2 | Summary Retrieval | Tests getting yukyu summary for an employee |
| 3 | Create Request | Tests TANTOSHA creating a yukyu request |
| 4 | Approve with LIFO | Tests KEIRI approval with LIFO deduction (newest first) |
| 5 | Expiration Logic | Tests automatic expiration after 2 years |

## 📊 Test Details

### Test 1: Automatic Calculation

**What it tests:**
- Calculates yukyus based on employee hire date
- Follows Japanese labor law:
  ```
  6 months   → 10 days
  18 months  → 11 days
  30 months  → 12 days
  42 months  → 14 days
  54 months  → 16 days
  66+ months → 18-20 days
  ```

**Expected output:**
```
✅ Calculation completed!
   Months since hire: 42
   Balances created: 3
   Total available: 33 days
```

### Test 2: Summary Retrieval

**What it tests:**
- Retrieves complete yukyu summary for an employee
- Shows total available, used, and expired days
- Lists all active balances

**Expected output:**
```
✅ Summary retrieved!
   Total available: 18 days
   Total used:      5 days
   Total expired:   0 days
   Balances:        2 record(s)
```

### Test 3: Create Request

**What it tests:**
- TANTOSHA creates yukyu request for an employee
- System validates employee has enough yukyus
- Request created with status=PENDING

**Expected output:**
```
✅ Request created! ID: 123
   Employee: 山田太郎
   Days requested: 1.0
   Available at request: 18
   Status: pending
```

### Test 4: Approve with LIFO

**What it tests:**
- KEIRI approves request
- System deducts yukyus using LIFO (newest first)
- Usage details created linking to specific balances

**Expected output:**
```
✅ Request approved!
   Status: approved
   Approved by: keiri_user

   📊 Balances BEFORE approval (newest first):
      2024: 11 days available (assigned: 11)
      2023: 10 days available (assigned: 10)

   📊 Balances AFTER approval (newest first):
      2024: 10 days available (assigned: 11)
      2023: 10 days available (assigned: 10)

   ✅ LIFO verified! Newest balance (2024) was deducted first.
   ✅ Created 1 usage detail record(s)
```

### Test 5: Expiration Logic

**What it tests:**
- Finds balances older than 2 years
- Marks them as EXPIRED
- Moves remaining days to expired count

**Expected output:**
```
✅ Expired 5 balance(s)
   Before expiration:
      Active balances:  120
      Expired balances: 10
   After expiration:
      Active balances:  115
      Expired balances: 15
```

## 🎯 Success Criteria

All tests should pass:

```
🎉 ALL TESTS PASSED!
Total: 5/5 tests passed
```

If some tests fail, check:
1. Database has employees with `hire_date` set
2. Migrations were applied successfully
3. No database connection issues

## 📝 API Endpoints Available

After migration, these endpoints are available:

### Calculate Yukyus
```bash
POST /api/yukyu/balances/calculate
{
  "employee_id": 123
}
```

### Get Summary
```bash
GET /api/yukyu/balances/{employee_id}
```

### Create Request (TANTOSHA)
```bash
POST /api/yukyu/requests/
{
  "employee_id": 123,
  "factory_id": "F001",
  "request_type": "yukyu",
  "start_date": "2025-12-01",
  "end_date": "2025-12-01",
  "days_requested": 1.0
}
```

### List Requests
```bash
GET /api/yukyu/requests/?factory_id=F001&status=pending
```

### Approve Request (KEIRI)
```bash
PUT /api/yukyu/requests/{id}/approve
{
  "notes": "Approved"
}
```

### Reject Request (KEIRI)
```bash
PUT /api/yukyu/requests/{id}/reject
{
  "rejection_reason": "Insufficient staff"
}
```

## 🐛 Troubleshooting

### Issue: Migrations fail

**Solution:**
```bash
# Check current migration status
docker exec -it uns-claudejp-541-backend bash -c "cd /app && alembic current"

# View migration history
docker exec -it uns-claudejp-541-backend bash -c "cd /app && alembic history"

# If stuck, downgrade and re-upgrade
docker exec -it uns-claudejp-541-backend bash -c "cd /app && alembic downgrade 001 && alembic upgrade head"
```

### Issue: Import fails with "Employee not found"

**This is normal!** The CSV has 923 employees, but your database may have fewer.

The import script will:
- ✅ Import balances for employees that exist
- ⚠️  Skip employees that don't exist in DB
- 📊 Show statistics at the end

### Issue: Tests fail with "No employees found"

**Solution:** Create at least one employee with a `hire_date`:

```bash
docker exec -it uns-claudejp-541-backend python -c "
from app.core.database import SessionLocal
from app.models.models import Employee
from datetime import date, timedelta

db = SessionLocal()
emp = Employee(
    hakenmoto_id=999,
    rirekisho_id='TEST001',
    full_name_kanji='テスト太郎',
    hire_date=date.today() - timedelta(days=400),  # ~13 months ago
    factory_id='TEST'
)
db.add(emp)
db.commit()
print('✅ Test employee created!')
"
```

## 📖 Next Steps

After successful testing:

1. **Frontend Development:**
   - Create `/yukyu-requests/create` page (TANTOSHA)
   - Create `/yukyu-requests/` page (KEIRI approval)
   - Create `/yukyu-reports/` dashboard

2. **PDF Generator:**
   - Implement PDF generation for yukyu requests
   - Include: employee info, yukyu balance, request details

3. **Production Deployment:**
   - Run migrations on production database
   - Import historical data
   - Configure cron job for automatic expiration

## 🔗 Related Documentation

- **API Docs:** http://localhost:8000/api/docs#/Yukyu%20(%E6%9C%89%E7%B5%A6%E4%BC%91%E6%9A%87%20-%20Paid%20Vacation)
- **Database Models:** `backend/app/models/models.py` (lines 1003-1133)
- **Service Logic:** `backend/app/services/yukyu_service.py`
- **API Endpoints:** `backend/app/api/yukyu.py`
- **Schemas:** `backend/app/schemas/yukyu.py`

## 📞 Support

If tests continue to fail, check:
1. Docker containers are running: `docker ps`
2. Backend logs: `docker logs uns-claudejp-541-backend`
3. Database is accessible: `docker exec -it uns-claudejp-541-db psql -U uns_admin -d uns_claudejp`

---

**Last updated:** 2025-11-11
**Version:** 5.4.1
