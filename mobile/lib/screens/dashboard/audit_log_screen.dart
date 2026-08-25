import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../core/theme.dart';
import '../../services/election_service.dart';
import 'dashboard_screen.dart'; // import electionServiceProvider

final auditLogsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final service = ref.read(electionServiceProvider);
  return service.getAuditLogs();
});

class AuditLogScreen extends ConsumerStatefulWidget {
  const AuditLogScreen({super.key});

  @override
  ConsumerState<AuditLogScreen> createState() => _AuditLogScreenState();
}

class _AuditLogScreenState extends ConsumerState<AuditLogScreen> with SingleTickerProviderStateMixin {
  String _searchQuery = '';
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auditLogsAsync = ref.watch(auditLogsProvider);

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Cek Resi & Transparansi'),
        automaticallyImplyLeading: false,
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppTheme.primary600,
          unselectedLabelColor: AppTheme.slate400,
          indicatorColor: AppTheme.primary600,
          tabs: const [
            Tab(text: 'DEMA-F'),
            Tab(text: 'SEMA-F'),
            Tab(text: 'HMJ'),
          ],
        ),
      ),
      body: auditLogsAsync.when(
        data: (logs) {
          // Filter by search query
          final filteredLogs = logs.where((log) {
            final resi = (log['nomor_bukti'] ?? '').toString().toLowerCase();
            final hash = (log['hash_record'] ?? '').toString().toLowerCase();
            final query = _searchQuery.toLowerCase();
            return resi.contains(query) || hash.contains(query);
          }).toList();

          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: TextField(
                  decoration: InputDecoration(
                    hintText: 'Cari Nomor Resi atau Kode Hash...',
                    prefixIcon: const Icon(Icons.search),
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                  ),
                  onChanged: (val) {
                    setState(() {
                      _searchQuery = val;
                    });
                  },
                ),
              ),
              Expanded(
                child: TabBarView(
                  controller: _tabController,
                  children: [
                    _buildLogList(filteredLogs.where((l) => l['jenjang'] == 'DEMA-F').toList()),
                    _buildLogList(filteredLogs.where((l) => l['jenjang'] == 'SEMA-F').toList()),
                    _buildLogList(filteredLogs.where((l) => l['jenjang'] == 'HMJ' || l['jenjang'] == 'Kosma').toList()),
                  ],
                ),
              ),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Error: $err')),
      ),
    );
  }

  Widget _buildLogList(List<Map<String, dynamic>> logs) {
    if (logs.isEmpty) {
      return const Center(child: Text('Belum ada data di kategori ini.'));
    }

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(auditLogsProvider);
      },
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        itemCount: logs.length,
        itemBuilder: (context, index) {
          final log = logs[index];
          final dt = DateTime.parse(log['waktu_vote'] ?? DateTime.now().toIso8601String()).toLocal();
          final formattedDate = DateFormat('dd MMM yyyy, HH:mm').format(dt);
          final kandidatNama = log['kandidat_nama'] ?? 'Tidak Diketahui';
          final nomorUrut = log['nomor_urut'] ?? '?';

          final status = log['status_verifikasi'] ?? 'menunggu_verifikasi';
          Color statusColor;
          String statusText;
          switch (status) {
            case 'terverifikasi':
              statusColor = Colors.green;
              statusText = 'SAH';
              break;
            case 'gagal_verifikasi':
              statusColor = Colors.red;
              statusText = 'DITOLAK';
              break;
            default:
              statusColor = Colors.orange;
              statusText = 'MENUNGGU';
          }

          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: AppTheme.slate200.withOpacity(0.5),
                  blurRadius: 10,
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
                    Text('RESI: ${log['nomor_bukti']}', style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.slate800)),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: statusColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        statusText,
                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: statusColor),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text('Memilih: Paslon $nomorUrut - $kandidatNama', style: const TextStyle(color: AppTheme.primary600, fontWeight: FontWeight.w600)),
                const SizedBox(height: 8),
                Text('Waktu: $formattedDate', style: const TextStyle(fontSize: 12, color: AppTheme.slate500)),
                const SizedBox(height: 4),
                Text('Hash: ${log['hash_record']}', style: const TextStyle(fontSize: 10, color: AppTheme.slate400, fontFamily: 'monospace')),
                if (log['sasaran'] != null && log['sasaran'] != '')
                  Padding(
                    padding: const EdgeInsets.only(top: 8.0),
                    child: Text('Kategori: ${log['sasaran']}', style: const TextStyle(fontSize: 12, color: AppTheme.slate500)),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }
}
