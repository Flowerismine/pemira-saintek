import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shimmer/shimmer.dart';
import 'package:shimmer/shimmer.dart';
import '../../core/theme.dart';
import '../../models/kandidat_model.dart';
import '../../models/periode_model.dart';
import '../../services/election_service.dart';
import '../dashboard/dashboard_screen.dart'; // import electionServiceProvider
import 'selfie_verification_screen.dart';

// Provider yang butuh parameter periodeId (menggunakan family)
final kandidatListProvider = FutureProvider.family<List<KandidatModel>, String>((ref, periodeId) async {
  final service = ref.read(electionServiceProvider);
  return service.getKandidatByPeriode(periodeId);
});

class CandidateListScreen extends ConsumerWidget {
  final PeriodeModel periode;

  const CandidateListScreen({super.key, required this.periode});

  void _showVisiMisiBottomSheet(BuildContext context, KandidatModel kandidat) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.75, // 75% layar
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
        ),
        child: Column(
          children: [
            // Handle bar
            Container(
              margin: const EdgeInsets.symmetric(vertical: 16),
              width: 48,
              height: 6,
              decoration: BoxDecoration(
                color: AppTheme.slate200,
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Paslon 0${kandidat.nomorUrut}',
                      style: AppTheme.textTheme.titleLarge?.copyWith(color: AppTheme.primary600, fontSize: 16),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      kandidat.nama,
                      style: AppTheme.textTheme.displayMedium?.copyWith(fontSize: 24),
                    ),
                    const SizedBox(height: 32),
                    
                    // Visi & Misi
                    Row(
                      children: [
                        const Icon(Icons.my_location, color: AppTheme.primary500),
                        const SizedBox(width: 12),
                        Text('Visi & Misi', style: AppTheme.textTheme.titleLarge),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(kandidat.visiMisi ?? 'Belum ada visi & misi.', style: AppTheme.textTheme.bodyLarge?.copyWith(height: 1.6)),
                    const SizedBox(height: 48),
                  ],
                ),
              ),
            ),
            // Tombol Coblos di Bottom Sheet
            Padding(
              padding: const EdgeInsets.all(24.0),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pop(context); // Tutup bottom sheet
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => SelfieVerificationScreen(kandidat: kandidat),
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primary600,
                    padding: const EdgeInsets.symmetric(vertical: 20),
                  ),
                  child: Text('Coblos Paslon 0${kandidat.nomorUrut}', style: const TextStyle(fontSize: 16)),
                ),
              ),
            )
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final kandidatAsync = ref.watch(kandidatListProvider(periode.id));

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: Text('Kandidat ${periode.jenjang}'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: kandidatAsync.when(
        data: (kandidatList) {
          if (kandidatList.isEmpty) {
            return RefreshIndicator(
              onRefresh: () async {
                ref.invalidate(kandidatListProvider(periode.id));
              },
              child: ListView(
                children: [
                  SizedBox(height: MediaQuery.of(context).size.height * 0.4),
                  const Center(child: Text('Belum ada kandidat terdaftar.')),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(kandidatListProvider(periode.id));
            },
            child: ListView.builder(
              padding: const EdgeInsets.all(24.0),
              itemCount: kandidatList.length,
              itemBuilder: (context, index) {
                final kandidat = kandidatList[index];
                return _buildKandidatCard(context, kandidat);
              },
            ),
          );
        },
        loading: () => ListView(
          padding: const EdgeInsets.all(24.0),
          children: [
            _buildSkeletonCard(),
            const SizedBox(height: 24),
            _buildSkeletonCard(),
          ],
        ),
        error: (err, stack) => Center(child: Text('Error: $err', style: const TextStyle(color: Colors.red))),
      ),
    );
  }

  Widget _buildKandidatCard(BuildContext context, KandidatModel kandidat) {
    return Container(
      margin: const EdgeInsets.only(bottom: 24),
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
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Bagian Foto
          Stack(
            children: [
              Container(
                height: 240,
                color: AppTheme.slate100,
                child: kandidat.fotoUrl != null && kandidat.fotoUrl!.isNotEmpty
                    ? Image.network(
                        kandidat.fotoUrl!,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) => const Icon(Icons.image_not_supported, size: 48, color: AppTheme.slate300),
                      )
                    : const Center(child: Icon(Icons.person, size: 64, color: AppTheme.slate300)),
              ),
              // Label Nomor Urut
              Positioned(
                top: 16,
                left: 16,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppTheme.primary600,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '0${kandidat.nomorUrut}',
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
                  ),
                ),
              ),
            ],
          ),
          
          // Bagian Teks & Tombol
          Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  kandidat.nama,
                  style: AppTheme.textTheme.titleLarge,
                ),
                const SizedBox(height: 24),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => _showVisiMisiBottomSheet(context, kandidat),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppTheme.primary600,
                          side: const BorderSide(color: AppTheme.primary200, width: 2),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                        child: const Text('Visi & Misi', style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {
                           Navigator.push(
                             context,
                             MaterialPageRoute(
                               builder: (_) => SelfieVerificationScreen(kandidat: kandidat),
                             ),
                           );
                        },
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                        child: const Text('Coblos'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          )
        ],
      ),
    );
  }

  Widget _buildSkeletonCard() {
    return Shimmer.fromColors(
      baseColor: AppTheme.slate200,
      highlightColor: AppTheme.slate100,
      child: Container(
        height: 380,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
        ),
      ),
    );
  }
}
