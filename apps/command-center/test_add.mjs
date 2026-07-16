import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://avkorqyoxyrxjvfncuji.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2a29ycXlveHlyeGp2Zm5jdWppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMDE0NjYsImV4cCI6MjA5OTY3NzQ2Nn0.6WsEMdOaUChQ9ZWWLXSNgXlgwpYT-eBXPnkyLU24D2U';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
  const workerData = {
    name: "Test Name",
    type: "security",
    section: 1,
    status: "off-duty"
  };
  const worker_id = Math.floor(10000 + Math.random() * 90000).toString();
  
  console.log("Inserting worker...");
  const { data, error } = await supabase
    .from('workers')
    .insert([{ 
      worker_id, 
      name: workerData.name, 
      type: workerData.type, 
      section: workerData.section, 
      status: workerData.status,
      efficiency: 100
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
