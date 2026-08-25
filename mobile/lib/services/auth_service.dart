import 'package:supabase_flutter/supabase_flutter.dart';

class AuthService {
  final SupabaseClient _supabase = Supabase.instance.client;

  // 1. Meminta OTP (Memanggil Edge Function request-otp)
  Future<void> requestOtp({required String nim, required String waNumber}) async {
    try {
      final response = await _supabase.functions.invoke('request-otp', body: {
        'nim': nim,
        'wa_number': waNumber,
      });

      if (response.status != 200) {
        // Karena response dari Edge Function kadang dibungkus error, kita parsing.
        final errorMsg = response.data['error'] ?? 'Terjadi kesalahan saat memanggil server.';
        throw Exception(errorMsg);
      }
    } catch (e) {
      if (e is FunctionException) {
        String errorMsg = 'Gagal meminta OTP';
        if (e.details is Map && (e.details as Map).containsKey('error')) {
          errorMsg = (e.details as Map)['error'].toString();
        } else if (e.details != null) {
          errorMsg = 'Kesalahan jaringan: Periksa koneksi internet Anda.';
        }
        throw Exception(errorMsg);
      }
      throw Exception(e.toString());
    }
  }

  // 2. Memverifikasi OTP dan Otomatis Login (Memanggil Edge Function verify-otp)
  Future<void> verifyOtpAndLogin({required String nim, required String otpCode}) async {
    try {
      final response = await _supabase.functions.invoke('verify-otp', body: {
        'nim': nim,
        'otp_code': otpCode,
      });

      if (response.status != 200) {
        final errorMsg = response.data['error'] ?? 'Kode OTP Salah.';
        throw Exception(errorMsg);
      }

      // Ambil kredensial dummy hasil verifikasi
      final credentials = response.data['login_credentials'];
      if (credentials != null) {
        final email = credentials['email'];
        final password = credentials['password'];

        // Lakukan login secara silent ke Supabase Auth
        final authResponse = await _supabase.auth.signInWithPassword(
          email: email,
          password: password,
        );
        
        if (authResponse.session == null) {
          throw Exception('Sesi login gagal dibuat.');
        }
      } else {
         throw Exception('Tidak mendapatkan kredensial login dari server.');
      }
    } catch (e) {
      if (e is FunctionException) {
        String errorMsg = 'Gagal memverifikasi OTP';
        if (e.details is Map && (e.details as Map).containsKey('error')) {
          errorMsg = (e.details as Map)['error'].toString();
        } else if (e.details != null) {
          errorMsg = 'Kesalahan jaringan: Periksa koneksi internet Anda.';
        }
        throw Exception(errorMsg);
      }
      throw Exception(e.toString());
    }
  }

  // 3. Mengecek Status KTM
  Future<bool> hasUploadedKTM() async {
    final user = _supabase.auth.currentUser;
    if (user == null) return false;

    final response = await _supabase
        .from('users')
        .select('foto_ktm_url')
        .eq('id', user.id)
        .single();
    
    return response['foto_ktm_url'] != null;
  }

  // 4. Upload KTM
  Future<void> uploadKTM(dynamic imageFile, String extension) async {
    final user = _supabase.auth.currentUser;
    if (user == null) throw Exception('Sesi tidak valid.');

    try {
      final fileName = '${user.id}_${DateTime.now().millisecondsSinceEpoch}.$extension';
      // Path di storage akan otomatis dimasukkan ke folder user.id berkat RLS
      final filePath = '${user.id}/$fileName';

      // Gunakan Supabase Storage upload
      await _supabase.storage.from('foto-ktm').upload(filePath, imageFile);

      // Ambil public URL
      final publicUrl = _supabase.storage.from('foto-ktm').getPublicUrl(filePath);

      // Update tabel users (otomatis setujui tanpa perlu admin)
      await _supabase
          .from('users')
          .update({
             'foto_ktm_url': publicUrl,
             'status_registrasi': 'disetujui'
          })
          .eq('id', user.id);

    } catch (e) {
      throw Exception('Gagal mengunggah KTM: ${e.toString()}');
    }
  }
}
