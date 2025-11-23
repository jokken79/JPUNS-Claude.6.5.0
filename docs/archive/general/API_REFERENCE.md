# API Reference - UNS-ClaudeJP 5.4.1

This document provides detailed documentation for all newly implemented API endpoints in version 5.4.1.

**Base URL:** `http://localhost:8000/api`

**Authentication:** All endpoints require JWT Bearer token in the `Authorization` header.

```
Authorization: Bearer <your_jwt_token>
```

---

## Table of Contents

1. [Assignment Service](#assignment-service)
2. [Payroll API](#payroll-api)
3. [Apartment Service](#apartment-service)
4. [Yukyu Service](#yukyu-service)

---

## Assignment Service

### POST /api/apartments-v2/assignments/transfer

Transfer an employee between apartments with automatic prorated rent calculations.

**Request Body:**
```json
{
  "employee_id": 123,
  "current_apartment_id": 456,
  "new_apartment_id": 789,
  "transfer_date": "2025-11-15",
  "notes": "Employee requested transfer",
  "user_id": 1
}
```

**Response:** `200 OK`
```json
{
  "ended_assignment": {
    "id": 1,
    "employee_id": 123,
    "apartment_id": 456,
    "start_date": "2025-11-01",
    "end_date": "2025-11-15",
    "status": "transferred",
    "monthly_rent": 50000,
    "prorated_rent": 25000,
    "cleaning_fee": 20000,
    "total_deduction": 45000
  },
  "new_assignment": {
    "id": 2,
    "employee_id": 123,
    "apartment_id": 789,
    "start_date": "2025-11-15",
    "status": "active",
    "monthly_rent": 60000,
    "prorated_rent": 30000
  },
  "breakdown": {
    "old_apartment_prorated": 25000,
    "cleaning_fee": 20000,
    "new_apartment_prorated": 30000,
    "total": 75000
  }
}
```

**Errors:**
- `404` - Current assignment not found
- `400` - Invalid transfer date or apartment not available
- `500` - Internal server error

---

### GET /api/apartments-v2/assignments

List apartment assignments with filters and pagination.

**Query Parameters:**
- `skip` (optional): Number of records to skip (default: 0)
- `limit` (optional): Maximum records to return (default: 100)
- `employee_id` (optional): Filter by employee ID
- `apartment_id` (optional): Filter by apartment ID
- `status_filter` (optional): Filter by status (active, ended, transferred, cancelled)
- `start_date_from` (optional): Filter by start date (YYYY-MM-DD)
- `start_date_to` (optional): Filter by end date (YYYY-MM-DD)

**Example Request:**
```
GET /api/apartments-v2/assignments?status_filter=active&limit=10
```

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "apartment_id": 456,
    "apartment_name": "マンション A-101",
    "employee_id": 123,
    "employee_name": "田中太郎",
    "start_date": "2025-11-01",
    "end_date": null,
    "status": "active",
    "monthly_rent": 50000,
    "total_deduction": 50000
  }
]
```

---

### GET /api/apartments-v2/assignments/{assignment_id}

Get detailed information about a specific assignment.

**Path Parameters:**
- `assignment_id`: Assignment ID

**Response:** `200 OK`
```json
{
  "id": 1,
  "apartment": {
    "id": 456,
    "apartment_code": "A-101",
    "building_name": "マンション A",
    "base_rent": 50000,
    "capacity": 2,
    "current_occupancy": 1,
    "status": "occupied"
  },
  "employee_name": "田中太郎",
  "employee_name_kana": "たなかたろう",
  "start_date": "2025-11-01",
  "end_date": null,
  "monthly_rent": 50000,
  "prorated_rent": null,
  "total_deduction": 50000,
  "status": "active",
  "statistics": {
    "days_elapsed": 10,
    "total_days": 10,
    "daily_rate": 1666.67
  }
}
```

**Errors:**
- `404` - Assignment not found

---

### GET /api/apartments-v2/assignments/active

Get all active assignments.

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "apartment_id": 456,
    "apartment_name": "マンション A-101",
    "employee_id": 123,
    "employee_name": "田中太郎",
    "start_date": "2025-11-01",
    "end_date": null,
    "status": "active",
    "monthly_rent": 50000
  }
]
```

---

### GET /api/apartments-v2/assignments/statistics

Get assignment statistics for reporting.

**Query Parameters:**
- `period_start` (optional): Start date for period (YYYY-MM-DD)
- `period_end` (optional): End date for period (YYYY-MM-DD)

**Response:** `200 OK`
```json
{
  "total_assignments": 150,
  "active_assignments": 120,
  "completed_assignments": 25,
  "cancelled_assignments": 3,
  "transferred_assignments": 2,
  "total_rent_collected": 7500000,
  "average_rent": 50000,
  "average_occupancy_days": 180.5,
  "period_start": "2025-01-01",
  "period_end": "2025-12-31"
}
```

---

## Payroll API

### POST /api/payroll/runs

Create a new payroll run for a specific pay period.

**Request Body:**
```json
{
  "pay_period_start": "2025-11-01T00:00:00",
  "pay_period_end": "2025-11-30T00:00:00",
  "created_by": "admin"
}
```

**Response:** `201 Created`
```json
{
  "id": 42,
  "pay_period_start": "2025-11-01T00:00:00",
  "pay_period_end": "2025-11-30T00:00:00",
  "status": "draft",
  "total_employees": 0,
  "total_gross_amount": 0.0,
  "total_deductions": 0.0,
  "total_net_amount": 0.0,
  "created_by": "admin",
  "created_at": "2025-11-11T10:30:00",
  "updated_at": "2025-11-11T10:30:00"
}
```

**Errors:**
- `400` - Invalid dates or overlapping period
- `500` - Internal server error

---

### GET /api/payroll/runs

List all payroll runs with pagination and filtering.

**Query Parameters:**
- `skip` (optional): Number of records to skip (default: 0)
- `limit` (optional): Maximum records to return (default: 100)
- `status_filter` (optional): Filter by status (draft, calculated, approved, paid)

**Example Request:**
```
GET /api/payroll/runs?status_filter=draft&limit=10
```

**Response:** `200 OK`
```json
[
  {
    "id": 42,
    "pay_period_start": "2025-11-01T00:00:00",
    "pay_period_end": "2025-11-30T00:00:00",
    "status": "draft",
    "total_employees": 150,
    "total_gross_amount": 30000000.0,
    "total_net_amount": 24000000.0,
    "created_at": "2025-11-11T10:30:00"
  }
]
```

---

### GET /api/payroll/runs/{payroll_run_id}

Get detailed information about a specific payroll run.

**Path Parameters:**
- `payroll_run_id`: Payroll run ID

**Response:** `200 OK`
```json
{
  "id": 42,
  "pay_period_start": "2025-11-01T00:00:00",
  "pay_period_end": "2025-11-30T00:00:00",
  "status": "calculated",
  "total_employees": 150,
  "total_gross_amount": 30000000.0,
  "total_deductions": 6000000.0,
  "total_net_amount": 24000000.0,
  "created_by": "admin",
  "created_at": "2025-11-11T10:30:00",
  "updated_at": "2025-11-11T14:20:00"
}
```

**Errors:**
- `404` - Payroll run not found

---

### GET /api/payroll/runs/{payroll_run_id}/employees

Get all employees and their payroll calculations for a specific payroll run.

**Path Parameters:**
- `payroll_run_id`: Payroll run ID

**Response:** `200 OK`
```json
[
  {
    "success": true,
    "employee_id": 123,
    "payroll_run_id": 42,
    "pay_period_start": "2025-11-01",
    "pay_period_end": "2025-11-30",
    "hours_breakdown": {
      "regular_hours": 160.0,
      "overtime_hours": 20.0,
      "night_shift_hours": 10.0,
      "holiday_hours": 8.0,
      "sunday_hours": 8.0,
      "total_hours": 206.0,
      "work_days": 22
    },
    "rates": {
      "base_rate": 1200.0,
      "overtime_rate": 1500.0,
      "night_shift_rate": 1500.0,
      "holiday_rate": 1620.0,
      "sunday_rate": 1620.0
    },
    "amounts": {
      "base_amount": 192000.0,
      "overtime_amount": 30000.0,
      "night_shift_amount": 15000.0,
      "holiday_amount": 12960.0,
      "sunday_amount": 12960.0,
      "gross_amount": 262920.0,
      "total_deductions": 52584.0,
      "net_amount": 210336.0
    },
    "deductions_detail": {
      "income_tax": 15000.0,
      "resident_tax": 12000.0,
      "health_insurance": 13000.0,
      "pension": 11000.0,
      "employment_insurance": 1584.0,
      "apartment": 0.0,
      "other": 0.0
    },
    "validation": {
      "is_valid": true,
      "errors": [],
      "warnings": [],
      "validated_at": "2025-11-11T14:20:00"
    },
    "calculated_at": "2025-11-11T14:15:00"
  }
]
```

---

### POST /api/payroll/runs/{payroll_run_id}/approve

Approve a payroll run for payment.

**Path Parameters:**
- `payroll_run_id`: Payroll run ID

**Request Body:**
```json
{
  "approved_by": "admin",
  "notes": "Payroll approved for November 2025"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "payroll_run_id": 42,
  "status": "approved",
  "approved_by": "admin",
  "approved_at": "2025-11-11T15:00:00"
}
```

**Errors:**
- `404` - Payroll run not found
- `400` - Invalid status for approval (must be draft or calculated)
- `500` - Internal server error

---

### POST /api/payroll/payslips/generate

Generate a payslip PDF for an employee.

**Request Body:**
```json
{
  "employee_id": 123,
  "payroll_run_id": 42
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "pdf_path": "/path/to/payslips/payslip_123_202511.pdf",
  "pdf_url": "/downloads/payslips/payslip_123_202511.pdf",
  "payslip_id": "payslip_123_202511",
  "generated_at": "2025-11-11T15:30:00",
  "employee_id": 123,
  "pay_period": "2025-11"
}
```

**Errors:**
- `404` - No payroll record found for employee in specified run
- `500` - Error generating PDF

---

### GET /api/payroll/summary

Get aggregated payroll summary across all runs.

**Query Parameters:**
- `skip` (optional): Number of records to skip (default: 0)
- `limit` (optional): Maximum records to return (default: 50)

**Response:** `200 OK`
```json
[
  {
    "payroll_run_id": 42,
    "pay_period_start": "2025-11-01T00:00:00",
    "pay_period_end": "2025-11-30T00:00:00",
    "status": "approved",
    "total_employees": 150,
    "total_gross_amount": 30000000.0,
    "total_deductions": 6000000.0,
    "total_net_amount": 24000000.0,
    "total_hours": 30900.0,
    "avg_gross_amount": 200000.0,
    "created_at": "2025-11-11T10:30:00"
  }
]
```

---

## Apartment Service

### DELETE /api/apartments-v2/apartments/{apartment_id}

Soft delete an apartment (marks as deleted, doesn't remove from database).

**Path Parameters:**
- `apartment_id`: Apartment ID

**Response:** `204 No Content`

**Errors:**
- `404` - Apartment not found
- `400` - Cannot delete apartment with active assignments
- `400` - Cannot delete apartment with pending rent deductions
- `500` - Internal server error

**Error Response Example:**
```json
{
  "detail": "No se puede eliminar el apartamento. Tiene 3 asignación(es) activa(s). Primero debe finalizar todas las asignaciones activas."
}
```

---

## Yukyu Service

### GET /api/yukyu/employees/{employee_id}/compliance

Check employee's yukyu compliance with Japanese labor law (5-day minimum).

**Path Parameters:**
- `employee_id`: Employee ID

**Query Parameters:**
- `fiscal_year` (optional): Fiscal year to check (default: current fiscal year)

**Example Request:**
```
GET /api/yukyu/employees/123/compliance?fiscal_year=2025
```

**Response:** `200 OK`
```json
{
  "employee_id": 123,
  "fiscal_year": 2025,
  "fiscal_start": "2025-04-01",
  "fiscal_end": "2026-03-31",
  "total_days_used": 6.0,
  "minimum_required": 5,
  "is_compliant": true,
  "compliance_percentage": 100.0,
  "days_remaining": 0,
  "warning": null
}
```

**Non-Compliant Example:**
```json
{
  "employee_id": 124,
  "fiscal_year": 2025,
  "fiscal_start": "2025-04-01",
  "fiscal_end": "2026-03-31",
  "total_days_used": 2.0,
  "minimum_required": 5,
  "is_compliant": false,
  "compliance_percentage": 40.0,
  "days_remaining": 3,
  "warning": "警告: 最低5日の有給休暇取得が必要です。現在2.0日のみ使用。"
}
```

**Notes:**
- Fiscal year in Japan runs from April 1 to March 31
- Supports half-day yukyu (半休) counted as 0.5 days
- Only counts approved yukyu requests
- Compliance with 年5日の年次有給休暇の取得義務 (5-day annual minimum requirement)

---

## Common Response Codes

| Code | Meaning | Description |
|------|---------|-------------|
| `200` | OK | Request successful |
| `201` | Created | Resource created successfully |
| `204` | No Content | Request successful, no content to return |
| `400` | Bad Request | Invalid request data or business logic violation |
| `401` | Unauthorized | Missing or invalid authentication token |
| `403` | Forbidden | Insufficient permissions |
| `404` | Not Found | Resource not found |
| `422` | Unprocessable Entity | Validation error |
| `500` | Internal Server Error | Server error |

---

## Authentication

All endpoints require JWT authentication. Obtain a token via the login endpoint:

**POST /api/auth/login/**

**Request Body (form-data):**
```
username=admin
password=admin123
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Usage:**
```bash
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/payroll/runs
```

---

## Rate Limiting

No rate limiting currently implemented. Consider adding rate limiting in production.

---

## Pagination

Endpoints that return lists support pagination:

- `skip`: Number of records to skip (default: 0)
- `limit`: Maximum records to return (default varies by endpoint)

**Example:**
```
GET /api/payroll/runs?skip=20&limit=10
```

Returns records 21-30.

---

## Error Response Format

All errors follow this format:

```json
{
  "detail": "Error message describing what went wrong"
}
```

Validation errors (422):
```json
{
  "detail": [
    {
      "loc": ["body", "pay_period_start"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

---

## Testing

### Using cURL

**Create Payroll Run:**
```bash
curl -X POST http://localhost:8000/api/payroll/runs \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "pay_period_start": "2025-11-01T00:00:00",
    "pay_period_end": "2025-11-30T00:00:00",
    "created_by": "admin"
  }'
```

**List Assignments:**
```bash
curl -X GET "http://localhost:8000/api/apartments-v2/assignments?status_filter=active&limit=10" \
  -H "Authorization: Bearer <token>"
```

### Using Python

```python
import requests

# Login
response = requests.post(
    "http://localhost:8000/api/auth/login/",
    data={"username": "admin", "password": "admin123"}
)
token = response.json()["access_token"]

# Create payroll run
headers = {"Authorization": f"Bearer {token}"}
data = {
    "pay_period_start": "2025-11-01T00:00:00",
    "pay_period_end": "2025-11-30T00:00:00",
    "created_by": "admin"
}
response = requests.post(
    "http://localhost:8000/api/payroll/runs",
    headers=headers,
    json=data
)
print(response.json())
```

---

## Interactive Documentation

FastAPI provides interactive API documentation:

- **Swagger UI:** http://localhost:8000/api/docs
- **ReDoc:** http://localhost:8000/api/redoc

These interfaces allow you to test endpoints directly from your browser.

---

## Changelog

See `CHANGELOG_V5.4.1.md` for detailed version history.

---

## Support

For issues or questions:
- Check troubleshooting guide: `docs/04-troubleshooting/TROUBLESHOOTING.md`
- Review development guide: `CLAUDE.md`
- Check implementation summary: `README_IMPLEMENTATION.md`

---

*Last Updated: November 11, 2025*
*Version: 5.4.1*
*API Base URL: http://localhost:8000/api*
