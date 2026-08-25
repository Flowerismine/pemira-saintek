import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme.dart';
import 'dashboard_screen.dart'; // import electionServiceProvider

final receiptsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final service = ref.read(electionServiceProvider);
  return service.getMyReceipts();
});

class ReceiptListScreen extends ConsumerWidget {
  const ReceiptListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final receiptsAsync = ref.watch(receiptsProvider);

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Resi Saya'),
        automaticallyImplyLeading: false,
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(receiptsProvider);
          },
          child: receiptsAsync.when(
            data: (receipts) {
              if (receipts.isEmpty) {
                return ListView(
                  padding: const EdgeInsets.all(24),
                  children: [
                    SizedBox(height: MediaQuery.of(context).size.height * 0.3),
                    const Center(child: Text('Anda belum memberikan suara.')),
                  ],
                );
              }

              return ListView.builder(
                padding: const EdgeInsets.all(24),
                itemCount: receipts.length,
                itemBuilder: (context, index) {
                  final item = receipts[index];
                  final jenjang = item['periode_pemilihan']?['jenjang'] ?? 'Pemilihan';
                  final status = item['status_verifikasi'] ?? 'menunggu_verifikasi';

                  Color statusColor = AppTheme.slate500;
                  String statusText = 'Menunggu Verifikasi';
                  IconData statusIcon = Icons.hourglass_empty;

                  if (status == 'terverifikasi') {
                    statusColor = Colors.green;
                    statusText = 'Suara Sah';
                    statusIcon = Icons.check_circle;
                  } else if (status == 'gagal_verifikasi') {
                    statusColor = Colors.red;
                    statusText = 'Ditolak';
                    statusIcon = Icons.cancel;
                  }

                  return Container(
                    margin: const EdgeInsets.only(bottom: 24),
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: AppTheme.slate200.withOpacity(0.5),
                          blurRadius: 16,
                          offset: const Offset(0, 4),
                        )
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(jenjang, style: AppTheme.textTheme.titleLarge?.copyWith(fontSize: 16)),
                            Row(
                              children: [
                                Icon(statusIcon, color: statusColor, size: 16),
                                const SizedBox(width: 4),
                                Text(
                                  statusText,
                                  style: TextStyle(color: statusColor, fontWeight: FontWeight.bold, fontSize: 12),
                                ),
                              ],
                            ),
                          ],
                        ),
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 16),
                          child: Divider(color: AppTheme.slate200),
                        ),
                        Text('NOMOR RESI', style: AppTheme.textTheme.labelLarge?.copyWith(color: AppTheme.slate400)),
                        const SizedBox(height: 4),
                        Text(
                          item['nomor_bukti'] ?? '',
                          style: AppTheme.textTheme.displayMedium?.copyWith(fontSize: 20, color: AppTheme.slate900, letterSpacing: 1.5),
                        ),
                        const SizedBox(height: 16),
                        Text('KODE HASH (SHA-256)', style: AppTheme.textTheme.labelLarge?.copyWith(color: AppTheme.slate400)),
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppTheme.slate50,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: AppTheme.slate200),
                          ),
                          child: Text(
                            item['hash_record'] ?? 'Menunggu Sinkronisasi',
                            style: const TextStyle(fontFamily: 'monospace', fontSize: 11, color: AppTheme.slate600),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Waktu: ${DateTime.parse(item['created_at']).toLocal().toString().split('.')[0]}',
                          style: AppTheme.textTheme.bodyMedium?.copyWith(fontSize: 12, color: AppTheme.slate400),
                        ),
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
