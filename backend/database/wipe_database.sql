-- ============================================================
-- Barbershop App - Destructive database wipe
-- Removes objects owned by the public application schema.
-- ============================================================

BEGIN;

-- Dropping tables with CASCADE removes their foreign keys, constraints,
-- indexes, and table triggers, including tables added in the future.
DO $$
DECLARE
    table_record record;
BEGIN
    FOR table_record IN
        SELECT schemaname, tablename
        FROM pg_catalog.pg_tables
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format(
            'DROP TABLE IF EXISTS %I.%I CASCADE',
            table_record.schemaname,
            table_record.tablename
        );
    END LOOP;
END
$$;

-- Remove application enum types and any remaining dependencies.
DROP TYPE IF EXISTS supply_movement_type CASCADE;
DROP TYPE IF EXISTS shift_name CASCADE;
DROP TYPE IF EXISTS notification_status CASCADE;
DROP TYPE IF EXISTS appointment_status CASCADE;
DROP TYPE IF EXISTS facial_structure_type CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- Remove schema helper functions if they survived dependency cleanup.
DROP FUNCTION IF EXISTS set_updated_at() CASCADE;
DROP FUNCTION IF EXISTS check_user_role() CASCADE;
DROP FUNCTION IF EXISTS set_supplies_needs_reorder() CASCADE;
DROP FUNCTION IF EXISTS update_client_loyalty_count() CASCADE;
DROP FUNCTION IF EXISTS check_barber_deletable() CASCADE;
DROP FUNCTION IF EXISTS check_manager_deletable() CASCADE;

COMMIT;
