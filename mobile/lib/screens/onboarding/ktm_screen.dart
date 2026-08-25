import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/theme.dart';
import '../../services/auth_service.dart';
import '../auth/login_screen.dart'; // import provider authServiceProvider
import '../dashboard/dashboard_screen.dart';

class KtmScreen extends ConsumerStatefulWidget {
  const KtmScreen({super.key});

  @override
  ConsumerState<KtmScreen> createState() => _KtmScreenState();
}

class _KtmScreenState extends ConsumerState<KtmScreen> {
  File? _imageFile;
  bool _isLoading = false;
  String? _errorMessage;
  final ImagePicker _picker = ImagePicker();

  Future<void> _captureKTM() async {
    try {
      // Wajib ambil dari Kamera, BUKAN Galeri
      final XFile? photo = await _picker.pickImage(
        source: ImageSource.camera,
        imageQuality: 70, // Kompresi agar tidak berat
        preferredCameraDevice: CameraDevice.rear,
      );

      if (photo != null) {
        setState(() {
          _imageFile = File(photo.path);
          _errorMessage = null;
        });
      }
    } catch (e) {
      setState(() => _errorMessage = "Gagal mengakses kamera. Pastikan izin kamera telah diberikan.");
    }
  }

  Future<void> _uploadKTM() async {
    if (_imageFile == null) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final extension = _imageFile!.path.split('.').last;
      final authService = ref.read(authServiceProvider);
      
      await authService.uploadKTM(_imageFile!, extension);
      
      if (mounted) {
        // Jika sukses, lempar ke Dashboard
        Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const DashboardScreen()));
      }
    } catch (e) {
      setState(() => _errorMessage = e.toString().replaceAll('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 24),
              // Header
              Text(
                'Lengkapi Profil Anda',
                style: AppTheme.textTheme.displayMedium,
              ),
              const SizedBox(height: 12),
              Text(
                'Untuk menjaga kejujuran pemilu, Anda wajib mengunggah foto Kartu Tanda Mahasiswa (KTM). Foto ini akan digunakan untuk pencocokan wajah di bilik suara nanti.',
                style: AppTheme.textTheme.bodyMedium,
              ),
              const SizedBox(height: 48),

              // Image Preview Area
              Expanded(
                child: Center(
                  child: _imageFile == null
                      ? Container(
                          width: double.infinity,
                          decoration: BoxDecoration(
                            color: AppTheme.slate50,
                            borderRadius: BorderRadius.circular(24),
                            border: Border.all(color: AppTheme.slate200, width: 2, style: BorderStyle.solid),
                          ),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Container(
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: AppTheme.primary50,
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(Icons.camera_alt, size: 48, color: AppTheme.primary500),
                              ),
                              const SizedBox(height: 24),
                              Text('Belum ada foto KTM', style: AppTheme.textTheme.titleLarge?.copyWith(fontSize: 18, color: AppTheme.slate400)),
                            ],
                          ),
                        )
                      : Container(
                          width: double.infinity,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(24),
                            border: Border.all(color: AppTheme.primary500, width: 3),
                            image: DecorationImage(
                              image: FileImage(_imageFile!),
                              fit: BoxFit.cover,
                            ),
                          ),
                        ),
                ),
              ),

              const SizedBox(height: 32),

              // Error message
              if (_errorMessage != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 24.0),
                  child: Text(
                    _errorMessage!,
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.redAccent, fontWeight: FontWeight.w500, fontSize: 14),
                  ),
                ),

              // Action Buttons
              if (_imageFile == null)
                ElevatedButton.icon(
                  onPressed: _captureKTM,
                  icon: const Icon(Icons.camera_alt),
                  label: const Text('Buka Kamera Sekarang'),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 20),
                  ),
                )
              else
                Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    ElevatedButton(
                      onPressed: _isLoading ? null : _uploadKTM,
                      style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 20)),
                      child: _isLoading
                          ? const SizedBox(
                              height: 24,
                              width: 24,
                              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                            )
                          : const Text('Simpan Foto KTM'),
                    ),
                    const SizedBox(height: 12),
                    TextButton(
                      onPressed: _isLoading ? null : _captureKTM,
                      child: Text('Foto Ulang', style: TextStyle(color: AppTheme.slate500, fontWeight: FontWeight.w600)),
                    ),
                  ],
                ),
            ],
          ),
        ),
      ),
    );
  }
}
