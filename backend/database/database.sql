-- ============================================================
-- Barbershop App — Core Schema
-- Postgres 18. gen_random_uuid() is built into core (no extension needed).
-- ============================================================

-- ---------- ENUMS ----------

CREATE TYPE user_role AS ENUM ('client', 'barber', 'manager_assistant', 'receptionist');

CREATE TYPE appointment_status AS ENUM (
    'scheduled',    -- booked ahead of time, not yet arrived
    'checked_in',   -- client has arrived (walk-in lands here immediately on creation)
    'in_progress',  -- barber has started the service
    'completed',
    'cancelled',
    'no_show'
);

CREATE TYPE notification_channel AS ENUM ('whatsapp', 'email');
CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed');
CREATE TYPE recommendation_status AS ENUM ('pending', 'completed', 'failed');
CREATE TYPE loyalty_transaction_type AS ENUM ('earn', 'redeem', 'adjustment', 'expire');

-- ---------- updated_at trigger helper ----------

CREATE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------- shops (multi-tenancy root) ----------

CREATE TABLE shops (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name        varchar(150) NOT NULL,
    address     text,
    phone       varchar(30),
    timezone    varchar(50) NOT NULL DEFAULT 'UTC',
    is_active   boolean NOT NULL DEFAULT true,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_shops_updated_at BEFORE UPDATE ON shops
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------- users (shared identity, role-gated) ----------

CREATE TABLE users (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    role            user_role NOT NULL,
    email           varchar(255) NOT NULL UNIQUE,
    phone           varchar(30) UNIQUE,
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

-- ---------- role-specific extension tables (1:1 with users) ----------

CREATE TABLE clients (
    user_id                 uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    preferred_barber_id     uuid, -- FK added below, once barbers exists
    facial_structure_notes  text, -- preference inputs feeding recommendation flow
    created_at              timestamptz NOT NULL DEFAULT now(),
    updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE barbers (
    user_id                 uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    shop_id                 uuid NOT NULL REFERENCES shops(id) ON DELETE RESTRICT,
    bio                     text,
    specialty               varchar(150),
    is_accepting_bookings   boolean NOT NULL DEFAULT true,
    created_at              timestamptz NOT NULL DEFAULT now(),
    updated_at              timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE clients
    ADD CONSTRAINT fk_clients_preferred_barber
    FOREIGN KEY (preferred_barber_id) REFERENCES barbers(user_id) ON DELETE SET NULL;

CREATE INDEX idx_barbers_shop ON barbers (shop_id);
CREATE TRIGGER trg_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_barbers_updated_at BEFORE UPDATE ON barbers
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE managers (
    user_id     uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    shop_id     uuid REFERENCES shops(id) ON DELETE RESTRICT, -- NULL = org-level/owner, oversees all shops
    title       varchar(100),
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_managers_shop ON managers (shop_id);
CREATE TRIGGER trg_managers_updated_at BEFORE UPDATE ON managers
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE receptionists (
    user_id     uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    shop_id     uuid NOT NULL REFERENCES shops(id) ON DELETE RESTRICT, -- receptionist works at one specific shop
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_receptionists_shop ON receptionists (shop_id);
CREATE TRIGGER trg_receptionists_updated_at BEFORE UPDATE ON receptionists
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

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

CREATE TABLE supplies (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id           uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    name              varchar(150) NOT NULL,
    description       text,
    unit              varchar(30) NOT NULL DEFAULT 'unit', -- e.g. 'bottle', 'box', 'unit'
    quantity_on_hand  integer NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
    reorder_threshold integer CHECK (reorder_threshold >= 0),
    unit_cost         numeric(10,2) CHECK (unit_cost >= 0),
    sku               varchar(50),
    is_active         boolean NOT NULL DEFAULT true,
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now(),
    UNIQUE (shop_id, sku)
);

CREATE INDEX idx_supplies_shop ON supplies (shop_id);
CREATE TRIGGER trg_supplies_updated_at BEFORE UPDATE ON supplies
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

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

CREATE TABLE availability_exceptions (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    barber_id        uuid NOT NULL REFERENCES barbers(user_id) ON DELETE CASCADE,
    shop_id          uuid NOT NULL REFERENCES shops(id) ON DELETE RESTRICT,
    exception_date   date NOT NULL,
    is_unavailable   boolean NOT NULL DEFAULT true, -- true = full day off; false = custom hours for that date
    start_time       time,
    end_time         time,
    reason           varchar(255),
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_availability_exception_hours CHECK (
        (is_unavailable = true  AND start_time IS NULL AND end_time IS NULL) OR
        (is_unavailable = false AND start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time)
    ),
    UNIQUE (barber_id, exception_date)
);

CREATE INDEX idx_availability_exceptions_barber_date ON availability_exceptions (barber_id, exception_date);
CREATE TRIGGER trg_availability_exceptions_updated_at BEFORE UPDATE ON availability_exceptions
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
    started_at           timestamptz,
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

-- ---------- appointment_services (join + historical price/duration snapshot) ----------

CREATE TABLE appointment_services (
    id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id              uuid NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    service_id                  uuid NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
    quantity                    integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
    price_at_booking            numeric(10,2) NOT NULL CHECK (price_at_booking >= 0),
    duration_minutes_at_booking integer NOT NULL CHECK (duration_minutes_at_booking > 0),
    created_at                  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (appointment_id, service_id)
);

CREATE INDEX idx_appointment_services_appointment ON appointment_services (appointment_id);
CREATE INDEX idx_appointment_services_service     ON appointment_services (service_id);

-- ---------- loyalty (shared across shops) ----------

CREATE TABLE loyalty_accounts (
    client_id   uuid PRIMARY KEY REFERENCES clients(user_id) ON DELETE CASCADE,
    balance     integer NOT NULL DEFAULT 0 CHECK (balance >= 0),
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_loyalty_accounts_updated_at BEFORE UPDATE ON loyalty_accounts
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE loyalty_transactions (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id      uuid NOT NULL REFERENCES clients(user_id) ON DELETE RESTRICT,
    appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
    type           loyalty_transaction_type NOT NULL,
    amount         integer NOT NULL, -- positive = credit, negative = debit
    balance_after  integer NOT NULL,
    description    varchar(255),
    created_by     uuid REFERENCES users(id) ON DELETE SET NULL, -- staff who made a manual adjustment; null = system-generated
    created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_loyalty_transactions_client ON loyalty_transactions (client_id, created_at DESC);
CREATE INDEX idx_loyalty_transactions_appt   ON loyalty_transactions (appointment_id);

-- ---------- haircut recommendations ----------

CREATE TABLE recommendation_history (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id       uuid NOT NULL REFERENCES clients(user_id) ON DELETE CASCADE,
    photo_s3_key    varchar(512) NOT NULL, -- S3 object key/URL only, never the blob
    status          recommendation_status NOT NULL DEFAULT 'pending',
    suggestion_text text,
    confidence      numeric(5,2),
    error_message   text,
    requested_at    timestamptz NOT NULL DEFAULT now(),
    completed_at    timestamptz,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_recommendation_history_client ON recommendation_history (client_id, requested_at DESC);
CREATE INDEX idx_recommendation_history_status ON recommendation_history (status);
CREATE TRIGGER trg_recommendation_history_updated_at BEFORE UPDATE ON recommendation_history
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------- notifications ----------

CREATE TABLE notifications_log (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id       uuid NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    client_id            uuid NOT NULL REFERENCES clients(user_id) ON DELETE RESTRICT,
    channel              notification_channel NOT NULL,
    status               notification_status NOT NULL DEFAULT 'pending',
    trigger_type         varchar(50) NOT NULL DEFAULT 'reminder', -- e.g. 'reminder_24h','reminder_2h' — kept free-text since timing is still open/configurable
    scheduled_for        timestamptz NOT NULL,
    sent_at              timestamptz,
    failure_reason       text,
    provider_message_id  varchar(255),
    retry_count          integer NOT NULL DEFAULT 0,
    created_at           timestamptz NOT NULL DEFAULT now(),
    updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_log_appointment      ON notifications_log (appointment_id);
CREATE INDEX idx_notifications_log_status_scheduled ON notifications_log (status, scheduled_for);
CREATE TRIGGER trg_notifications_log_updated_at BEFORE UPDATE ON notifications_log
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
