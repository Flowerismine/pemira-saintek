# Tahap Pembuatan Aplikasi E-Voting Kampus dari Nol — Versi Rinci

*Dokumen ini menggabungkan `tahap-pembuatan-aplikasi.md` (roadmap 10 fase) dan `rincian-tahap-voting.md` (detail alur registrasi & voting), lalu memecah tiap langkah menjadi lebih kecil dan menambahkan kebutuhan teknis (tools, library, konfigurasi, contoh kode/skema) di setiap tahap. Urutan disusun supaya tiap tahap punya fondasi dari tahap sebelumnya — jangan loncat tahap.*

---

## 0. PRASYARAT UMUM (siapkan sebelum mulai Tahap A)

**Akun & layanan yang perlu dibuat lebih dulu:**
- Akun GitHub (untuk repo + CI/CD).
- Akun Supabase (backend-as-a-service: Postgres, Auth, Storage, Edge Functions).
- Akun provider WhatsApp API (Twilio, Fonnte, atau Wablas) — untuk OTP & notifikasi.
- Akun hosting frontend web (Vercel paling umum untuk Next.js).
- Domain (opsional tapi disarankan untuk production, misal `evoting.kampus.ac.id`).

**Tools yang perlu diinstal di komputer development:**
- Git.
- Node.js LTS (untuk Next.js, tooling CLI Supabase, dan CI).
- Flutter SDK + Android Studio / Xcode (kalau mau build iOS juga perlu Mac).
- VS Code (atau IDE lain) + extension: Flutter, Dart, ESLint, Prettier, Tailwind CSS IntelliSense.
- Supabase CLI (`npm install -g supabase`) — untuk migration database lokal.
- Postman atau Insomnia — untuk testing API/endpoint manual.
- Docker (opsional, dipakai Supabase CLI untuk local development database).

**Skill/role yang idealnya terlibat:**
- 1 backend developer (Supabase/Postgres, logic hash chain, RLS).
- 1 mobile developer (Flutter).
- 1 web developer (Next.js, dashboard admin).
- 1 orang UI/UX (bisa dirangkap) untuk wireframe & desain.
- Perwakilan KPU Mahasiswa & Pengawas SEMA-F sebagai product owner/reviewer requirement.

---

## A. TAHAP PERSIAPAN & PERENCANAAN

### A1. Finalisasi dokumen spesifikasi
- **Yang dilakukan:** Kumpulkan seluruh requirement (alur registrasi, alur voting, kebutuhan keamanan, kebutuhan pelaporan) jadi satu dokumen spek yang disetujui KPU Mahasiswa & Pengawas SEMA-F.
- **Yang diperlukan:** Google Docs/Notion untuk kolaborasi, sesi review bersama stakeholder, checklist tanda-tangan/approval (bisa berupa persetujuan tertulis via email/WA agar ada jejak).
- **Output:** Dokumen spek final versi 1.0, tidak berubah-ubah lagi selama development berjalan (perubahan besar harus lewat change request).

### A2. Susun daftar fitur MVP vs fitur lanjutan
- **Yang dilakukan:** Pisahkan fitur wajib ada di rilis pertama (MVP) — misal: registrasi, login, submit vote, verifikasi manual, checkpoint transparansi dasar — dari fitur yang bisa menyusul (dashboard analitik lanjutan, reset vote otomatis, multi-bahasa, dsb).
- **Yang diperlukan:** Tabel prioritas (MoSCoW: Must/Should/Could/Won't), disepakati bersama stakeholder.
- **Output:** Daftar fitur fase 1 (MVP) dan fase 2 (lanjutan).

### A3. Tentukan jenjang pemilihan pilot
- **Yang dilakukan:** Pilih satu fakultas/jurusan sebagai target pilot sebelum full rollout ke seluruh kampus.
- **Yang diperlukan:** Data jumlah mahasiswa di fakultas pilot (untuk estimasi beban server & skala testing), kesepakatan dengan pengurus fakultas terkait.
- **Output:** Nama fakultas/jenjang pilot + jadwal target pilot.

### A4. Buat wireframe kasar tiap halaman utama
- **Yang dilakukan:** Sketsa low-fidelity untuk: registrasi, verifikasi OTP, consent data wajah, upload KTM, login, daftar kandidat, konfirmasi vote, kartu bukti vote, cek status suara, papan transparansi, dashboard admin (antrian registrasi, antrian verifikasi vote, kelola periode, kelola kandidat, audit log).
- **Yang diperlukan:** Tools desain (Figma gratis cukup, atau bahkan kertas/whiteboard untuk versi kasar).
- **Output:** Set wireframe per halaman, dipakai acuan tim mobile & web.

### A5. Buat struktur folder project
- **Yang dilakukan:** Siapkan skeleton folder terpisah untuk mobile (Flutter) dan web (Next.js).
- **Yang diperlukan:**
  ```
  evoting-kampus/
  ├── mobile/        # Flutter app (mahasiswa)
  ├── web/           # Next.js app (admin + publik)
  ├── supabase/      # migration SQL, edge functions, seed data
  └── docs/          # dokumen spek, wireframe, ERD
  ```
- **Output:** Repo dengan struktur folder siap diisi.

### A6. Setup repository Git & branch strategy
- **Yang dilakukan:** Buat repo GitHub, tentukan strategi branching.
- **Yang diperlukan:**
  - `main` → hanya berisi kode yang sudah production-ready.
  - `develop` → integrasi fitur sebelum rilis.
  - `feature/nama-fitur` → tiap fitur dikerjakan di branch sendiri, merge ke `develop` via Pull Request + review.
  - Aktifkan branch protection rule di GitHub (wajib PR review sebelum merge ke `main`/`develop`).
- **Output:** Repo Git siap dipakai tim.

### A7. Setup project management board
- **Yang dilakukan:** Buat board untuk tracking task per tahap (bisa pakai daftar 104 langkah di dokumen ini sebagai starting backlog).
- **Yang diperlukan:** GitHub Projects (paling praktis karena satu ekosistem dengan repo), atau Trello/Notion kalau tim lebih familiar.
- **Output:** Board dengan kolom To Do / In Progress / Review / Done, berisi task dari Tahap B sampai J.

---

## B. TAHAP SETUP INFRASTRUKTUR

### B1. Buat project baru di Supabase
- **Yang dilakukan:** Buat project via dashboard Supabase.
- **Yang diperlukan:** Akun Supabase, pilih region server terdekat (misal Singapore untuk latensi rendah ke Indonesia).
- **Output:** Project Supabase kosong dengan URL & API key.

### B2. Catat kredensial project dengan aman
- **Yang dilakukan:** Simpan `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` sebagai environment variable, bukan hardcode di kode.
- **Yang diperlukan:**
  - File `.env.local` (web) dan `.env` (mobile, via package `flutter_dotenv`), keduanya masuk `.gitignore`.
  - Password manager tim (misal 1Password/Bitwarden) untuk simpan service role key — key ini punya akses penuh, jangan pernah taruh di client-side code.
- **Output:** Kredensial aman, tidak pernah ter-commit ke Git.

### B3. Setup PostgreSQL database (project kosong)
- **Yang dilakukan:** Pastikan database Supabase aktif, belum ada tabel (tabel dibuat di Tahap C).
- **Yang diperlukan:** Akses ke Supabase SQL Editor atau Supabase CLI untuk migration.
- **Output:** Database kosong siap diisi skema.

### B4. Aktifkan Supabase Auth
- **Yang dilakukan:** Konfigurasi metode login (email+password), atur template email/pesan (kalau dipakai), set session expiry.
- **Yang diperlukan:** Menu Authentication di dashboard Supabase, keputusan soal apakah login pakai email atau NIM (kalau NIM, siapkan mapping NIM→email internal, misal `nim@evoting.local`, karena Supabase Auth berbasis email).
- **Output:** Supabase Auth aktif dan siap dipakai fungsi registrasi/login.

### B5. Setup Supabase Storage bucket
- **Yang dilakukan:** Buat 3 bucket terpisah: `foto-ktm`, `foto-vote`, `foto-kandidat`.
- **Yang diperlukan:**
  - Set bucket `foto-ktm` dan `foto-vote` sebagai **private** (akses lewat signed URL saja, tidak publik), karena berisi data wajah mahasiswa.
  - Set bucket `foto-kandidat` sebagai **public** (perlu ditampilkan ke semua mahasiswa).
  - Storage policy per bucket (siapa boleh upload, siapa boleh baca) — akan disempurnakan bareng RLS di Tahap C.
- **Output:** 3 bucket siap dipakai fungsi upload.

### B6. Setup akses WhatsApp API
- **Yang dilakukan:** Pilih provider (Twilio/Fonnte/Wablas), daftar akun, dapatkan API key & nomor pengirim.
- **Yang diperlukan:** Verifikasi bisnis (kalau pakai Twilio WhatsApp Business API perlu proses approval Meta), saldo/kredit untuk kirim pesan, template pesan OTP disetujui provider (WhatsApp mewajibkan template pre-approved untuk pesan non-sesi).
- **Output:** API key WhatsApp siap dipakai fungsi kirim OTP & notifikasi.

### B7. Setup environment terpisah (dev/staging/prod)
- **Yang dilakukan:** Buat 3 project Supabase terpisah (atau minimal 2: dev+staging digabung, prod terpisah) supaya data uji coba tidak campur data asli.
- **Yang diperlukan:** 2–3 set kredensial Supabase berbeda, file env terpisah per environment (`.env.development`, `.env.staging`, `.env.production`), penamaan project yang jelas di dashboard Supabase.
- **Output:** 3 environment terisolasi.

### B8. Setup CI/CD dasar
- **Yang dilakukan:** Buat workflow GitHub Actions untuk lint & build otomatis tiap push/PR.
- **Yang diperlukan:** File `.github/workflows/ci.yml` berisi job:
  - Untuk web: `npm install` → `npm run lint` → `npm run build`.
  - Untuk mobile: `flutter pub get` → `flutter analyze` → `flutter test`.
  - Secrets (env variable) disimpan di GitHub Secrets, bukan di file workflow.
- **Output:** Setiap PR otomatis dicek sebelum boleh di-merge.

---

## C. TAHAP DATABASE

### C1. Buat tabel `users`
- **Yang dilakukan:** Simpan data akun mahasiswa & admin.
- **Kolom kunci:** `id`, `nim`, `nama`, `wa_number`, `password_hash` (dikelola Supabase Auth), `role` (`mahasiswa`/`admin_kpu`/`pengawas_sema`), `kelas`, `jurusan`, `fakultas`, `foto_ktm_url`, `status_registrasi` (`pending`/`disetujui`/`ditolak`), `consent_data_wajah_at`, `device_id`, `created_at`.
- **Yang diperlukan:** SQL migration file di `supabase/migrations/`.

### C2. Buat tabel `periode_pemilihan`
- **Kolom kunci:** `id`, `jenjang` (Kosma/HMJ/BEM-F/SEMA-F), `fakultas_id`/`jurusan_id` (nullable kalau jenjang tingkat universitas), `tanggal_mulai`, `tanggal_selesai`, `status` (`draft`/`aktif`/`ditutup`).

### C3. Buat tabel `kandidat`
- **Kolom kunci:** `id`, `periode_id` (FK ke `periode_pemilihan`), `nomor_urut`, `nama`, `foto_url`, `visi_misi` (text).
- **Yang diperlukan:** Constraint `FOREIGN KEY (periode_id) REFERENCES periode_pemilihan(id)`.

### C4. Buat tabel `votes`
- **Kolom kunci:** `id`, `user_id` (FK), `periode_id` (FK), `kandidat_id` (FK), `foto_vote_url`, `device_id`, `hash_record`, `nomor_bukti`, `status_verifikasi` (`menunggu_verifikasi`/`terverifikasi`/`gagal_verifikasi`), `catatan_admin`, `direview_oleh`, `direview_at`, `created_at`.
- **Constraint wajib:** `UNIQUE(user_id, periode_id)` — mencegah vote ganda di periode yang sama.

### C5. Buat tabel `checkpoint_transparansi`
- **Kolom kunci:** `id`, `periode_id`, `timestamp`, `jumlah_suara_per_kandidat` (JSON atau tabel relasi terpisah), `hash_terakhir`.

### C6. Buat tabel `audit_log`
- **Kolom kunci:** `id`, `admin_id`, `aksi` (approve/reject/override/reset), `target_table`, `target_id`, `detail` (JSON, misal status lama→baru), `timestamp`.

### C7. Buat index pada kolom yang sering di-query
- **Yang diperlukan:** `CREATE INDEX ON votes(user_id); CREATE INDEX ON votes(periode_id); CREATE INDEX ON votes(status_verifikasi);` — penting untuk performa antrian verifikasi & live counter saat data sudah banyak.

### C8. Tulis RLS (Row Level Security) policy
- **Yang dilakukan:**
  - Aktifkan RLS di semua tabel (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`).
  - Policy mahasiswa: `SELECT`/`INSERT` hanya untuk baris dengan `user_id = auth.uid()`.
  - Policy admin: akses lebih luas via custom claim/role di JWT (misal cek `auth.jwt() ->> 'role' = 'admin_kpu'`).
  - Policy pengawas: `SELECT` saja ke `audit_log` dan `votes` (khusus kolom hash), tidak ada `UPDATE`/`DELETE`.
- **Yang diperlukan:** Pemahaman Supabase RLS + custom claims (bisa lewat Supabase Auth Hooks atau tabel `user_roles` terpisah).

### C9. Uji coba RLS policy dengan akun dummy
- **Yang dilakukan:** Buat 2 akun mahasiswa dummy, pastikan akun A tidak bisa `SELECT`/`UPDATE` data akun B lewat API langsung (bukan lewat aplikasi, tapi lewat request manual/Postman).
- **Yang diperlukan:** Postman dengan anon key + JWT token masing-masing akun dummy.

### C10. Buat seed data dummy
- **Yang dilakukan:** Isi data mahasiswa palsu, kandidat palsu, dan satu periode uji coba untuk keperluan development.
- **Yang diperlukan:** Script SQL seed atau Supabase CLI `supabase db seed`.

---

## D. TAHAP BACKEND / API LOGIC

*(Sebagian besar logic ini sebaiknya ditulis sebagai Supabase Edge Function (Deno/TypeScript) atau Postgres Function, bukan langsung di client, supaya validasi kritikal tidak bisa dibypass.)*

### D1. Fungsi registrasi akun
- **Yang dilakukan:** Terima input NIM → cek ke tabel whitelist → kalau valid & belum ada akun, buat draft user, generate OTP, kirim via WA.
- **Yang diperlukan:** Edge Function `register-start`, tabel `whitelist_mahasiswa` terpisah dari `users` (sesuai alur di dokumen 2, langkah A3).

### D2. Fungsi kirim OTP via WhatsApp API
- **Yang diperlukan:** Edge Function `send-otp` yang memanggil REST API provider WA (Twilio/Fonnte/Wablas), simpan OTP (hashed) + `expired_at` di tabel `otp_requests`.

### D3. Fungsi validasi OTP
- **Yang diperlukan:** Edge Function `verify-otp`, cek kecocokan hash OTP & `expired_at` (misal 5 menit), batasi jumlah percobaan (rate limit, misal maksimal 5x coba lalu OTP baru harus diminta).

### D4. Fungsi upload foto KTM
- **Yang diperlukan:** Client upload langsung ke Supabase Storage bucket `foto-ktm` pakai signed upload URL, lalu simpan path-nya ke kolom `foto_ktm_url` di `users`.

### D5. Fungsi approve/reject registrasi oleh admin
- **Yang diperlukan:** Edge Function `review-registration` (hanya bisa dipanggil role admin), update `status_registrasi`, trigger notifikasi WA, tulis ke `audit_log`.

### D6. Fungsi login
- **Yang diperlukan:** Pakai `supabase.auth.signInWithPassword()` langsung dari client (Flutter/Next.js), tidak perlu Edge Function khusus — tapi perlu fungsi tambahan untuk mapping NIM→email internal kalau login pakai NIM.

### D7. Fungsi cek periode pemilihan aktif
- **Yang diperlukan:** Query `SELECT * FROM periode_pemilihan WHERE status='aktif' AND fakultas_id = <fakultas user> AND tanggal_mulai <= now() AND tanggal_selesai >= now()`, bisa dibungkus sebagai Postgres Function/View supaya reusable.

### D8. Fungsi submit vote (inti sistem, paling kritikal)
- **Sub-langkah:**
  1. Terima foto real-time dari client, upload ke bucket `foto-vote`. (Catatan: verifikasi biometrik dan PIN dihapus, mengandalkan pengecekan manual foto selfie oleh admin).
  3. Cek constraint `UNIQUE(user_id, periode_id)` sebelum insert (di level aplikasi) — tapi constraint database tetap jadi pengaman utama untuk race condition.
  4. Insert record ke `votes` dengan `status_verifikasi = 'menunggu_verifikasi'`.
  5. Panggil fungsi hash chain (lihat D9) untuk generate `hash_record`.
  6. Generate `nomor_bukti` unik (misal kombinasi timestamp + random string).
- **Yang diperlukan:** Edge Function `submit-vote`, HARUS dijalankan sebagai satu database transaction (`BEGIN...COMMIT`) supaya insert vote + hash chain konsisten kalau ada error di tengah jalan.

### D9. Fungsi hitung hash chain
- **Yang dilakukan:** Ambil `hash_record` terakhir dalam periode yang sama, gabung dengan data vote baru (user_id, periode_id, kandidat_id, timestamp) + salt rahasia, hash pakai SHA-256.
- **Yang diperlukan:** Salt disimpan sebagai secret di environment variable server (Edge Function), bukan di database maupun client.
- **Contoh pseudocode:**
  ```
  hash_baru = SHA256(hash_terakhir + data_vote_baru + SALT)
  ```

### D10. Fungsi update device_id + notifikasi
- **Yang diperlukan:** Bandingkan `device_id` yang dikirim client dengan yang tersimpan; kalau beda, update dan trigger `send-wa-notification` (bukan blocking, sesuai dokumen 2 langkah 43).

### D11. Fungsi verifikasi manual admin
- **Yang diperlukan:** Edge Function `verify-vote`, wajib validasi `catatan_admin` tidak boleh kosong kalau hasil `gagal_verifikasi` (validasi di server, jangan andalkan validasi client saja).

### D12. Fungsi banding
- **Yang diperlukan:** Edge Function `appeal-vote`, reopen record (bukan hapus, hanya ubah status kembali bisa direview), simpan histori status lama→baru ke `audit_log`.

### D13. Fungsi reset vote
- **Yang diperlukan:** Edge Function `reset-vote`, nonaktifkan (soft-delete, tambah kolom `is_active boolean`) record lama, bukan hard-delete (supaya jejak audit tetap ada), sehingga constraint `UNIQUE` otomatis bebas untuk record baru.

### D14. Scheduled job checkpoint transparansi
- **Yang diperlukan:** Supabase Cron (`pg_cron`) atau scheduled Edge Function tiap 15 menit, menjalankan D15.

### D15. Fungsi hitung live counter
- **Yang diperlukan:** Hitung `COUNT(*) GROUP BY kandidat_id` hanya untuk `status_verifikasi='terverifikasi'`, simpan hasil + hash terakhir ke `checkpoint_transparansi`.

### D16. Middleware/logger otomatis ke audit_log
- **Yang diperlukan:** Bisa pakai Postgres trigger (`AFTER UPDATE/INSERT`) di tabel sensitif (`votes`, `users`) supaya tercatat otomatis tanpa bergantung developer ingat manual tiap tulis kode baru.

### D17. Unit test tiap fungsi
- **Yang diperlukan:** Framework testing (Deno test untuk Edge Function, atau Jest kalau logic ditulis di Next.js API route). Prioritas tertinggi: test hash chain (pastikan mengubah 1 record merusak seluruh chain setelahnya) dan test constraint anti-vote-ganda (termasuk simulasi concurrent request).

---

## E. TAHAP FRONTEND MOBILE (FLUTTER) — MAHASISWA

### E1. Setup project Flutter
- **Yang diperlukan:** `flutter create evoting_mobile`, tambah dependency: `supabase_flutter`, `camera`, `image_picker`, `flutter_dotenv`, `provider`/`riverpod` (state management).

### E2. Halaman Splash Screen & onboarding
- **Yang diperlukan:** Widget sederhana + logic cek status login (kalau sudah login, langsung ke Beranda).

### E3. Halaman Registrasi
- **Yang diperlukan:** Form input NIM, WA, password; validasi input di sisi client (format NIM, kekuatan password) sebelum kirim ke server.

### E4. Halaman verifikasi OTP
- **Yang diperlukan:** Input 6 digit OTP, countdown timer untuk resend, panggil Edge Function `verify-otp`.

### E5. Halaman consent data wajah
- **Yang diperlukan:** Teks penjelasan tujuan pemakaian foto sesuai UU PDP, checkbox **tidak boleh default tercentang**, simpan timestamp saat dicentang.

### E6. Halaman upload foto KTM
- **Yang diperlukan:** Package `image_picker` (kamera & galeri), preview sebelum submit, indikator loading saat upload ke Storage.

### E7. Halaman "Menunggu Persetujuan Admin"
- **Yang diperlukan:** Polling status atau Supabase Realtime subscription ke perubahan `status_registrasi`.

### E8. Halaman Login
- **Yang diperlukan:** Form NIM/email + password, panggil `supabase.auth.signInWithPassword()`.

### E9. Halaman Beranda
- **Yang diperlukan:** Query periode aktif sesuai jenjang user (panggil fungsi D7), tampilkan card periode/jadwal.

### E10. Halaman Daftar Kandidat
- **Yang diperlukan:** List view foto, visi-misi ringkas, nomor urut; tap untuk detail lengkap.

### E11. Halaman Konfirmasi Pilihan
- **Yang diperlukan:** Tampilkan ulang kandidat yang dipilih, tombol "Ubah" dan "Lanjut Submit" untuk mencegah salah pilih.

### E12 & E13. (Dihapus - Verifikasi Biometrik dan PIN ditiadakan)
- **Catatan:** Sesuai keputusan terbaru, lapisan keamanan biometrik/PIN dihapus untuk menyederhanakan UX (sekaligus mengakomodir PWA iOS dengan mudah). Keamanan bergantung sepenuhnya pada foto selfie real-time yang dicek manual oleh admin.

### E14. Integrasi kamera untuk foto real-time
- **Yang diperlukan:** Package `camera` (bukan `image_picker`) supaya bisa dikunci hanya live capture, matikan opsi pilih dari galeri secara eksplisit di UI dan idealnya juga divalidasi ukuran/metadata di server.

### E15. Halaman "Kartu Bukti Vote"
- **Yang diperlukan:** Tampilkan `nomor_bukti` + status, opsi screenshot/share terbatas (opsional watermark supaya tidak disalahgunakan sebagai bukti jual-beli suara).

### E16. Halaman "Cek Status Suara Saya"
- **Yang diperlukan:** Realtime subscription ke tabel `votes` filter `user_id = auth.uid()`, tampilkan status + `catatan_admin` kalau gagal.

### E17. Fitur chat/banding ke admin
- **Yang diperlukan:** Minimal viable: deep link ke WhatsApp admin (`https://wa.me/<nomor>?text=...`) dengan `nomor_bukti` ter-prefill; versi lanjutan bisa in-app chat pakai Supabase Realtime.

### E18. Halaman "Papan Transparansi" (mobile)
- **Yang diperlukan:** Query tabel `checkpoint_transparansi`, bisa diakses tanpa login (route publik, RLS policy `SELECT` untuk role `anon`).

### E19. Halaman ganti device
- **Yang diperlukan:** Alur OTP WA ulang, dan opsi eskalasi manual ke admin kalau OTP juga tidak bisa diakses (nomor WA hilang, dsb).

### E20. Uji UI di berbagai ukuran layar
- **Yang diperlukan:** Testing di emulator berbagai resolusi + minimal 2-3 device fisik low-end (karena tidak semua mahasiswa punya HP flagship).

---

## F. TAHAP FRONTEND WEB (NEXT.JS) — ADMIN & PUBLIK

### F1. Setup project Next.js
- **Yang diperlukan:** `npx create-next-app@latest evoting-web`, tambah `@supabase/supabase-js`, `@supabase/ssr`, Tailwind CSS, komponen table (bisa pakai shadcn/ui) untuk dashboard.

### F2. Halaman login admin (role-based)
- **Yang diperlukan:** Middleware Next.js cek role dari JWT setelah login, redirect sesuai role (Admin KPU vs Pengawas SEMA-F punya landing page berbeda).

### F3. Dashboard utama admin
- **Yang diperlukan:** Widget ringkasan (query count registrasi pending, vote pending, periode aktif) — bisa pakai `chart_display`-style komponen atau tabel sederhana.

### F4. Halaman kelola whitelist mahasiswa
- **Yang diperlukan:** Upload CSV/Excel (library `papaparse` untuk CSV, `xlsx`/SheetJS untuk Excel), validasi format sebelum insert massal, tampilkan laporan baris gagal.

### F5. Halaman antrian registrasi
- **Yang diperlukan:** Tabel list `status_registrasi='pending'`, tombol approve/reject + form alasan wajib diisi saat reject.

### F6. Halaman kelola periode pemilihan
- **Yang diperlukan:** Form CRUD `periode_pemilihan`, date picker untuk `tanggal_mulai`/`tanggal_selesai`, validasi tidak boleh overlap untuk jenjang yang sama.

### F7. Halaman kelola kandidat
- **Yang diperlukan:** Form CRUD `kandidat`, upload foto ke bucket `foto-kandidat` (public), rich text/textarea untuk visi-misi.

### F8. Halaman antrian verifikasi vote
- **Yang diperlukan:** Tampilkan `foto_vote_url` dan `foto_ktm_url` berdampingan (signed URL karena bucket private), tombol approve/reject + textarea `catatan_admin` wajib untuk reject.

### F9. Halaman detail banding
- **Yang diperlukan:** Riwayat komunikasi/alasan banding, tombol override status dengan konfirmasi dialog (mencegah klik tidak sengaja).

### F10. Halaman reset vote
- **Yang diperlukan:** Search record by NIM/nomor_bukti, form konfirmasi + alasan wajib, tombol eksekusi dengan double-confirmation (aksi ini sensitif).

### F11. Halaman audit log
- **Yang diperlukan:** Tabel dengan filter (by admin, tanggal, jenis aksi), pagination karena data akan besar, export ke CSV untuk laporan.

### F12. Halaman hasil publik / papan transparansi (web)
- **Yang diperlukan:** Route publik tanpa perlu login, live counter (bisa pakai Supabase Realtime atau polling interval), grafik sederhana (bisa pakai `recharts`).

### F13. Halaman khusus Pengawas SEMA-F
- **Yang diperlukan:** Akses read-only ke `audit_log` dan hash chain (`votes.hash_record`), tombol verifikasi manual hash chain (misal tools kecil yang re-hash data dan bandingkan dengan `hash_record` tersimpan).

### F14. Uji role-based access control
- **Yang diperlukan:** Testing manual + otomatis: login sebagai admin biasa coba akses halaman khusus pengawas (harus ditolak), dan sebaliknya.

---

## G. TAHAP KEAMANAN & INTEGRITAS DATA

### G1. Uji coba hash chain
- **Yang dilakukan:** Ubah satu record vote lama langsung di database (bypass aplikasi), lalu jalankan ulang perhitungan hash dari awal chain, pastikan hash di titik itu dan seterusnya tidak cocok lagi.
- **Yang diperlukan:** Script verifikasi hash chain terpisah (bisa jadi tools CLI kecil), akses langsung ke database (hanya di environment testing, bukan production).

### G2. Uji constraint UNIQUE + race condition
- **Yang diperlukan:** Script load testing yang mengirim beberapa request submit vote bersamaan dari user yang sama (misal pakai k6 atau Artillery), pastikan hanya 1 yang berhasil insert.

### G3. Load testing submit vote serentak
- **Yang diperlukan:** Tools load testing (k6, Artillery, atau JMeter), skenario simulasi jumlah mahasiswa mendekati kondisi real (misal ribuan submit dalam rentang waktu sempit), pantau response time & error rate di dashboard Supabase.

### G4. Penetration testing dasar
- **Yang diperlukan:** Checklist manual: coba akses endpoint tanpa token auth, coba pakai anon key untuk baca data user lain, coba injeksi SQL di form input, cek apakah signed URL foto bisa ditebak/expired dengan benar. Bisa juga pakai tools seperti OWASP ZAP untuk scan dasar.

### G5. Review kepatuhan UU PDP
- **Yang diperlukan:** Checklist: ada fitur permintaan hapus data (mahasiswa bisa minta akun+foto dihapus setelah periode selesai), kebijakan retensi foto tertulis jelas (berapa lama foto disimpan setelah pemilihan), teks consent sudah direview (idealnya oleh yang paham UU PDP, bukan hanya tim teknis).

### G6. Setup backup otomatis database
- **Yang diperlukan:** Supabase menyediakan automated daily backup di paket berbayar tertentu — cek plan yang dipakai; kalau perlu, tambahkan backup manual via `pg_dump` terjadwal (cron) terutama menjelang & selama periode voting.

### G7. Rencana kontinjensi kalau server down
- **Yang diperlukan:** Dokumen tertulis: siapa yang dihubungi kalau server down saat voting, apakah ada perpanjangan waktu voting otomatis, mekanisme rollback kalau ada data korup, nomor kontak on-call selama periode voting berlangsung.

---

## H. TAHAP UJI COBA (TESTING) MENYELURUH

### H1. Internal testing oleh tim developer
- **Yang diperlukan:** Checklist skenario normal + edge case (gagal verifikasi, banding, reset vote, OTP expired, device berganti, koneksi terputus saat upload foto).

### H2. UAT bersama panitia KPU Mahasiswa
- **Yang diperlukan:** Environment staging terisi data dummy, simulasi pemilihan penuh dari registrasi sampai publikasi hasil, panitia mengikuti alur sebagai "admin" sungguhan.

### H3. UAT bersama sample mahasiswa asli
- **Yang diperlukan:** 1 kelas sebagai sample, environment staging (bukan production), formulir feedback pengalaman pengguna.

### H4. Kumpulkan feedback dari UAT
- **Yang diperlukan:** Form terstruktur (Google Form cukup) + sesi diskusi langsung, catat semua bug/kendala di project management board (Tahap A7).

### H5. Perbaiki bug + regression testing
- **Yang diperlukan:** Re-run unit test (D17) dan test manual fitur terkait setelah tiap fix, supaya perbaikan tidak merusak fitur lain.

### H6. Simulasi beban penuh (stress test)
- **Yang diperlukan:** Ulangi G3 tapi dengan jumlah mendekati total mahasiswa sesungguhan di jenjang yang akan pertama kali live.

---

## I. TAHAP PERSIAPAN ROLLOUT

### I1. Sosialisasi ke mahasiswa
- **Yang diperlukan:** Materi panduan (poster/video singkat cara registrasi & voting), jadwal sosialisasi tatap muka kalau perlu, channel pengumuman resmi (WA grup angkatan, mading, media sosial kampus).

### I2. Import whitelist mahasiswa sesungguhnya
- **Yang diperlukan:** Data resmi dari bagian akademik (NIM, nama, kelas, jurusan, fakultas), diupload ke tabel whitelist production lewat fitur F4, double-check tidak ada duplikat/typo.

### I3. Training admin/panitia KPU
- **Yang diperlukan:** Sesi hands-on pakai environment staging, dokumentasi tertulis (SOP) cara pakai dashboard verifikasi, kelola periode, kelola kandidat.

### I4. Training Pengawas SEMA-F
- **Yang diperlukan:** Sesi khusus cara membaca `audit_log` dan memverifikasi hash chain secara independen, dokumentasi terpisah dari SOP admin (karena tugasnya berbeda: audit, bukan operasional).

### I5. Setup monitoring & alerting production
- **Yang diperlukan:** Tools error tracking (misal Sentry), uptime monitoring (misal UptimeRobot atau Better Uptime), alert ke WA/email tim teknis kalau ada error rate tinggi atau server down.

### I6. Jalankan periode registrasi sungguhan
- **Yang diperlukan:** Pastikan environment production sudah final (kredensial, RLS, backup aktif), buka pendaftaran sesuai jadwal yang sudah disosialisasikan.

---

## J. TAHAP PELAKSANAAN & PASCA-PEMILIHAN

### J1. Buka periode voting sesuai jadwal per jenjang
- **Yang diperlukan:** Update status `periode_pemilihan` ke `aktif` sesuai jadwal (Kosma → HMJ → BEM-F → SEMA-F, atau urutan lain yang disepakati), bisa manual atau otomatis via cron berdasarkan `tanggal_mulai`.

### J2. Monitor real-time selama voting berlangsung
- **Yang diperlukan:** Tim teknis standby memantau dashboard monitoring (I5), antrian verifikasi (F8) tidak menumpuk terlalu lama.

### J3. Pastikan checkpoint transparansi berjalan
- **Yang diperlukan:** Pantau log eksekusi cron job (D14), siapkan alert kalau checkpoint gagal jalan tiap 15 menit.

### J4. Tutup periode voting sesuai jadwal
- **Yang diperlukan:** Update status `periode_pemilihan` ke `ditutup`, pastikan tidak ada submit vote baru diterima setelah waktu tutup (validasi timestamp di server, bukan hanya sembunyikan tombol di UI).

### J5. Selesaikan sisa antrian verifikasi manual
- **Yang diperlukan:** Admin memproses semua vote `menunggu_verifikasi` yang tersisa sebelum publikasi hasil resmi.

### J6. Publikasikan hasil akhir resmi per jenjang
- **Yang diperlukan:** Update halaman Papan Transparansi (E18/F12) dengan status final, umumkan lewat channel resmi kampus.

### J7. Buka jendela waktu untuk sengketa/komplain resmi
- **Yang diperlukan:** Batas waktu jelas (misal 3x24 jam setelah hasil diumumkan), form/kanal pengaduan resmi.

### J8. Audit akhir oleh Pengawas SEMA-F
- **Yang diperlukan:** Akses ke fitur F13, verifikasi hash chain penuh dari awal sampai akhir periode, laporan hasil audit independen.

### J9. Susun laporan evaluasi pasca-pemilihan
- **Yang diperlukan:** Rangkum kendala teknis, jumlah kasus gagal verifikasi/banding/reset, waktu rata-rata verifikasi, feedback dari UAT & pelaksanaan asli — jadi bahan perbaikan periode berikutnya (masuk ke fitur fase 2 dari A2).

---

## Ringkasan Urutan Besar

```
A. Persiapan & Perencanaan
        ↓
B. Setup Infrastruktur (Supabase, Storage, WA API, CI/CD)
        ↓
C. Database (skema, RLS, seed)
        ↓
D. Backend/API Logic (registrasi, submit vote, hash chain, verifikasi)
        ↓
E + F. Frontend Mobile & Web (bisa paralel setelah D selesai fungsi intinya)
        ↓
G. Keamanan & Integritas Data
        ↓
H. Testing Menyeluruh (internal → UAT panitia → UAT mahasiswa)
        ↓
I. Persiapan Rollout (sosialisasi, training, monitoring)
        ↓
J. Pelaksanaan & Pasca-Pemilihan
```

**Catatan penting:** Tahap D (Backend) sebaiknya selesai fungsi-fungsi intinya (submit vote, hash chain, constraint anti-vote-ganda) **sebelum** Tahap E/F terlalu jauh dikerjakan, supaya frontend tidak bolak-balik menyesuaikan kontrak API yang berubah.
