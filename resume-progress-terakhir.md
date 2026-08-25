# Resume Progress Terakhir Pemira Saintek (25 Agustus 2026)

Dokumen ini adalah catatan checkpoint pengembangan terakhir agar kita bisa melanjutkan dari titik ini tanpa kehilangan konteks.

## 📱 Aplikasi Mobile (Android)
1. **Navigasi Bottom Bar**: Sudah diperbaiki. Setelah mahasiswa login, mereka akan selalu diarahkan ke `MainLayoutScreen` sehingga menu bawah (Beranda, Live Stats, Cek Resi, Resi Saya) selalu muncul.
2. **Hasil Sementara (Quick Count)**: Halaman `LiveStatsScreen` telah dirombak. Kini menampilkan grafik batang progres perolehan suara secara real-time untuk masing-masing kandidat.
3. **Menu Audit Transparansi (Cek Resi)**: 
   - Fitur ala *Blockchain* berhasil diimplementasikan.
   - Mahasiswa dapat memantau "Nomor Resi" mencoblos siapa beserta statusnya (SAH/DITOLAK/MENUNGGU).
   - Menjamin 100% rahasia *Secret Ballot* karena tidak ada nama atau NIM yang dimunculkan.
   - Dilengkapi *Tab* (DEMA-F, SEMA-F, HMJ) dan fitur pencarian resi/hash.
   - HMJ otomatis terfilter berdasarkan jurusan pengguna yang login.
4. **Bug HMJ Card Hilang**: Telah diselesaikan dengan mengubah `jurusanId` menjadi `fakultasId` pada kondisi logika di Flutter, karena admin menginputkan nama jurusan ke dalam kolom `fakultas_id`.
5. **Kompilasi APK**: APK Android telah sukses di-build (`app-release.apk`) dan siap dipasang di *smartphone* mahasiswa.

## 💻 Dasbor Admin (Web Next.js)
1. **Lonceng Notifikasi**: Ikon lonceng sekarang berfungsi (tidak lagi memunculkan pop-up alert kosong). Lonceng akan menampilkan indikator berkedip jika ada mahasiswa yang menunggu verifikasi DPT atau jika ada suara masuk yang belum disahkan. Memiliki menu gantung (*dropdown*) yang dapat diklik langsung ke halaman terkait.
2. **Aktivitas Terbaru**: Ditambahkan keterangan jenjang dan fakultas (misal: "Suara Sah Terverifikasi (HMJ Ilmu Komputer)") agar admin KPU tidak bingung jika satu nama mahasiswa muncul dua kali untuk pemilihan yang berbeda.

## 🗄️ Database (Supabase)
1. Dibuat dua *Remote Procedure Call* (RPC) baru dengan hak akses keamanan tinggi (`SECURITY DEFINER`):
   - `get_live_quick_count()`: Untuk menghitung suara hasil sementara di aplikasi Mobile.
   - `get_audit_logs()`: Untuk mencetak data transparansi (Resi & Hash) ke tabel aplikasi Mobile tanpa merusak *Row Level Security* (RLS).
2. Bug *Type Mismatch* Postgres (ERROR 42804 dan 42P13) telah diselesaikan dengan penyesuaian tipe data `TEXT` pada kolom resi.

## Langkah Selanjutnya (Next Steps)
- Melakukan testing aplikasi ke lebih banyak perangkat.
- Jika ada penambahan fitur lain, kita tinggal mengacu pada dokumen ini untuk mengingat state terakhir.
