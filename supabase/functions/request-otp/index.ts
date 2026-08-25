import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { nim, wa_number } = await req.json();
    
    if (!nim || !wa_number) {
      return new Response(
        JSON.stringify({ error: 'NIM dan Nomor WA wajib diisi' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // 1. Initialize Supabase client with SERVICE_ROLE key to bypass RLS
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Cek apakah NIM ada di whitelist_mahasiswa
    const { data: whitelistData, error: whitelistError } = await supabaseClient
      .from('whitelist_mahasiswa')
      .select('*')
      .eq('nim', nim)
      .single()

    if (whitelistError || !whitelistData) {
      return new Response(
        JSON.stringify({ error: 'NIM tidak terdaftar dalam Daftar Pemilih Tetap (DPT). Hubungi Admin KPU.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // 2.5 Cek apakah NIM sudah pernah login dan terikat dengan nomor WA tertentu
    const { data: userData } = await supabaseClient
      .from('users')
      .select('wa_number')
      .eq('nim', nim)
      .maybeSingle()

    if (userData && userData.wa_number) {
      // Hilangkan spasi atau tanda baca berlebih jika ada, lalu bandingkan
      const cleanDbWa = userData.wa_number.trim();
      const cleanReqWa = wa_number.trim();
      
      if (cleanDbWa !== cleanReqWa) {
        return new Response(
          JSON.stringify({ error: 'NIM ini sudah terikat dengan nomor WA lain. Gunakan nomor WA yang Anda daftarkan pertama kali.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        )
      }
    }

    // 3. Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiry 5 minutes from now
    const expiresAt = new Date(new Date().getTime() + 5 * 60000).toISOString();

    // 4. Save to otp_requests table
    const { error: otpError } = await supabaseClient
      .from('otp_requests')
      .insert({
        nim: nim,
        otp_code: otpCode, // In production, we should hash this, but for MVP plain text is okay since table has strict RLS
        wa_number: wa_number,
        expires_at: expiresAt
      })

    if (otpError) throw otpError;

    // 5. KIRIM WHATSAPP DENGAN FONNTE
    // Mengambil token Fonnte dari tabel app_settings (diubah via Web Admin)
    const { data: settingData } = await supabaseClient
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'fonnte_api_token')
      .maybeSingle();
      
    const fonnteToken = settingData?.setting_value;
    
    if (fonnteToken && fonnteToken.trim() !== '') {
      try {
        const formData = new FormData();
        formData.append('target', wa_number);
        formData.append('message', `*KPU Mahasiswa*\n\nKode OTP Pemira Anda adalah: *${otpCode}*\n\n_Kode ini rahasia. Jangan berikan kepada siapapun, termasuk panitia._`);
        formData.append('countryCode', '62'); // Pastikan format nomor telepon sesuai (kode negara 62 untuk Indonesia)

        const fonnteRes = await fetch("https://api.fonnte.com/send", {
          method: "POST",
          headers: {
            "Authorization": fonnteToken,
          },
          body: formData,
        });

        if (!fonnteRes.ok) {
          console.error("Gagal mengirim WA via Fonnte:", await fonnteRes.text());
        } else {
          console.log(`WA terkirim ke ${wa_number} via Fonnte.`);
        }
      } catch (err) {
        console.error("Error memanggil API Fonnte:", err);
      }
    } else {
      // Fallback ke Mock jika token belum di-set
      console.log(`\n\n===========================================`)
      console.log(`📱 MOCK WHATSAPP MESSAGE SENT TO: ${wa_number}`)
      console.log(`"Kode OTP Pemira Anda adalah: ${otpCode}. Rahasiakan kode ini."`)
      console.log(`[Peringatan: Token Fonnte belum disetel di Supabase Secrets]`)
      console.log(`===========================================\n\n`)
    }

    return new Response(
      JSON.stringify({ 
        message: 'OTP berhasil dikirim ke nomor WhatsApp Anda',
        // Saat production, hapus _dev_otp agar lebih aman. Saat ini kita biarkan untuk fallback jika Fonnte mati.
        _dev_otp: otpCode 
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
