# Migration Guide: Apartments API V1 to V2

## Overview

This document provides a comprehensive guide for migrating from the deprecated Apartments API V1 (`/api/apartments`) to the new and enhanced Apartments API V2 (`/api/apartments-v2`).

**Important Dates:**
- **Deprecation Date:** 2025-11-12
- **End of Life:** 2025-12-31
- **Action Required:** All clients must migrate by December 31, 2025

---

## Why Migrate?

The Apartments API V2 provides significant improvements over V1:

### New Features in V2
1. **Enhanced Assignment Management**
   - Prorated rent calculations
   - Automatic deduction generation
   - Transfer functionality between apartments
   - Assignment history tracking

2. **Additional Charges System**
   - Cleaning fees
   - Repair charges
   - Damage fees
   - Approval workflow

3. **Comprehensive Deduction Management**
   - Monthly deduction generation
   - Status tracking (pending/processed/paid)
   - Excel export functionality
   - Integration with payroll

4. **Advanced Reporting**
   - Occupancy reports with breakdowns
   - Arrears tracking
   - Maintenance cost analysis
   - Cost analysis reports

5. **Better Pagination and Filtering**
   - Cursor-based pagination
   - Advanced search capabilities
   - Multi-field filtering
   - Sorting options

---

## API Comparison

### Endpoint Mapping

| V1 Endpoint | V2 Endpoint | Notes |
|-------------|-------------|-------|
| `GET /api/apartments` | `GET /api/apartments-v2/apartments` | Enhanced with pagination |
| `GET /api/apartments/stats` | `GET /api/apartments-v2/reports/occupancy` | More comprehensive stats |
| `GET /api/apartments/{id}` | `GET /api/apartments-v2/apartments/{id}` | Includes assignment history |
| `POST /api/apartments` | `POST /api/apartments-v2/apartments` | Additional validation |
| `PUT /api/apartments/{id}` | `PUT /api/apartments-v2/apartments/{id}` | More fields supported |
| `DELETE /api/apartments/{id}` | `DELETE /api/apartments-v2/apartments/{id}` | Soft delete with validation |
| `POST /api/apartments/{id}/assign` | `POST /api/apartments-v2/assignments` | Complete assignment flow |
| `POST /api/apartments/{id}/remove` | `PUT /api/apartments-v2/assignments/{id}/end` | Enhanced with final calculation |
| `GET /api/apartments/{id}/employees` | `GET /api/apartments-v2/assignments/apartment/{id}/active` | Returns assignment details |

### New Endpoints (V2 Only)

- `POST /api/apartments-v2/assignments/transfer` - Transfer employee between apartments
- `POST /api/apartments-v2/calculate/prorated` - Calculate prorated rent
- `GET /api/apartments-v2/calculate/cleaning-fee/{id}` - Get cleaning fee
- `POST /api/apartments-v2/calculate/total` - Calculate total deduction
- `POST /api/apartments-v2/charges` - Add additional charges
- `GET /api/apartments-v2/charges` - List additional charges
- `PUT /api/apartments-v2/charges/{id}/approve` - Approve charge
- `GET /api/apartments-v2/deductions/{year}/{month}` - Get monthly deductions
- `POST /api/apartments-v2/deductions/generate` - Generate monthly deductions
- `GET /api/apartments-v2/reports/arrears` - Get arrears report
- `GET /api/apartments-v2/reports/maintenance` - Get maintenance report
- `GET /api/apartments-v2/reports/costs` - Get cost analysis

---

## Step-by-Step Migration Guide

### Step 1: Update Base URL

**V1 (Deprecated):**
```javascript
const baseURL = '/api/apartments';
```

**V2 (Recommended):**
```javascript
const baseURL = '/api/apartments-v2';
```

### Step 2: Update Apartment Listing

**V1:**
```javascript
// GET /api/apartments?skip=0&limit=100
const response = await fetch('/api/apartments?skip=0&limit=100');
const apartments = await response.json();
```

**V2:**
```javascript
// GET /api/apartments-v2/apartments?page=1&page_size=12
const response = await fetch('/api/apartments-v2/apartments?page=1&page_size=12');
const data = await response.json();
const apartments = data.items;  // ⚠️ Response structure changed
const total = data.total;
const pages = data.total_pages;
```

**Key Changes:**
- Pagination uses `page` and `page_size` instead of `skip` and `limit`
- Response is paginated: `{ items: [], total: 0, page: 1, page_size: 12, total_pages: 1 }`

### Step 3: Update Apartment Details

**V1:**
```javascript
// GET /api/apartments/{id}
const response = await fetch(`/api/apartments/${apartmentId}`);
const apartment = await response.json();
```

**V2:**
```javascript
// GET /api/apartments-v2/apartments/{id}
const response = await fetch(`/api/apartments-v2/apartments/${apartmentId}`);
const apartment = await response.json();
// apartment now includes: active_assignments, assignment_history, statistics
```

**New Fields in V2:**
- `active_assignments`: List of current assignments
- `assignment_history`: Complete assignment history
- `current_occupancy`: Current number of occupants
- `occupancy_rate`: Percentage of capacity used
- `monthly_revenue`: Calculated monthly revenue

### Step 4: Update Assignment Flow

**V1 (Simple Assignment):**
```javascript
// POST /api/apartments/{apartment_id}/assign
const response = await fetch(`/api/apartments/${apartmentId}/assign`, {
  method: 'POST',
  body: JSON.stringify({
    employee_id: 123,
    start_date: '2025-11-10',
    rent_amount: 50000
  })
});
```

**V2 (Enhanced Assignment with Prorated Calculation):**
```javascript
// POST /api/apartments-v2/assignments
const response = await fetch('/api/apartments-v2/assignments', {
  method: 'POST',
  body: JSON.stringify({
    employee_id: 123,
    apartment_id: 45,
    start_date: '2025-11-10',
    monthly_rent: 50000,
    is_prorated: true,  // ⚠️ Automatically calculates prorated rent
    notes: 'Mid-month entry'
  })
});

const assignment = await response.json();
// assignment includes: prorated_rent, days_occupied, total_deduction
```

**Benefits of V2:**
- Automatic prorated rent calculation
- Deduction automatically generated
- Assignment tracking with full history
- Validation of apartment capacity

### Step 5: Update Employee Removal

**V1:**
```javascript
// POST /api/apartments/{apartment_id}/remove
const response = await fetch(`/api/apartments/${apartmentId}/remove`, {
  method: 'POST',
  body: JSON.stringify({
    employee_id: 123,
    end_date: '2025-12-15'
  })
});
```

**V2:**
```javascript
// PUT /api/apartments-v2/assignments/{assignment_id}/end
const response = await fetch(`/api/apartments-v2/assignments/${assignmentId}/end`, {
  method: 'PUT',
  body: JSON.stringify({
    end_date: '2025-12-15',
    include_cleaning_fee: true,
    cleaning_fee: 20000,
    additional_charges: [
      {
        charge_type: 'repair',
        description: 'Pared dañada',
        amount: 15000
      }
    ],
    notes: 'Salida a mitad de mes'
  })
});

const result = await response.json();
// result includes: final_calculation, prorated_rent, total_charges, deduction_id
```

**Benefits of V2:**
- Prorated final month calculation
- Cleaning fee integration
- Additional charges support
- Final deduction automatically generated

### Step 6: Statistics and Reports

**V1:**
```javascript
// GET /api/apartments/stats
const response = await fetch('/api/apartments/stats');
const stats = await response.json();
```

**V2:**
```javascript
// GET /api/apartments-v2/reports/occupancy
const response = await fetch('/api/apartments-v2/reports/occupancy');
const report = await response.json();
// report includes: occupancy_rate, breakdown_by_prefecture, breakdown_by_building, trends
```

---

## Code Examples

### Frontend (React/TypeScript)

**Complete Migration Example:**

```typescript
// Before (V1)
import { api } from '@/lib/api';

export const apartmentsService = {
  list: async (skip = 0, limit = 100) => {
    const response = await api.get('/apartments', {
      params: { skip, limit }
    });
    return response.data;
  },

  assign: async (apartmentId: number, data: AssignmentData) => {
    const response = await api.post(`/apartments/${apartmentId}/assign`, data);
    return response.data;
  }
};
```

```typescript
// After (V2)
import { api } from '@/lib/api';

export const apartmentsV2Service = {
  list: async (page = 1, pageSize = 12, filters = {}) => {
    const response = await api.get('/apartments-v2/apartments', {
      params: { page, page_size: pageSize, ...filters }
    });
    return response.data;  // { items, total, page, page_size, total_pages }
  },

  createAssignment: async (data: AssignmentCreateData) => {
    const response = await api.post('/apartments-v2/assignments', data);
    return response.data;  // Full assignment with calculations
  },

  endAssignment: async (assignmentId: number, data: AssignmentUpdateData) => {
    const response = await api.put(`/apartments-v2/assignments/${assignmentId}/end`, data);
    return response.data;  // Final calculation breakdown
  }
};
```

### Backend (Python/FastAPI)

**If you have a backend that calls the API:**

```python
# Before (V1)
import requests

def get_apartments():
    response = requests.get('http://backend:8000/api/apartments')
    return response.json()

def assign_employee(apartment_id: int, employee_id: int):
    response = requests.post(
        f'http://backend:8000/api/apartments/{apartment_id}/assign',
        json={'employee_id': employee_id}
    )
    return response.json()
```

```python
# After (V2)
import requests

def get_apartments(page: int = 1, page_size: int = 12):
    response = requests.get(
        'http://backend:8000/api/apartments-v2/apartments',
        params={'page': page, 'page_size': page_size}
    )
    data = response.json()
    return data['items'], data['total']  # Unpaginate if needed

def create_assignment(apartment_id: int, employee_id: int, start_date: str):
    response = requests.post(
        'http://backend:8000/api/apartments-v2/assignments',
        json={
            'apartment_id': apartment_id,
            'employee_id': employee_id,
            'start_date': start_date,
            'is_prorated': True  # Automatic calculation
        }
    )
    return response.json()
```

---

## Testing Your Migration

### Checklist

- [ ] Update all API endpoint URLs
- [ ] Update request payloads to match V2 schemas
- [ ] Update response parsing (paginated responses)
- [ ] Test authentication still works
- [ ] Test error handling (error responses may differ)
- [ ] Verify all filters and search parameters
- [ ] Test assignment creation and removal flows
- [ ] Validate deduction generation works
- [ ] Run integration tests

### Recommended Testing Order

1. **Read Operations First**
   - `GET /apartments-v2/apartments` (listing)
   - `GET /apartments-v2/apartments/{id}` (details)
   - `GET /apartments-v2/reports/occupancy` (statistics)

2. **Write Operations**
   - `POST /apartments-v2/apartments` (create)
   - `PUT /apartments-v2/apartments/{id}` (update)

3. **Assignment Flow**
   - `POST /apartments-v2/assignments` (assign employee)
   - `GET /apartments-v2/assignments` (list assignments)
   - `PUT /apartments-v2/assignments/{id}/end` (remove employee)

4. **Advanced Features**
   - `POST /apartments-v2/calculate/prorated` (prorated calculations)
   - `POST /apartments-v2/charges` (additional charges)
   - `POST /apartments-v2/deductions/generate` (monthly deductions)

---

## Common Migration Issues

### Issue 1: Response Structure Changed

**Problem:** V1 returns array directly, V2 returns paginated object

**Solution:**
```javascript
// V1
const apartments = await response.json();  // array

// V2
const data = await response.json();        // object
const apartments = data.items;             // array
```

### Issue 2: Pagination Parameters

**Problem:** `skip` and `limit` no longer work

**Solution:**
```javascript
// V1
?skip=20&limit=10

// V2
?page=3&page_size=10  // Page 3 = skip 20, limit 10
```

### Issue 3: Assignment Endpoint Changed

**Problem:** `/apartments/{id}/assign` no longer exists

**Solution:**
```javascript
// V1
POST /api/apartments/123/assign
{
  "employee_id": 456
}

// V2
POST /api/apartments-v2/assignments
{
  "apartment_id": 123,
  "employee_id": 456,
  "start_date": "2025-11-10"
}
```

### Issue 4: Removal Flow Changed

**Problem:** `/apartments/{id}/remove` requires assignment ID now

**Solution:**
1. First, get the assignment ID:
   ```javascript
   GET /api/apartments-v2/assignments/employee/456/active
   // Returns: { id: 789, apartment_id: 123, employee_id: 456, ... }
   ```

2. Then, end the assignment:
   ```javascript
   PUT /api/apartments-v2/assignments/789/end
   {
     "end_date": "2025-12-15",
     "include_cleaning_fee": true
   }
   ```

---

## Rollback Plan

If you encounter critical issues during migration:

1. **V1 is still available until 2025-12-31**
   - You can continue using V1 temporarily
   - All V1 endpoints will log deprecation warnings

2. **Gradual Migration**
   - Migrate one module at a time
   - Keep V1 for non-critical features initially
   - Monitor for errors in V2 calls

3. **Report Issues**
   - Contact support if you find bugs in V2
   - Provide detailed error messages and request/response examples

---

## FAQ

### Q: Can I use both V1 and V2 simultaneously?
**A:** Yes, during the migration period (until 2025-12-31), both APIs are available. However, we recommend migrating completely as soon as possible.

### Q: Will my existing data be accessible in V2?
**A:** Yes, both APIs use the same database. All apartments, assignments, and data created in V1 are immediately available in V2.

### Q: What happens if I don't migrate by 2025-12-31?
**A:** V1 will be completely removed. All requests to `/api/apartments` will return 404 errors.

### Q: Are there breaking changes in the response schemas?
**A:** Yes, the main breaking changes are:
- Pagination structure (`{ items, total, page }` instead of direct array)
- Assignment endpoints (separate `/assignments` instead of nested routes)
- Additional fields in responses (more detailed information)

### Q: How do I test V2 without affecting production?
**A:** V2 is read-safe. All read operations (GET) are safe to test in production. For write operations (POST/PUT/DELETE), use a test environment first.

### Q: Is there a compatibility layer?
**A:** No. V2 is a new API with improvements. You must update your code to use V2 endpoints and schemas.

### Q: What about authentication?
**A:** Authentication remains the same. Use the same JWT tokens with V2 endpoints.

---

## Support

If you need assistance with migration:

- **Documentation:** `/api/docs#/Apartments%20V2`
- **Email:** support@uns-kikaku.com
- **Migration Support:** Available until 2025-12-31

---

## Appendix: Complete Endpoint Reference

### Apartments

| Method | V1 Endpoint | V2 Endpoint |
|--------|-------------|-------------|
| GET | `/apartments` | `/apartments-v2/apartments` |
| GET | `/apartments/stats` | `/apartments-v2/reports/occupancy` |
| GET | `/apartments/{id}` | `/apartments-v2/apartments/{id}` |
| POST | `/apartments` | `/apartments-v2/apartments` |
| PUT | `/apartments/{id}` | `/apartments-v2/apartments/{id}` |
| DELETE | `/apartments/{id}` | `/apartments-v2/apartments/{id}` |

### Assignments

| Method | V1 Endpoint | V2 Endpoint |
|--------|-------------|-------------|
| POST | `/apartments/{id}/assign` | `/apartments-v2/assignments` |
| POST | `/apartments/{id}/remove` | `/apartments-v2/assignments/{id}/end` |
| GET | `/apartments/{id}/employees` | `/apartments-v2/assignments/apartment/{id}/active` |
| N/A | N/A | `/apartments-v2/assignments` (list) |
| N/A | N/A | `/apartments-v2/assignments/{id}` (get) |
| N/A | N/A | `/apartments-v2/assignments/transfer` (transfer) |

### Calculations (V2 Only)

| Method | Endpoint |
|--------|----------|
| POST | `/apartments-v2/apartments/calculate/prorated` |
| GET | `/apartments-v2/apartments/calculate/cleaning-fee/{id}` |
| POST | `/apartments-v2/apartments/calculate/total` |

### Additional Charges (V2 Only)

| Method | Endpoint |
|--------|----------|
| GET | `/apartments-v2/charges` |
| POST | `/apartments-v2/charges` |
| GET | `/apartments-v2/charges/{id}` |
| PUT | `/apartments-v2/charges/{id}/approve` |
| PUT | `/apartments-v2/charges/{id}/cancel` |
| DELETE | `/apartments-v2/charges/{id}` |

### Deductions (V2 Only)

| Method | Endpoint |
|--------|----------|
| GET | `/apartments-v2/deductions/{year}/{month}` |
| POST | `/apartments-v2/deductions/generate` |
| GET | `/apartments-v2/deductions/{id}` |
| PUT | `/apartments-v2/deductions/{id}/status` |
| GET | `/apartments-v2/deductions/export/{year}/{month}` |

### Reports (V2 Only)

| Method | Endpoint |
|--------|----------|
| GET | `/apartments-v2/reports/occupancy` |
| GET | `/apartments-v2/reports/arrears` |
| GET | `/apartments-v2/reports/maintenance` |
| GET | `/apartments-v2/reports/costs` |

---

**Document Version:** 1.0
**Last Updated:** 2025-11-12
**API V1 End of Life:** 2025-12-31
