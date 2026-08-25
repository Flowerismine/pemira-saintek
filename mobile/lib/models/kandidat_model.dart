class KandidatModel {
  final String id;
  final String periodeId;
  final int nomorUrut;
  final String nama;
  final String? visiMisi;
  final String? fotoUrl;

  KandidatModel({
    required this.id,
    required this.periodeId,
    required this.nomorUrut,
    required this.nama,
    this.visiMisi,
    this.fotoUrl,
  });

  factory KandidatModel.fromJson(Map<String, dynamic> json) {
    return KandidatModel(
      id: json['id'] as String,
      periodeId: json['periode_id'] as String,
      nomorUrut: json['nomor_urut'] as int,
      nama: json['nama'] as String,
      visiMisi: json['visi_misi'] as String?,
      fotoUrl: json['foto_url'] as String?,
    );
  }
}
