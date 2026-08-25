import 'dart:io';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/periode_model.dart';
import '../models/user_model.dart';
import '../models/kandidat_model.dart';

class ElectionService {
  final SupabaseClient _supabase = Supabase.instance.client;

  // 1. Ambil Profil Mahasiswa
  Future<UserModel> getCurrentUser() async {
    final userAuth = _supabase.auth.currentUser;
    if (userAuth == null) throw Exception('Belum login');

    final response = await _supabase
        .from('users')
        .select('*')
        .eq('id', userAuth.id)
        .single();
    
    return UserModel.fromJson(response);
  }

  // 2. Ambil Periode Aktif yang Sesuai dengan Jurusan Mahasiswa
  Future<List<PeriodeModel>> getTargetedActivePeriods(UserModel user) async {
    // Ambil semua periode aktif
    final List<dynamic> response = await _supabase
        .from('periode_pemilihan')
        .select('*')
        .eq('status', 'aktif');

    List<PeriodeModel> allActivePeriods = response.map((data) => PeriodeModel.fromJson(data)).toList();
    List<PeriodeModel> targetedPeriods = [];

    // Filter Pintar Berdasarkan Jurusan
    for (var periode in allActivePeriods) {
      bool isEligible = false;

      if (periode.jenjang == 'DEMA-F' || periode.jenjang == 'SEMA-F') {
        // Asumsi DEMA-F & SEMA-F berlaku untuk seluruh Fakultas (atau cek fakultas_id jika ada spesifik)
        if (periode.fakultasId == null || periode.fakultasId == '' || periode.fakultasId == user.fakultas) {
          isEligible = true;
        }
      } else if (periode.jenjang == 'HMJ') {
        // HANYA jika sasaran (disimpan di fakultas_id di DB) sama persis dengan jurusan user
        if (periode.fakultasId == user.jurusan) {
          isEligible = true;
        }
      }

      if (isEligible) {
        // Cek apakah user sudah mencoblos di periode ini
        final voteCheck = await _supabase
            .from('votes')
            .select('id')
            .eq('user_id', user.id)
            .eq('periode_id', periode.id)
            .maybeSingle();

        targetedPeriods.add(periode.copyWith(hasVoted: voteCheck != null));
      }
    }

    return targetedPeriods;
  }

  // 3. Ambil Kandidat Berdasarkan Periode
  Future<List<KandidatModel>> getKandidatByPeriode(String periodeId) async {
    final response = await _supabase
        .from('kandidat')
        .select('*')
        .eq('periode_id', periodeId)
        .order('nomor_urut', ascending: true);

    return (response as List<dynamic>)
        .map((data) => KandidatModel.fromJson(data))
        .toList();
  }

  // 4. Submit Suara (Selfie + Enkripsi)
  Future<Map<String, dynamic>> submitVote(String periodeId, String kandidatId, dynamic imageFile, String extension) async {
    final user = _supabase.auth.currentUser;
    if (user == null) throw Exception('Sesi tidak valid.');

    try {
      // 4A. Dapatkan Device ID Palsu / Nyata
      String deviceId = 'unknown_device';
      try {
        final DeviceInfoPlugin deviceInfo = DeviceInfoPlugin();
        if (Platform.isAndroid) {
          AndroidDeviceInfo androidInfo = await deviceInfo.androidInfo;
          deviceId = androidInfo.id;
        } else if (Platform.isIOS) {
          IosDeviceInfo iosInfo = await deviceInfo.iosInfo;
          deviceId = iosInfo.identifierForVendor ?? 'ios_unknown';
        }
      } catch (e) {
        // Abaikan jika gagal ambil device id
      }

      // 4B. Upload Selfie Bukti
      final fileName = '${user.id}_${DateTime.now().millisecondsSinceEpoch}.$extension';
      final filePath = '${user.id}/$fileName';
      
      await _supabase.storage.from('foto-vote').upload(filePath, imageFile);
      final publicUrl = _supabase.storage.from('foto-vote').getPublicUrl(filePath);

      // 4C. Panggil RPC Kriptografi (submit_vote_secure)
      final response = await _supabase.rpc('submit_vote_secure', params: {
        'p_periode_id': periodeId,
        'p_kandidat_id': kandidatId,
        'p_foto_url': publicUrl,
        'p_device_id': deviceId,
      });

      return response as Map<String, dynamic>;
    } catch (e) {
      if (e is PostgrestException) {
        throw Exception(e.message);
      }
      throw Exception('Gagal mengirim suara: ${e.toString()}');
    }
  }

  // 5. Ambil Resi Saya
  Future<List<Map<String, dynamic>>> getMyReceipts() async {
    final user = _supabase.auth.currentUser;
    if (user == null) throw Exception('Sesi tidak valid.');

    final response = await _supabase
        .from('votes')
        .select('id, nomor_bukti, hash_record, created_at, status_verifikasi, periode_pemilihan(jenjang)')
        .eq('user_id', user.id)
        .order('created_at', ascending: false);
    
    return List<Map<String, dynamic>>.from(response);
  }

  // 6. Ambil Live Quick Count (Hasil Sementara)
  Future<List<Map<String, dynamic>>> getLiveStats() async {
    final response = await _supabase.rpc('get_live_quick_count');
    return List<Map<String, dynamic>>.from(response ?? []);
  }

  // 7. Ambil Audit Log (Cek Seluruh Resi)
  Future<List<Map<String, dynamic>>> getAuditLogs() async {
    final response = await _supabase.rpc('get_audit_logs');
    return List<Map<String, dynamic>>.from(response ?? []);
  }
}
