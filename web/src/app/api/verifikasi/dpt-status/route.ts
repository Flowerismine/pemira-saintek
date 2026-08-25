import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    // 1. Get all whitelist
    const { data: whitelist, error: dptError } = await supabase
      .from('whitelist_mahasiswa')
      .select('nim, nama, fakultas, jurusan, is_registered')
      .order('nim', { ascending: true });
      
    if (dptError) throw dptError;

    // 2. Get all votes with their jenjang
    const { data: votesData, error: votesError } = await supabase
      .from('votes')
      .select(`
        user_id,
        status_verifikasi,
        users!votes_user_id_fkey (nim),
        periode_pemilihan (jenjang)
      `);
      
    if (votesError) throw votesError;

    // Group votes by NIM
    const votesMap: Record<string, Record<string, string>> = {};
    for (const v of votesData as any[]) {
      if (!v.users?.nim) continue;
      const nim = v.users.nim;
      if (!votesMap[nim]) votesMap[nim] = {};
      
      const jenjang = v.periode_pemilihan?.jenjang;
      if (jenjang) {
        votesMap[nim][jenjang] = v.status_verifikasi;
      }
    }

    // Combine
    const result = whitelist.map(w => ({
      ...w,
      votes: votesMap[w.nim] || {}
    }));

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
