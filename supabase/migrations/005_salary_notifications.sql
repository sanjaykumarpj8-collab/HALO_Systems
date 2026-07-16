-- ============================================================
-- HALO Stadium Operations — Database Schema
-- Migration 005: Salary & Notifications
-- ============================================================

-- ─── Salary ────────────────────────────────────────────────
CREATE TABLE salary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
  worker_name VARCHAR(255),
  grade VARCHAR(5) CHECK (grade IN ('A', 'B', 'C', 'D')),
  type VARCHAR(20) CHECK (type IN ('janitor', 'medic', 'security')),
  section INTEGER,
  base_pay DECIMAL(10, 2) DEFAULT 0,
  bonus DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) GENERATED ALWAYS AS (base_pay + bonus) STORED,
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('paid', 'pending', 'overdue')),
  pay_period VARCHAR(20),    -- e.g. "2026-07"
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE salary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage salary"
  ON salary FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ─── Notifications ─────────────────────────────────────────
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  body TEXT,
  type VARCHAR(20) DEFAULT 'system' CHECK (type IN ('incident', 'dispatch', 'system', 'alert')),
  metadata JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, read, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can mark own notifications read"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- ─── Analytics Events ──────────────────────────────────────
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,
  section_id INTEGER REFERENCES sections(id),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analytics_type ON analytics_events(event_type, created_at DESC);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can access analytics"
  ON analytics_events FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );
