CREATE TABLE incident_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE NOT NULL,
  worker_id UUID REFERENCES workers(id) ON DELETE CASCADE NOT NULL,
  
  -- The status of this specific work order
  status VARCHAR(20) DEFAULT 'assigned' CHECK (status IN (
    'assigned', 'in-progress', 'completed', 'cancelled'
  )),
  
  -- Details about the work
  instructions TEXT,
  resolution_notes TEXT,
  
  -- Timestamps for tracking SLA/efficiency
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- System fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_assignments_incident ON incident_assignments(incident_id);
CREATE INDEX idx_assignments_worker ON incident_assignments(worker_id);
CREATE INDEX idx_assignments_status ON incident_assignments(status);

-- RLS Policies
ALTER TABLE incident_assignments ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access for the prototype (similar to incidents/workers)
CREATE POLICY "Allow public select on assignments" ON incident_assignments FOR SELECT USING (true);
CREATE POLICY "Allow public insert on assignments" ON incident_assignments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on assignments" ON incident_assignments FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on assignments" ON incident_assignments FOR DELETE USING (true);
