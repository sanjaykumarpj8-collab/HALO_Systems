import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://avkorqyoxyrxjvfncuji.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2a29ycXlveHlyeGp2Zm5jdWppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMDE0NjYsImV4cCI6MjA5OTY3NzQ2Nn0.6WsEMdOaUChQ9ZWWLXSNgXlgwpYT-eBXPnkyLU24D2U';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
  console.log("Fetching an incident and a worker...");
  const { data: incidents } = await supabase.from('incidents').select('id').limit(1);
  const { data: workers } = await supabase.from('workers').select('id').limit(1);
  
  if (!incidents?.length || !workers?.length) {
    console.log("Need at least 1 incident and 1 worker in the DB to test.");
    return;
  }
  
  const incident_id = incidents[0].id;
  const worker_id = workers[0].id;
  
  console.log(`Assigning worker ${worker_id} to incident ${incident_id}...`);
  const { data, error } = await supabase
    .from('incident_assignments')
    .insert([{ 
      incident_id, 
      worker_id, 
      status: 'assigned',
      instructions: 'Please check the spill on aisle 4.'
    }])
    .select();
    
  if (error) {
    console.error("ERROR:");
    console.error(JSON.stringify(error, null, 2));
  } else {
    console.log("SUCCESS:", data);
  }
}
test();
