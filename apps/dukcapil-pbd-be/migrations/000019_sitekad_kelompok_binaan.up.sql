ALTER TABLE sitekad_potensi_kampung
  ADD COLUMN IF NOT EXISTS distrik TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS nama_kelompok TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS komoditas TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS jumlah_anggota INTEGER NOT NULL DEFAULT 0;

UPDATE sitekad_potensi_kampung
SET nama_kelompok = kode
WHERE BTRIM(nama_kelompok) = '';

UPDATE sitekad_potensi_kampung AS sitekad
SET distrik = wilayah.distrik
FROM (
  SELECT DISTINCT ON (kabupaten_kota, kampung)
    kabupaten_kota,
    kampung,
    distrik
  FROM bum_kampung
  WHERE BTRIM(kabupaten_kota) <> ''
    AND BTRIM(kampung) <> ''
    AND BTRIM(distrik) <> ''
  ORDER BY kabupaten_kota, kampung, distrik
) AS wilayah
WHERE BTRIM(sitekad.distrik) = ''
  AND sitekad.kabupaten_kota = wilayah.kabupaten_kota
  AND sitekad.kampung = wilayah.kampung;

ALTER TABLE sitekad_potensi_kampung
  DROP CONSTRAINT IF EXISTS sitekad_potensi_kampung_kategori_valid;

ALTER TABLE sitekad_potensi_kampung
  ADD CONSTRAINT sitekad_potensi_kampung_kategori_valid CHECK (
    kategori_usaha IN (
      'Pertanian',
      'Perikanan',
      'Perikanan Darat',
      'Perikanan Laut',
      'Peternakan',
      'Perkebunan',
      'Pariwisata',
      'Perdagangan',
      'Kerajinan',
      'Jasa',
      'Lainnya'
    )
  ),
  ADD CONSTRAINT sitekad_potensi_kampung_jumlah_anggota_nonnegative CHECK (
    jumlah_anggota >= 0
  );

CREATE INDEX IF NOT EXISTS idx_sitekad_potensi_kampung_distrik
  ON sitekad_potensi_kampung (distrik);

CREATE INDEX IF NOT EXISTS idx_sitekad_potensi_kampung_nama_kelompok
  ON sitekad_potensi_kampung (nama_kelompok);
