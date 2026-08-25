import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: votes, error } = await supabase
    .from('votes')
    .select(`
      id, 
      status_verifikasi, 
      created_at,
      user_id,
      users!votes_user_id_fkey ( nama, nim ),
      periode_id,
      periode_pemilihan ( jenjang, fakultas_id )
    `);
    
  if (error) console.error("ERROR:", error);
  console.log(JSON.stringify(votes, null, 2));
}

check();
