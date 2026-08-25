import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shimmer/shimmer.dart';
import '../../core/theme.dart';
import '../../models/periode_model.dart';
import '../../models/user_model.dart';
import '../../services/election_service.dart';
import '../auth/login_screen.dart';
import '../election/candidate_list_screen.dart';

final electionServiceProvider = Provider((ref) => ElectionService());

// Mengambil User
final currentUserProvider = FutureProvider<UserModel>((ref) async {
  final service = ref.read(electionServiceProvider);
  return service.getCurrentUser();
});

// Mengambil Periode Aktif berdasarkan Jurusan User
final targetedPeriodsProvider = FutureProvider<List<PeriodeModel>>((ref) async {
  final service = ref.read(electionServiceProvider);
  final user = await ref.watch(currentUserProvider.future);
  return service.getTargetedActivePeriods(user);
});

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userAsync = ref.watch(currentUserProvider);
    final periodsAsync = ref.watch(targetedPeriodsProvider);

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Dashboard Pemira'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () {
              showDialog(
                context: context,
                builder: (context) => AlertDialog(
                  title: const Text('Keluar Aplikasi'),
                  content: const Text('Apakah Anda yakin ingin keluar dari akun ini?'),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('Batal'),
                    ),
                    ElevatedButton(
                      onPressed: () async {
                        Navigator.pop(context); // Tutup dialog
                        await Supabase.instance.client.auth.signOut();
                        
                        // Navigasi paksa ke Halaman Login dan hapus semua tumpukan halaman
                        // karena AuthGate tertimpa oleh pushReplacement saat proses OTP.
                        if (context.mounted) {
                          Navigator.pushAndRemoveUntil(
                            context,
                            MaterialPageRoute(builder: (context) => const LoginScreen()),
                            (Route<dynamic> route) => false,
                          );
                        }
                      },
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                      child: const Text('Keluar', style: TextStyle(color: Colors.white)),
                    ),
                  ],
                ),
              );
            },
          )
        ],
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(currentUserProvider);
            ref.invalidate(targetedPeriodsProvider);
          },
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Header Profil
                userAsync.when(
                  data: (user) => _buildUserHeader(user),
                  loading: () => _buildUserHeaderSkeleton(),
                  error: (err, stack) => Text('Gagal memuat profil: $err', style: const TextStyle(color: Colors.red)),
                ),
                
                const SizedBox(height: 32),
                Text('Daftar Pemilihan', style: AppTheme.textTheme.titleLarge),
                const SizedBox(height: 16),

                // Daftar Kartu
                periodsAsync.when(
                  data: (periods) {
                    if (periods.isEmpty) {
                      return _buildEmptyState();
                    }
                    return Column(
                      children: periods.map((p) => _buildPeriodCard(context, p)).toList(),
                    );
                  },
                  loading: () => Column(
                    children: [
                      _buildPeriodCardSkeleton(),
                      const SizedBox(height: 16),
                      _buildPeriodCardSkeleton(),
                    ],
                  ),
                  error: (err, stack) => Text('Gagal memuat data: $err', style: const TextStyle(color: Colors.red)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildUserHeader(UserModel user) {
    return Row(
      children: [
        Container(
          width: 56,
          height: 56,
          decoration: BoxDecoration(
            color: AppTheme.primary100,
            shape: BoxShape.circle,
          ),
          child: Center(
            child: Text(
              user.nama.substring(0, 1).toUpperCase(),
              style: AppTheme.textTheme.titleLarge?.copyWith(color: AppTheme.primary700),
            ),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Halo, ${user.nama}', style: AppTheme.textTheme.titleLarge?.copyWith(fontSize: 20), maxLines: 1, overflow: TextOverflow.ellipsis),
              const SizedBox(height: 4),
              Text('${user.jurusan} • ${user.nim}', style: AppTheme.textTheme.bodyMedium),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildPeriodCard(BuildContext context, PeriodeModel periode) {
    final isDone = periode.hasVoted;
    
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: isDone ? AppTheme.slate50 : AppTheme.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isDone ? AppTheme.slate200 : AppTheme.primary100, width: 2),
        boxShadow: isDone ? [] : [
          BoxShadow(
            color: AppTheme.primary500.withOpacity(0.05),
            blurRadius: 20,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: isDone ? AppTheme.slate200 : AppTheme.primary100,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    periode.jenjang,
                    style: TextStyle(
                      color: isDone ? AppTheme.slate600 : AppTheme.primary700,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
                if (isDone)
                  const Icon(Icons.check_circle, color: Colors.green, size: 24),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              'Pemilihan Ketua ${periode.jenjang}',
              style: AppTheme.textTheme.titleLarge?.copyWith(fontSize: 18, color: isDone ? AppTheme.slate400 : AppTheme.slate900),
            ),
            if (periode.jenjang == 'HMJ')
               Text(
                periode.fakultasId ?? '',
                style: AppTheme.textTheme.bodyMedium?.copyWith(color: isDone ? AppTheme.slate400 : AppTheme.primary600, fontWeight: FontWeight.w600),
              ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: isDone ? null : () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => CandidateListScreen(periode: periode),
                    ),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: isDone ? AppTheme.slate200 : AppTheme.primary600,
                  foregroundColor: isDone ? AppTheme.slate500 : Colors.white,
                ),
                child: Text(isDone ? 'Sudah Memilih' : 'Mulai Memilih'),
              ),
            )
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Container(
      padding: const EdgeInsets.all(40),
      decoration: BoxDecoration(
        color: AppTheme.slate50,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppTheme.slate200, style: BorderStyle.solid),
      ),
      child: Column(
        children: [
          const Icon(Icons.inbox, size: 48, color: AppTheme.slate300),
          const SizedBox(height: 16),
          Text('Belum Ada Pemilihan', style: AppTheme.textTheme.titleLarge?.copyWith(fontSize: 18, color: AppTheme.slate600)),
          const SizedBox(height: 8),
          Text('Pemira untuk jurusan Anda belum dibuka atau sedang ditunda.', textAlign: TextAlign.center, style: AppTheme.textTheme.bodyMedium),
        ],
      ),
    );
  }

  // --- SKELETON LOADERS ---
  Widget _buildUserHeaderSkeleton() {
    return Shimmer.fromColors(
      baseColor: AppTheme.slate200,
      highlightColor: AppTheme.slate100,
      child: Row(
        children: [
          Container(width: 56, height: 56, decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle)),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(width: 150, height: 20, color: Colors.white),
                const SizedBox(height: 8),
                Container(width: 100, height: 14, color: Colors.white),
              ],
            ),
          )
        ],
      ),
    );
  }

  Widget _buildPeriodCardSkeleton() {
    return Shimmer.fromColors(
      baseColor: AppTheme.slate200,
      highlightColor: AppTheme.slate100,
      child: Container(
        height: 180,
        width: double.infinity,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
        ),
      ),
    );
  }
}
