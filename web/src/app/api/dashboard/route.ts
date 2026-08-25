import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    // 1. Stats Utama
    const { count: totalDpt } = await supabase
      .from('whitelist_mahasiswa')
      .select('*', { count: 'exact', head: true });

    const { count: totalSuara } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true });

    const { count: antrianVerifikasi } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('status_verifikasi', 'menunggu_verifikasi');

    // 2. Aktivitas Terbaru (5 vote terakhir yang masuk)
    const { data: recentActivity } = await supabase
      .from('votes')
      .select(`
        id, 
        created_at, 
        status_verifikasi,
        users!votes_user_id_fkey(nim, nama)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    // 3. Data Grafik (Suara per Periode)
    const { data: periods } = await supabase.from('periode_pemilihan').select('id, jenjang, jurusan_id');
    const { data: votes } = await supabase.from('votes').select('periode_id');
    const { data: whitelist } = await supabase.from('whitelist_mahasiswa').select('jurusan');

    const totalDptSemua = whitelist?.length || 0;
    const dptPerJurusan = (whitelist || []).reduce((acc: any, curr) => {
      const jur = curr.jurusan;
      if (jur) acc[jur] = (acc[jur] || 0) + 1;
      return acc;
    }, {});

    const votesPerPeriode = (votes || []).reduce((acc: any, curr) => {
      const pid = curr.periode_id;
      acc[pid] = (acc[pid] || 0) + 1;
      return acc;
    }, {});

    const chartData = (periods || []).map(p => {
      let periodDpt = totalDptSemua;
      let labelName = p.jenjang;
      
      if (p.jenjang === 'HMJ' && p.jurusan_id) {
        periodDpt = dptPerJurusan[p.jurusan_id] || 0;
        labelName = `HMJ ${p.jurusan_id}`;
      }

      return {
        name: labelName,
        'Suara Masuk': votesPerPeriode[p.id] || 0,
        'Total DPT': periodDpt
      };
    });

    return NextResponse.json({
      stats: {
        totalDpt: totalDpt || 0,
        totalSuara: totalSuara || 0,
        antrianVerifikasi: antrianVerifikasi || 0,
        serverStatus: 'Optimal'
      },
      activity: recentActivity || [],
      chartData: chartData.length > 0 ? chartData : [{ name: 'Belum Ada', partisipasi: 0 }]
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
