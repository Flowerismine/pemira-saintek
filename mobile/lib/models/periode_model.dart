class PeriodeModel {
  final String id;
  final String jenjang;
  final String? fakultasId;
  final String? jurusanId;
  final DateTime tanggalMulai;
  final DateTime tanggalSelesai;
  final bool hasVoted; // Ini field tambahan khusus untuk UI Mobile

  PeriodeModel({
    required this.id,
    required this.jenjang,
    this.fakultasId,
    this.jurusanId,
    required this.tanggalMulai,
    required this.tanggalSelesai,
    this.hasVoted = false,
  });

  factory PeriodeModel.fromJson(Map<String, dynamic> json, {bool hasVoted = false}) {
    return PeriodeModel(
      id: json['id'] as String,
      jenjang: json['jenjang'] as String,
      fakultasId: json['fakultas_id'] as String?,
      jurusanId: json['jurusan_id'] as String?,
      tanggalMulai: DateTime.parse(json['tanggal_mulai'] as String),
      tanggalSelesai: DateTime.parse(json['tanggal_selesai'] as String),
      hasVoted: hasVoted,
    );
  }

  PeriodeModel copyWith({bool? hasVoted}) {
    return PeriodeModel(
      id: this.id,
      jenjang: this.jenjang,
      fakultasId: this.fakultasId,
      jurusanId: this.jurusanId,
      tanggalMulai: this.tanggalMulai,
      tanggalSelesai: this.tanggalSelesai,
      hasVoted: hasVoted ?? this.hasVoted,
    );
  }
}
