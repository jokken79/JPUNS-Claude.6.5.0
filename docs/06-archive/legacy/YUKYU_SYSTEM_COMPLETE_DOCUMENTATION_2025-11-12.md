# Yukyu (有給休暇) System - Complete Documentation

**Document Date:** 2025-11-12  
**Version:** 1.0  
**Status:** ✅ All Systems Operational  
**Last Updated:** After completing full system analysis and fixes

See the comprehensive analysis and fix reports:
- docs/FIX_YUKYU_LOGIN_DEBUG_2025-11-12.md
- docs/FIX_YUKYU_BALANCES_ENDPOINT_2025-11-12.md

## Quick Reference

### What is Yukyu?
Yukyu (有給休暇) is paid vacation under Japanese labor law. The system manages automatic calculation, balance tracking, request workflows, LIFO deduction, and compliance alerts.

### System Files
- Backend API: backend/app/api/yukyu.py (492 lines, 13 endpoints)
- Backend Service: backend/app/services/yukyu_service.py (721 lines)
- Backend Models: backend/app/models/models.py (lines 1115-1243)
- Backend Schemas: backend/app/schemas/yukyu.py (206 lines)
- Frontend Dashboard: frontend/app/(dashboard)/yukyu/page.tsx (259 lines)

### Database Tables
- yukyu_balances (17 columns)
- yukyu_requests (17 columns)  
- yukyu_usage_details (6 columns)

## Issues Fixed (2025-11-12)

### Issue 1: Missing Imports
- FIXED: Added date, datetime, YukyuRequest, RequestStatus imports
- File: backend/app/api/yukyu.py lines 1-14
- Verification: ✅ All endpoints responding

### Issue 2: Frontend Mock Data
- FIXED: Verified React Query fetching real API data
- File: frontend/app/(dashboard)/yukyu/page.tsx lines 14-47
- Verification: ✅ Real-time data display

### Issue 3: Wrong API Client
- FIXED: Using axios client from @/lib/api with JWT
- File: frontend/app/(dashboard)/yukyu/page.tsx line 14
- Verification: ✅ Token injection working

### Issue 4: Non-Existent Employee.user_id
- FIXED: Changed to email matching (users table NOT linked to employees)
- File: backend/app/api/yukyu.py lines 88-99
- Added: Admin aggregate view for all employees
- Schema update: employee_id now Optional[int]
- Verification: ✅ No AttributeError

## API Endpoints (13 Total)

1. POST /yukyu/balances/calculate - Calculate yukyu for employee
2. GET /yukyu/balances - Get current user balance (role-based)
3. GET /yukyu/balances/{employee_id} - Get specific employee balance
4. POST /yukyu/requests/ - Create new request (TANTOSHA)
5. GET /yukyu/requests/ - List requests (filtered by role)
6. PUT /yukyu/requests/{id}/approve - Approve request (KEIRI)
7. PUT /yukyu/requests/{id}/reject - Reject request (KEIRI)
8. GET /yukyu/employees/by-factory/{id} - Get employees in factory
9. POST /yukyu/maintenance/expire-old-yukyus - Expire old balances (cron)
10. GET /yukyu/maintenance/scheduler-status - Get cron status
11. GET /yukyu/reports/export-excel - Export to Excel (4 sheets)
12. GET /yukyu/requests/{id}/pdf - Generate PDF document
13. GET /yukyu/payroll/summary - Payroll integration

## Japanese Labor Law Compliance

### Entitlement Rules
- 6 months: 10 days
- 18 months: 11 days
- 30 months: 12 days
- 42 months: 14 days
- 54 months: 16 days
- 66 months: 18 days
- 78+ months: 20 days (maximum)

### Legal Requirements
1. Minimum 5 days per year (April 2019 amendment)
2. 2-year expiration (時効 - jikou)
3. LIFO deduction (newest first)

## Business Logic

### Yukyu Calculation
File: backend/app/services/yukyu_service.py lines 45-81
Calculates days based on months worked per Japanese law

### LIFO Deduction  
File: backend/app/services/yukyu_service.py lines 443-501
Uses newest balances first to maximize usage before expiration

Example:
- Employee has: 8 days (FY2023) + 11 days (FY2024) = 19 total
- Request: 5 days
- Deduction: 5 from FY2024 (newest)
- Remaining: 8 (FY2023) + 6 (FY2024) = 14 total

### Expiration
File: backend/app/services/yukyu_service.py lines 503-527
Daily cron job marks balances with expires_on <= today as expired

### 5-Day Compliance
File: backend/app/services/yukyu_service.py lines 255-317
Tracks if employee used 5+ days in fiscal year (April 1 - March 31)

## Testing

### Backend API Testing


### Frontend Testing
1. Navigate to http://localhost:3000/yukyu
2. Verify loading skeleton appears
3. Verify balance cards show numbers
4. Verify requests list displays
5. Test error handling (stop backend)

### Database Verification


## Troubleshooting

### Login 422 Error
**Cause:** Using JSON instead of form data
**Solution:** Use application/x-www-form-urlencoded

### Employee No user_id Error  
**Cause:** Field doesn't exist
**Solution:** Already fixed - now uses email matching

### 404 No Employee Found
**Cause:** User email doesn't match employee
**Solution:** Create employee or update employee email

### 401 Unauthorized
**Solution:** Get fresh token, check Authorization header

## Future Improvements

1. Add user_id column to employees table (proper FK)
2. Fix SQLAlchemy cartesian product warnings
3. Add E2E test infrastructure (non-Alpine container)
4. Complete notification system configuration
5. Add bulk request creation
6. Add request templates
7. Add analytics dashboard (Chart.js)
8. Add mobile app (React Native/Flutter)
9. Enhanced payroll integration (webhooks)
10. Add yukyu forecasting algorithm

## Summary

Status: 🟢 FULLY OPERATIONAL

All 4 critical issues have been fixed:
✅ Missing imports
✅ Frontend real API integration
✅ Correct axios client
✅ Email-based employee lookup

The yukyu system now works end-to-end with:
- 13 working API endpoints
- Real-time frontend dashboard
- LIFO deduction algorithm
- Automatic expiration
- 5-day compliance tracking
- Excel export and PDF generation
- Payroll integration support

Last Updated: 2025-11-12
