# Migration 001 - PostgreSQL Enum Type Fix

## Problem
The original migration was failing with error:
```
invalid input value for enum interviewresult: "pending"
```

## Root Cause
The migration was using `Base.metadata.create_all()` which doesn't properly handle PostgreSQL enum types before creating tables. When tables with columns that have `server_default` values referencing enum types are created, PostgreSQL expects those enum types to already exist.

The `candidates` table has a column:
```python
interview_result = Column(SQLEnum(InterviewResult), server_default="pending")
```

This tries to use the enum type `interviewresult` with default value `"pending"`, but the enum type doesn't exist yet.

## Solution
The migration now explicitly creates all 16 PostgreSQL enum types BEFORE calling `Base.metadata.create_all()`:

### Enum Types Created (in order):
1. `user_role` - UserRole enum with values: SUPER_ADMIN, ADMIN, KEITOSAN, TANTOSHA, COORDINATOR, KANRININSHA, EMPLOYEE, CONTRACT_WORKER
2. `candidate_status` - CandidateStatus enum with values: pending, approved, rejected, hired
3. `interviewresult` - InterviewResult enum with values: passed, failed, pending
4. `document_type` - DocumentType enum with values: rirekisho, zairyu_card, license, contract, other
5. `request_type` - RequestType enum with values: yukyu, hankyu, ikkikokoku, taisha, nyuusha
6. `request_status` - RequestStatus enum with values: pending, approved, rejected, completed
7. `yukyu_status` - YukyuStatus enum with values: active, expired
8. `shift_type` - ShiftType enum with values: asa, hiru, yoru, other
9. `room_type` - RoomType enum with values: 1K, 1DK, 1LDK, 2K, 2DK, 2LDK, 3LDK, studio, other
10. `apartment_status` - ApartmentStatus enum with values: active, inactive, maintenance, reserved
11. `assignment_status` - AssignmentStatus enum with values: active, ended, cancelled, transferred
12. `charge_type` - ChargeType enum with values: cleaning, repair, deposit, penalty, key_replacement, other
13. `deduction_status` - DeductionStatus enum with values: pending, processed, paid, cancelled
14. `admin_action_type` - AdminActionType enum with values: PAGE_VISIBILITY_CHANGE, ROLE_PERMISSION_CHANGE, BULK_OPERATION, CONFIG_CHANGE, CACHE_CLEAR, USER_MANAGEMENT, SYSTEM_SETTINGS
15. `resource_type` - ResourceType enum with values: PAGE, ROLE, SYSTEM, USER, PERMISSION
16. `ai_provider` - AIProvider enum with values: gemini, openai, claude_api, local_cli

## Implementation Details

### Upgrade Process:
1. Import all enum classes from `app.models.models`
2. Create each PostgreSQL enum type using `postgresql.ENUM()` with `create_type=False`
3. Call `.create(op.get_bind(), checkfirst=True)` for each enum
4. Finally call `Base.metadata.create_all()` to create all tables

### Downgrade Process:
1. Drop all tables using `Base.metadata.drop_all()`
2. Drop all enum types in reverse order using `DROP TYPE IF EXISTS ... CASCADE`

## Key Changes
- Added import: `from sqlalchemy.dialects import postgresql`
- Added explicit enum creation before table creation
- Added proper cleanup in downgrade function
- Used `checkfirst=True` to make migration idempotent

## Testing
To test this migration:
```bash
cd backend
alembic upgrade head
```

To rollback:
```bash
alembic downgrade base
```

## Notes
- All enum types use `create_type=False` to prevent automatic creation by SQLAlchemy
- The `checkfirst=True` parameter ensures the migration is idempotent
- Enum names match exactly what SQLAlchemy generates (e.g., `interviewresult` not `interview_result`)
- All enum values match the Python enum class definitions in `models.py`
