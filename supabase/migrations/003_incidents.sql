-- ============================================================
-- HALO Stadium Operations — Database Schema
-- Migration 003: Incidents (core of Crisis-Bridge pipeline)
-- ============================================================

CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reported_by UUID REFERENCES users(id),
  reporter_name VARCHAR(255),
  raw_text TEXT NOT NULL,                -- Original message in any language
  detected_language VARCHAR(10),
  english_translation TEXT,
  parsed_type VARCHAR(30) CHECK (parsed_type IN (
    'spill', 'medical', 'security', 'fire', 'structural', 'noise', 'accessibility', 'other'
  )),
  severity INTEGER DEFAULT 3 CHECK (severity >= 1 AND severity <= 5),
  section_id INTEGER,
  location_description TEXT,
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN (
    'new', 'processing', 'assigned', 'in-progress', 'resolved', 'closed'
  )),
  assigned_worker_id UUID REFERENCES workers(id),
  assigned_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  eta_minutes INTEGER,
  confidence DOUBLE PRECISION DEFAULT 0,
  is_duplicate BOOLEAN DEFAULT FALSE,
  duplicate_of UUID REFERENCES incidents(id),
  ai_reasoning TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for real-time monitoring
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_section ON incidents(section_id);
CREATE INDEX idx_incidents_created ON incidents(created_at DESC);

-- RLS
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can see all incidents"
  ON incidents FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Staff can see assigned incidents"
  ON incidents FOR SELECT
  USING (
    assigned_worker_id IN (
      SELECT id FROM workers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can update assigned incidents"
  ON incidents FOR UPDATE
  USING (
    assigned_worker_id IN (
      SELECT id FROM workers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Fans can create incidents"
  ON incidents FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'fan')
  );

CREATE POLICY "Fans can see own incidents"
  ON incidents FOR SELECT
  USING (reported_by = auth.uid());
