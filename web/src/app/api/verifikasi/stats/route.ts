import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const periode = searchParams.get('periode');

  try {
    let dptQuery = supabase.from('whitelist_mahasiswa').select('*', { count: 'exact', head: true });
    let registeredQuery = supabase.from('whitelist_mahasiswa').select('*', { count: 'exact', head: true }).eq('is_registered', true);

    // Filter DPT if Periode is HMJ
    if (periode && periode !== 'all') {
      const { data: pData } = await supabase.from('periode_pemilihan').select('jenjang, fakultas_id').eq('id', periode).single();
      if (pData && pData.jenjang === 'HMJ' && pData.fakultas_id) {
        dptQuery = dptQuery.eq('jurusan', pData.fakultas_id);
        registeredQuery = registeredQuery.eq('jurusan', pData.fakultas_id);
      }
    }

    const { count: totalDpt, error: dptError } = await dptQuery;
    const { count: totalRegistered, error: regError } = await registeredQuery;

    if (dptError) throw dptError;
    if (regError) throw regError;

    // 2. Dapatkan statistik dari tabel votes untuk periode terkait
    let votesQuery = supabase.from('votes').select('status_verifikasi');
    if (periode && periode !== 'all') {
      votesQuery = votesQuery.eq('periode_id', periode);
    }
    
    const { data: votesData, error: votesError } = await votesQuery;
    if (votesError) throw votesError;

    const totalVotes = votesData ? votesData.length : 0;
    
    let menunggu = 0;
    let sah = 0;
    let ditolak = 0;

    if (votesData) {
      for (const v of votesData) {
        if (v.status_verifikasi === 'menunggu_verifikasi') menunggu++;
        else if (v.status_verifikasi === 'terverifikasi') sah++;
        else if (v.status_verifikasi === 'gagal_verifikasi') ditolak++;
      }
    }

    return NextResponse.json({
      total_dpt: totalDpt || 0,
      total_registered: totalRegistered || 0,
      sudah_coblos: totalVotes,
      belum_coblos: (totalDpt || 0) - totalVotes,
      menunggu_verifikasi: menunggu,
      sah: sah,
      ditolak: ditolak
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
