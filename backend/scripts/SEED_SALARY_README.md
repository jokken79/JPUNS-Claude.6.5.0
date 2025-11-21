# Salary System Seed Data Script

## Overview

`seed_salary_data.py` creates comprehensive test data for the salary calculation and payroll system. This script generates realistic data following Japanese labor law standards.

## What It Creates

### 📊 Data Summary

- **5 Employees** with varied profiles and hourly rates
- **2 Factories** (Toyota Nagoya, Honda Suzuka) with bonus configurations
- **5 Apartments** with different rent levels (¥25,000 - ¥50,000/month)
- **100 Timer Cards** (October 2025, 20 working days per employee)
- **5 Salary Calculations** for October 2025
- **1 PayrollRun** with draft status
- **5 EmployeePayroll** records linked to the payroll run
- **PayrollSettings** configured with Japanese labor law rates

### 👥 Employee Profiles

| ID | Name | Rate | Factory | Nationality | Position |
|----|------|------|---------|-------------|----------|
| 1001 | 田中太郎 | ¥1,000/h | Toyota Nagoya | 日本 | 組立作業員 |
| 1002 | 佐藤花子 | ¥1,100/h | Toyota Nagoya | 日本 | 検査員 |
| 1003 | 鈴木次郎 | ¥950/h | Honda Suzuka | ベトナム | プレス作業員 |
| 1004 | 山田美咲 | ¥1,150/h | Honda Suzuka | 日本 | ライン管理者 |
| 1005 | 石川拓也 | ¥1,050/h | Toyota Nagoya | フィリピン | 溶接工 |

### ⏱️ Timer Card Patterns

Each employee gets 20 working days in October 2025 with varied shift patterns:

- **Regular Days** (8:30-17:30): 8 hours/day
- **Overtime Days**: 11 hours (8 regular + 3 OT)
- **Night Shifts**: 9 hours (22:00-07:00) with 5 night hours
- **All approved** for immediate calculation

### 💰 Salary Components

Each salary calculation includes:

- **Regular hours**: Standard 8-hour shifts
- **Overtime (OT)**: 125% premium rate
- **Night shift**: 125% premium rate
- **Holiday**: 135% premium rate
- **Bonuses**: ¥10,000 attendance bonus (20+ days)
- **Allowances**: ¥5,000 gasoline (car commuters only)
- **Deductions**: ¥30,000 apartment rent

### 🏭 Factory Configurations

**Toyota Nagoya** (TOYOTA__NAGOYA):
- Overtime bonus: ¥5,000
- Night shift bonus: ¥3,000
- Attendance bonus: ¥10,000

**Honda Suzuka** (HONDA__SUZUKA):
- Overtime bonus: ¥4,000
- Night shift bonus: ¥2,500
- Attendance bonus: ¥8,000

### 🏠 Apartment Inventory

| Code | Name | Type | Rent | Location |
|------|------|------|------|----------|
| APT001 | さくら荘 | 1K | ¥30,000 | 名古屋市熱田区 |
| APT002 | グリーンハイツ | 1DK | ¥35,000 | 名古屋市港区 |
| APT003 | サンシャイン | 1LDK | ¥40,000 | 四日市市 |
| APT004 | コーポ山田 | 1K | ¥25,000 | 名古屋市南区 |
| APT005 | ライオンズマンション | 2DK | ¥50,000 | 鈴鹿市 |

### ⚙️ PayrollSettings (Japanese Labor Law)

- **Overtime rate**: 1.25 (125%)
- **Night shift rate**: 1.25 (125%)
- **Holiday rate**: 1.35 (135%)
- **Sunday rate**: 1.35 (135%)
- **Standard hours**: 160/month
- **Income tax**: 10%
- **Resident tax**: 5%
- **Health insurance**: 4.75%
- **Pension**: 10%
- **Employment insurance**: 0.3%

## Usage

### From Docker Container (Recommended)

```bash
docker exec uns-claudejp-backend python backend/scripts/seed_salary_data.py
```

### Locally (Development)

```bash
# Activate virtual environment first
cd /home/user/UNS-ClaudeJP-5.4.1
python backend/scripts/seed_salary_data.py
```

### With Custom Database URL

```bash
DATABASE_URL=postgresql://user:pass@localhost/dbname python backend/scripts/seed_salary_data.py
```

## Expected Output

```
============================================================
🌱 SEEDING SALARY SYSTEM TEST DATA
============================================================

🗑️  Clearing existing data...
✅ Existing data cleared

📊 Creating PayrollSettings...
   ✅ PayrollSettings created/updated

🏭 Creating Factories...
   ✅ 2 factories created

🏠 Creating Apartments...
   ✅ 5 apartments created

👥 Creating Employees...
   ✅ 5 employees created

⏱️  Creating Timer Cards...
   - 田中太郎: 20 timer cards
   - 佐藤花子: 20 timer cards
   - 鈴木次郎: 20 timer cards
   - 山田美咲: 20 timer cards
   - 石川拓也: 20 timer cards
   ✅ 100 timer cards created

💰 Creating Salary Calculations...
   - 田中太郎: ¥175,000 gross / ¥145,000 net
   - 佐藤花子: ¥192,500 gross / ¥162,500 net
   - 鈴木次郎: ¥166,250 gross / ¥136,250 net
   - 山田美咲: ¥201,250 gross / ¥171,250 net
   - 石川拓也: ¥183,750 gross / ¥153,750 net
   ✅ 5 salary calculations created

📋 Creating PayrollRun...
   ✅ PayrollRun created (ID: 1)

📝 Creating EmployeePayroll records...
   ✅ 5 employee payroll records created

============================================================
✅ SEED DATA CREATION COMPLETE!
============================================================

📊 Summary:
   - Factories: 2
   - Apartments: 5
   - Employees: 5
   - Timer Cards: 100
   - Salary Calculations: 5
   - Payroll Runs: 1
   - Employee Payroll Records: 5
   - PayrollSettings: ✅ Configured

💰 Total Payroll:
   - Gross: ¥918,750
   - Deductions: ¥150,000
   - Net: ¥768,750
   - Company Profit: ¥481,250

🎯 Test Data Ready!
   You can now test salary calculations, reports, and exports.
============================================================
```

## Data Cleanup

The script automatically clears existing test data before seeding:

- ✅ Deletes previous employee payroll records
- ✅ Deletes previous payroll runs
- ✅ Deletes previous salary calculations
- ✅ Deletes previous timer cards
- ✅ Deletes test employees (hakenmoto_id >= 1001)
- ✅ Deletes test factories (TOYOTA__NAGOYA, HONDA__SUZUKA)
- ✅ Deletes test apartments (APT001-APT005)

**Note**: Production data is NOT affected. Only test data is cleared.

## What You Can Test

After running this seed script, you can test:

### ✅ Salary Calculations
- Monthly salary calculations
- Overtime and night shift premiums
- Holiday pay calculations
- Bonus and allowance additions
- Apartment deductions
- Company profit margins

### ✅ Payroll Processing
- Payroll run creation
- Employee payroll generation
- Payroll status management (draft, approved, paid)
- Bulk payroll operations

### ✅ Reports
- Monthly salary reports
- Employee salary details
- Factory-wise payroll summaries
- Profit margin analysis
- Timer card reports

### ✅ Exports
- PDF payslip generation
- Excel salary reports
- CSV exports
- Bulk export operations

### ✅ API Endpoints
- `GET /api/salary/` - List all salaries
- `GET /api/salary/{id}` - Salary details
- `POST /api/salary/calculate` - Calculate salary
- `GET /api/payroll/` - List payroll runs
- `POST /api/payroll/run` - Create payroll run
- `GET /api/payroll/export/excel` - Excel export
- `GET /api/payroll/export/pdf/{id}` - PDF export

## Integration with Test Suite

This seed data is designed to work with:

- **Unit tests**: `backend/tests/test_salary.py`
- **Integration tests**: `backend/tests/test_payroll_integration.py`
- **E2E tests**: Frontend payroll page tests
- **Manual testing**: Via Swagger UI at `http://localhost:8000/api/docs`

## Troubleshooting

### Error: "relation does not exist"

**Solution**: Run Alembic migrations first:
```bash
docker exec uns-claudejp-backend alembic upgrade head
```

### Error: "database connection failed"

**Solution**: Verify database is running:
```bash
docker compose ps db
docker compose logs db
```

### Error: "duplicate key value violates unique constraint"

**Solution**: The script auto-clears existing data. If this fails, manually clear:
```bash
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "
DELETE FROM employee_payroll;
DELETE FROM payroll_runs;
DELETE FROM salary_calculations;
DELETE FROM timer_cards;
DELETE FROM employees WHERE hakenmoto_id >= 1001;
"
```

## Related Files

- **Models**: `backend/app/models/models.py` (Employee, TimerCard, SalaryCalculation)
- **Payroll Models**: `backend/app/models/payroll_models.py` (PayrollRun, EmployeePayroll, PayrollSettings)
- **Schemas**: `backend/app/schemas/salary.py`, `backend/app/schemas/payroll.py`
- **Services**: `backend/app/services/salary_service.py`, `backend/app/services/payroll_service.py`
- **API**: `backend/app/api/salary.py`, `backend/app/api/payroll.py`

## Version History

- **v1.0** (2025-11-12): Initial creation
  - 5 employees, 2 factories, 5 apartments
  - 100 timer cards (October 2025)
  - Full payroll cycle data
  - Japanese labor law compliance

## License

Part of UNS-ClaudeJP 5.4.1 HR Management System
