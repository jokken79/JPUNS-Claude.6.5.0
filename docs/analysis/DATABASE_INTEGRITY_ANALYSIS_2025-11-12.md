# 📊 UNS-ClaudeJP 5.4.1 - Database Integrity Analysis Report

**Date:** 2025-11-12
**Analysis Type:** Complete Schema, Model, and Pydantic Validation Audit
**Status:** COMPREHENSIVE ANALYSIS

---

## Executive Summary

The UNS-ClaudeJP project contains **34 database tables** (not the documented 13), organized into:
- **31 models** in `backend/app/models/models.py`
- **3 models** in `backend/app/models/payroll_models.py`  
- **20 Pydantic schema files** for API validation

**Critical Issues Found:** 4
**Medium Issues Found:** 8
**Documentation Discrepancies:** 3

---

## Key Findings

### 🔴 CRITICAL ISSUES

1. **13 Tables Missing Pydantic Schemas** - No API validation for 38% of tables
2. **Apartment Schema: 80% Data Loss** - Only 7 of 35 fields in schema
3. **Employee Schema Incomplete** - Missing emergency_contact_relationship field
4. **Foreign Key Integrity Issues** - Using non-primary keys as FKs

### 🟠 HIGH PRIORITY ISSUES

5. Missing UNIQUE constraint on RolePagePermission(role_key, page_key)
6. Duplicate field definitions in Candidate schema
7. Document model allows orphaned records
8. TimerCard/Request FKs reference hakenmoto_id instead of employee.id

### Schema Coverage by Category

| Category | Tables | With Schema | Coverage |
|----------|--------|------------|----------|
| Personnel | 10 | 7 | 70% |
| Housing | 7 | 4 | 57% |
| Attendance | 8 | 6 | 75% |
| Paid Leave | 3 | 3 | 100% |
| Regional | 4 | 0 | 0% |
| System | 2 | 1 | 50% |
| **TOTAL** | **34** | **21** | **62%** |

---

## Tables Missing Pydantic Schemas

**Critical for API Operations:**
1. Document (OCR document management)
2. ContractWorker (派遣社員 - contract worker management)
3. Workplace (職場 - workplace locations)

**Important Configuration:**
4. Region (地域 - regional management)
5. Department (部署 - organizational structure)
6. ResidenceType (居住タイプ - housing classifications)
7. ResidenceStatus (在留ステータス - visa status)
8. SocialInsuranceRate (保険料率 - insurance rates)
9. ApartmentFactory (M:N junction)

**System Maintenance:**
10. Staff (管理人者 - office personnel)
11. AuditLog (監査ログ - audit trail)
12. PageVisibility (ページ表示 - page visibility)
13. RolePagePermission (ロール権限 - role permissions)

---

## Detailed Issue Breakdown

### Issue #1: Apartment Schema - MASSIVE Mismatch

**Database Model:** 35 fields  
**Pydantic Schema:** 6 fields  
**Data Loss:** 80% (28 fields missing)

**Missing Fields Include:**
- Address Components: postal_code, prefecture, city, address_line1/2
- Room Details: building_name, room_number, floor_number, room_type, size_sqm
- Financial: base_rent, management_fee, deposit, key_money, parking fees
- Contract: contract dates, landlord info, real_estate_agency
- Configuration: region_id, zone, property_type, status

**Impact:** Cannot manage apartment details through API

---

### Issue #2: Employee Schema - Field Mismatch

**Missing:**
- emergency_contact_relationship (critical for emergencies)
- 40+ other fields (hakensaki_shain_id, photo_url, appointment info, etc.)

**Current:** Only ~20% of fields available through API

---

### Issue #3: Foreign Key Integrity

**Problem 1:** Using non-primary keys as FKs
```
TimerCard.hakenmoto_id → Employee.hakenmoto_id (not Employee.id)
Request.hakenmoto_id → Employee.hakenmoto_id (not Employee.id)
```

**Problem 2:** Orphaned records possible
```
Document: candidate_id nullable, employee_id nullable
→ Documents can exist without parent
```

---

## Recommendations Summary

### 🔴 MUST FIX (Critical Priority)

1. Create Pydantic schemas for 13 missing tables
2. Extend ApartmentCreateV2 schema with all 35 fields
3. Add missing employee_contact_relationship to Employee schema  
4. Fix FK references to use employee.id instead of hakenmoto_id
5. Add CHECK constraint to ensure Document has at least one parent

### 🟠 SHOULD FIX (High Priority)

6. Add UNIQUE(role_key, page_key) to RolePagePermission
7. Remove duplicate field definitions in Candidate
8. Implement automatic soft-delete filtering
9. Add validation for JSON fields (config, employee_data)
10. Standardize FK column types

### 🟡 NICE TO HAVE (Medium Priority)

11. Refactor Employee/ContractWorker to eliminate duplication
12. Add comprehensive field validation
13. Create database integrity tests
14. Document all 34 models in API docs
15. Implement audit logging for schema changes

---

## Estimated Impact

| Risk Area | Level | Description |
|-----------|-------|-------------|
| **Data Loss** | 🔴 HIGH | 28 apartment fields, 40+ employee fields cannot be managed via API |
| **Referential Integrity** | 🟠 MEDIUM | 4 FK relationships use non-primary keys |
| **API Validation** | 🟠 MEDIUM | 13 tables lack Pydantic validation |
| **Business Logic** | 🟡 LOW | Some calculations lack validation constraints |

---

## Files Generated

1. **DATABASE_INTEGRITY_ANALYSIS_2025-11-12.md** (this file) - Complete analysis
2. **SCHEMA_MISMATCH_DETAILS.md** - Detailed field-by-field comparison
3. **DATABASE_INTEGRITY_RECOMMENDATIONS.md** - Implementation guide

---

## Next Steps

1. Review this analysis for accuracy
2. Prioritize schema creation by business impact
3. Create implementation tickets for each issue
4. Add tests to prevent regression
5. Update documentation

