import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST() {
  try {
    // 1. Delete all votes
    const { error: err1 } = await supabase
      .from('votes')
      .delete()
      .neq('id', 'dummy'); // Deletes all rows

    if (err1) throw err1;

    // 2. Reset registration status in whitelist
    const { error: err2 } = await supabase
      .from('whitelist_mahasiswa')
      .update({ is_registered: false })
      .neq('nim', 'dummy');

    if (err2) throw err2;

    return NextResponse.json({ message: 'Semua data pemilihan berhasil direset.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
