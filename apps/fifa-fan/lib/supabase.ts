import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://avkorqyoxyrxjvfncuji.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2a29ycXlveHlyeGp2Zm5jdWppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMDE0NjYsImV4cCI6MjA5OTY3NzQ2Nn0.6WsEMdOaUChQ9ZWWLXSNgXlgwpYT-eBXPnkyLU24D2U';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function submitIncident(payload: {
  reporter_name: string;
  raw_text: string;
  detected_language: string;
  section_id?: number;
}) {
  const { data, error } = await supabase.functions.invoke('process-report', {
    body: payload,
  });

  if (error) throw error;
  return data;
}

export async function getSections() {
  const { data } = await supabase.from('sections').select('id, name, current_occupancy, capacity, noise_level, is_accessible').order('id');
  return data ?? [];
}
