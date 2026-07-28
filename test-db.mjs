import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wjdphuvbhgnczbjabddw.supabase.co'
const supabaseAnonKey = 'sb_publishable_8Fb0w4joNURJPvFFjKVPuA_DpPaBWDE'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  console.log("Testing connection...");
  const { data, error } = await supabase.from('projects').select('*');
  if (error) {
    console.error("ERROR:", error.message);
  } else {
    console.log("SUCCESS. Data found:", data.length, "rows");
  }
}

testConnection();
