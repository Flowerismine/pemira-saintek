import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { nim, otp_code } = await req.json();
    
    if (!nim || !otp_code) {
      return new Response(
        JSON.stringify({ error: 'NIM dan Kode OTP wajib diisi' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Cek OTP di database
    const { data: otpData, error: otpError } = await supabaseClient
      .from('otp_requests')
      .select('*')
      .eq('nim', nim)
      .eq('otp_code', otp_code)
      .eq('is_used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (otpError || !otpData) {
      return new Response(
        JSON.stringify({ error: 'Kode OTP salah atau tidak ditemukan.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Cek apakah kedaluwarsa
    if (new Date() > new Date(otpData.expires_at)) {
      return new Response(
        JSON.stringify({ error: 'Kode OTP sudah kedaluwarsa (lebih dari 5 menit). Silakan minta ulang.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // 2. Tandai OTP sudah terpakai
    await supabaseClient
      .from('otp_requests')
      .update({ is_used: true })
      .eq('id', otpData.id)

    // 3. Ambil data asli dari whitelist
    const { data: whitelistData } = await supabaseClient
      .from('whitelist_mahasiswa')
      .select('*')
      .eq('nim', nim)
      .single()

    if (!whitelistData) {
      return new Response(JSON.stringify({ error: 'Data DPT hilang.' }), { status: 500 })
    }

    // 4. BUAT AKUN DI SUPABASE AUTH MENGGUNAKAN EMAIL DUMMY (nim@evoting.local)
    const dummyEmail = `${nim}@evoting.local`;
    // Gunakan wa_number sebagai password sementara (karena Supabase Auth wajib password)
    // Di aplikasi, mahasiswa tidak perlu ngetik password ini, kita bisa login-kan otomatis nanti
    const generatedPassword = `Pswd_${otpData.wa_number}_!`;

    let userId = null;

    // Cek apakah akun auth sudah ada sebelumnya
    const { data: existingUsers, error: searchError } = await supabaseClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === dummyEmail);

    if (existingUser) {
       userId = existingUser.id;
    } else {
       // Buat akun baru
       const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
          email: dummyEmail,
          password: generatedPassword,
          email_confirm: true // Langsung confirm agar bisa langsung dipakai
       });

       if (createError) throw createError;
       userId = newUser.user.id;
    }

    // 5. Masukkan data ke tabel public.users
    const { error: insertUserError } = await supabaseClient
      .from('users')
      .upsert({
        id: userId,
        nim: nim,
        nama: whitelistData.nama,
        wa_number: otpData.wa_number,
        role: 'mahasiswa',
        fakultas: whitelistData.fakultas,
        jurusan: whitelistData.jurusan,
        kelas: whitelistData.kelas,
        status_registrasi: 'disetujui' // Auto-approve berkat whitelist + OTP
      }, { onConflict: 'nim' })

    if (insertUserError) throw insertUserError;

    // 6. Update whitelist is_registered
    await supabaseClient
      .from('whitelist_mahasiswa')
      .update({ is_registered: true })
      .eq('nim', nim);

    // KEMBALIKAN KREDENSIAL LOGIN KE APLIKASI HP
    // Agar aplikasi HP bisa langsung memanggil supabase.auth.signInWithPassword() di balik layar
    return new Response(
      JSON.stringify({ 
        message: 'Verifikasi berhasil!',
        login_credentials: {
          email: dummyEmail,
          password: generatedPassword
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
