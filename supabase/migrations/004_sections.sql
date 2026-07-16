-- ============================================================
-- HALO Stadium Operations — Database Schema
-- Migration 004: Sections (Stadium Layout)
-- ============================================================

CREATE TABLE sections (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 500,
  current_occupancy INTEGER DEFAULT 0,
  noise_level INTEGER DEFAULT 0 CHECK (noise_level >= 0 AND noise_level <= 100),
  gate VARCHAR(20),
  floor INTEGER DEFAULT 1,
  is_accessible BOOLEAN DEFAULT TRUE,
  map_x DOUBLE PRECISION DEFAULT 0,
  map_y DOUBLE PRECISION DEFAULT 0,
  map_width DOUBLE PRECISION DEFAULT 50,
  map_height DOUBLE PRECISION DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read sections"
  ON sections FOR SELECT
  USING (TRUE);

CREATE POLICY "Only admins can modify sections"
  ON sections FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );
