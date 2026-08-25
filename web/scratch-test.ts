import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function test() {
  const { data, error } = await supabase
    .from('votes')
    .select(`
      id, user_id, foto_vote_url, nomor_bukti, hash_record, created_at, status_verifikasi, catatan_admin,
      users!votes_user_id_fkey (nim, nama, foto_ktm_url, fakultas),
      periode_pemilihan!inner (id, jenjang),
      kandidat (nomor_urut, nama_kandidat, foto_url)
    `);

  console.log('Error:', error);
  console.log('Data count:', data?.length);
}

test();
