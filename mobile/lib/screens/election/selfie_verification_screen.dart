import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/theme.dart';
import '../../core/theme.dart';
import '../../models/kandidat_model.dart';
import '../../services/election_service.dart';
import '../dashboard/dashboard_screen.dart'; // untuk electionServiceProvider
import 'receipt_screen.dart';

class SelfieVerificationScreen extends ConsumerStatefulWidget {
  final KandidatModel kandidat;

  const SelfieVerificationScreen({super.key, required this.kandidat});

  @override
  ConsumerState<SelfieVerificationScreen> createState() => _SelfieVerificationScreenState();
}

class _SelfieVerificationScreenState extends ConsumerState<SelfieVerificationScreen> {
  File? _imageFile;
  bool _isLoading = false;
  String? _errorMessage;
  final ImagePicker _picker = ImagePicker();

  Future<void> _captureSelfie() async {
    try {
      final XFile? photo = await _picker.pickImage(
        source: ImageSource.camera,
        preferredCameraDevice: CameraDevice.front, // Memaksa kamera depan
        imageQuality: 70,
      );

      if (photo != null) {
        setState(() {
          _imageFile = File(photo.path);
          _errorMessage = null;
        });
      }
    } catch (e) {
      setState(() => _errorMessage = "Gagal mengakses kamera depan.");
    }
  }

  Future<void> _submitVote() async {
    if (_imageFile == null) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final extension = _imageFile!.path.split('.').last;
      final authService = ref.read(electionServiceProvider);
      
      final response = await authService.submitVote(
        widget.kandidat.periodeId,
        widget.kandidat.id,
        _imageFile!,
        extension,
      );
      
      if (mounted) {
        // Jika sukses, lempar ke Layar Resi
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => ReceiptScreen(
              nomorBukti: response['nomor_bukti'],
              hash: response['hash'],
            ),
          ),
        );
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
      appBar: AppBar(
        title: const Text('Verifikasi Wajah'),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Info Pilihan
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.primary50,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.primary100),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.info_outline, color: AppTheme.primary600),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Anda akan memberikan suara untuk Paslon 0${widget.kandidat.nomorUrut} (${widget.kandidat.nama}).',
                        style: AppTheme.textTheme.bodyMedium?.copyWith(color: AppTheme.primary900),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

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
                                child: const Icon(Icons.face, size: 48, color: AppTheme.primary500),
                              ),
                              const SizedBox(height: 24),
                              Text('Ambil Foto Selfie', style: AppTheme.textTheme.titleLarge?.copyWith(fontSize: 18, color: AppTheme.slate600)),
                              const SizedBox(height: 8),
                              Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 32),
                                child: Text(
                                  'Sebagai bukti kehadiran, silakan ambil foto wajah Anda secara langsung.',
                                  textAlign: TextAlign.center,
                                  style: AppTheme.textTheme.bodyMedium,
                                ),
                              )
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
                  onPressed: _captureSelfie,
                  icon: const Icon(Icons.camera_alt),
                  label: const Text('Buka Kamera Depan'),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 20),
                  ),
                )
              else
                Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    ElevatedButton(
                      onPressed: _isLoading ? null : _submitVote,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green.shade600,
                        padding: const EdgeInsets.symmetric(vertical: 20),
                      ),
                      child: _isLoading
                          ? const SizedBox(
                              height: 24,
                              width: 24,
                              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                            )
                          : const Text('Kunci Suara Saya!'),
                    ),
                    const SizedBox(height: 12),
                    TextButton(
                      onPressed: _isLoading ? null : _captureSelfie,
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
