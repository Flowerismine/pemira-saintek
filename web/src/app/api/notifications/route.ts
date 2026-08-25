import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Hitung jumlah pendaftar KYC yang belum diverifikasi
    const { count: pendingKYC, error: errorKYC } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('status_registrasi', 'pending');

    if (errorKYC) throw errorKYC;

    // Hitung jumlah suara yang belum diverifikasi admin
    const { count: pendingVotes, error: errorVotes } = await supabaseAdmin
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('status_verifikasi', 'menunggu_verifikasi');

    if (errorVotes) throw errorVotes;

    return NextResponse.json({
      pendingKYC: pendingKYC || 0,
      pendingVotes: pendingVotes || 0,
    });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
