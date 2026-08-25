-- Migration untuk mengubah semua referensi BEM-F menjadi DEMA-F

-- 1. Update data yang sudah ada di tabel periode_pemilihan
UPDATE periode_pemilihan SET jenjang = 'DEMA-F' WHERE jenjang = 'BEM-F';

-- 2. Hapus constraint lama dan buat yang baru
ALTER TABLE periode_pemilihan DROP CONSTRAINT IF EXISTS periode_pemilihan_jenjang_check;
ALTER TABLE periode_pemilihan ADD CONSTRAINT periode_pemilihan_jenjang_check 
  CHECK (jenjang IN ('Kosma', 'HMJ', 'DEMA-F', 'SEMA-F', 'Universitas'));

-- 3. Update Trigger check_vote_validity dari file 20260824_vote_hash_logic.sql
CREATE OR REPLACE FUNCTION check_vote_validity()
RETURNS trigger AS $$
DECLARE
  v_periode_jenjang VARCHAR;
  v_periode_sasaran VARCHAR;
  v_user_fakultas VARCHAR;
  v_user_jurusan VARCHAR;
  v_sudah_vote BOOLEAN;
BEGIN
  -- Ambil info periode
  SELECT jenjang, fakultas_id INTO v_periode_jenjang, v_periode_sasaran
  FROM periode_pemilihan WHERE id = NEW.periode_id;

  -- Ambil info user
  SELECT fakultas, jurusan INTO v_user_fakultas, v_user_jurusan
  FROM whitelist_mahasiswa WHERE nim = (SELECT nim FROM users WHERE id = NEW.user_id);

  -- 1. Validasi Fakultas (DEMA-F / SEMA-F)
  IF (v_periode_jenjang = 'DEMA-F' OR v_periode_jenjang = 'SEMA-F') AND v_periode_sasaran IS NOT NULL AND v_periode_sasaran != v_user_fakultas THEN
    RAISE EXCEPTION 'Mahasiswa tidak berhak memilih di DEMA/SEMA fakultas ini';
  END IF;

  -- 2. Validasi Jurusan (HMJ / Kosma)
  IF (v_periode_jenjang = 'HMJ' OR v_periode_jenjang = 'Kosma') AND v_periode_sasaran IS NOT NULL AND v_periode_sasaran != v_user_jurusan THEN
    RAISE EXCEPTION 'Mahasiswa tidak berhak memilih di HMJ/Kosma jurusan ini';
  END IF;

  -- 3. Cek double voting
  SELECT EXISTS (
    SELECT 1 FROM votes 
    WHERE user_id = NEW.user_id AND periode_id = NEW.periode_id
  ) INTO v_sudah_vote;

  IF v_sudah_vote THEN
    RAISE EXCEPTION 'Mahasiswa sudah memberikan suara untuk periode ini';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Update fungsi get_dashboard_stats
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_periode_id UUID DEFAULT NULL)
RETURNS TABLE (
  status_verifikasi VARCHAR,
  count BIGINT
) AS $$
DECLARE
  v_fakultas VARCHAR;
BEGIN
  -- If specific periode is requested
  IF p_periode_id IS NOT NULL THEN
    RETURN QUERY
    SELECT v.status_verifikasi, count(*) 
    FROM votes v
    WHERE v.periode_id = p_periode_id
    GROUP BY v.status_verifikasi;
    RETURN;
  END IF;

  -- If global stats requested, it only includes DEMA-F and SEMA-F across the faculty (Saintek)
  v_fakultas := 'Sains dan Teknologi';
  
  RETURN QUERY
  SELECT v.status_verifikasi, count(*)
  FROM votes v
  JOIN periode_pemilihan p ON v.periode_id = p.id
  WHERE (p.jenjang IN ('DEMA-F', 'SEMA-F') AND (p.fakultas_id IS NULL OR p.fakultas_id = '' OR p.fakultas_id = v_fakultas))
  GROUP BY v.status_verifikasi;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
