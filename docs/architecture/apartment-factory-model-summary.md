# Apartment-Factory Relationship Model - Analysis & Recommendation

**Date:** 2025-11-12  
**Version:** 5.4.1  
**Author:** @database-architect  
**Status:** Design Proposal

---

## Executive Summary

**Problem:** 472 apartments lack organizational and geographic context.

**Solution:** Hybrid model combining:
- **Many-to-many relationship table** (`apartment_factory`) for flexibility
- **Geographic fields** (`region_id`, `zone`) in `apartments` for location context

**Benefits:**
- ✅ Supports complex apartment-factory relationships
- ✅ Historical tracking with temporal fields
- ✅ Priority management for conflict resolution
- ✅ Scalable for future growth
- ✅ Backward compatible with existing data

---

## Current Situation

- **472 apartments** with NULL prefecture/city
- **24 active factories**
- **0 employees** currently linking apartments to factories
- Existing `regions` table available

---

## Option Comparison

| Feature | Option 1<br>Direct FK | Option 2<br>Junction Table | Option 3<br>Derived View | Option 4<br>Geographic | Recommended<br>Hybrid (2+4) |
|---------|:---:|:---:|:---:|:---:|:---:|
| Flexibility | ❌ Low | ✅ High | ⚠️ Medium | ❌ N/A | ✅ High |
| Scalability | ❌ Low | ✅ High | ⚠️ Medium | ✅ High | ✅ High |
| Performance | ✅ High | ⚠️ Medium | ❌ Low | ✅ High | ✅ High |
| Historical Tracking | ❌ No | ✅ Yes | ⚠️ Limited | ❌ No | ✅ Yes |
| Maintenance | ✅ Easy | ⚠️ Medium | ❌ Complex | ✅ Easy | ⚠️ Medium |
| Future-Proof | ❌ No | ✅ Yes | ❌ No | ⚠️ Partial | ✅ Yes |

---

## Recommended Solution

### New Table: `apartment_factory`

```sql
CREATE TABLE apartment_factory (
    id SERIAL PRIMARY KEY,
    apartment_id INTEGER NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
    factory_id INTEGER NOT NULL REFERENCES factories(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 1,
    distance_km NUMERIC(6,2),
    commute_minutes INTEGER,
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_until DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Extended Table: `apartments`

```sql
ALTER TABLE apartments ADD COLUMN region_id INTEGER REFERENCES regions(id);
ALTER TABLE apartments ADD COLUMN zone VARCHAR(50);
```

### Key Features

1. **Many-to-Many:** Apartments can serve multiple factories
2. **Temporal Tracking:** `effective_from`/`effective_until` for history
3. **Priority System:** `is_primary` + `priority` for ranking
4. **Distance Metrics:** `distance_km` + `commute_minutes`
5. **Automatic Triggers:** Ensures single primary factory per apartment
6. **Optimized View:** `v_apartment_factory_details` for reporting

---

## Files Delivered

1. **Migration Script:** `backend/alembic/versions/apartment_factory_migration.sql`
   - Creates `apartment_factory` table
   - Adds geographic fields to `apartments`
   - Creates indexes, triggers, views, functions

2. **ER Diagram:** `docs/architecture/apartment-factory-er-diagram.txt`
   - Visual representation of relationships
   - Constraints and indexes documentation

3. **This Analysis:** `docs/architecture/apartment-factory-model-summary.md`
   - Complete analysis of all options
   - Recommendations and rationale

---

## Implementation Steps

### Step 1: Apply Migration

```bash
# Execute migration
docker exec -i uns-claudejp-db psql -U uns_admin -d uns_claudejp < backend/alembic/versions/apartment_factory_migration.sql
```

### Step 2: Populate Data

```sql
-- Auto-populate from employees (if data exists)
SELECT * FROM populate_apartment_factory_from_employees();

-- Manual assignment examples
INSERT INTO apartment_factory (apartment_id, factory_id, is_primary, distance_km, commute_minutes)
VALUES 
    (12, 5, TRUE, 8.5, 20),
    (15, 8, TRUE, 5.2, 12);
```

### Step 3: Verify

```sql
-- Check migration success
SELECT 
    COUNT(DISTINCT a.id) as total_apartments,
    COUNT(DISTINCT f.id) as factories_with_apartments,
    COUNT(af.id) as total_relationships,
    COUNT(CASE WHEN af.is_primary THEN 1 END) as primary_relationships
FROM apartments a
LEFT JOIN apartment_factory af ON a.id = af.apartment_id
LEFT JOIN factories f ON af.factory_id = f.id
WHERE a.deleted_at IS NULL;
```

---

## Example Queries

### Get Apartments for Factory

```sql
SELECT * FROM get_factory_apartments(5, TRUE);
```

### Get Factories for Apartment

```sql
SELECT * FROM get_apartment_factories(12, TRUE);
```

### Find Available Apartments Within 10km

```sql
SELECT 
    a.name, af.distance_km, af.commute_minutes,
    a.capacity - COALESCE(v.current_occupancy, 0) as available_spots
FROM apartment_factory af
JOIN apartments a ON af.apartment_id = a.id
LEFT JOIN v_apartment_factory_details v ON af.id = v.id
WHERE af.factory_id = 5
  AND af.distance_km <= 10.0
  AND af.is_active = TRUE
  AND a.status = 'ACTIVE'
ORDER BY af.distance_km ASC;
```

---

## Advantages

### Option 1: Direct FK ❌ Not Recommended

**Pros:**
- Simple 1:N relationship
- Fast queries

**Cons:**
- Inflexible (one apartment = one factory only)
- No historical tracking
- Cannot handle shared apartments

### Option 2: Junction Table ✅ RECOMMENDED

**Pros:**
- Maximum flexibility (N:M relationships)
- Historical tracking
- Priority management
- Scalable

**Cons:**
- Additional JOIN (mitigated by view)
- Slightly more complex

### Option 3: Derived View ❌ Not Recommended

**Pros:**
- No duplicate data
- Auto-updates

**Cons:**
- Performance overhead
- Loses vacant apartments
- Cannot pre-assign
- Complex maintenance

### Option 4: Geographic Fields ✅ COMPLEMENTARY

**Pros:**
- Direct geographic filtering
- Stable information

**Cons:**
- Doesn't solve factory relationship
- Potential redundancy

---

## Why Hybrid (Option 2 + 4)?

1. **Flexibility:** N:M relationships support complex scenarios
2. **Geographic Context:** Region/zone for location-based queries
3. **Historical Data:** Track changes over time
4. **Performance:** Optimized indexes and views
5. **Future-Proof:** Adaptable to changing requirements
6. **Best of Both:** Junction table + geographic fields

---

## Rollback Plan

If needed, run:

```sql
DROP FUNCTION IF EXISTS get_factory_apartments(INTEGER, BOOLEAN);
DROP FUNCTION IF EXISTS get_apartment_factories(INTEGER, BOOLEAN);
DROP FUNCTION IF EXISTS populate_apartment_factory_from_employees();
DROP VIEW IF EXISTS v_apartment_factory_details;
DROP TRIGGER IF EXISTS trg_ensure_single_primary_factory ON apartment_factory;
DROP FUNCTION IF EXISTS ensure_single_primary_factory();
DROP TABLE IF EXISTS apartment_factory CASCADE;
ALTER TABLE apartments DROP COLUMN IF EXISTS region_id;
ALTER TABLE apartments DROP COLUMN IF EXISTS zone;
```

---

## Conclusion

The hybrid approach provides:
- ✅ **Flexibility** for complex organizational structures
- ✅ **Performance** through proper indexing
- ✅ **Scalability** for future growth
- ✅ **Data integrity** with constraints and triggers
- ✅ **Usability** via helper functions and views

This design supports current requirements while being adaptable to future business needs.

---

**For detailed ER diagram, see:** `docs/architecture/apartment-factory-er-diagram.txt`

**For migration script, see:** `backend/alembic/versions/apartment_factory_migration.sql`
