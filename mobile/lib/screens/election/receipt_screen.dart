import 'package:flutter/material.dart';
import '../../core/theme.dart';
import '../dashboard/dashboard_screen.dart';

class ReceiptScreen extends StatelessWidget {
  final String nomorBukti;
  final String hash;

  const ReceiptScreen({
    super.key,
    required this.nomorBukti,
    required this.hash,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.primary600, // Background biru penuh
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Icon(Icons.check_circle, size: 120, color: Colors.white),
              const SizedBox(height: 32),
              Text(
                'Suara Berhasil Terkunci!',
                textAlign: TextAlign.center,
                style: AppTheme.textTheme.displayMedium?.copyWith(color: Colors.white),
              ),
              const SizedBox(height: 12),
              Text(
                'Pilihan Anda telah diamankan ke dalam rantai kriptografi dan menunggu verifikasi Admin KPU.',
                textAlign: TextAlign.center,
                style: AppTheme.textTheme.bodyLarge?.copyWith(color: AppTheme.primary100),
              ),
              const SizedBox(height: 48),

              // Kotak Resi
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 20, offset: const Offset(0, 10))
                  ],
                ),
                child: Column(
                  children: [
                    Text('NOMOR RESI BUKTI', style: AppTheme.textTheme.labelLarge?.copyWith(color: AppTheme.slate500)),
                    const SizedBox(height: 8),
                    Text(
                      nomorBukti,
                      style: AppTheme.textTheme.displayMedium?.copyWith(color: AppTheme.slate900, letterSpacing: 2),
                    ),
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 16),
                      child: Divider(color: AppTheme.slate200),
                    ),
                    Text('KODE HASH (SHA-256)', style: AppTheme.textTheme.labelLarge?.copyWith(color: AppTheme.slate500)),
                    const SizedBox(height: 8),
                    Text(
                      hash,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontFamily: 'monospace',
                        color: AppTheme.slate400,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              
              const Spacer(),

              ElevatedButton(
                onPressed: () {
                  // Kembali ke Dashboard dan hapus semua layar sebelumnya
                  Navigator.pushAndRemoveUntil(
                    context,
                    MaterialPageRoute(builder: (_) => const DashboardScreen()),
                    (route) => false,
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: AppTheme.primary600,
                  padding: const EdgeInsets.symmetric(vertical: 20),
                ),
                child: const Text('Kembali ke Beranda'),
              )
            ],
          ),
        ),
      ),
    );
  }
}
