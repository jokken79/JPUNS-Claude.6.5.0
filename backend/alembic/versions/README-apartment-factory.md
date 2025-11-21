# Apartment-Factory Relationship Model

**Version:** 5.4.1  
**Date:** 2025-11-12  
**Author:** @database-architect

## Quick Start

### 1. Review Documentation

- **Analysis:** `docs/architecture/apartment-factory-model-summary.md`
- **ER Diagram:** `docs/architecture/apartment-factory-er-diagram.txt`

### 2. Apply Migration

```bash
cd D:/UNS-ClaudeJP-5.4.1
docker exec -i uns-claudejp-db psql -U uns_admin -d uns_claudejp < backend/alembic/versions/apartment_factory_migration.sql
```

Expected output:
```
NOTICE: Added region_id column to apartments
NOTICE: Added zone column to apartments
NOTICE: Created prefecture+city composite index
CREATE TABLE
CREATE INDEX
...
COMMIT
```

### 3. Populate Data

```bash
# Option A: Auto-populate from employees
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "SELECT * FROM populate_apartment_factory_from_employees();"

# Option B: Manual with sample queries
docker exec -i uns-claudejp-db psql -U uns_admin -d uns_claudejp < backend/alembic/versions/apartment_factory_sample_queries.sql
```

### 4. Verify

```bash
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "
SELECT 
    COUNT(DISTINCT a.id) as total_apartments,
    COUNT(DISTINCT f.id) as factories_with_apartments,
    COUNT(af.id) as total_relationships
FROM apartments a
LEFT JOIN apartment_factory af ON a.id = af.apartment_id
LEFT JOIN factories f ON af.factory_id = f.id
WHERE a.deleted_at IS NULL;
"
```

## What Was Created

### 1. New Table: `apartment_factory`

Many-to-many relationship between apartments and factories with:
- `is_primary`: Only one primary factory per apartment (enforced by trigger)
- `priority`: Ranking (1 = highest)
- `distance_km`, `commute_minutes`: Logistics data
- `effective_from`, `effective_until`: Temporal tracking
- Full indexing for performance

### 2. Extended Table: `apartments`

New columns:
- `region_id`: Link to regions table
- `zone`: District/zone within region

### 3. Helper Functions

- `get_factory_apartments(factory_id, active_only)`
- `get_apartment_factories(apartment_id, active_only)`
- `populate_apartment_factory_from_employees()`

### 4. Optimized View

`v_apartment_factory_details` - Denormalized view with:
- Apartment details
- Factory details
- Calculated occupancy
- Active status

## Common Use Cases

### Find Apartments for a Factory

```sql
SELECT * FROM get_factory_apartments(5, TRUE);
```

### Find Factories for an Apartment

```sql
SELECT * FROM get_apartment_factories(12, TRUE);
```

### Search Available Housing Near Factory

```sql
SELECT * FROM v_apartment_factory_details
WHERE factory_id = 5 
  AND is_active = TRUE
  AND available_spots > 0
  AND distance_km <= 10
ORDER BY distance_km;
```

### Assign Apartment to Factory

```sql
INSERT INTO apartment_factory (apartment_id, factory_id, is_primary, distance_km, notes)
VALUES (12, 5, TRUE, 8.5, 'Primary housing for Plant #3');
```

## Files

| File | Purpose |
|------|---------|
| `apartment_factory_migration.sql` | Migration script (run once) |
| `apartment_factory_sample_queries.sql` | Example queries |
| `apartment-factory-model-summary.md` | Complete analysis |
| `apartment-factory-er-diagram.txt` | ER diagram |
| `README-apartment-factory.md` | This file |

## Advantages

1. **Flexible:** N:M relationships support complex scenarios
2. **Historical:** Track changes over time
3. **Fast:** Optimized indexes and views
4. **Safe:** Constraints and triggers ensure data integrity
5. **Scalable:** Handles growth from 24 to 2400+ factories

## Rollback

If needed:

```bash
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp << 'ROLLBACK'
DROP FUNCTION IF EXISTS get_factory_apartments(INTEGER, BOOLEAN);
DROP FUNCTION IF EXISTS get_apartment_factories(INTEGER, BOOLEAN);
DROP FUNCTION IF EXISTS populate_apartment_factory_from_employees();
DROP VIEW IF EXISTS v_apartment_factory_details;
DROP TRIGGER IF EXISTS trg_ensure_single_primary_factory ON apartment_factory;
DROP FUNCTION IF EXISTS ensure_single_primary_factory();
DROP TABLE IF EXISTS apartment_factory CASCADE;
ALTER TABLE apartments DROP COLUMN IF EXISTS region_id;
ALTER TABLE apartments DROP COLUMN IF EXISTS zone;
DROP INDEX IF EXISTS idx_apartments_prefecture_city;
ROLLBACK
```

## Support

For questions or issues, see:
- Main analysis: `docs/architecture/apartment-factory-model-summary.md`
- ER diagram: `docs/architecture/apartment-factory-er-diagram.txt`
- Example queries: `backend/alembic/versions/apartment_factory_sample_queries.sql`
