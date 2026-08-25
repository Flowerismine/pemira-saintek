import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (key) {
      // Ambil 1 kunci
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', key)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // ignore no rows
      return NextResponse.json({ value: data?.setting_value || '' });
    } else {
      // Ambil semua kunci
      const { data, error } = await supabase
        .from('app_settings')
        .select('*');
        
      if (error) throw error;
      
      const allSettings = (data || []).reduce((acc: any, curr) => {
        acc[curr.setting_key] = curr.setting_value;
        return acc;
      }, {});
      
      return NextResponse.json(allSettings);
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { key, value } = await request.json();

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Parameter key dan value diperlukan' }, { status: 400 });
    }

    const { error } = await supabase
      .from('app_settings')
      .upsert({ 
        setting_key: key, 
        setting_value: value,
        updated_at: new Date().toISOString()
      }, { onConflict: 'setting_key' });

    if (error) throw error;

    return NextResponse.json({ message: 'Pengaturan berhasil disimpan' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
