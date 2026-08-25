class UserModel {
  final String id;
  final String nim;
  final String nama;
  final String? jurusan;
  final String? fakultas;

  UserModel({
    required this.id,
    required this.nim,
    required this.nama,
    this.jurusan,
    this.fakultas,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as String,
      nim: json['nim'] as String,
      nama: json['nama'] as String,
      jurusan: json['jurusan'] as String?,
      fakultas: json['fakultas'] as String?,
    );
  }
}
