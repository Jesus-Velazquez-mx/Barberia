-- ============================================================
-- Barbershop App — Mock Data
-- For local development / testing only. Run after init_database.sql
-- (on a fresh database — the shifts rows it seeds are reused here).
-- Client and staff names are drawn from Neon Genesis Evangelion.
-- ============================================================

-- Password for all users: 'password'

BEGIN;
-- ---------- managers ----------

INSERT INTO users (id, role, email, phone, password_hash, first_name, last_name) VALUES
    ('aaaaaaaa-0000-0000-0000-000000000001', 'manager', 'gendo.ikari@nerv-barbershop.test',     '5550000001', '$2b$10$Qsyyw2A9nY41jcwqGvOSL..ymmVpMw.IqpaFUEQkBZcXW.SNZIxoS', 'Gendo',  'Ikari'),
    ('aaaaaaaa-0000-0000-0000-000000000002', 'manager', 'kozo.fuyutsuki@nerv-barbershop.test',  '5550000002', '$2b$10$Qsyyw2A9nY41jcwqGvOSL..ymmVpMw.IqpaFUEQkBZcXW.SNZIxoS', 'Kozo',   'Fuyutsuki');

INSERT INTO managers (user_id, title) VALUES
    ('aaaaaaaa-0000-0000-0000-000000000001', 'Regional Director'),
    ('aaaaaaaa-0000-0000-0000-000000000002', 'Sub-Director');

-- ---------- shops ----------

INSERT INTO shops (id, name, street, postal_code, number, phone, manager_id) VALUES
    ('bbbbbbbb-0000-0000-0000-000000000001', 'NERV Barbershop - Tokyo-3',    'Central Dogma Ave', '10001', '0100', '5551000001', 'aaaaaaaa-0000-0000-0000-000000000001'),
    ('bbbbbbbb-0000-0000-0000-000000000002', 'NERV Barbershop - Matsushiro', 'Geofront Blvd',      '10002', '0200', '5551000002', 'aaaaaaaa-0000-0000-0000-000000000002');

-- ---------- barbers ----------

INSERT INTO users (id, role, email, phone, password_hash, first_name, last_name) VALUES
    ('cccccccc-0000-0000-0000-000000000001', 'barber', 'shinji.ikari@nerv-barbershop.test',   '5550000003', '$2b$10$Qsyyw2A9nY41jcwqGvOSL..ymmVpMw.IqpaFUEQkBZcXW.SNZIxoS', 'Shinji', 'Ikari'),
    ('cccccccc-0000-0000-0000-000000000002', 'barber', 'kaworu.nagisa@nerv-barbershop.test',  '5550000004', '$2b$10$Qsyyw2A9nY41jcwqGvOSL..ymmVpMw.IqpaFUEQkBZcXW.SNZIxoS', 'Kaworu', 'Nagisa'),
    ('cccccccc-0000-0000-0000-000000000003', 'barber', 'ryoji.kaji@nerv-barbershop.test',     '5550000005', '$2b$10$Qsyyw2A9nY41jcwqGvOSL..ymmVpMw.IqpaFUEQkBZcXW.SNZIxoS', 'Ryoji',  'Kaji'),
    ('cccccccc-0000-0000-0000-000000000004', 'barber', 'toji.suzuhara@nerv-barbershop.test',  '5550000006', '$2b$10$Qsyyw2A9nY41jcwqGvOSL..ymmVpMw.IqpaFUEQkBZcXW.SNZIxoS', 'Toji',   'Suzuhara'),
    ('cccccccc-0000-0000-0000-000000000005', 'barber', 'kensuke.aida@nerv-barbershop.test',   '5550000007', '$2b$10$Qsyyw2A9nY41jcwqGvOSL..ymmVpMw.IqpaFUEQkBZcXW.SNZIxoS', 'Kensuke','Aida');

INSERT INTO barbers (user_id, shop_id, shift_id, bio, is_accepting_bookings) VALUES
    ('cccccccc-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', (SELECT id FROM shifts WHERE name = 'morning'),   'Precise fades, patient with first-timers.', true),
    ('cccccccc-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000001', (SELECT id FROM shifts WHERE name = 'afternoon'), 'Specialist in clean, minimalist cuts.',     true),
    ('cccccccc-0000-0000-0000-000000000003', 'bbbbbbbb-0000-0000-0000-000000000001', (SELECT id FROM shifts WHERE name = 'morning'),   'Ten years of experience with hot towel shaves.', true),
    ('cccccccc-0000-0000-0000-000000000004', 'bbbbbbbb-0000-0000-0000-000000000002', (SELECT id FROM shifts WHERE name = 'morning'),   'Great with kids and first haircuts.', true),
    ('cccccccc-0000-0000-0000-000000000005', 'bbbbbbbb-0000-0000-0000-000000000002', (SELECT id FROM shifts WHERE name = 'afternoon'), 'Currently fully booked most weeks.', false);

-- ---------- receptionists ----------

INSERT INTO users (id, role, email, phone, password_hash, first_name, last_name) VALUES
    ('dddddddd-0000-0000-0000-000000000001', 'receptionist', 'misato.katsuragi@nerv-barbershop.test', '5550000008', '$2b$10$Qsyyw2A9nY41jcwqGvOSL..ymmVpMw.IqpaFUEQkBZcXW.SNZIxoS', 'Misato',  'Katsuragi'),
    ('dddddddd-0000-0000-0000-000000000002', 'receptionist', 'ritsuko.akagi@nerv-barbershop.test',    '5550000009', '$2b$10$Qsyyw2A9nY41jcwqGvOSL..ymmVpMw.IqpaFUEQkBZcXW.SNZIxoS', 'Ritsuko', 'Akagi');

INSERT INTO receptionists (user_id, shop_id) VALUES
    ('dddddddd-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001'),
    ('dddddddd-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000002');

-- ---------- clients ----------

INSERT INTO users (id, role, email, phone, password_hash, first_name, last_name) VALUES
    ('eeeeeeee-0000-0000-0000-000000000001', 'client', 'asuka.soryu@nerv-barbershop.test',    '5550000010', '$2b$10$Qsyyw2A9nY41jcwqGvOSL..ymmVpMw.IqpaFUEQkBZcXW.SNZIxoS', 'Asuka',  'Langley Soryu'),
    ('eeeeeeee-0000-0000-0000-000000000002', 'client', 'rei.ayanami@nerv-barbershop.test',    '5550000011', '$2b$10$Qsyyw2A9nY41jcwqGvOSL..ymmVpMw.IqpaFUEQkBZcXW.SNZIxoS', 'Rei',    'Ayanami'),
    ('eeeeeeee-0000-0000-0000-000000000003', 'client', 'mari.illustrious@nerv-barbershop.test','5550000012', '$2b$10$Qsyyw2A9nY41jcwqGvOSL..ymmVpMw.IqpaFUEQkBZcXW.SNZIxoS', 'Mari',   'Makinami Illustrious'),
    ('eeeeeeee-0000-0000-0000-000000000004', 'client', 'hikari.horaki@nerv-barbershop.test',  '5550000013', '$2b$10$Qsyyw2A9nY41jcwqGvOSL..ymmVpMw.IqpaFUEQkBZcXW.SNZIxoS', 'Hikari', 'Horaki'),
    ('eeeeeeee-0000-0000-0000-000000000005', 'client', 'maya.ibuki@nerv-barbershop.test',     '5550000014', '$2b$10$Qsyyw2A9nY41jcwqGvOSL..ymmVpMw.IqpaFUEQkBZcXW.SNZIxoS', 'Maya',   'Ibuki'),
    ('eeeeeeee-0000-0000-0000-000000000006', 'client', 'shigeru.aoba@nerv-barbershop.test',   '5550000015', '$2b$10$Qsyyw2A9nY41jcwqGvOSL..ymmVpMw.IqpaFUEQkBZcXW.SNZIxoS', 'Shigeru','Aoba'),
    ('eeeeeeee-0000-0000-0000-000000000007', 'client', 'makoto.hyuga@nerv-barbershop.test',   '5550000016', '$2b$10$Qsyyw2A9nY41jcwqGvOSL..ymmVpMw.IqpaFUEQkBZcXW.SNZIxoS', 'Makoto', 'Hyuga'),
    ('eeeeeeee-0000-0000-0000-000000000008', 'client', 'yui.ikari@nerv-barbershop.test',      '5550000017', '$2b$10$Qsyyw2A9nY41jcwqGvOSL..ymmVpMw.IqpaFUEQkBZcXW.SNZIxoS', 'Yui',    'Ikari'),
    ('eeeeeeee-0000-0000-0000-000000000009', 'client', 'naoko.akagi@nerv-barbershop.test',    '5550000018', '$2b$10$Qsyyw2A9nY41jcwqGvOSL..ymmVpMw.IqpaFUEQkBZcXW.SNZIxoS', 'Naoko',  'Akagi'),
    ('eeeeeeee-0000-0000-0000-000000000010', 'client', 'sakura.suzuhara@nerv-barbershop.test','5550000019', '$2b$10$Qsyyw2A9nY41jcwqGvOSL..ymmVpMw.IqpaFUEQkBZcXW.SNZIxoS', 'Sakura', 'Suzuhara');

INSERT INTO clients (user_id, facial_structure_type) VALUES
    ('eeeeeeee-0000-0000-0000-000000000001', 'oval'),
    ('eeeeeeee-0000-0000-0000-000000000002', 'round'),
    ('eeeeeeee-0000-0000-0000-000000000003', 'heart'),
    ('eeeeeeee-0000-0000-0000-000000000004', 'square'),
    ('eeeeeeee-0000-0000-0000-000000000005', 'oval'),
    ('eeeeeeee-0000-0000-0000-000000000006', 'diamond'),
    ('eeeeeeee-0000-0000-0000-000000000007', 'rectangle'),
    ('eeeeeeee-0000-0000-0000-000000000008', 'oval'),
    ('eeeeeeee-0000-0000-0000-000000000009', NULL),
    ('eeeeeeee-0000-0000-0000-000000000010', 'triangle');

-- ---------- services catalog ----------

INSERT INTO services_categories (id, name, description) VALUES
    ('f1111111-0000-0000-0000-000000000001', 'Haircuts',      'Standard and specialty haircuts.'),
    ('f1111111-0000-0000-0000-000000000002', 'Beard & Shave', 'Beard grooming and shaving services.'),
    ('f1111111-0000-0000-0000-000000000003', 'Hair Coloring', 'Full and partial coloring services.'),
    ('f1111111-0000-0000-0000-000000000004', 'Kids',          'Services for children under 12.');

INSERT INTO services (id, category_id, name, description, duration_minutes, price) VALUES
    ('f2222222-0000-0000-0000-000000000001', 'f1111111-0000-0000-0000-000000000001', 'Classic Haircut',  'Scissor cut with clippers on the sides.', 30, 15.00),
    ('f2222222-0000-0000-0000-000000000002', 'f1111111-0000-0000-0000-000000000001', 'Skin Fade',         'High-contrast fade with a razor finish.', 45, 20.00),
    ('f2222222-0000-0000-0000-000000000003', 'f1111111-0000-0000-0000-000000000002', 'Beard Trim',        'Shape and trim with straight razor edging.', 20, 10.00),
    ('f2222222-0000-0000-0000-000000000004', 'f1111111-0000-0000-0000-000000000002', 'Hot Towel Shave',   'Traditional straight razor shave.', 30, 18.00),
    ('f2222222-0000-0000-0000-000000000005', 'f1111111-0000-0000-0000-000000000003', 'Full Color',        'Full head hair coloring.', 90, 45.00),
    ('f2222222-0000-0000-0000-000000000006', 'f1111111-0000-0000-0000-000000000004', 'Kids Haircut',      'Haircut for clients under 12.', 25, 12.00);

-- ---------- supplies (per-shop inventory) ----------

INSERT INTO supplies_categories (id, name, description) VALUES
    ('f3333333-0000-0000-0000-000000000001', 'Tools',              'Reusable equipment.'),
    ('f3333333-0000-0000-0000-000000000002', 'Hair Care Products', 'Shampoos, conditioners, and styling products.'),
    ('f3333333-0000-0000-0000-000000000003', 'Disposables',        'Single-use consumables.');

INSERT INTO supplies (id, shop_id, category_id, name, description, unit, sku) VALUES
    ('f4444444-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', 'f3333333-0000-0000-0000-000000000001', 'Professional Scissors', 'Stainless steel cutting shears.', 'unit',   'TS-SCI-001'),
    ('f4444444-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000001', 'f3333333-0000-0000-0000-000000000001', 'Clipper Set',           'Cordless clipper with guard set.', 'unit',   'TS-CLP-001'),
    ('f4444444-0000-0000-0000-000000000003', 'bbbbbbbb-0000-0000-0000-000000000001', 'f3333333-0000-0000-0000-000000000002', 'NERV Shampoo',          'House-brand shampoo.', 'bottle', 'TS-SHM-001'),
    ('f4444444-0000-0000-0000-000000000004', 'bbbbbbbb-0000-0000-0000-000000000001', 'f3333333-0000-0000-0000-000000000003', 'Disposable Razors',     'Single-use straight razor blades.', 'box',    'TS-RAZ-001'),
    ('f4444444-0000-0000-0000-000000000005', 'bbbbbbbb-0000-0000-0000-000000000002', 'f3333333-0000-0000-0000-000000000001', 'Professional Scissors', 'Stainless steel cutting shears.', 'unit',   'MT-SCI-001'),
    ('f4444444-0000-0000-0000-000000000006', 'bbbbbbbb-0000-0000-0000-000000000002', 'f3333333-0000-0000-0000-000000000001', 'Clipper Set',           'Cordless clipper with guard set.', 'unit',   'MT-CLP-001'),
    ('f4444444-0000-0000-0000-000000000007', 'bbbbbbbb-0000-0000-0000-000000000002', 'f3333333-0000-0000-0000-000000000002', 'NERV Shampoo',          'House-brand shampoo.', 'bottle', 'MT-SHM-001'),
    ('f4444444-0000-0000-0000-000000000008', 'bbbbbbbb-0000-0000-0000-000000000002', 'f3333333-0000-0000-0000-000000000003', 'Disposable Razors',     'Single-use straight razor blades.', 'box',    'MT-RAZ-001');

INSERT INTO supply_stock (supply_id, quantity_on_hand, reorder_threshold, unit_cost) VALUES
    ('f4444444-0000-0000-0000-000000000001', 8,  2, 12.50),
    ('f4444444-0000-0000-0000-000000000002', 5,  1, 45.00),
    ('f4444444-0000-0000-0000-000000000003', 10, 3, 6.00),
    ('f4444444-0000-0000-0000-000000000004', 6,  4, 8.00),
    ('f4444444-0000-0000-0000-000000000005', 7,  2, 12.75),
    ('f4444444-0000-0000-0000-000000000006', 4,  1, 45.00),
    ('f4444444-0000-0000-0000-000000000007', 9,  3, 6.00),
    ('f4444444-0000-0000-0000-000000000008', 3,  4, 8.00); -- below threshold: needs_reorder trigger will flag this row

-- ---------- haircut styles (AI recommendation knowledge base) ----------

INSERT INTO haircut_styles (id, name, description) VALUES
    ('f5555555-0000-0000-0000-000000000001', 'Angel Wing Undercut',    'Sharp undercut with a swept-back top.'),
    ('f5555555-0000-0000-0000-000000000002', 'EVA Pilot Crop',         'Short, low-maintenance crop with tapered sides.'),
    ('f5555555-0000-0000-0000-000000000003', 'Classic Ikari Side Part','Traditional side part with a clean fade.'),
    ('f5555555-0000-0000-0000-000000000004', 'Rei Bob',                'Straight, blunt bob with even bangs.'),
    ('f5555555-0000-0000-0000-000000000005', 'Commander Slickback',    'Slicked-back style for a formal look.');

INSERT INTO haircut_style_facial_structures (haircut_style_id, facial_structure_type) VALUES
    ('f5555555-0000-0000-0000-000000000001', 'oval'),
    ('f5555555-0000-0000-0000-000000000001', 'square'),
    ('f5555555-0000-0000-0000-000000000002', 'round'),
    ('f5555555-0000-0000-0000-000000000002', 'diamond'),
    ('f5555555-0000-0000-0000-000000000003', 'oval'),
    ('f5555555-0000-0000-0000-000000000003', 'rectangle'),
    ('f5555555-0000-0000-0000-000000000004', 'round'),
    ('f5555555-0000-0000-0000-000000000004', 'heart'),
    ('f5555555-0000-0000-0000-000000000005', 'triangle'),
    ('f5555555-0000-0000-0000-000000000005', 'square');

-- ---------- barber availability ----------
-- One slot per barber per working day (Monday-Saturday), matching their shift hours.

INSERT INTO availability_slots (barber_id, shop_id, day_of_week, start_time, end_time)
SELECT b.user_id, b.shop_id, d.day, s.start_time, s.end_time
FROM barbers b
JOIN shifts s ON s.id = b.shift_id
CROSS JOIN generate_series(1, 6) AS d(day);

-- ---------- appointments ----------

INSERT INTO appointments (
    id, shop_id, client_id, is_registered_client, guest_client_name, barber_id,
    is_walk_in, status, scheduled_start, scheduled_end,
    checked_in_at, completed_at, cancelled_at, cancellation_reason,
    notes, is_reward_redemption
) VALUES
    -- A1: completed, Classic Haircut + Beard Trim (7 days ago, 10:00-10:50)
    ('f6666666-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001',
     'eeeeeeee-0000-0000-0000-000000000001', true, NULL, 'cccccccc-0000-0000-0000-000000000001',
     false, 'completed',
     date_trunc('day', now() - interval '7 days') + interval '10 hours', date_trunc('day', now() - interval '7 days') + interval '10 hours 50 minutes',
     NULL, date_trunc('day', now() - interval '7 days') + interval '10 hours 50 minutes', NULL, NULL,
     NULL, false),
    -- A2: completed, reward redemption (free Skin Fade, 5 days ago, 14:00-14:45)
    ('f6666666-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000001',
     'eeeeeeee-0000-0000-0000-000000000002', true, NULL, 'cccccccc-0000-0000-0000-000000000002',
     false, 'completed',
     date_trunc('day', now() - interval '5 days') + interval '14 hours', date_trunc('day', now() - interval '5 days') + interval '14 hours 45 minutes',
     NULL, date_trunc('day', now() - interval '5 days') + interval '14 hours 45 minutes', NULL, NULL,
     'Redeemed loyalty reward.', true),
    -- A3: scheduled, upcoming (tomorrow, 11:00-11:30)
    ('f6666666-0000-0000-0000-000000000003', 'bbbbbbbb-0000-0000-0000-000000000001',
     'eeeeeeee-0000-0000-0000-000000000003', true, NULL, 'cccccccc-0000-0000-0000-000000000003',
     false, 'scheduled',
     date_trunc('day', now() + interval '1 day') + interval '11 hours', date_trunc('day', now() + interval '1 day') + interval '11 hours 30 minutes',
     NULL, NULL, NULL, NULL,
     NULL, false),
    -- A4: checked in, in progress today
    ('f6666666-0000-0000-0000-000000000004', 'bbbbbbbb-0000-0000-0000-000000000001',
     'eeeeeeee-0000-0000-0000-000000000004', true, NULL, 'cccccccc-0000-0000-0000-000000000001',
     false, 'checked_in',
     now() - interval '10 minutes', now() + interval '20 minutes',
     now() - interval '5 minutes', NULL, NULL, NULL,
     NULL, false),
    -- A5: cancelled (3 days ago, 09:00-09:45)
    ('f6666666-0000-0000-0000-000000000005', 'bbbbbbbb-0000-0000-0000-000000000002',
     'eeeeeeee-0000-0000-0000-000000000005', true, NULL, 'cccccccc-0000-0000-0000-000000000004',
     false, 'cancelled',
     date_trunc('day', now() - interval '3 days') + interval '9 hours', date_trunc('day', now() - interval '3 days') + interval '9 hours 45 minutes',
     NULL, NULL, now() - interval '4 days', 'Client rescheduled for a different day.',
     NULL, false),
    -- A6: no-show (2 days ago, 15:00-15:30)
    ('f6666666-0000-0000-0000-000000000006', 'bbbbbbbb-0000-0000-0000-000000000002',
     'eeeeeeee-0000-0000-0000-000000000006', true, NULL, 'cccccccc-0000-0000-0000-000000000005',
     false, 'no_show',
     date_trunc('day', now() - interval '2 days') + interval '15 hours', date_trunc('day', now() - interval '2 days') + interval '15 hours 30 minutes',
     NULL, NULL, NULL, NULL,
     NULL, false),
    -- A7: walk-in guest, completed (1 day ago, 16:00-16:20)
    ('f6666666-0000-0000-0000-000000000007', 'bbbbbbbb-0000-0000-0000-000000000002',
     NULL, false, 'Pen Pen', 'cccccccc-0000-0000-0000-000000000004',
     true, 'completed',
     date_trunc('day', now() - interval '1 day') + interval '16 hours', date_trunc('day', now() - interval '1 day') + interval '16 hours 20 minutes',
     date_trunc('day', now() - interval '1 day') + interval '16 hours', date_trunc('day', now() - interval '1 day') + interval '16 hours 20 minutes', NULL, NULL,
     'Walk-in, no account.', false),
    -- A8: scheduled, kids haircut (in 3 days, 13:00-13:25)
    ('f6666666-0000-0000-0000-000000000008', 'bbbbbbbb-0000-0000-0000-000000000002',
     'eeeeeeee-0000-0000-0000-000000000010', true, NULL, 'cccccccc-0000-0000-0000-000000000005',
     false, 'scheduled',
     date_trunc('day', now() + interval '3 days') + interval '13 hours', date_trunc('day', now() + interval '3 days') + interval '13 hours 25 minutes',
     NULL, NULL, NULL, NULL,
     NULL, false),
    -- A9: completed, earlier visit, builds loyalty history (14 days ago, 10:00-10:45)
    ('f6666666-0000-0000-0000-000000000009', 'bbbbbbbb-0000-0000-0000-000000000001',
     'eeeeeeee-0000-0000-0000-000000000001', true, NULL, 'cccccccc-0000-0000-0000-000000000002',
     false, 'completed',
     date_trunc('day', now() - interval '14 days') + interval '10 hours', date_trunc('day', now() - interval '14 days') + interval '10 hours 45 minutes',
     NULL, date_trunc('day', now() - interval '14 days') + interval '10 hours 45 minutes', NULL, NULL,
     NULL, false);

-- ---------- appointment_services ----------

INSERT INTO appointment_services (appointment_id, service_id, price_at_booking, duration_minutes_at_booking) VALUES
    ('f6666666-0000-0000-0000-000000000001', 'f2222222-0000-0000-0000-000000000001', 15.00, 30), -- A1: Classic Haircut
    ('f6666666-0000-0000-0000-000000000001', 'f2222222-0000-0000-0000-000000000003', 10.00, 20), -- A1: Beard Trim
    ('f6666666-0000-0000-0000-000000000002', 'f2222222-0000-0000-0000-000000000002',  0.00, 45), -- A2: Skin Fade (free, reward)
    ('f6666666-0000-0000-0000-000000000003', 'f2222222-0000-0000-0000-000000000004', 18.00, 30), -- A3: Hot Towel Shave
    ('f6666666-0000-0000-0000-000000000004', 'f2222222-0000-0000-0000-000000000001', 15.00, 30), -- A4: Classic Haircut
    ('f6666666-0000-0000-0000-000000000005', 'f2222222-0000-0000-0000-000000000002', 20.00, 45), -- A5: Skin Fade
    ('f6666666-0000-0000-0000-000000000006', 'f2222222-0000-0000-0000-000000000001', 15.00, 30), -- A6: Classic Haircut
    ('f6666666-0000-0000-0000-000000000007', 'f2222222-0000-0000-0000-000000000003', 10.00, 20), -- A7: Beard Trim
    ('f6666666-0000-0000-0000-000000000008', 'f2222222-0000-0000-0000-000000000006', 12.00, 25), -- A8: Kids Haircut
    ('f6666666-0000-0000-0000-000000000009', 'f2222222-0000-0000-0000-000000000002', 20.00, 45); -- A9: Skin Fade

-- ---------- AI recommendation history ----------

INSERT INTO recommendation_history (client_id, photo_s3_key, suggestion_text, confidence, error_message, requested_at, completed_at) VALUES
    ('eeeeeeee-0000-0000-0000-000000000001', 's3://nerv-barbershop-mock/recommendations/asuka-001.jpg',
     'Based on your oval face shape, a Skin Fade or Classic Haircut with side-swept bangs would suit you well.', 92.50, NULL,
     now() - interval '10 days', now() - interval '10 days' + interval '2 minutes'),
    ('eeeeeeee-0000-0000-0000-000000000002', 's3://nerv-barbershop-mock/recommendations/rei-001.jpg',
     'Your round facial structure pairs well with a longer top and tapered sides — try the EVA Pilot Crop.', 88.00, NULL,
     now() - interval '9 days', now() - interval '9 days' + interval '1 minute'),
    ('eeeeeeee-0000-0000-0000-000000000003', 's3://nerv-barbershop-mock/recommendations/mari-001.jpg',
     NULL, NULL, 'Face not detected in the uploaded photo. Please try again with a clearer, front-facing image.',
     now() - interval '6 days', now() - interval '6 days' + interval '30 seconds');

-- ---------- notifications ----------

INSERT INTO notifications_log (appointment_id, client_id, status, trigger_type, scheduled_for, sent_at, failure_reason) VALUES
    ('f6666666-0000-0000-0000-000000000001', 'eeeeeeee-0000-0000-0000-000000000001', 'sent',   'reminder_24h', now() - interval '8 days', now() - interval '8 days', NULL),
    ('f6666666-0000-0000-0000-000000000002', 'eeeeeeee-0000-0000-0000-000000000002', 'sent',   'reminder_24h', now() - interval '6 days', now() - interval '6 days', NULL),
    ('f6666666-0000-0000-0000-000000000003', 'eeeeeeee-0000-0000-0000-000000000003', 'pending','reminder_24h', now() + interval '1 hour', NULL, NULL),
    ('f6666666-0000-0000-0000-000000000008', 'eeeeeeee-0000-0000-0000-000000000010', 'pending','reminder_24h', now() + interval '2 days', NULL, NULL),
    ('f6666666-0000-0000-0000-000000000009', 'eeeeeeee-0000-0000-0000-000000000001', 'failed', 'reminder_2h',  now() - interval '14 days' - interval '2 hours', NULL, 'Invalid phone number format returned by provider.');

-- ---------- supply movements ----------

INSERT INTO supply_movements (supply_id, movement_type, quantity, unit_cost, reason, performed_by) VALUES
    ('f4444444-0000-0000-0000-000000000001', 'in',  8,  12.50, 'Initial stock',      'aaaaaaaa-0000-0000-0000-000000000001'),
    ('f4444444-0000-0000-0000-000000000003', 'out', 2,  NULL,  'Used in service',    'dddddddd-0000-0000-0000-000000000001'),
    ('f4444444-0000-0000-0000-000000000005', 'in',  7,  12.75, 'Initial stock',      'aaaaaaaa-0000-0000-0000-000000000002'),
    ('f4444444-0000-0000-0000-000000000008', 'out', 10, NULL,  'Used in service',    'dddddddd-0000-0000-0000-000000000002');

COMMIT;
