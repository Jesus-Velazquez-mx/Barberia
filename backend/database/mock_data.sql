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
    ('b27c93cf-2282-4b40-81ea-efb5f7bec219', 'manager', 'gendo.ikari@nerv-barbershop.test',     '5550000001', '$2b$10$Qsyyw2A9nY41jcwqGvOSL..ymmVpMw.IqpaFUEQkBZcXW.SNZIxoS', 'Gendo',  'Ikari'),
    ('ca85606b-6af7-4583-82e6-89bcb6a8d4c6', 'manager', 'kozo.fuyutsuki@nerv-barbershop.test',  '5550000002', '$2b$10$Qsyyw2A9nY41jcwqGvOSL..ymmVpMw.IqpaFUEQkBZcXW.SNZIxoS', 'Kozo',   'Fuyutsuki');

INSERT INTO managers (user_id, title) VALUES
    ('b27c93cf-2282-4b40-81ea-efb5f7bec219', 'Regional Director'),
    ('ca85606b-6af7-4583-82e6-89bcb6a8d4c6', 'Sub-Director');

-- ---------- shops ----------

INSERT INTO shops (id, name, street, postal_code, number, phone, manager_id) VALUES
    ('064e25fa-26c1-4ec8-9d49-78fc5f520519', 'NERV Barbershop - Tokyo-3',    'Central Dogma Ave', '10001', '0100', '5551000001', 'b27c93cf-2282-4b40-81ea-efb5f7bec219'),
    ('96c3c0e1-b183-446f-9d2d-d3f3fc9f9361', 'NERV Barbershop - Matsushiro', 'Geofront Blvd',      '10002', '0200', '5551000002', 'ca85606b-6af7-4583-82e6-89bcb6a8d4c6');

-- ---------- barbers ----------

INSERT INTO users (id, role, email, phone, password_hash, first_name, last_name) VALUES
    ('60bdbfde-b471-4a48-a8dc-208a709793de', 'barber', 'shinji.ikari@nerv-barbershop.test',   '5550000003', '$2b$10$Qsyyw2A9nY41jcwqGvOSL..ymmVpMw.IqpaFUEQkBZcXW.SNZIxoS', 'Shinji', 'Ikari'),
    ('0d67c12d-3947-4ac2-8667-83410cfd5ce1', 'barber', 'kaworu.nagisa@nerv-barbershop.test',  '5550000004', '$2b$10$Qsyyw2A9nY41jcwqGvOSL..ymmVpMw.IqpaFUEQkBZcXW.SNZIxoS', 'Kaworu', 'Nagisa'),
    ('f06b06dd-132f-4b72-a124-b89fe9dd4a0c', 'barber', 'ryoji.kaji@nerv-barbershop.test',     '5550000005', '$2b$10$Qsyyw2A9nY41jcwqGvOSL..ymmVpMw.IqpaFUEQkBZcXW.SNZIxoS', 'Ryoji',  'Kaji'),
    ('cf28b56a-f463-4300-8743-e20979b0901e', 'barber', 'toji.suzuhara@nerv-barbershop.test',  '5550000006', '$2b$10$Qsyyw2A9nY41jcwqGvOSL..ymmVpMw.IqpaFUEQkBZcXW.SNZIxoS', 'Toji',   'Suzuhara'),
    ('347e8a2f-973c-4fab-97a2-144616b2ede0', 'barber', 'kensuke.aida@nerv-barbershop.test',   '5550000007', '$2b$10$Qsyyw2A9nY41jcwqGvOSL..ymmVpMw.IqpaFUEQkBZcXW.SNZIxoS', 'Kensuke','Aida');

INSERT INTO barbers (user_id, shop_id, shift_id, bio, is_accepting_bookings) VALUES
    ('60bdbfde-b471-4a48-a8dc-208a709793de', '064e25fa-26c1-4ec8-9d49-78fc5f520519', (SELECT id FROM shifts WHERE name = 'morning'),   'Precise fades, patient with first-timers.', true),
    ('0d67c12d-3947-4ac2-8667-83410cfd5ce1', '064e25fa-26c1-4ec8-9d49-78fc5f520519', (SELECT id FROM shifts WHERE name = 'afternoon'), 'Specialist in clean, minimalist cuts.',     true),
    ('f06b06dd-132f-4b72-a124-b89fe9dd4a0c', '064e25fa-26c1-4ec8-9d49-78fc5f520519', (SELECT id FROM shifts WHERE name = 'morning'),   'Ten years of experience with hot towel shaves.', true),
    ('cf28b56a-f463-4300-8743-e20979b0901e', '96c3c0e1-b183-446f-9d2d-d3f3fc9f9361', (SELECT id FROM shifts WHERE name = 'morning'),   'Great with kids and first haircuts.', true),
    ('347e8a2f-973c-4fab-97a2-144616b2ede0', '96c3c0e1-b183-446f-9d2d-d3f3fc9f9361', (SELECT id FROM shifts WHERE name = 'afternoon'), 'Currently fully booked most weeks.', false);

-- ---------- receptionists ----------

INSERT INTO users (id, role, email, phone, password_hash, first_name, last_name) VALUES
    ('5204b553-fe01-4c42-a624-7d566e006147', 'receptionist', 'misato.katsuragi@nerv-barbershop.test', '5550000008', '$2b$10$Qsyyw2A9nY41jcwqGvOSL..ymmVpMw.IqpaFUEQkBZcXW.SNZIxoS', 'Misato',  'Katsuragi'),
    ('01bd0371-7afc-4756-a7de-26bcb37a163e', 'receptionist', 'ritsuko.akagi@nerv-barbershop.test',    '5550000009', '$2b$10$Qsyyw2A9nY41jcwqGvOSL..ymmVpMw.IqpaFUEQkBZcXW.SNZIxoS', 'Ritsuko', 'Akagi');

INSERT INTO receptionists (user_id, shop_id) VALUES
    ('5204b553-fe01-4c42-a624-7d566e006147', '064e25fa-26c1-4ec8-9d49-78fc5f520519'),
    ('01bd0371-7afc-4756-a7de-26bcb37a163e', '96c3c0e1-b183-446f-9d2d-d3f3fc9f9361');

-- ---------- clients ----------

INSERT INTO users (id, role, email, phone, password_hash, first_name, last_name) VALUES
    ('9df92579-03de-47c4-aa1f-76658d361e2b', 'client', 'asuka.soryu@nerv-barbershop.test',    '5550000010', '$2b$10$Qsyyw2A9nY41jcwqGvOSL..ymmVpMw.IqpaFUEQkBZcXW.SNZIxoS', 'Asuka',  'Langley Soryu'),
    ('7a3be44f-9740-437b-86d2-c0a0463a0ea2', 'client', 'rei.ayanami@nerv-barbershop.test',    '5550000011', '$2b$10$Qsyyw2A9nY41jcwqGvOSL..ymmVpMw.IqpaFUEQkBZcXW.SNZIxoS', 'Rei',    'Ayanami'),
    ('c8d0e26f-6adb-4d84-91ca-4d8fe6e7da97', 'client', 'mari.illustrious@nerv-barbershop.test','5550000012', '$2b$10$Qsyyw2A9nY41jcwqGvOSL..ymmVpMw.IqpaFUEQkBZcXW.SNZIxoS', 'Mari',   'Makinami Illustrious'),
    ('df0942b0-7ce1-4edd-8583-01483bcf4cf4', 'client', 'hikari.horaki@nerv-barbershop.test',  '5550000013', '$2b$10$Qsyyw2A9nY41jcwqGvOSL..ymmVpMw.IqpaFUEQkBZcXW.SNZIxoS', 'Hikari', 'Horaki'),
    ('25cb4434-8409-4473-bfce-82ba2f9084c2', 'client', 'maya.ibuki@nerv-barbershop.test',     '5550000014', '$2b$10$Qsyyw2A9nY41jcwqGvOSL..ymmVpMw.IqpaFUEQkBZcXW.SNZIxoS', 'Maya',   'Ibuki'),
    ('cc458df9-eea1-43ce-a33a-7bb4cefb7ef5', 'client', 'shigeru.aoba@nerv-barbershop.test',   '5550000015', '$2b$10$Qsyyw2A9nY41jcwqGvOSL..ymmVpMw.IqpaFUEQkBZcXW.SNZIxoS', 'Shigeru','Aoba'),
    ('fb9cd491-e105-4e20-b7be-008b91290f9f', 'client', 'makoto.hyuga@nerv-barbershop.test',   '5550000016', '$2b$10$Qsyyw2A9nY41jcwqGvOSL..ymmVpMw.IqpaFUEQkBZcXW.SNZIxoS', 'Makoto', 'Hyuga'),
    ('f2406620-80c1-44d4-a2f6-a102e74d87a9', 'client', 'yui.ikari@nerv-barbershop.test',      '5550000017', '$2b$10$Qsyyw2A9nY41jcwqGvOSL..ymmVpMw.IqpaFUEQkBZcXW.SNZIxoS', 'Yui',    'Ikari'),
    ('a69aca94-e01a-436f-b54f-4ca8b068b2d0', 'client', 'naoko.akagi@nerv-barbershop.test',    '5550000018', '$2b$10$Qsyyw2A9nY41jcwqGvOSL..ymmVpMw.IqpaFUEQkBZcXW.SNZIxoS', 'Naoko',  'Akagi'),
    ('76a1be5b-c058-4a10-929f-2b4aea92829a', 'client', 'sakura.suzuhara@nerv-barbershop.test','5550000019', '$2b$10$Qsyyw2A9nY41jcwqGvOSL..ymmVpMw.IqpaFUEQkBZcXW.SNZIxoS', 'Sakura', 'Suzuhara');

INSERT INTO clients (user_id, facial_structure_type) VALUES
    ('9df92579-03de-47c4-aa1f-76658d361e2b', 'oval'),
    ('7a3be44f-9740-437b-86d2-c0a0463a0ea2', 'round'),
    ('c8d0e26f-6adb-4d84-91ca-4d8fe6e7da97', 'heart'),
    ('df0942b0-7ce1-4edd-8583-01483bcf4cf4', 'square'),
    ('25cb4434-8409-4473-bfce-82ba2f9084c2', 'oval'),
    ('cc458df9-eea1-43ce-a33a-7bb4cefb7ef5', 'diamond'),
    ('fb9cd491-e105-4e20-b7be-008b91290f9f', 'rectangle'),
    ('f2406620-80c1-44d4-a2f6-a102e74d87a9', 'oval'),
    ('a69aca94-e01a-436f-b54f-4ca8b068b2d0', NULL),
    ('76a1be5b-c058-4a10-929f-2b4aea92829a', 'triangle');

-- ---------- services catalog ----------

INSERT INTO services_categories (id, name, description) VALUES
    ('5750bab7-2364-4955-829c-44bcb11b3b1f', 'Haircuts',      'Standard and specialty haircuts.'),
    ('bae72ba4-252c-42f9-a854-87c85f37a185', 'Beard & Shave', 'Beard grooming and shaving services.'),
    ('9d90d1c7-9eae-45e0-863e-90ecc30f4c20', 'Hair Coloring', 'Full and partial coloring services.'),
    ('fc2c1299-9731-498e-8332-f0add96ac5ad', 'Kids',          'Services for children under 12.');

INSERT INTO services (id, category_id, name, description, duration_minutes, price) VALUES
    ('208bea03-e5d3-490a-9f43-54a1ee0decca', '5750bab7-2364-4955-829c-44bcb11b3b1f', 'Classic Haircut',  'Scissor cut with clippers on the sides.', 30, 15.00),
    ('ade5fab3-14a5-4455-8ccd-853439ca35fa', '5750bab7-2364-4955-829c-44bcb11b3b1f', 'Skin Fade',         'High-contrast fade with a razor finish.', 45, 20.00),
    ('d4d0d57a-01e0-48f8-83ef-1fc1fcd1aeb4', 'bae72ba4-252c-42f9-a854-87c85f37a185', 'Beard Trim',        'Shape and trim with straight razor edging.', 20, 10.00),
    ('3d4c9ce3-31e5-4825-8fa4-cbfae2b7f341', 'bae72ba4-252c-42f9-a854-87c85f37a185', 'Hot Towel Shave',   'Traditional straight razor shave.', 30, 18.00),
    ('49dfa392-f57e-4632-9c03-f06a37d03aca', '9d90d1c7-9eae-45e0-863e-90ecc30f4c20', 'Full Color',        'Full head hair coloring.', 90, 45.00),
    ('532342cc-94fb-4fdc-8dba-cee063e7554c', 'fc2c1299-9731-498e-8332-f0add96ac5ad', 'Kids Haircut',      'Haircut for clients under 12.', 25, 12.00);

-- ---------- supplies (per-shop inventory) ----------

INSERT INTO supplies_categories (id, name, description) VALUES
    ('547da365-0ebc-4f75-902b-8299a267a0a8', 'Tools',              'Reusable equipment.'),
    ('cc194507-1902-4c5d-9eeb-157b0b7391b9', 'Hair Care Products', 'Shampoos, conditioners, and styling products.'),
    ('8f0ab4c4-8238-4f52-aed3-b4657c5d7fcb', 'Disposables',        'Single-use consumables.');

INSERT INTO supplies (id, shop_id, category_id, name, description, unit, sku) VALUES
    ('a078e949-e605-4034-a206-632e10fbab6d', '064e25fa-26c1-4ec8-9d49-78fc5f520519', '547da365-0ebc-4f75-902b-8299a267a0a8', 'Professional Scissors', 'Stainless steel cutting shears.', 'unit',   'TS-SCI-001'),
    ('c7191516-5657-45a3-81d2-556a9212f072', '064e25fa-26c1-4ec8-9d49-78fc5f520519', '547da365-0ebc-4f75-902b-8299a267a0a8', 'Clipper Set',           'Cordless clipper with guard set.', 'unit',   'TS-CLP-001'),
    ('1abf3ceb-c5b5-4e37-8c68-24004ffec14a', '064e25fa-26c1-4ec8-9d49-78fc5f520519', 'cc194507-1902-4c5d-9eeb-157b0b7391b9', 'NERV Shampoo',          'House-brand shampoo.', 'bottle', 'TS-SHM-001'),
    ('a16cc485-dc8e-41ec-92b5-dee03b71c3f4', '064e25fa-26c1-4ec8-9d49-78fc5f520519', '8f0ab4c4-8238-4f52-aed3-b4657c5d7fcb', 'Disposable Razors',     'Single-use straight razor blades.', 'box',    'TS-RAZ-001'),
    ('3e27bdd3-2168-41f7-91d6-f9b8248ad5ba', '96c3c0e1-b183-446f-9d2d-d3f3fc9f9361', '547da365-0ebc-4f75-902b-8299a267a0a8', 'Professional Scissors', 'Stainless steel cutting shears.', 'unit',   'MT-SCI-001'),
    ('358e5e20-35ac-4c2d-9167-760c44b8cc91', '96c3c0e1-b183-446f-9d2d-d3f3fc9f9361', '547da365-0ebc-4f75-902b-8299a267a0a8', 'Clipper Set',           'Cordless clipper with guard set.', 'unit',   'MT-CLP-001'),
    ('bfbfa605-434d-4c17-a1de-739902af5ecf', '96c3c0e1-b183-446f-9d2d-d3f3fc9f9361', 'cc194507-1902-4c5d-9eeb-157b0b7391b9', 'NERV Shampoo',          'House-brand shampoo.', 'bottle', 'MT-SHM-001'),
    ('409313f0-6dc9-4fca-8e0d-4c0230878bac', '96c3c0e1-b183-446f-9d2d-d3f3fc9f9361', '8f0ab4c4-8238-4f52-aed3-b4657c5d7fcb', 'Disposable Razors',     'Single-use straight razor blades.', 'box',    'MT-RAZ-001');

INSERT INTO supply_stock (supply_id, quantity_on_hand, reorder_threshold, unit_cost) VALUES
    ('a078e949-e605-4034-a206-632e10fbab6d', 8,  2, 12.50),
    ('c7191516-5657-45a3-81d2-556a9212f072', 5,  1, 45.00),
    ('1abf3ceb-c5b5-4e37-8c68-24004ffec14a', 10, 3, 6.00),
    ('a16cc485-dc8e-41ec-92b5-dee03b71c3f4', 6,  4, 8.00),
    ('3e27bdd3-2168-41f7-91d6-f9b8248ad5ba', 7,  2, 12.75),
    ('358e5e20-35ac-4c2d-9167-760c44b8cc91', 4,  1, 45.00),
    ('bfbfa605-434d-4c17-a1de-739902af5ecf', 9,  3, 6.00),
    ('409313f0-6dc9-4fca-8e0d-4c0230878bac', 3,  4, 8.00); -- below threshold: needs_reorder trigger will flag this row

-- ---------- haircut styles (AI recommendation knowledge base) ----------

INSERT INTO haircut_styles (id, name, description) VALUES
    ('4dd02f15-8665-4c28-ad3d-b789847c462f', 'Angel Wing Undercut',    'Sharp undercut with a swept-back top.'),
    ('09fecd6b-d3c8-4453-8d01-1c9d833bbd37', 'EVA Pilot Crop',         'Short, low-maintenance crop with tapered sides.'),
    ('0b18355b-f649-4ee9-a2eb-7c379be103fc', 'Classic Ikari Side Part','Traditional side part with a clean fade.'),
    ('829a128a-61f4-49e3-b2ae-1b4c88862750', 'Rei Bob',                'Straight, blunt bob with even bangs.'),
    ('df283b6c-dc95-41b1-9336-5bd32ceda854', 'Commander Slickback',    'Slicked-back style for a formal look.');

INSERT INTO haircut_style_facial_structures (haircut_style_id, facial_structure_type) VALUES
    ('4dd02f15-8665-4c28-ad3d-b789847c462f', 'oval'),
    ('4dd02f15-8665-4c28-ad3d-b789847c462f', 'square'),
    ('09fecd6b-d3c8-4453-8d01-1c9d833bbd37', 'round'),
    ('09fecd6b-d3c8-4453-8d01-1c9d833bbd37', 'diamond'),
    ('0b18355b-f649-4ee9-a2eb-7c379be103fc', 'oval'),
    ('0b18355b-f649-4ee9-a2eb-7c379be103fc', 'rectangle'),
    ('829a128a-61f4-49e3-b2ae-1b4c88862750', 'round'),
    ('829a128a-61f4-49e3-b2ae-1b4c88862750', 'heart'),
    ('df283b6c-dc95-41b1-9336-5bd32ceda854', 'triangle'),
    ('df283b6c-dc95-41b1-9336-5bd32ceda854', 'square');

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
    ('0d6f42e6-eecc-4fd9-a372-80498da48af7', '064e25fa-26c1-4ec8-9d49-78fc5f520519',
     '9df92579-03de-47c4-aa1f-76658d361e2b', true, NULL, '60bdbfde-b471-4a48-a8dc-208a709793de',
     false, 'completed',
     date_trunc('day', now() - interval '7 days') + interval '10 hours', date_trunc('day', now() - interval '7 days') + interval '10 hours 50 minutes',
     NULL, date_trunc('day', now() - interval '7 days') + interval '10 hours 50 minutes', NULL, NULL,
     NULL, false),
    -- A2: completed, reward redemption (free Skin Fade, 5 days ago, 14:00-14:45)
    ('20340241-ed64-4b80-88e0-2d7d008e324e', '064e25fa-26c1-4ec8-9d49-78fc5f520519',
     '7a3be44f-9740-437b-86d2-c0a0463a0ea2', true, NULL, '0d67c12d-3947-4ac2-8667-83410cfd5ce1',
     false, 'completed',
     date_trunc('day', now() - interval '5 days') + interval '14 hours', date_trunc('day', now() - interval '5 days') + interval '14 hours 45 minutes',
     NULL, date_trunc('day', now() - interval '5 days') + interval '14 hours 45 minutes', NULL, NULL,
     'Redeemed loyalty reward.', true),
    -- A3: scheduled, upcoming (tomorrow, 11:00-11:30)
    ('d6fb73f4-c624-4a8c-aa8d-7e1a4f80c488', '064e25fa-26c1-4ec8-9d49-78fc5f520519',
     'c8d0e26f-6adb-4d84-91ca-4d8fe6e7da97', true, NULL, 'f06b06dd-132f-4b72-a124-b89fe9dd4a0c',
     false, 'scheduled',
     date_trunc('day', now() + interval '1 day') + interval '11 hours', date_trunc('day', now() + interval '1 day') + interval '11 hours 30 minutes',
     NULL, NULL, NULL, NULL,
     NULL, false),
    -- A4: checked in, in progress today
    ('a2497faa-c04e-49b1-8320-6c03297af2a4', '064e25fa-26c1-4ec8-9d49-78fc5f520519',
     'df0942b0-7ce1-4edd-8583-01483bcf4cf4', true, NULL, '60bdbfde-b471-4a48-a8dc-208a709793de',
     false, 'checked_in',
     now() - interval '10 minutes', now() + interval '20 minutes',
     now() - interval '5 minutes', NULL, NULL, NULL,
     NULL, false),
    -- A5: cancelled (3 days ago, 09:00-09:45)
    ('d1bbd7c1-75fc-4895-8855-157b81ce6619', '96c3c0e1-b183-446f-9d2d-d3f3fc9f9361',
     '25cb4434-8409-4473-bfce-82ba2f9084c2', true, NULL, 'cf28b56a-f463-4300-8743-e20979b0901e',
     false, 'cancelled',
     date_trunc('day', now() - interval '3 days') + interval '9 hours', date_trunc('day', now() - interval '3 days') + interval '9 hours 45 minutes',
     NULL, NULL, now() - interval '4 days', 'Client rescheduled for a different day.',
     NULL, false),
    -- A6: no-show (2 days ago, 15:00-15:30)
    ('b3b710e6-bc10-4911-a573-1f6a361ee879', '96c3c0e1-b183-446f-9d2d-d3f3fc9f9361',
     'cc458df9-eea1-43ce-a33a-7bb4cefb7ef5', true, NULL, '347e8a2f-973c-4fab-97a2-144616b2ede0',
     false, 'no_show',
     date_trunc('day', now() - interval '2 days') + interval '15 hours', date_trunc('day', now() - interval '2 days') + interval '15 hours 30 minutes',
     NULL, NULL, NULL, NULL,
     NULL, false),
    -- A7: walk-in guest, completed (1 day ago, 16:00-16:20)
    ('0a1367bf-e1ef-46c7-9bce-c474fa3aa77a', '96c3c0e1-b183-446f-9d2d-d3f3fc9f9361',
     NULL, false, 'Pen Pen', 'cf28b56a-f463-4300-8743-e20979b0901e',
     true, 'completed',
     date_trunc('day', now() - interval '1 day') + interval '16 hours', date_trunc('day', now() - interval '1 day') + interval '16 hours 20 minutes',
     date_trunc('day', now() - interval '1 day') + interval '16 hours', date_trunc('day', now() - interval '1 day') + interval '16 hours 20 minutes', NULL, NULL,
     'Walk-in, no account.', false),
    -- A8: scheduled, kids haircut (in 3 days, 13:00-13:25)
    ('044f613f-5e29-4f1d-94a1-56ea545ff529', '96c3c0e1-b183-446f-9d2d-d3f3fc9f9361',
     '76a1be5b-c058-4a10-929f-2b4aea92829a', true, NULL, '347e8a2f-973c-4fab-97a2-144616b2ede0',
     false, 'scheduled',
     date_trunc('day', now() + interval '3 days') + interval '13 hours', date_trunc('day', now() + interval '3 days') + interval '13 hours 25 minutes',
     NULL, NULL, NULL, NULL,
     NULL, false),
    -- A9: completed, earlier visit, builds loyalty history (14 days ago, 10:00-10:45)
    ('5c088974-46e9-4077-955a-6b66e8e10c8a', '064e25fa-26c1-4ec8-9d49-78fc5f520519',
     '9df92579-03de-47c4-aa1f-76658d361e2b', true, NULL, '0d67c12d-3947-4ac2-8667-83410cfd5ce1',
     false, 'completed',
     date_trunc('day', now() - interval '14 days') + interval '10 hours', date_trunc('day', now() - interval '14 days') + interval '10 hours 45 minutes',
     NULL, date_trunc('day', now() - interval '14 days') + interval '10 hours 45 minutes', NULL, NULL,
     NULL, false);

-- ---------- appointment_services ----------

INSERT INTO appointment_services (appointment_id, service_id, price_at_booking, duration_minutes_at_booking) VALUES
    ('0d6f42e6-eecc-4fd9-a372-80498da48af7', '208bea03-e5d3-490a-9f43-54a1ee0decca', 15.00, 30), -- A1: Classic Haircut
    ('0d6f42e6-eecc-4fd9-a372-80498da48af7', 'd4d0d57a-01e0-48f8-83ef-1fc1fcd1aeb4', 10.00, 20), -- A1: Beard Trim
    ('20340241-ed64-4b80-88e0-2d7d008e324e', 'ade5fab3-14a5-4455-8ccd-853439ca35fa',  0.00, 45), -- A2: Skin Fade (free, reward)
    ('d6fb73f4-c624-4a8c-aa8d-7e1a4f80c488', '3d4c9ce3-31e5-4825-8fa4-cbfae2b7f341', 18.00, 30), -- A3: Hot Towel Shave
    ('a2497faa-c04e-49b1-8320-6c03297af2a4', '208bea03-e5d3-490a-9f43-54a1ee0decca', 15.00, 30), -- A4: Classic Haircut
    ('d1bbd7c1-75fc-4895-8855-157b81ce6619', 'ade5fab3-14a5-4455-8ccd-853439ca35fa', 20.00, 45), -- A5: Skin Fade
    ('b3b710e6-bc10-4911-a573-1f6a361ee879', '208bea03-e5d3-490a-9f43-54a1ee0decca', 15.00, 30), -- A6: Classic Haircut
    ('0a1367bf-e1ef-46c7-9bce-c474fa3aa77a', 'd4d0d57a-01e0-48f8-83ef-1fc1fcd1aeb4', 10.00, 20), -- A7: Beard Trim
    ('044f613f-5e29-4f1d-94a1-56ea545ff529', '532342cc-94fb-4fdc-8dba-cee063e7554c', 12.00, 25), -- A8: Kids Haircut
    ('5c088974-46e9-4077-955a-6b66e8e10c8a', 'ade5fab3-14a5-4455-8ccd-853439ca35fa', 20.00, 45); -- A9: Skin Fade

-- ---------- AI recommendation history ----------

INSERT INTO recommendation_history (client_id, photo_s3_key, suggestion_text, confidence, error_message, requested_at, completed_at) VALUES
    ('9df92579-03de-47c4-aa1f-76658d361e2b', 's3://nerv-barbershop-mock/recommendations/asuka-001.jpg',
     'Based on your oval face shape, a Skin Fade or Classic Haircut with side-swept bangs would suit you well.', 92.50, NULL,
     now() - interval '10 days', now() - interval '10 days' + interval '2 minutes'),
    ('7a3be44f-9740-437b-86d2-c0a0463a0ea2', 's3://nerv-barbershop-mock/recommendations/rei-001.jpg',
     'Your round facial structure pairs well with a longer top and tapered sides — try the EVA Pilot Crop.', 88.00, NULL,
     now() - interval '9 days', now() - interval '9 days' + interval '1 minute'),
    ('c8d0e26f-6adb-4d84-91ca-4d8fe6e7da97', 's3://nerv-barbershop-mock/recommendations/mari-001.jpg',
     NULL, NULL, 'Face not detected in the uploaded photo. Please try again with a clearer, front-facing image.',
     now() - interval '6 days', now() - interval '6 days' + interval '30 seconds');

-- ---------- notifications ----------

INSERT INTO notifications_log (appointment_id, client_id, status, trigger_type, scheduled_for, sent_at, failure_reason) VALUES
    ('0d6f42e6-eecc-4fd9-a372-80498da48af7', '9df92579-03de-47c4-aa1f-76658d361e2b', 'sent',   'reminder_24h', now() - interval '8 days', now() - interval '8 days', NULL),
    ('20340241-ed64-4b80-88e0-2d7d008e324e', '7a3be44f-9740-437b-86d2-c0a0463a0ea2', 'sent',   'reminder_24h', now() - interval '6 days', now() - interval '6 days', NULL),
    ('d6fb73f4-c624-4a8c-aa8d-7e1a4f80c488', 'c8d0e26f-6adb-4d84-91ca-4d8fe6e7da97', 'pending','reminder_24h', now() + interval '1 hour', NULL, NULL),
    ('044f613f-5e29-4f1d-94a1-56ea545ff529', '76a1be5b-c058-4a10-929f-2b4aea92829a', 'pending','reminder_24h', now() + interval '2 days', NULL, NULL),
    ('5c088974-46e9-4077-955a-6b66e8e10c8a', '9df92579-03de-47c4-aa1f-76658d361e2b', 'failed', 'reminder_2h',  now() - interval '14 days' - interval '2 hours', NULL, 'Invalid phone number format returned by provider.');

-- ---------- supply movements ----------

INSERT INTO supply_movements (supply_id, movement_type, quantity, unit_cost, reason, performed_by) VALUES
    ('a078e949-e605-4034-a206-632e10fbab6d', 'in',  8,  12.50, 'Initial stock',      'b27c93cf-2282-4b40-81ea-efb5f7bec219'),
    ('1abf3ceb-c5b5-4e37-8c68-24004ffec14a', 'out', 2,  NULL,  'Used in service',    '5204b553-fe01-4c42-a624-7d566e006147'),
    ('3e27bdd3-2168-41f7-91d6-f9b8248ad5ba', 'in',  7,  12.75, 'Initial stock',      'ca85606b-6af7-4583-82e6-89bcb6a8d4c6'),
    ('409313f0-6dc9-4fca-8e0d-4c0230878bac', 'out', 10, NULL,  'Used in service',    '01bd0371-7afc-4756-a7de-26bcb37a163e');

COMMIT;
