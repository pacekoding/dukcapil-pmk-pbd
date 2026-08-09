DROP INDEX IF EXISTS idx_sitekad_potensi_kampung_nama_kelompok;
DROP INDEX IF EXISTS idx_sitekad_potensi_kampung_distrik;

ALTER TABLE sitekad_potensi_kampung
  DROP CONSTRAINT IF EXISTS sitekad_potensi_kampung_jumlah_anggota_nonnegative,
  DROP CONSTRAINT IF EXISTS sitekad_potensi_kampung_kategori_valid;

UPDATE sitekad_potensi_kampung
SET kategori_usaha = 'Perikanan'
WHERE kategori_usaha IN ('Perikanan Darat', 'Perikanan Laut');

ALTER TABLE sitekad_potensi_kampung
  ADD CONSTRAINT sitekad_potensi_kampung_kategori_valid CHECK (
    kategori_usaha IN (
      'Pertanian',
      'Perikanan',
      'Peternakan',
      'Perkebunan',
      'Pariwisata',
      'Perdagangan',
      'Kerajinan',
      'Jasa',
      'Lainnya'
    )
  ),
  DROP COLUMN IF EXISTS jumlah_anggota,
  DROP COLUMN IF EXISTS komoditas,
  DROP COLUMN IF EXISTS nama_kelompok,
  DROP COLUMN IF EXISTS distrik;
