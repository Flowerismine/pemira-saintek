-- 1. Fungsi untuk Mengambil Live Stats (Aman, Bypassing RLS dengan SECURITY DEFINER)
CREATE OR REPLACE FUNCTION get_live_stats_for_user()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_jurusan VARCHAR;
  v_fakultas VARCHAR;
  v_result jsonb;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Ambil data jurusan/fakultas milik user
  SELECT jurusan, fakultas INTO v_jurusan, v_fakultas FROM users WHERE id = v_user_id;

  -- Susun array hasil perhitungan agregat suara masuk per periode
  SELECT jsonb_agg(
    jsonb_build_object(
      'periode_id', p.id,
      'jenjang', p.jenjang,
      'fakultas_id', p.fakultas_id,
      'jurusan_id', p.jurusan_id,
      'suara_masuk', (SELECT count(*) FROM votes v WHERE v.periode_id = p.id),
      'total_dpt', (
         -- Hitung Total DPT berdasarkan cakupan periode
         CASE 
           WHEN p.jenjang = 'HMJ' THEN 
             (SELECT count(*) FROM whitelist_mahasiswa w WHERE w.jurusan = p.jurusan_id)
           WHEN p.jenjang = 'BEM-F' OR p.jenjang = 'SEMA-F' THEN
             (SELECT count(*) FROM whitelist_mahasiswa w WHERE p.fakultas_id IS NULL OR w.fakultas = p.fakultas_id)
           ELSE 
             (SELECT count(*) FROM whitelist_mahasiswa)
         END
      )
    )
  ) INTO v_result
  FROM periode_pemilihan p
  WHERE p.status = 'aktif'
    AND (
      (p.jenjang = 'HMJ' AND p.jurusan_id = v_jurusan)
      OR
      (p.jenjang IN ('BEM-F', 'SEMA-F') AND (p.fakultas_id IS NULL OR p.fakultas_id = '' OR p.fakultas_id = v_fakultas))
      OR
      (p.jenjang = 'Universitas')
    );

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;
