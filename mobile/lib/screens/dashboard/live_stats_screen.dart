import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme.dart';
import '../../services/election_service.dart';
import 'dashboard_screen.dart'; // import electionServiceProvider

final liveStatsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final service = ref.read(electionServiceProvider);
  return service.getLiveStats();
});

class LiveStatsScreen extends ConsumerWidget {
  const LiveStatsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsAsync = ref.watch(liveStatsProvider);

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Live Statistik'),
        automaticallyImplyLeading: false,
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(liveStatsProvider);
          },
          child: statsAsync.when(
            data: (stats) {
              if (stats.isEmpty) {
                return ListView(
                  padding: const EdgeInsets.all(24),
                  children: [
                    SizedBox(height: MediaQuery.of(context).size.height * 0.3),
                    const Center(child: Text('Belum ada data pemilihan aktif.')),
                  ],
                );
              }

              return ListView.builder(
                padding: const EdgeInsets.all(24),
                itemCount: stats.length,
                itemBuilder: (context, index) {
                  final stat = stats[index];
                  final suaraMasuk = stat['suara_masuk'] as int? ?? 0;
                  final totalDpt = stat['total_dpt'] as int? ?? 0;
                  final percentage = totalDpt > 0 ? (suaraMasuk / totalDpt) : 0.0;

                  return Container(
                    margin: const EdgeInsets.only(bottom: 24),
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [
                        BoxShadow(
                          color: AppTheme.slate200.withOpacity(0.5),
                          blurRadius: 24,
                          offset: const Offset(0, 8),
                        )
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: AppTheme.primary50,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            stat['jenjang'] ?? '',
                            style: const TextStyle(
                              color: AppTheme.primary700,
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text('Partisipasi Pemilih', style: AppTheme.textTheme.titleLarge),
                        if (stat['jenjang'] == 'HMJ')
                          Text(stat['jurusan_id'] ?? '', style: AppTheme.textTheme.bodyMedium?.copyWith(color: AppTheme.slate500)),
                        const SizedBox(height: 24),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('SUARA MASUK', style: AppTheme.textTheme.labelLarge?.copyWith(color: AppTheme.slate400)),
                                Text(
                                  '$suaraMasuk',
                                  style: AppTheme.textTheme.displayMedium?.copyWith(color: AppTheme.primary600, fontSize: 32),
                                ),
                              ],
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text('TOTAL DPT', style: AppTheme.textTheme.labelLarge?.copyWith(color: AppTheme.slate400)),
                                Text(
                                  '$totalDpt',
                                  style: AppTheme.textTheme.titleLarge?.copyWith(color: AppTheme.slate700, fontSize: 24),
                                ),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: 24),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: LinearProgressIndicator(
                            value: percentage,
                            minHeight: 12,
                            backgroundColor: AppTheme.slate100,
                            valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primary500),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Align(
                          alignment: Alignment.centerRight,
                          child: Text(
                            '${(percentage * 100).toStringAsFixed(1)}%',
                            style: AppTheme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.bold, color: AppTheme.slate500),
                          ),
                        )
                      ],
                    ),
                  );
                },
              );
            },
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (err, stack) => Center(child: Text('Gagal memuat: $err')),
          ),
        ),
      ),
    );
  }
}
