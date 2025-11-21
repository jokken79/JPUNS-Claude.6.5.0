-- MIGRATION: Apartment-Factory Relationship Model
-- Version: 5.4.1
-- Date: 2025-11-12
-- Author: @database-architect

BEGIN;

-- STEP 1: Add geographic fields to apartments
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'apartments' AND column_name = 'region_id') THEN
        ALTER TABLE apartments ADD COLUMN region_id INTEGER REFERENCES regions(id);
        CREATE INDEX idx_apartments_region ON apartments(region_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'apartments' AND column_name = 'zone') THEN
        ALTER TABLE apartments ADD COLUMN zone VARCHAR(50);
        CREATE INDEX idx_apartments_zone ON apartments(zone);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'apartments' AND indexname = 'idx_apartments_prefecture_city') THEN
        CREATE INDEX idx_apartments_prefecture_city ON apartments(prefecture, city);
    END IF;
END $$;

-- STEP 2: Create apartment_factory relationship table
CREATE TABLE IF NOT EXISTS apartment_factory (
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_apartment_factory_active UNIQUE(apartment_id, factory_id, effective_from),
    CONSTRAINT chk_effective_dates CHECK (effective_until IS NULL OR effective_until > effective_from),
    CONSTRAINT chk_priority_positive CHECK (priority > 0),
    CONSTRAINT chk_distance_positive CHECK (distance_km IS NULL OR distance_km >= 0),
    CONSTRAINT chk_commute_positive CHECK (commute_minutes IS NULL OR commute_minutes >= 0)
);

CREATE INDEX IF NOT EXISTS idx_apartment_factory_apartment ON apartment_factory(apartment_id);
CREATE INDEX IF NOT EXISTS idx_apartment_factory_factory ON apartment_factory(factory_id);
CREATE INDEX IF NOT EXISTS idx_apartment_factory_primary ON apartment_factory(apartment_id, is_primary) WHERE is_primary = TRUE;
CREATE INDEX IF NOT EXISTS idx_apartment_factory_active ON apartment_factory(factory_id, effective_until);
CREATE INDEX IF NOT EXISTS idx_apartment_factory_dates ON apartment_factory(effective_from, effective_until);

-- STEP 3: Trigger for single primary
CREATE OR REPLACE FUNCTION ensure_single_primary_factory()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_primary = TRUE THEN
        UPDATE apartment_factory 
        SET is_primary = FALSE, updated_at = NOW()
        WHERE apartment_id = NEW.apartment_id 
          AND id != COALESCE(NEW.id, 0)
          AND (effective_until IS NULL OR effective_until > CURRENT_DATE);
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ensure_single_primary_factory ON apartment_factory;
CREATE TRIGGER trg_ensure_single_primary_factory
BEFORE INSERT OR UPDATE ON apartment_factory
FOR EACH ROW WHEN (NEW.is_primary = TRUE)
EXECUTE FUNCTION ensure_single_primary_factory();

-- STEP 4: View
CREATE OR REPLACE VIEW v_apartment_factory_details AS
SELECT 
    af.id, af.apartment_id, af.factory_id, af.is_primary, af.priority,
    af.distance_km, af.commute_minutes, af.effective_from, af.effective_until,
    af.notes, af.created_at, af.updated_at,
    a.apartment_code, a.name as apartment_name, a.address as apartment_address,
    a.prefecture, a.city, a.zone, a.base_rent, a.monthly_rent, a.capacity,
    a.status as apartment_status, a.is_available as apartment_available,
    f.factory_id as factory_code, f.company_name, f.plant_name,
    f.address as factory_address, r.name as region_name,
    (SELECT COUNT(*) FROM employees e WHERE e.apartment_id = a.id AND e.is_active = TRUE AND e.deleted_at IS NULL) as current_occupancy,
    (SELECT COUNT(*) FROM employees e WHERE e.apartment_id = a.id AND e.factory_id = f.factory_id AND e.is_active = TRUE AND e.deleted_at IS NULL) as factory_employees_count,
    CASE WHEN af.effective_until IS NULL OR af.effective_until > CURRENT_DATE THEN TRUE ELSE FALSE END as is_active
FROM apartment_factory af
JOIN apartments a ON af.apartment_id = a.id
JOIN factories f ON af.factory_id = f.id
LEFT JOIN regions r ON a.region_id = r.id
WHERE a.deleted_at IS NULL AND f.deleted_at IS NULL
ORDER BY af.is_primary DESC, af.priority ASC, a.name;

-- STEP 5: Helper functions
CREATE OR REPLACE FUNCTION get_factory_apartments(p_factory_id INTEGER, p_active_only BOOLEAN DEFAULT TRUE)
RETURNS TABLE (apartment_id INTEGER, apartment_name VARCHAR, is_primary BOOLEAN, current_occupancy BIGINT, capacity INTEGER, available_spots INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT v.apartment_id, v.apartment_name, v.is_primary, v.current_occupancy, v.capacity,
           GREATEST(0, COALESCE(v.capacity, 0) - v.current_occupancy)::INTEGER as available_spots
    FROM v_apartment_factory_details v
    WHERE v.factory_id = p_factory_id AND (NOT p_active_only OR v.is_active = TRUE)
    ORDER BY v.is_primary DESC, v.priority ASC, v.apartment_name;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION get_apartment_factories(p_apartment_id INTEGER, p_active_only BOOLEAN DEFAULT TRUE)
RETURNS TABLE (factory_id INTEGER, company_name VARCHAR, plant_name VARCHAR, is_primary BOOLEAN, employee_count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT v.factory_id, v.company_name, v.plant_name, v.is_primary, v.factory_employees_count
    FROM v_apartment_factory_details v
    WHERE v.apartment_id = p_apartment_id AND (NOT p_active_only OR v.is_active = TRUE)
    ORDER BY v.is_primary DESC, v.priority ASC;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION populate_apartment_factory_from_employees()
RETURNS TABLE (apartments_linked INTEGER, total_relationships INTEGER) AS $$
DECLARE
    v_apartments_linked INTEGER := 0;
    v_total_relationships INTEGER := 0;
BEGIN
    INSERT INTO apartment_factory (apartment_id, factory_id, is_primary, priority, effective_from, notes)
    SELECT DISTINCT ON (e.apartment_id, f.id)
        e.apartment_id, f.id as factory_id, TRUE as is_primary, 1 as priority,
        MIN(e.apartment_start_date) OVER (PARTITION BY e.apartment_id, f.id) as effective_from,
        'Auto-generated from employee assignments' as notes
    FROM employees e
    JOIN factories f ON e.factory_id = f.factory_id
    WHERE e.apartment_id IS NOT NULL AND e.factory_id IS NOT NULL AND e.deleted_at IS NULL
      AND NOT EXISTS (SELECT 1 FROM apartment_factory af WHERE af.apartment_id = e.apartment_id AND af.factory_id = f.id)
    ON CONFLICT (apartment_id, factory_id, effective_from) DO NOTHING;
    
    GET DIAGNOSTICS v_total_relationships = ROW_COUNT;
    SELECT COUNT(DISTINCT apartment_id) INTO v_apartments_linked FROM apartment_factory;
    RETURN QUERY SELECT v_apartments_linked, v_total_relationships;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE apartment_factory IS 'Many-to-many relationship between apartments and factories with temporal tracking';
COMMENT ON COLUMN apartment_factory.is_primary IS 'Primary factory for this apartment (only one can be true)';
COMMENT ON COLUMN apartment_factory.priority IS 'Priority level (1=highest)';
COMMENT ON COLUMN apartments.region_id IS 'Geographic region';
COMMENT ON COLUMN apartments.zone IS 'Zone or district';

COMMIT;
