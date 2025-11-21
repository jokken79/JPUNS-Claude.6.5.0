-- Create function to populate apartment_factory from employee assignments
CREATE OR REPLACE FUNCTION populate_apartment_factory_from_employees()
RETURNS TABLE (apartments_linked INTEGER, total_relationships INTEGER) AS $$
DECLARE
    v_apartments_linked INTEGER := 0;
    v_total_relationships INTEGER := 0;
BEGIN
    INSERT INTO apartment_factory (apartment_id, factory_id, is_primary, priority, effective_from, notes)
    SELECT DISTINCT ON (e.apartment_id, f.id)
        e.apartment_id, 
        f.id as factory_id, 
        TRUE as is_primary, 
        1 as priority,
        MIN(e.apartment_start_date) OVER (PARTITION BY e.apartment_id, f.id) as effective_from,
        'Auto-generated from employee assignments' as notes
    FROM employees e
    JOIN factories f ON e.current_factory_id = f.id
    WHERE e.apartment_id IS NOT NULL 
      AND e.current_factory_id IS NOT NULL 
      AND e.deleted_at IS NULL
      AND NOT EXISTS (
          SELECT 1 FROM apartment_factory af 
          WHERE af.apartment_id = e.apartment_id 
            AND af.factory_id = f.id
      )
    ON CONFLICT (apartment_id, factory_id, effective_from) DO NOTHING;
    
    GET DIAGNOSTICS v_total_relationships = ROW_COUNT;
    SELECT COUNT(DISTINCT apartment_id) INTO v_apartments_linked FROM apartment_factory;
    
    RETURN QUERY SELECT v_apartments_linked, v_total_relationships;
END;
$$ LANGUAGE plpgsql;
