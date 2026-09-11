-- ============================================================
-- Barbershop App — Core Schema
-- Postgres 18. gen_random_uuid() is built into core (no extension needed).
-- ============================================================

-- ---------- TESTING TABLE -----------
CREATE TABLE test (
	id_test CHAR(5),
	field_test VARCHAR(50)
);

-- ---------- ENUMS ----------

CREATE TYPE user_role AS ENUM ('client', 'barber', 'manager', 'receptionist');
CREATE TYPE facial_structure_type AS ENUM ('oval', 'triangle', 'heart', 'round', 'diamond', 'square', 'rectangle');

CREATE TYPE appointment_status AS ENUM (
    'scheduled',    -- booked ahead of time, not yet arrived
    'checked_in',   -- client has arrived (walk-in lands here immediately on creation)
    'completed',
    'cancelled',
    'no_show'
);

CREATE TYPE notification_status AS ENUM ('sent', 'failed', 'pending');
CREATE TYPE shift_name AS ENUM ('morning', 'afternoon');

-- ---------- updated_at trigger helper ----------

CREATE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------- role-consistency trigger helper ----------
-- Each role-specific extension table (clients/barbers/managers/receptionists) is
-- 1:1 with users via user_id, but a plain FK can't enforce that users.role
-- actually matches the table being inserted into. This trigger does.

CREATE FUNCTION check_user_role() RETURNS trigger AS $$
DECLARE
    expected_role user_role;
    actual_role   user_role;
BEGIN
    expected_role := CASE TG_TABLE_NAME
        WHEN 'clients'       THEN 'client'
        WHEN 'barbers'       THEN 'barber'
        WHEN 'managers'      THEN 'manager'
        WHEN 'receptionists' THEN 'receptionist'
    END::user_role;

    SELECT role INTO actual_role FROM users WHERE id = NEW.user_id;

    IF actual_role IS DISTINCT FROM expected_role THEN
        RAISE EXCEPTION 'user % has role % but table % requires role %',
            NEW.user_id, actual_role, TG_TABLE_NAME, expected_role;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------- users (shared identity, role-gated) ----------

CREATE TABLE users (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    role            user_role NOT NULL,
    email           varchar(255) NOT NULL UNIQUE,
    phone           varchar(10) UNIQUE,
    password_hash   text NOT NULL,
    first_name      varchar(100) NOT NULL,
    last_name       varchar(100) NOT NULL,
    is_active       boolean NOT NULL DEFAULT true,
    deleted_at      timestamptz,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_role ON users (role);
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------- managers & shops (multi-tenancy root) ----------
-- A manager is created before being assigned to a shop; a shop always has exactly
-- one manager at creation time, and one manager may run multiple shops.

CREATE TABLE managers (
    user_id     uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    title       varchar(100),
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_managers_updated_at BEFORE UPDATE ON managers
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_managers_check_role BEFORE INSERT OR UPDATE ON managers
    FOR EACH ROW EXECUTE FUNCTION check_user_role();

CREATE TABLE shops (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name        varchar(50) NOT NULL,
    street      varchar(50),
    postal_code CHAR(5),
    number      CHAR(4),
    phone       varchar(10),
    manager_id  uuid NOT NULL,
    is_active   boolean NOT NULL DEFAULT true,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

-- manager_id is NOT NULL (a shop always has a manager) and RESTRICT, not SET NULL:
-- a manager must be reassigned off of all their shops before they can be deleted.
ALTER TABLE shops
    ADD CONSTRAINT fk_shops_manager
    FOREIGN KEY (manager_id) REFERENCES managers(user_id) ON DELETE RESTRICT;

CREATE INDEX idx_shops_manager ON shops (manager_id);
CREATE TRIGGER trg_shops_updated_at BEFORE UPDATE ON shops
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------- shifts (fixed catalog) ----------
-- Only two shifts exist today. Every barber works one shift, Monday–Saturday.

CREATE TABLE shifts (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name        shift_name NOT NULL UNIQUE,
    start_time  time NOT NULL,
    end_time    time NOT NULL CHECK (end_time > start_time),
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_shifts_updated_at BEFORE UPDATE ON shifts
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO shifts (name, start_time, end_time) VALUES
    ('morning',   '08:00', '16:00'),
    ('afternoon', '12:00', '20:00');

-- ---------- role-specific extension tables (1:1 with users) ----------

CREATE TABLE clients (
    user_id                    uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    facial_structure_type      facial_structure_type,
    completed_services_count   integer NOT NULL DEFAULT 0 CHECK (completed_services_count >= 0), -- paid services since the last free reward; resets to 0 on redemption
    created_at                 timestamptz NOT NULL DEFAULT now(),
    updated_at                 timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_clients_check_role BEFORE INSERT OR UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION check_user_role();

CREATE TABLE barbers (
    user_id                 uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    shop_id                 uuid NOT NULL REFERENCES shops(id) ON DELETE RESTRICT,
    shift_id                uuid NOT NULL REFERENCES shifts(id) ON DELETE RESTRICT,
    bio                     text,
    is_accepting_bookings   boolean NOT NULL DEFAULT true,
    created_at              timestamptz NOT NULL DEFAULT now(),
    updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_barbers_shop ON barbers (shop_id);
CREATE INDEX idx_barbers_shift ON barbers (shift_id);
CREATE TRIGGER trg_barbers_updated_at BEFORE UPDATE ON barbers
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_barbers_check_role BEFORE INSERT OR UPDATE ON barbers
    FOR EACH ROW EXECUTE FUNCTION check_user_role();

CREATE TABLE receptionists (
    user_id     uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    shop_id     uuid NOT NULL REFERENCES shops(id) ON DELETE RESTRICT, -- receptionist works at one specific shop
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_receptionists_shop ON receptionists (shop_id);
CREATE TRIGGER trg_receptionists_updated_at BEFORE UPDATE ON receptionists
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_receptionists_check_role BEFORE INSERT OR UPDATE ON receptionists
    FOR EACH ROW EXECUTE FUNCTION check_user_role();

-- ---------- services catalog (shared/global across shops) ----------

CREATE TABLE services (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name              varchar(150) NOT NULL,
    description       text,
    duration_minutes  integer NOT NULL CHECK (duration_minutes > 0),
    price             numeric(10,2) NOT NULL CHECK (price >= 0),
    is_active         boolean NOT NULL DEFAULT true,
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------- supplies (per-shop inventory, not a customer-facing catalog) ----------
-- "Products" in the docs actually means each shop's own stock of consumables
-- (scissors, shampoo, conditioner, etc.) used to deliver services — never sold to
-- or attached to a client's appointment, hence no link to appointments/appointment_services.
-- Split into identity (supplies: what the product is, rarely changes) and state
-- (supply_stock: current stock levels, re-priced/re-ordered often) so the two
-- change at different rates and can be updated independently.

CREATE TABLE supplies (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id     uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    name        varchar(150) NOT NULL,
    description text,
    unit        varchar(30) NOT NULL DEFAULT 'unit', -- e.g. 'bottle', 'box', 'unit'
    sku         varchar(50),
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (shop_id, sku)
);

CREATE INDEX idx_supplies_shop ON supplies (shop_id);
CREATE TRIGGER trg_supplies_updated_at BEFORE UPDATE ON supplies
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 1:1 with supplies, same pattern as the role-extension tables (user_id as PK/FK).
CREATE TABLE supply_stock (
    supply_id         uuid PRIMARY KEY REFERENCES supplies(id) ON DELETE CASCADE,
    quantity_on_hand  integer NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
    reorder_threshold integer CHECK (reorder_threshold >= 0),
    needs_reorder     boolean DEFAULT false NOT NULL,
    unit_cost         numeric(10,2) CHECK (unit_cost >= 0),
    is_active         boolean NOT NULL DEFAULT true,
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_supply_stock_updated_at BEFORE UPDATE ON supply_stock
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- needs_reorder is derived, not user-set: true once stock drops to/below the
-- threshold, false again once restocked above it. NULL threshold means "no
-- threshold configured yet" — never flagged.
CREATE FUNCTION set_supplies_needs_reorder() RETURNS trigger AS $$
BEGIN
    NEW.needs_reorder := (NEW.reorder_threshold IS NOT NULL AND NEW.quantity_on_hand <= NEW.reorder_threshold);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_supply_stock_needs_reorder BEFORE INSERT OR UPDATE ON supply_stock
    FOR EACH ROW EXECUTE FUNCTION set_supplies_needs_reorder();

-- ---------- barber availability ----------

CREATE TABLE availability_slots (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    barber_id   uuid NOT NULL REFERENCES barbers(user_id) ON DELETE CASCADE,
    shop_id     uuid NOT NULL REFERENCES shops(id) ON DELETE RESTRICT,
    day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday
    start_time  time NOT NULL,
    end_time    time NOT NULL CHECK (end_time > start_time),
    is_active   boolean NOT NULL DEFAULT true,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_availability_slots_barber_day ON availability_slots (barber_id, day_of_week);
CREATE TRIGGER trg_availability_slots_updated_at BEFORE UPDATE ON availability_slots
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------- appointments ----------

CREATE TABLE appointments (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id              uuid NOT NULL REFERENCES shops(id) ON DELETE RESTRICT,
    client_id            uuid NOT NULL REFERENCES clients(user_id) ON DELETE RESTRICT,
    barber_id            uuid REFERENCES barbers(user_id) ON DELETE RESTRICT, -- nullable: walk-in may be unassigned until check-in
    is_walk_in           boolean NOT NULL DEFAULT false,
    status               appointment_status NOT NULL DEFAULT 'scheduled',
    scheduled_start      timestamptz NOT NULL,
    scheduled_end        timestamptz NOT NULL,
    checked_in_at        timestamptz,
    completed_at         timestamptz,
    cancelled_at         timestamptz,
    cancellation_reason  varchar(255),
    notes                text,
    is_reward_redemption boolean NOT NULL DEFAULT false,
    created_at           timestamptz NOT NULL DEFAULT now(),
    updated_at           timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_appointments_barber_required CHECK (is_walk_in = true OR barber_id IS NOT NULL),
    CONSTRAINT chk_appointments_time_order CHECK (scheduled_end > scheduled_start)
);

CREATE INDEX idx_appointments_barber_start ON appointments (barber_id, scheduled_start);
CREATE INDEX idx_appointments_client_start ON appointments (client_id, scheduled_start DESC);
CREATE INDEX idx_appointments_shop_start   ON appointments (shop_id, scheduled_start);
CREATE INDEX idx_appointments_status       ON appointments (status);
CREATE TRIGGER trg_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Loyalty: every completed, non-reward appointment counts as one paid service
-- toward the client's next free service; completing a reward-redemption
-- appointment resets the count back to 0 (see clients.completed_services_count).
CREATE FUNCTION update_client_loyalty_count() RETURNS trigger AS $$
BEGIN
    IF NEW.is_reward_redemption THEN
        UPDATE clients SET completed_services_count = 0 WHERE user_id = NEW.client_id;
    ELSE
        UPDATE clients SET completed_services_count = completed_services_count + 1 WHERE user_id = NEW.client_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_appointments_loyalty_count_insert AFTER INSERT ON appointments
    FOR EACH ROW WHEN (NEW.status = 'completed')
    EXECUTE FUNCTION update_client_loyalty_count();
CREATE TRIGGER trg_appointments_loyalty_count_update AFTER UPDATE ON appointments
    FOR EACH ROW WHEN (NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed')
    EXECUTE FUNCTION update_client_loyalty_count();

-- ---------- appointment_services (join + historical price/duration snapshot) ----------

CREATE TABLE appointment_services (
    id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id              uuid NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    service_id                  uuid NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
    price_at_booking            numeric(10,2) NOT NULL CHECK (price_at_booking >= 0),
    duration_minutes_at_booking integer NOT NULL CHECK (duration_minutes_at_booking > 0),
    created_at                  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (appointment_id, service_id)
);

CREATE INDEX idx_appointment_services_appointment ON appointment_services (appointment_id);
CREATE INDEX idx_appointment_services_service     ON appointment_services (service_id);

-- ---------- haircut recommendations ----------

CREATE TABLE recommendation_history (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id       uuid NOT NULL REFERENCES clients(user_id) ON DELETE CASCADE,
    photo_s3_key    varchar(512) NOT NULL, -- S3 object key/URL only, never the blob
    suggestion_text text,
    confidence      numeric(5,2),
    error_message   text,
    requested_at    timestamptz NOT NULL DEFAULT now(),
    completed_at    timestamptz,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_recommendation_history_client ON recommendation_history (client_id, requested_at DESC);
CREATE TRIGGER trg_recommendation_history_updated_at BEFORE UPDATE ON recommendation_history
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------- notifications ----------

CREATE TABLE notifications_log (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id       uuid NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    client_id            uuid NOT NULL REFERENCES clients(user_id) ON DELETE RESTRICT,
    status               notification_status NOT NULL DEFAULT ('pending'),
    trigger_type         varchar(50) NOT NULL DEFAULT 'reminder', -- e.g. 'reminder_24h','reminder_2h' — kept free-text since timing is still open/configurable
    scheduled_for        timestamptz NOT NULL,
    sent_at              timestamptz,
    failure_reason       text,
    provider_message_id  varchar(255),
    retry_count          integer NOT NULL DEFAULT 0, -- Modificar ya cuando sepamos cómo funciona la api de whatsapp
    created_at           timestamptz NOT NULL DEFAULT now(),
    updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_log_appointment      ON notifications_log (appointment_id);
CREATE INDEX idx_notifications_log_status_scheduled ON notifications_log (status, scheduled_for);
CREATE TRIGGER trg_notifications_log_updated_at BEFORE UPDATE ON notifications_log
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();