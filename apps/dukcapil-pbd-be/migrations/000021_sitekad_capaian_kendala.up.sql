CREATE TABLE IF NOT EXISTS sitekad_capaian_kendala (
  id BIGSERIAL PRIMARY KEY,
  kelompok_id BIGINT NOT NULL REFERENCES sitekad_potensi_kampung(id) ON DELETE CASCADE,
  nama_capaian TEXT NOT NULL,
  tahun_binaan VARCHAR(4) NOT NULL,
  deskripsi_capaian TEXT NOT NULL,
  kendala_hambatan TEXT NOT NULL DEFAULT '',
  dokumentasi_urls TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT sitekad_capaian_kendala_nama_not_blank CHECK (BTRIM(nama_capaian) <> ''),
  CONSTRAINT sitekad_capaian_kendala_tahun_check CHECK (tahun_binaan ~ '^\d{4}$'),
  CONSTRAINT sitekad_capaian_kendala_deskripsi_not_blank CHECK (BTRIM(deskripsi_capaian) <> ''),
  CONSTRAINT sitekad_capaian_kendala_dokumentasi_limit CHECK (CARDINALITY(dokumentasi_urls) <= 3)
);

CREATE INDEX IF NOT EXISTS idx_sitekad_capaian_kendala_kelompok
  ON sitekad_capaian_kendala (kelompok_id);

CREATE INDEX IF NOT EXISTS idx_sitekad_capaian_kendala_tahun
  ON sitekad_capaian_kendala (tahun_binaan);

CREATE INDEX IF NOT EXISTS idx_sitekad_capaian_kendala_updated
  ON sitekad_capaian_kendala (updated_at DESC, id DESC);

-- Pertahankan capaian/kendala lama sebagai entri riwayat pertama kelompok.
INSERT INTO sitekad_capaian_kendala (
  kelompok_id,
  nama_capaian,
  tahun_binaan,
  deskripsi_capaian,
  kendala_hambatan
)
SELECT
  id,
  CASE
    WHEN BTRIM(capaian_utama) <> '' THEN 'Capaian Awal ' || nama_kelompok
    ELSE 'Catatan Awal ' || nama_kelompok
  END,
  TO_CHAR(COALESCE(updated_at, created_at, NOW()), 'YYYY'),
  CASE
    WHEN BTRIM(capaian_utama) <> '' THEN BTRIM(capaian_utama)
    ELSE 'Capaian kelompok belum dicatat.'
  END,
  BTRIM(kendala_lapangan)
FROM sitekad_potensi_kampung
WHERE BTRIM(capaian_utama) <> '' OR BTRIM(kendala_lapangan) <> '';

ALTER TABLE sitekad_potensi_kampung
  DROP COLUMN IF EXISTS capaian_utama,
  DROP COLUMN IF EXISTS kendala_lapangan;
