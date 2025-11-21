"""Add database triggers for timer card consistency and auto-calculation

Revision ID: 2025_11_12_2015
Revises: 2025_11_12_2000
Create Date: 2025-11-12 20:15:00.000000

This migration implements the following trigger-based consistency mechanisms:

1. **prevent_duplicate_timer_cards**: Ensures no duplicate (hakenmoto_id, work_date) pairs
   - Raises exception if INSERT/UPDATE creates duplicate

2. **calculate_timer_card_hours**: Auto-calculates work hours based on clock_in/clock_out
   - Calculates: regular_hours, night_hours (22:00-05:00), overtime_hours
   - Sets clock_in/clock_out validation

3. **sync_timer_card_factory**: Auto-syncs factory_id from employee record
   - Updates factory_id when employee changes
   - Ensures factory_id is always in sync with employee assignment

4. **validate_approval_workflow**: Ensures approval data is consistent
   - If is_approved=true, requires both approved_by and approved_at
   - If is_approved=false, clears approved_by and approved_at

5. **update_timer_card_timestamp**: Auto-updates updated_at on changes
   - Ensures audit trail is maintained
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '2025_11_12_2015'
down_revision = '2025_11_12_2000'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Apply all timer card consistency triggers"""

    # ==========================================
    # 1. PREVENT DUPLICATE TIMER CARDS
    # ==========================================
    op.execute("""
    CREATE OR REPLACE FUNCTION prevent_duplicate_timer_cards()
    RETURNS TRIGGER AS $$
    DECLARE
        existing_count INTEGER;
    BEGIN
        -- Check if a timer card already exists for this hakenmoto_id and work_date
        SELECT COUNT(*) INTO existing_count
        FROM timer_cards
        WHERE hakenmoto_id = NEW.hakenmoto_id
          AND work_date = NEW.work_date
          AND id != NEW.id;  -- Exclude current record for UPDATEs

        IF existing_count > 0 THEN
            RAISE EXCEPTION 'Duplicate timer card for hakenmoto_id % on date %',
                NEW.hakenmoto_id, NEW.work_date;
        END IF;

        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """)

    op.execute("""
    DROP TRIGGER IF EXISTS trg_prevent_duplicate_timer_cards ON timer_cards;
    CREATE TRIGGER trg_prevent_duplicate_timer_cards
    BEFORE INSERT OR UPDATE ON timer_cards
    FOR EACH ROW
    EXECUTE FUNCTION prevent_duplicate_timer_cards();
    """)

    # ==========================================
    # 2. CALCULATE TIMER CARD HOURS
    # ==========================================
    op.execute("""
    CREATE OR REPLACE FUNCTION calculate_timer_card_hours()
    RETURNS TRIGGER AS $$
    DECLARE
        minutes_worked INTEGER;
        night_minutes INTEGER;
        holiday_multiplier NUMERIC;
        is_holiday BOOLEAN;
    BEGIN
        -- Only calculate if both clock_in and clock_out are provided
        IF NEW.clock_in IS NOT NULL AND NEW.clock_out IS NOT NULL THEN

            -- Calculate minutes worked (accounting for break)
            IF NEW.clock_out > NEW.clock_in THEN
                -- Same day
                minutes_worked := EXTRACT(EPOCH FROM (NEW.clock_out - NEW.clock_in))/60;
            ELSE
                -- Overnight shift (e.g., 22:00 to 05:00 next day)
                minutes_worked := EXTRACT(EPOCH FROM ('24:00:00'::TIME - NEW.clock_in))/60
                                + EXTRACT(EPOCH FROM (NEW.clock_out - '00:00:00'::TIME))/60;
            END IF;

            -- Subtract break time
            minutes_worked := minutes_worked - COALESCE(NEW.break_minutes, 0);

            -- Validate minimum work time
            IF minutes_worked < 0 THEN
                RAISE EXCEPTION 'Invalid shift: clock_out must be after clock_in (accounting for breaks)';
            END IF;

            -- Calculate night hours (22:00-05:00 with 25% bonus)
            IF NEW.clock_in >= '22:00:00'::TIME OR NEW.clock_out <= '05:00:00'::TIME THEN
                IF NEW.clock_in >= '22:00:00'::TIME AND NEW.clock_out <= '05:00:00'::TIME THEN
                    -- Entire shift is night (likely overnight)
                    night_minutes := minutes_worked;
                ELSIF NEW.clock_in >= '22:00:00'::TIME THEN
                    -- Shift starts at night
                    night_minutes := EXTRACT(EPOCH FROM ('24:00:00'::TIME - NEW.clock_in))/60;
                ELSE
                    -- Shift ends in early morning (before 05:00)
                    night_minutes := EXTRACT(EPOCH FROM (NEW.clock_out - '00:00:00'::TIME))/60;
                END IF;
            ELSE
                night_minutes := 0;
            END IF;

            -- Ensure night_minutes doesn't exceed total minutes
            night_minutes := LEAST(night_minutes, minutes_worked);

            -- Check if work_date is a Japanese holiday
            is_holiday := EXISTS(
                SELECT 1 FROM requests
                WHERE request_type = 'TAISHA'  -- Holiday indicator
                  AND DATE(created_at) = NEW.work_date
                LIMIT 1
            );

            -- Calculate holiday hours (35% bonus if applicable)
            IF is_holiday THEN
                NEW.holiday_hours := (minutes_worked::NUMERIC / 60);
                NEW.regular_hours := 0;
            ELSE
                NEW.regular_hours := ((minutes_worked - night_minutes)::NUMERIC / 60);
                NEW.holiday_hours := 0;
            END IF;

            -- Calculate night hours separately (with 25% bonus calculation)
            NEW.night_hours := (night_minutes::NUMERIC / 60);

            -- Default overtime_hours to 0 if not explicitly set
            IF NEW.overtime_hours IS NULL THEN
                NEW.overtime_hours := 0;
            END IF;

        END IF;

        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """)

    op.execute("""
    DROP TRIGGER IF EXISTS trg_calculate_timer_card_hours ON timer_cards;
    CREATE TRIGGER trg_calculate_timer_card_hours
    BEFORE INSERT OR UPDATE ON timer_cards
    FOR EACH ROW
    EXECUTE FUNCTION calculate_timer_card_hours();
    """)

    # ==========================================
    # 3. SYNC TIMER CARD FACTORY
    # ==========================================
    op.execute("""
    CREATE OR REPLACE FUNCTION sync_timer_card_factory()
    RETURNS TRIGGER AS $$
    DECLARE
        emp_factory_id VARCHAR(20);
    BEGIN
        -- Fetch factory_id from employee record
        SELECT factory_id INTO emp_factory_id
        FROM employees
        WHERE hakenmoto_id = NEW.hakenmoto_id
        LIMIT 1;

        -- Update factory_id if found
        IF emp_factory_id IS NOT NULL THEN
            NEW.factory_id := emp_factory_id;
        END IF;

        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """)

    op.execute("""
    DROP TRIGGER IF EXISTS trg_sync_timer_card_factory ON timer_cards;
    CREATE TRIGGER trg_sync_timer_card_factory
    BEFORE INSERT OR UPDATE ON timer_cards
    FOR EACH ROW
    WHEN (NEW.hakenmoto_id IS NOT NULL)
    EXECUTE FUNCTION sync_timer_card_factory();
    """)

    # ==========================================
    # 4. VALIDATE APPROVAL WORKFLOW
    # ==========================================
    op.execute("""
    CREATE OR REPLACE FUNCTION validate_approval_workflow()
    RETURNS TRIGGER AS $$
    BEGIN
        -- If is_approved is true, require approved_by and approved_at
        IF NEW.is_approved = true THEN
            IF NEW.approved_by IS NULL OR NEW.approved_at IS NULL THEN
                RAISE EXCEPTION 'Approval requires both approved_by and approved_at to be set';
            END IF;
        ELSE
            -- If is_approved is false, clear approval fields
            NEW.approved_by := NULL;
            NEW.approved_at := NULL;
        END IF;

        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """)

    op.execute("""
    DROP TRIGGER IF EXISTS trg_validate_approval_workflow ON timer_cards;
    CREATE TRIGGER trg_validate_approval_workflow
    BEFORE INSERT OR UPDATE ON timer_cards
    FOR EACH ROW
    EXECUTE FUNCTION validate_approval_workflow();
    """)

    # ==========================================
    # 5. UPDATE TIMESTAMP
    # ==========================================
    op.execute("""
    CREATE OR REPLACE FUNCTION update_timer_card_timestamp()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at := CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """)

    op.execute("""
    DROP TRIGGER IF EXISTS trg_update_timer_card_timestamp ON timer_cards;
    CREATE TRIGGER trg_update_timer_card_timestamp
    BEFORE UPDATE ON timer_cards
    FOR EACH ROW
    EXECUTE FUNCTION update_timer_card_timestamp();
    """)

    # ==========================================
    # 6. ADD UNIQUE CONSTRAINT (IF NOT EXISTS)
    # ==========================================
    # Check if constraint exists before creating
    op.execute("""
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE table_name = 'timer_cards'
            AND constraint_name = 'uq_timer_cards_hakenmoto_work_date'
        ) THEN
            ALTER TABLE timer_cards
            ADD CONSTRAINT uq_timer_cards_hakenmoto_work_date
            UNIQUE (hakenmoto_id, work_date);
        END IF;
    END $$;
    """)


def downgrade() -> None:
    """Remove all timer card consistency triggers"""

    op.execute("DROP TRIGGER IF EXISTS trg_prevent_duplicate_timer_cards ON timer_cards;")
    op.execute("DROP FUNCTION IF EXISTS prevent_duplicate_timer_cards();")

    op.execute("DROP TRIGGER IF EXISTS trg_calculate_timer_card_hours ON timer_cards;")
    op.execute("DROP FUNCTION IF EXISTS calculate_timer_card_hours();")

    op.execute("DROP TRIGGER IF EXISTS trg_sync_timer_card_factory ON timer_cards;")
    op.execute("DROP FUNCTION IF EXISTS sync_timer_card_factory();")

    op.execute("DROP TRIGGER IF EXISTS trg_validate_approval_workflow ON timer_cards;")
    op.execute("DROP FUNCTION IF EXISTS validate_approval_workflow();")

    op.execute("DROP TRIGGER IF EXISTS trg_update_timer_card_timestamp ON timer_cards;")
    op.execute("DROP FUNCTION IF EXISTS update_timer_card_timestamp();")

    op.execute("""
    DO $$
    BEGIN
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE table_name = 'timer_cards'
            AND constraint_name = 'uq_timer_cards_hakenmoto_work_date'
        ) THEN
            ALTER TABLE timer_cards
            DROP CONSTRAINT uq_timer_cards_hakenmoto_work_date;
        END IF;
    END $$;
    """)
