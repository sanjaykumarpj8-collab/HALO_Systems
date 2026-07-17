import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://avkorqyoxyrxjvfncuji.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2a29ycXlveHlyeGp2Zm5jdWppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMDE0NjYsImV4cCI6MjA5OTY3NzQ2Nn0.6WsEMdOaUChQ9ZWWLXSNgXlgwpYT-eBXPnkyLU24D2U';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function getMyIncidents(workerDbId: string) {
  const { data } = await supabase
    .from('incidents')
    .select('*')
    .eq('assigned_worker_id', workerDbId)
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function getOpenIncidents() {
  const { data } = await supabase
    .from('incidents')
    .select('*')
    .in('status', ['new', 'processing', 'assigned', 'in-progress', 'resolved'])
    .order('severity', { ascending: true })
    .order('created_at', { ascending: true });
  return data ?? [];
}

export function subscribeToIncidents(callback: (payload: any) => void) {
  return supabase
    .channel(`incidents-changes-${Math.random()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, callback)
    .subscribe();
}

export async function updateIncidentStatus(id: string, status: string) {
  return supabase.from('incidents').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
}

export async function getWorkerByWorkerId(workerId: string) {
  const { data } = await supabase.from('workers').select('*').eq('worker_id', workerId).single();
  return data;
}
