import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:pinput/pinput.dart';
import '../../core/theme.dart';
import '../../services/auth_service.dart';
import '../dashboard/dashboard_screen.dart';
import '../onboarding/ktm_screen.dart';
import 'login_screen.dart'; // import provider

class OtpScreen extends ConsumerStatefulWidget {
  final String nim;
  const OtpScreen({super.key, required this.nim});

  @override
  ConsumerState<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends ConsumerState<OtpScreen> {
  final _pinController = TextEditingController();
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _pinController.dispose();
    super.dispose();
  }

  Future<void> _verifyOtp(String pin) async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final authService = ref.read(authServiceProvider);
      await authService.verifyOtpAndLogin(nim: widget.nim, otpCode: pin);
      
      if (mounted) {
        // Cek apakah user sudah punya KTM
        final hasKtm = await authService.hasUploadedKTM();
        
        if (mounted) {
          if (hasKtm) {
            Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const DashboardScreen()));
          } else {
            Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const KtmScreen()));
          }
        }
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Kode OTP salah atau sudah kedaluwarsa. Silakan periksa kembali.';
        _pinController.clear(); // Hapus PIN jika salah
      });
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    // Styling untuk kotak Pinput
    final defaultPinTheme = PinTheme(
      width: 56,
      height: 64,
      textStyle: AppTheme.textTheme.titleLarge?.copyWith(color: AppTheme.primary700, fontSize: 24),
      decoration: BoxDecoration(
        color: AppTheme.slate50,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.slate200, width: 2),
      ),
    );

    final focusedPinTheme = defaultPinTheme.copyDecorationWith(
      border: Border.all(color: AppTheme.primary500, width: 2),
    );

    final errorPinTheme = defaultPinTheme.copyDecorationWith(
      border: Border.all(color: Colors.redAccent, width: 2),
      color: Colors.red.shade50,
    );

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 24),
              Text(
                'Masukkan Kode OTP',
                style: AppTheme.textTheme.displayMedium,
              ),
              const SizedBox(height: 12),
              RichText(
                text: TextSpan(
                  style: AppTheme.textTheme.bodyMedium,
                  children: [
                    const TextSpan(text: 'Kami telah mengirimkan 6 digit kode akses ke WhatsApp untuk NIM '),
                    TextSpan(
                      text: widget.nim,
                      style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.slate900),
                    ),
                    const TextSpan(text: '.'),
                  ],
                ),
              ),
              const SizedBox(height: 48),

              // Pinput Widget
              Center(
                child: Pinput(
                  controller: _pinController,
                  length: 6,
                  defaultPinTheme: defaultPinTheme,
                  focusedPinTheme: focusedPinTheme,
                  errorPinTheme: errorPinTheme,
                  forceErrorState: _errorMessage != null,
                  onCompleted: (pin) {
                    _verifyOtp(pin);
                  },
                ),
              ),
              
              if (_errorMessage != null)
                Container(
                  padding: const EdgeInsets.all(12),
                  margin: const EdgeInsets.only(top: 24),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.red.shade100),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline, color: Colors.redAccent, size: 20),
                      const SizedBox(width: 8),
                      Flexible(
                        child: Text(
                          _errorMessage!,
                          textAlign: TextAlign.center,
                          style: const TextStyle(color: Colors.redAccent, fontSize: 13, fontWeight: FontWeight.w500),
                        ),
                      ),
                    ],
                  ),
                ),

              const SizedBox(height: 48),

              if (_isLoading)
                const Center(
                  child: CircularProgressIndicator(color: AppTheme.primary500),
                )
              else
                Center(
                  child: TextButton(
                    onPressed: () {
                      // Bisa ditambahkan logika kirim ulang
                      Navigator.pop(context); 
                    },
                    child: Text('Tidak menerima pesan? Kirim Ulang', style: GoogleFonts.inter(color: AppTheme.primary600, fontWeight: FontWeight.w600)),
                  ),
                )
            ],
          ),
        ),
      ),
    );
  }
}
