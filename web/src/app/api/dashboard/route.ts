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

    // 3. Data Grafik (Suara per Jurusan)
    // Supabase tidak punya GROUP BY sederhana di client, jadi kita ambil data mentah atau gunakan RPC.
    // Karena ini MVP, kita ambil semua whitelist_mahasiswa yg sudah login dan hitung di server
    const { data: registeredUsers } = await supabase
      .from('whitelist_mahasiswa')
      .select('jurusan')
      .eq('is_registered', true);

    const jurusanCounts = (registeredUsers || []).reduce((acc: any, curr) => {
      const jur = curr.jurusan || 'Lainnya';
      acc[jur] = (acc[jur] || 0) + 1;
      return acc;
    }, {});

    const chartData = Object.keys(jurusanCounts).map(key => ({
      name: key,
      partisipasi: jurusanCounts[key]
    })).sort((a, b) => b.partisipasi - a.partisipasi);

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
