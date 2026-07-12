CREATE TABLE IF NOT EXISTS sitekad_potensi_kampung (
  id BIGSERIAL PRIMARY KEY,
  kode VARCHAR(64) NOT NULL UNIQUE,
  kabupaten_kota TEXT NOT NULL,
  kampung TEXT NOT NULL,
  kategori_usaha TEXT NOT NULL,
  dana_alokasi BIGINT NOT NULL DEFAULT 0,
  capaian_utama TEXT NOT NULL DEFAULT '',
  kendala_lapangan TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT sitekad_potensi_kampung_kode_not_blank CHECK (BTRIM(kode) <> ''),
  CONSTRAINT sitekad_potensi_kampung_kabupaten_not_blank CHECK (BTRIM(kabupaten_kota) <> ''),
  CONSTRAINT sitekad_potensi_kampung_kampung_not_blank CHECK (BTRIM(kampung) <> ''),
  CONSTRAINT sitekad_potensi_kampung_dana_nonnegative CHECK (dana_alokasi >= 0),
  CONSTRAINT sitekad_potensi_kampung_kategori_valid CHECK (
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
  )
);

CREATE INDEX IF NOT EXISTS idx_sitekad_potensi_kampung_kabupaten
  ON sitekad_potensi_kampung (kabupaten_kota);

CREATE INDEX IF NOT EXISTS idx_sitekad_potensi_kampung_kategori
  ON sitekad_potensi_kampung (kategori_usaha);

INSERT INTO portal_app_statuses (access_key, status)
VALUES ('sitekad', 'Aktif')
ON CONFLICT (access_key) DO NOTHING;
