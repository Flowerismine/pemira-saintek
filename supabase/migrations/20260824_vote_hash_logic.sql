-- 1. Mengaktifkan ekstensi pgcrypto untuk fungsi SHA256
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Membuat Mesin Kriptografi (Stored Procedure)
CREATE OR REPLACE FUNCTION submit_vote_secure(
  p_periode_id UUID,
  p_kandidat_id UUID,
  p_foto_url TEXT,
  p_device_id TEXT
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER -- Berjalan dengan hak akses penuh agar bisa mem-bypass RLS insert
AS $$
DECLARE
  v_user_id UUID;
  v_status_registrasi VARCHAR;
  v_last_hash TEXT;
  v_new_hash TEXT;
  v_nomor_bukti TEXT;
  v_vote_id UUID;
  v_secret_salt TEXT := 'KPU_SAINTEK_SECRET_2026';
  v_user_jurusan VARCHAR;
  v_user_fakultas VARCHAR;
  v_periode_jenjang VARCHAR;
  v_periode_sasaran VARCHAR;
BEGIN
  -- 0. Dapatkan ID pengguna yang sedang login dari token JWT
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Gagal: Sesi tidak sah. Anda harus login.';
  END IF;

  -- A. Validasi Status Registrasi dan Ambil Data Jurusan
  SELECT status_registrasi, jurusan, fakultas 
  INTO v_status_registrasi, v_user_jurusan, v_user_fakultas 
  FROM users WHERE id = v_user_id;
  
  IF v_status_registrasi != 'disetujui' THEN
    RAISE EXCEPTION 'Gagal: Status registrasi Anda belum disetujui oleh KPU.';
  END IF;

  -- A2. Validasi Hak Pilih Lintas Jurusan/Fakultas
  SELECT jenjang, fakultas_id INTO v_periode_jenjang, v_periode_sasaran FROM periode_pemilihan WHERE id = p_periode_id;
  
  IF v_periode_jenjang = 'HMJ' AND v_periode_sasaran != v_user_jurusan THEN
    RAISE EXCEPTION 'Gagal: Kecurangan Terdeteksi! Anda mencoba memberikan suara pada jurusan (%) yang tidak sesuai dengan data terdaftar Anda (%).', v_periode_sasaran, v_user_jurusan;
  END IF;

  IF (v_periode_jenjang = 'BEM-F' OR v_periode_jenjang = 'SEMA-F') AND v_periode_sasaran IS NOT NULL AND v_periode_sasaran != v_user_fakultas THEN
    RAISE EXCEPTION 'Gagal: Anda tidak berhak memilih di Fakultas ini.';
  END IF;

  -- B. Validasi Anti-Vote-Ganda
  IF EXISTS (SELECT 1 FROM votes WHERE user_id = v_user_id AND periode_id = p_periode_id) THEN
    RAISE EXCEPTION 'Gagal: Anda sudah pernah memberikan suara pada periode ini. Kecurangan terdeteksi.';
  END IF;

  -- C. Kriptografi: Mengambil Hash Terakhir secara Sekuensial (Antrian Ketat)
  -- Perintah "FOR UPDATE" memastikan jika ada 1000 mahasiswa vote bersamaan,
  -- database akan memprosesnya satu per satu layaknya antrian kasir,
  -- sehingga rantai hash tidak akan bercabang/rusak.
  SELECT hash_record INTO v_last_hash 
  FROM votes 
  ORDER BY created_at DESC 
  LIMIT 1 
  FOR UPDATE;
  
  -- Jika ini adalah suara pertama di dunia (Genesis)
  IF v_last_hash IS NULL THEN
    v_last_hash := 'GENESIS_BLOCK_2026_SAINTEK';
  END IF;

  -- D. Menyiapkan Data Suara Baru
  v_vote_id := gen_random_uuid();
  -- Membuat nomor resi acak (misal BKT-2026-X8F2A)
  v_nomor_bukti := 'BKT-2026-' || upper(substr(md5(random()::text), 1, 5));
  
  -- E. Menghitung Hash Baru (SHA256)
  -- Rumus: SHA256(Hash Lama + ID Vote Baru + ID HP + Kunci Rahasia)
  v_new_hash := encode(digest(v_last_hash || v_vote_id::text || p_device_id || v_secret_salt, 'sha256'), 'hex');

  -- F. Memasukkan Suara ke Kotak Suara (Database)
  INSERT INTO votes (
    id, user_id, periode_id, kandidat_id, foto_vote_url, device_id, hash_record, nomor_bukti, status_verifikasi
  ) VALUES (
    v_vote_id, v_user_id, p_periode_id, p_kandidat_id, p_foto_url, p_device_id, v_new_hash, v_nomor_bukti, 'menunggu_verifikasi'
  );

  -- G. Mengembalikan resi ke aplikasi HP
  RETURN jsonb_build_object(
    'success', true, 
    'nomor_bukti', v_nomor_bukti, 
    'hash', v_new_hash,
    'message', 'Suara berhasil diamankan ke dalam rantai kriptografi.'
  );
END;
$$;
