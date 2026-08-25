import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data: whitelistData, error: whitelistError } = await supabase
    .from('whitelist_mahasiswa')
    .select('*')
    .order('created_at', { ascending: false });

  if (whitelistError) {
    return NextResponse.json({ error: whitelistError.message }, { status: 500 });
  }

  const { data: usersData, error: usersError } = await supabase
    .from('users')
    .select('nim, foto_ktm_url');

  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 });
  }

  const merged = whitelistData.map(w => {
    const user = usersData?.find(u => u.nim === w.nim);
    return {
      ...w,
      foto_ktm_url: user?.foto_ktm_url || null
    };
  });

  return NextResponse.json(merged);
}
