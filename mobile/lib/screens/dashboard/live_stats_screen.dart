import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme.dart';
import '../../services/election_service.dart';
import 'dashboard_screen.dart'; 

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
        title: const Text('Live Quick Count'),
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

              // Group stats by jenjang and fakultas_id
              final Map<String, List<Map<String, dynamic>>> groupedStats = {};
              for (var row in stats) {
                final key = '${row['jenjang']} - ${row['fakultas_id'] ?? 'Saintek'}';
                if (!groupedStats.containsKey(key)) {
                  groupedStats[key] = [];
                }
                groupedStats[key]!.add(row);
              }

              return ListView.builder(
                padding: const EdgeInsets.all(24),
                itemCount: groupedStats.keys.length,
                itemBuilder: (context, index) {
                  final key = groupedStats.keys.elementAt(index);
                  final candidates = groupedStats[key]!;
                  
                  // Calculate total suara in this periode
                  int totalSuara = 0;
                  for (var c in candidates) {
                    totalSuara += (c['suara'] as num?)?.toInt() ?? 0;
                  }

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
                            key,
                            style: const TextStyle(
                              color: AppTheme.primary700,
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text('Hasil Sementara', style: AppTheme.textTheme.titleLarge),
                        Text('Total Suara Masuk: $totalSuara', style: AppTheme.textTheme.bodyMedium?.copyWith(color: AppTheme.slate500)),
                        const SizedBox(height: 24),
                        ...candidates.map((c) {
                          final suara = (c['suara'] as num?)?.toInt() ?? 0;
                          final percentage = totalSuara > 0 ? (suara / totalSuara) : 0.0;
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(
                                      child: Text(
                                        'Paslon ${c['nomor_urut']}: ${c['nama']}',
                                        style: AppTheme.textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600),
                                      ),
                                    ),
                                    Text(
                                      '$suara Suara',
                                      style: AppTheme.textTheme.bodyLarge?.copyWith(color: AppTheme.primary600, fontWeight: FontWeight.bold),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Stack(
                                  children: [
                                    Container(
                                      height: 8,
                                      width: double.infinity,
                                      decoration: BoxDecoration(
                                        color: AppTheme.slate100,
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                    ),
                                    FractionallySizedBox(
                                      widthFactor: percentage,
                                      child: Container(
                                        height: 8,
                                        decoration: BoxDecoration(
                                          color: AppTheme.primary500,
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '${(percentage * 100).toStringAsFixed(1)}%',
                                  style: AppTheme.textTheme.bodySmall?.copyWith(color: AppTheme.slate500),
                                ),
                              ],
                            ),
                          );
                        }).toList(),
                      ],
                    ),
                  );
                },
              );
            },
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (err, stack) => Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, color: Colors.red, size: 48),
                  const SizedBox(height: 16),
                  Text('Gagal memuat data', style: AppTheme.textTheme.titleMedium),
                  Text(err.toString(), style: AppTheme.textTheme.bodySmall, textAlign: TextAlign.center),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
