-- ============================================================
-- HALO Stadium Operations — Seed Data
-- Realistic demo data for a FIFA World Cup match day
-- ============================================================

-- ─── Sections (Standard FIFA Stadium Layout) ────────────────
INSERT INTO sections (name, capacity, current_occupancy, noise_level, gate, floor, is_accessible) VALUES
  ('Section 101', 800, 720, 85, 'Gate A', 1, true),
  ('Section 102', 800, 690, 80, 'Gate A', 1, true),
  ('Section 103', 600, 580, 90, 'Gate B', 1, true),
  ('Section 104', 600, 540, 75, 'Gate B', 1, false),
  ('Section 105', 500, 480, 70, 'Gate C', 1, true),
  ('Section 201', 1000, 950, 95, 'Gate A', 2, true),
  ('Section 202', 1000, 880, 88, 'Gate B', 2, true),
  ('Section 203', 800, 720, 82, 'Gate C', 2, false),
  ('Section 204', 800, 760, 78, 'Gate D', 2, true),
  ('Section 301', 600, 450, 60, 'Gate A', 3, true),
  ('Section 302', 600, 500, 65, 'Gate B', 3, true),
  ('Section 303', 400, 350, 55, 'Gate C', 3, true),
  ('Section VIP-A', 200, 180, 40, 'VIP Gate', 2, true),
  ('Section VIP-B', 200, 160, 35, 'VIP Gate', 2, true),
  ('Sensory Room 1', 20, 8, 15, 'Gate A', 1, true),
  ('Sensory Room 2', 20, 5, 10, 'Gate C', 1, true);

-- ─── Demo Workers ───────────────────────────────────────────
-- Note: In production, workers link to auth users via user_id
-- For demo, user_id is NULL — these are standalone records

INSERT INTO workers (worker_id, name, type, section, status, efficiency, language, location_lat, location_lng) VALUES
  ('10001', 'John Martinez',    'janitor',   102, 'on-duty',    80, 'en', 25.2744, 51.5310),
  ('10002', 'Priya Sharma',     'medic',     104, 'completed',  79, 'hi', 25.2750, 51.5315),
  ('10003', 'Bobby Williams',   'security',  204, 'on-duty',    85, 'en', 25.2748, 51.5320),
  ('10004', 'Ana Rodriguez',    'janitor',   103, 'on-duty',    92, 'es', 25.2755, 51.5318),
  ('10005', 'Ahmed Hassan',     'medic',     201, 'on-duty',    88, 'ar', 25.2740, 51.5325),
  ('10006', 'Li Wei',           'security',  301, 'off-duty',   75, 'zh', 25.2760, 51.5312),
  ('10007', 'Marie Dupont',     'janitor',   105, 'on-duty',    70, 'fr', 25.2742, 51.5305),
  ('10008', 'Kenji Tanaka',     'medic',     202, 'on-duty',    91, 'ja', 25.2758, 51.5322),
  ('10009', 'Carlos Silva',     'security',  101, 'on-duty',    82, 'pt', 25.2752, 51.5308),
  ('10010', 'Emma Johnson',     'janitor',   201, 'completed',  77, 'en', 25.2746, 51.5316),
  ('10011', 'Fatima Al-Sayed',  'medic',     103, 'on-duty',    94, 'ar', 25.2753, 51.5311),
  ('10012', 'Hans Mueller',     'security',  302, 'on-duty',    86, 'de', 25.2749, 51.5319),
  ('10013', 'Sofia Rossi',      'janitor',   204, 'off-duty',   68, 'es', 25.2741, 51.5323),
  ('10014', 'David Kim',        'medic',     301, 'on-duty',    90, 'en', 25.2757, 51.5307),
  ('10015', 'Olga Petrova',     'security',  102, 'on-duty',    83, 'en', 25.2745, 51.5314);

-- ─── Demo Incidents ─────────────────────────────────────────
INSERT INTO incidents (reporter_name, raw_text, detected_language, english_translation, parsed_type, severity, section_id, location_description, status, confidence) VALUES
  ('Mary', 'I am stuck in crowd TT at section 203', 'en', 'I am stuck in crowd at section 203', 'security', 2, 8, 'Section 203, Floor 2', 'new', 0.91),
  ('Hans', 'Two persons where fighting at section 103', 'en', 'Two persons are fighting at section 103', 'security', 1, 3, 'Section 103, Floor 1', 'assigned', 0.95),
  ('Carmen', 'Hay un derrame grande en la puerta B', 'es', 'There is a large spill at Gate B', 'spill', 2, 3, 'Gate B entrance', 'new', 0.88),
  ('Yuki', '医療の緊急事態、セクション201', 'ja', 'Medical emergency, Section 201', 'medical', 1, 6, 'Section 201, Floor 2', 'in-progress', 0.96),
  ('Pierre', 'Escalier bloqué près de la section VIP', 'fr', 'Stairway blocked near VIP section', 'structural', 3, 13, 'VIP Gate stairway', 'resolved', 0.84);

-- ─── Demo Salary Records ────────────────────────────────────
INSERT INTO salary (worker_id, worker_name, grade, type, section, base_pay, bonus, payment_status, pay_period)
SELECT 
  w.id, w.name, 
  CASE w.type 
    WHEN 'medic' THEN 'A'
    WHEN 'security' THEN 'B'
    WHEN 'janitor' THEN 'C'
  END,
  w.type, w.section,
  CASE w.type
    WHEN 'medic' THEN 850.00
    WHEN 'security' THEN 720.00
    WHEN 'janitor' THEN 580.00
  END,
  CASE 
    WHEN w.efficiency >= 90 THEN 200.00
    WHEN w.efficiency >= 80 THEN 100.00
    ELSE 50.00
  END,
  'pending', '2026-07'
FROM workers w;
