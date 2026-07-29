CREATE TABLE IF NOT EXISTS sikampung_data (
	id BIGSERIAL PRIMARY KEY,
	tahun_anggaran VARCHAR(4) NOT NULL,
	kode_desa VARCHAR(32) NOT NULL,
	desa TEXT NOT NULL,
	distrik TEXT NOT NULL,
	kabupaten TEXT NOT NULL,
	iks NUMERIC(6, 4) NOT NULL DEFAULT 0,
	ike NUMERIC(6, 4) NOT NULL DEFAULT 0,
	ikl NUMERIC(6, 4) NOT NULL DEFAULT 0,
	nilai_idm NUMERIC(6, 4) NOT NULL DEFAULT 0,
	status_idm VARCHAR(32) NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT sikampung_data_tahun_anggaran_check CHECK (tahun_anggaran ~ '^\d{4}$'),
	CONSTRAINT sikampung_data_kode_desa_not_blank_check CHECK (BTRIM(kode_desa) <> ''),
	CONSTRAINT sikampung_data_desa_not_blank_check CHECK (BTRIM(desa) <> ''),
	CONSTRAINT sikampung_data_distrik_not_blank_check CHECK (BTRIM(distrik) <> ''),
	CONSTRAINT sikampung_data_kabupaten_not_blank_check CHECK (BTRIM(kabupaten) <> ''),
	CONSTRAINT sikampung_data_index_range_check CHECK (
		iks >= 0 AND iks <= 1 AND
		ike >= 0 AND ike <= 1 AND
		ikl >= 0 AND ikl <= 1 AND
		nilai_idm >= 0 AND nilai_idm <= 1
	),
	CONSTRAINT sikampung_data_status_idm_check CHECK (
		status_idm IN ('Mandiri', 'Maju', 'Berkembang', 'Tertinggal', 'Sangat Tertinggal')
	)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sikampung_data_tahun_kode_unique
	ON sikampung_data(tahun_anggaran, LOWER(kode_desa));

CREATE INDEX IF NOT EXISTS idx_sikampung_data_tahun_kabupaten
	ON sikampung_data(tahun_anggaran, kabupaten);

CREATE INDEX IF NOT EXISTS idx_sikampung_data_tahun_status
	ON sikampung_data(tahun_anggaran, status_idm);
