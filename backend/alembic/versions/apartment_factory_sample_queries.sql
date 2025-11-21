-- APARTMENT-FACTORY SAMPLE QUERIES
-- Version: 5.4.1 | Date: 2025-11-12 | Author: @database-architect

-- ========================================================================
-- SECTION 1: DATA POPULATION
-- ========================================================================

-- Q1: Auto-populate from employees
SELECT * FROM populate_apartment_factory_from_employees();

-- Q2: Manual assignment examples
INSERT INTO apartment_factory (apartment_id, factory_id, is_primary, priority, distance_km, commute_minutes, notes)
VALUES 
    (12, 5, TRUE, 1, 8.5, 20, 'Primary housing for Toyota Plant #3'),
    (12, 8, FALSE, 2, 15.2, 35, 'Overflow housing for Honda'),
    (15, 8, TRUE, 1, 5.2, 12, 'Primary housing for Honda Suzuka');

-- Q3: Update prefecture/city from addresses
UPDATE apartments 
SET prefecture = CASE 
        WHEN address LIKE '%愛知県%' THEN '愛知県'
        WHEN address LIKE '%静岡県%' THEN '静岡県'
        ELSE prefecture END
WHERE deleted_at IS NULL;

-- Q4: Map to regions
UPDATE apartments a
SET region_id = r.id
FROM regions r
WHERE a.prefecture LIKE '%' || r.name || '%'
  AND a.region_id IS NULL AND a.deleted_at IS NULL;

-- ========================================================================
-- SECTION 2: COMMON QUERIES
-- ========================================================================

-- Q5: Get all apartments for factory #5
SELECT * FROM get_factory_apartments(5, TRUE);

-- Q6: Get all factories for apartment #12
SELECT * FROM get_apartment_factories(12, TRUE);

-- Q7: Find available apartments within 10km of factory #5
SELECT a.name, af.distance_km, af.commute_minutes,
       a.capacity - COALESCE(v.current_occupancy, 0) as available_spots
FROM apartment_factory af
JOIN apartments a ON af.apartment_id = a.id
LEFT JOIN v_apartment_factory_details v ON af.id = v.id
WHERE af.factory_id = 5 AND af.distance_km <= 10.0
  AND (af.effective_until IS NULL OR af.effective_until > CURRENT_DATE)
  AND a.status = 'ACTIVE' AND a.is_available = TRUE
ORDER BY af.distance_km ASC;

-- Q8: Apartments serving multiple factories
SELECT a.id, a.name, COUNT(DISTINCT af.factory_id) as factories_count,
       STRING_AGG(DISTINCT f.company_name, ', ') as factories_served
FROM apartments a
JOIN apartment_factory af ON a.id = af.apartment_id
JOIN factories f ON af.factory_id = f.id
WHERE a.deleted_at IS NULL 
  AND (af.effective_until IS NULL OR af.effective_until > CURRENT_DATE)
GROUP BY a.id, a.name
HAVING COUNT(DISTINCT af.factory_id) > 1
ORDER BY factories_count DESC;

-- Q9: Occupancy rate by factory
SELECT f.company_name, f.plant_name,
       COUNT(DISTINCT a.id) as total_apartments,
       SUM(a.capacity) as total_capacity,
       SUM(COALESCE(v.current_occupancy, 0)) as total_occupied,
       ROUND(100.0 * SUM(COALESCE(v.current_occupancy, 0)) / 
             NULLIF(SUM(a.capacity), 0), 2) as occupancy_rate_percent
FROM factories f
LEFT JOIN apartment_factory af ON f.id = af.factory_id 
LEFT JOIN apartments a ON af.apartment_id = a.id AND a.deleted_at IS NULL
LEFT JOIN v_apartment_factory_details v ON af.id = v.id
WHERE f.deleted_at IS NULL AND (af.effective_until IS NULL OR af.effective_until > CURRENT_DATE)
GROUP BY f.id, f.company_name, f.plant_name
ORDER BY occupancy_rate_percent DESC NULLS LAST;

-- Q10: Suggest optimal apartment for new employee at factory #5
WITH factory_apartments AS (
    SELECT a.id, a.name, a.address, a.capacity, af.distance_km, 
           af.is_primary, COALESCE(COUNT(e.id), 0) as current_occupancy,
           a.base_rent
    FROM apartment_factory af
    JOIN apartments a ON af.apartment_id = a.id
    LEFT JOIN employees e ON a.id = e.apartment_id AND e.is_active = TRUE
    WHERE af.factory_id = 5 AND a.status = 'ACTIVE'
      AND (af.effective_until IS NULL OR af.effective_until > CURRENT_DATE)
    GROUP BY a.id, a.name, a.address, a.capacity, af.distance_km, 
             af.is_primary, a.base_rent
    HAVING a.capacity > COALESCE(COUNT(e.id), 0)
)
SELECT *, capacity - current_occupancy as available_spots,
       (CASE WHEN is_primary THEN 30 ELSE 0 END) 
       - COALESCE(distance_km, 50) * 2 - current_occupancy * 5 as score
FROM factory_apartments
ORDER BY score DESC, distance_km ASC NULLS LAST LIMIT 5;

-- ========================================================================
-- SECTION 3: VALIDATION
-- ========================================================================

-- Q11: Check multiple primaries (should return 0 rows)
SELECT apartment_id, COUNT(*) as primary_count
FROM apartment_factory 
WHERE is_primary = TRUE AND (effective_until IS NULL OR effective_until > CURRENT_DATE)
GROUP BY apartment_id HAVING COUNT(*) > 1;

-- Q12: Summary statistics
SELECT COUNT(DISTINCT a.id) as total_apartments,
       COUNT(DISTINCT f.id) as factories_with_apartments,
       COUNT(af.id) as total_relationships,
       COUNT(CASE WHEN af.is_primary THEN 1 END) as primary_relationships,
       ROUND(AVG(af.distance_km), 2) as avg_distance_km
FROM apartments a
LEFT JOIN apartment_factory af ON a.id = af.apartment_id
LEFT JOIN factories f ON af.factory_id = f.id
WHERE a.deleted_at IS NULL;

-- ========================================================================
-- SECTION 4: UPDATES
-- ========================================================================

-- Q13: Set apartment #12 as primary for factory #5
UPDATE apartment_factory SET is_primary = TRUE
WHERE apartment_id = 12 AND factory_id = 5;

-- Q14: Add distance information
UPDATE apartment_factory SET distance_km = 8.5, commute_minutes = 20
WHERE apartment_id = 12 AND factory_id = 5;

-- Q15: End relationship
UPDATE apartment_factory SET effective_until = CURRENT_DATE
WHERE apartment_id = 15 AND factory_id = 8 AND effective_until IS NULL;
