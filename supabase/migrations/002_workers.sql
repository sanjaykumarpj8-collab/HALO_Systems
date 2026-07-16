-- ============================================================
-- HALO Stadium Operations — Database Schema
-- Migration 002: Workers
-- ============================================================

CREATE TABLE workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id VARCHAR(20) UNIQUE NOT NULL,  -- Human-readable ID e.g. "10001"
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('janitor', 'medic', 'security')),
  section INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'off-duty' CHECK (status IN ('on-duty', 'completed', 'off-duty', 'retired')),
  efficiency INTEGER DEFAULT 0 CHECK (efficiency >= 0 AND efficiency <= 100),
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  language VARCHAR(10) DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast dispatch queries
CREATE INDEX idx_workers_type_status ON workers(type, status);
CREATE INDEX idx_workers_section ON workers(section);

-- RLS
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything with workers"
  ON workers FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Staff can read own worker profile"
  ON workers FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Staff can update own location and status"
  ON workers FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
