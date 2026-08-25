# 🚀 Resume Progress E-Voting Pemira Saintek (Hingga 25 Agustus 2026)

Dokumen ini merekam titik terakhir progres pengembangan aplikasi kita sebelum tahap pengujian mandiri (*end-to-end testing*) oleh Anda.

## 🛠️ Pencapaian Teknis Terakhir

1. **Bug Perizinan Mobile & Build Berhasil**
   - Konflik `lucide_icons` di Flutter versi terbaru telah dicabut dan diganti penuh dengan Material Icons.
   - Izin `<uses-permission android:name="android.permission.INTERNET" />` dan `CAMERA` telah ditambahkan ke dalam `AndroidManifest.xml` agar HP bisa menembus jaringan server.
   - File instalasi (`app-release.apk`) berukuran 50.8 MB telah siap uji di: `mobile/build/app/outputs/flutter-apk/app-release.apk`.

2. **Infrastruktur Cloud (Supabase) Mengudara**
   - Anda berhasil men-*deploy* Edge Functions (`request-otp` dan `verify-otp`) ke Supabase versi awan Anda (Project `vdphlanneoyqnnmsvtrx`).
   - Keranjang Penyimpanan (*Storage Buckets*) untuk `foto-ktm`, `foto-kandidat`, dan `foto-vote` telah dibentuk secara manual melalui SQL Editor di awan, lengkap dengan kunci RLS-nya.

3. **Portal Verifikasi KYC di Web Admin**
   - Halaman **"Antrian KYC"** telah berhasil ditambahkan ke menu *Registrasi Mahasiswa* di Web Admin.
   - Telah dibangun jalur khusus (API Route `/api/approve-kyc`) menggunakan `Service Role Key` agar Admin KPU di Web bisa menyetujui mahasiswa menembus batasan RLS *anon*.

4. **Data Dummy DPT**
   - Telah disediakan `dummy_whitelist.csv` yang berisi 20 sampel mahasiswa dari berbagai jurusan untuk pengujian *login*.

---

## 🧪 Skenario Pengujian Mandiri Anda Selanjutnya

Nanti setelah istirahat, ikuti rute ini untuk memastikan semua lorong data berjalan mulus:

1. **HP:** Buka aplikasi dan masukkan NIM + No WA Anda yang ada di data *dummy*.
2. **Cloud:** Cek *Dashboard Supabase* -> Tabel `otp_requests` untuk mengintip 6 digit kode OTP rahasia.
3. **HP:** Masukkan OTP, lalu potret/ambil foto sembarang sebagai simulasi foto KTM.
4. **HP:** Layar akan berubah menjadi *Menunggu Persetujuan Admin*.
5. **Laptop (Web):** Buka Web Admin (`localhost:3000`), masuk ke tab **Antrian KYC**.
6. **Laptop (Web):** Klik tombol **Setujui** pada foto Anda.
7. **HP:** Tonton layar HP Anda! Ia harusnya akan memproses respon secara seketika (*real-time*) dan langsung membuka pintu ke **Dashboard Pemilihan**.

---
*Semoga istirahat Anda berkualitas! Jangan ragu untuk mencoret-coret dan merusak datanya dalam uji coba nanti. Berikan saya feedback tanpa ampun mengenai pengalaman Anda di uji coba tersebut. Sampai jumpa! ☕💤*
