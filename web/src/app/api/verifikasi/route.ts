import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const periode = searchParams.get('periode');
  const status = searchParams.get('status') || 'menunggu_verifikasi';

  let query = supabase
    .from('votes')
    .select(`
      id, user_id, foto_vote_url, nomor_bukti, created_at, status_verifikasi, catatan_admin,
      users!votes_user_id_fkey (nim, nama, foto_ktm_url, fakultas),
      periode_pemilihan!inner (id, jenjang)
    `)
    .eq('status_verifikasi', status);

  if (periode && periode !== 'all') {
    query = query.eq('periode_pemilihan.id', periode);
  }

  const { data, error } = await query.order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { action, id, reason } = body;

  if (action === 'approve') {
    const { error } = await supabase
      .from('votes')
      .update({ 
        status_verifikasi: 'terverifikasi',
        direview_at: new Date().toISOString()
      })
      .eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === 'reject') {
    const { error } = await supabase
      .from('votes')
      .update({ 
        status_verifikasi: 'gagal_verifikasi',
        catatan_admin: reason,
        direview_at: new Date().toISOString()
      })
      .eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === 'revert') {
    const { error } = await supabase
      .from('votes')
      .update({ 
        status_verifikasi: 'menunggu_verifikasi',
        catatan_admin: null,
        direview_at: null
      })
      .eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
