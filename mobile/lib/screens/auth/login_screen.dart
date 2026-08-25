import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme.dart';
import '../../services/auth_service.dart';
import 'otp_screen.dart';

// Riverpod Provider untuk AuthService
final authServiceProvider = Provider((ref) => AuthService());

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _nimController = TextEditingController();
  final _waController = TextEditingController();
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _nimController.dispose();
    _waController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    final nim = _nimController.text.trim();
    final wa = _waController.text.trim();

    if (nim.isEmpty || wa.isEmpty) {
      setState(() => _errorMessage = "NIM dan Nomor WhatsApp harus diisi.");
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final authService = ref.read(authServiceProvider);
      await authService.requestOtp(nim: nim, waNumber: wa);
      
      if (mounted) {
        // Pindah ke halaman OTP dengan animasi halus
        Navigator.push(
          context,
          PageRouteBuilder(
            pageBuilder: (context, animation, secondaryAnimation) => OtpScreen(nim: nim),
            transitionsBuilder: (context, animation, secondaryAnimation, child) {
              return FadeTransition(opacity: animation, child: child);
            },
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
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Logo or Icon
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: AppTheme.primary50,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.how_to_vote, size: 40, color: AppTheme.primary600),
                ),
                const SizedBox(height: 24),
                
                // Welcome Text
                Text(
                  'Pemira Saintek',
                  textAlign: TextAlign.center,
                  style: AppTheme.textTheme.displayMedium,
                ),
                const SizedBox(height: 8),
                Text(
                  'Masukkan NIM dan Nomor WhatsApp aktif Anda untuk menerima kode akses (OTP).',
                  textAlign: TextAlign.center,
                  style: AppTheme.textTheme.bodyMedium,
                ),
                const SizedBox(height: 48),

                // Error Message
                if (_errorMessage != null)
                  Container(
                    padding: const EdgeInsets.all(12),
                    margin: const EdgeInsets.only(bottom: 24),
                    decoration: BoxDecoration(
                      color: Colors.red.shade50,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.red.shade100),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.error_outline, color: Colors.redAccent, size: 20),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            _errorMessage!,
                            style: const TextStyle(color: Colors.redAccent, fontSize: 13, fontWeight: FontWeight.w500),
                          ),
                        ),
                      ],
                    ),
                  ),

                // Form Fields
                TextField(
                  controller: _nimController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'Nomor Induk Mahasiswa (NIM)',
                    prefixIcon: Icon(Icons.person, color: AppTheme.slate400),
                  ),
                ),
                const SizedBox(height: 20),
                TextField(
                  controller: _waController,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(
                    labelText: 'Nomor WhatsApp (Contoh: 0812...)',
                    prefixIcon: Icon(Icons.chat_bubble_outline, color: AppTheme.slate400),
                  ),
                ),
                const SizedBox(height: 32),

                // Submit Button
                ElevatedButton(
                  onPressed: _isLoading ? null : _handleLogin,
                  child: _isLoading
                      ? const SizedBox(
                          height: 24,
                          width: 24,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                        )
                      : const Text('Kirim Kode Akses'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
