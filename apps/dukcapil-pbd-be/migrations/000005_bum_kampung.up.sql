CREATE TABLE IF NOT EXISTS bum_kampung (
	id BIGSERIAL PRIMARY KEY,
	tahun_anggaran VARCHAR(4) NOT NULL,
	kabupaten_kota TEXT NOT NULL,
	distrik TEXT NOT NULL,
	kampung TEXT NOT NULL,
	nama_bum_kampung TEXT NOT NULL,
	kategori VARCHAR(32) NOT NULL,
	status VARCHAR(64) NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT bum_kampung_tahun_anggaran_check CHECK (tahun_anggaran ~ '^\d{4}$'),
	CONSTRAINT bum_kampung_kabupaten_kota_not_blank_check CHECK (BTRIM(kabupaten_kota) <> ''),
	CONSTRAINT bum_kampung_distrik_not_blank_check CHECK (BTRIM(distrik) <> ''),
	CONSTRAINT bum_kampung_kampung_not_blank_check CHECK (BTRIM(kampung) <> ''),
	CONSTRAINT bum_kampung_nama_not_blank_check CHECK (BTRIM(nama_bum_kampung) <> ''),
	CONSTRAINT bum_kampung_kategori_check CHECK (kategori IN ('BUMKam', 'BUMKam bersama')),
	CONSTRAINT bum_kampung_status_check CHECK (
		status IN (
			'Dokumen Badan Hukum Terverifikasi',
			'Nama Terverifikasi',
			'Perbaikan Dokumen Badan Hukum',
			'Perbaikan Nama'
		)
	)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_bum_kampung_tahun_nama_unique
	ON bum_kampung(tahun_anggaran, LOWER(kabupaten_kota), LOWER(distrik), LOWER(kampung), LOWER(nama_bum_kampung));

CREATE INDEX IF NOT EXISTS idx_bum_kampung_tahun_kabupaten
	ON bum_kampung(tahun_anggaran, kabupaten_kota);

CREATE INDEX IF NOT EXISTS idx_bum_kampung_tahun_status
	ON bum_kampung(tahun_anggaran, status);
