CREATE TABLE IF NOT EXISTS admin_users (
	id BIGSERIAL PRIMARY KEY,
	username VARCHAR(64) NOT NULL UNIQUE,
	full_name VARCHAR(120) NOT NULL,
	role VARCHAR(32) NOT NULL,
	system_access TEXT[] NOT NULL DEFAULT '{}',
	password_hash TEXT NOT NULL,
	is_active BOOLEAN NOT NULL DEFAULT TRUE,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT admin_users_role_check CHECK (
		role IN ('superadmin', 'admin_dukcapil', 'admin_pmk', 'admin_sekretariat')
	)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_username_lower ON admin_users (LOWER(username));
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);

CREATE TABLE IF NOT EXISTS kab_kota (
	id BIGSERIAL PRIMARY KEY,
	kode_wilayah VARCHAR(32) NOT NULL,
	nama TEXT NOT NULL,
	provinsi TEXT NOT NULL DEFAULT 'Papua Barat Daya',
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT kab_kota_kode_not_blank_check CHECK (BTRIM(kode_wilayah) <> ''),
	CONSTRAINT kab_kota_nama_not_blank_check CHECK (BTRIM(nama) <> ''),
	CONSTRAINT kab_kota_provinsi_not_blank_check CHECK (BTRIM(provinsi) <> '')
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_kab_kota_kode_unique ON kab_kota(LOWER(kode_wilayah));
CREATE UNIQUE INDEX IF NOT EXISTS idx_kab_kota_nama_unique ON kab_kota(LOWER(nama));

CREATE TABLE IF NOT EXISTS data_wilayah (
	tahun_anggaran VARCHAR(4) NOT NULL,
	id VARCHAR(64) NOT NULL,
	sort_order INTEGER NOT NULL DEFAULT 0,
	name TEXT NOT NULL,
	short_name TEXT NOT NULL,
	region_type VARCHAR(16) NOT NULL,
	map_label TEXT NOT NULL,
	idm_sangat_tertinggal INTEGER NOT NULL DEFAULT 0,
	idm_tertinggal INTEGER NOT NULL DEFAULT 0,
	idm_berkembang INTEGER NOT NULL DEFAULT 0,
	idm_maju INTEGER NOT NULL DEFAULT 0,
	idm_mandiri INTEGER NOT NULL DEFAULT 0,
	bumdes_jumlah INTEGER NOT NULL DEFAULT 0,
	bumdes_aktif INTEGER NOT NULL DEFAULT 0,
	bumdes_tidak_aktif INTEGER NOT NULL DEFAULT 0,
	bumdes_bersama INTEGER NOT NULL DEFAULT 0,
	registration_penerbitan_kk INTEGER NOT NULL DEFAULT 0,
	registration_perubahan_kk INTEGER NOT NULL DEFAULT 0,
	registration_kia INTEGER NOT NULL DEFAULT 0,
	registration_nik_wni INTEGER NOT NULL DEFAULT 0,
	registration_perekaman_ktp_el INTEGER NOT NULL DEFAULT 0,
	registration_pencetakan_ktp_el INTEGER NOT NULL DEFAULT 0,
	oap_luas_wilayah NUMERIC(12, 2) NOT NULL DEFAULT 0,
	oap_jumlah_oap INTEGER NOT NULL DEFAULT 0,
	oap_jumlah_non_oap INTEGER NOT NULL DEFAULT 0,
	oap_jumlah_jiwa INTEGER NOT NULL DEFAULT 0,
	civil_akta_kelahiran INTEGER NOT NULL DEFAULT 0,
	civil_akta_kematian INTEGER NOT NULL DEFAULT 0,
	civil_akta_perkawinan INTEGER NOT NULL DEFAULT 0,
	civil_akta_perceraian INTEGER NOT NULL DEFAULT 0,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	PRIMARY KEY (tahun_anggaran, id),
	CONSTRAINT data_wilayah_tahun_anggaran_check CHECK (tahun_anggaran ~ '^\d{4}$'),
	CONSTRAINT data_wilayah_region_type_check CHECK (region_type IN ('Kabupaten', 'Kota')),
	CONSTRAINT data_wilayah_non_negative_check CHECK (
		idm_sangat_tertinggal >= 0 AND idm_tertinggal >= 0 AND idm_berkembang >= 0 AND idm_maju >= 0 AND idm_mandiri >= 0 AND
		bumdes_jumlah >= 0 AND bumdes_aktif >= 0 AND bumdes_tidak_aktif >= 0 AND bumdes_bersama >= 0 AND
		registration_penerbitan_kk >= 0 AND registration_perubahan_kk >= 0 AND registration_kia >= 0 AND registration_nik_wni >= 0 AND
		registration_perekaman_ktp_el >= 0 AND registration_pencetakan_ktp_el >= 0 AND
		oap_luas_wilayah >= 0 AND oap_jumlah_oap >= 0 AND oap_jumlah_non_oap >= 0 AND oap_jumlah_jiwa >= 0 AND
		civil_akta_kelahiran >= 0 AND civil_akta_kematian >= 0 AND civil_akta_perkawinan >= 0 AND civil_akta_perceraian >= 0
	)
);

CREATE INDEX IF NOT EXISTS idx_data_wilayah_tahun_sort_order ON data_wilayah(tahun_anggaran, sort_order);

CREATE TABLE IF NOT EXISTS data_wilayah_public_settings (
	id SMALLINT PRIMARY KEY DEFAULT 1,
	featured_tahun_anggaran VARCHAR(4) NOT NULL,
	published_tahun_anggaran TEXT[] NOT NULL DEFAULT '{}',
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT data_wilayah_public_settings_singleton CHECK (id = 1),
	CONSTRAINT data_wilayah_public_settings_featured_check CHECK (featured_tahun_anggaran ~ '^\d{4}$')
);

CREATE TABLE IF NOT EXISTS subkegiatan (
	id BIGSERIAL PRIMARY KEY,
	tahun_anggaran VARCHAR(4) NOT NULL,
	kode VARCHAR(64) NOT NULL,
	nama TEXT NOT NULL,
	bidang VARCHAR(16) NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT subkegiatan_tahun_anggaran_check CHECK (tahun_anggaran ~ '^\d{4}$'),
	CONSTRAINT subkegiatan_bidang_check CHECK (bidang IN ('dukcapil', 'pmk', 'umum')),
	CONSTRAINT subkegiatan_kode_not_blank_check CHECK (BTRIM(kode) <> ''),
	CONSTRAINT subkegiatan_nama_not_blank_check CHECK (BTRIM(nama) <> '')
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subkegiatan_tahun_kode_unique ON subkegiatan(tahun_anggaran, LOWER(kode));
CREATE UNIQUE INDEX IF NOT EXISTS idx_subkegiatan_tahun_id_unique ON subkegiatan(tahun_anggaran, id);
CREATE INDEX IF NOT EXISTS idx_subkegiatan_tahun_bidang ON subkegiatan(tahun_anggaran, bidang);

CREATE TABLE IF NOT EXISTS ssd (
	id BIGSERIAL PRIMARY KEY,
	tahun_anggaran VARCHAR(4) NOT NULL,
	kode VARCHAR(64) NOT NULL,
	uraian TEXT NOT NULL,
	satuan VARCHAR(120) NOT NULL DEFAULT '',
	definisi_operasional TEXT NOT NULL DEFAULT '',
	is_active BOOLEAN NOT NULL DEFAULT FALSE,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT ssd_tahun_anggaran_check CHECK (tahun_anggaran ~ '^\d{4}$'),
	CONSTRAINT ssd_kode_not_blank_check CHECK (BTRIM(kode) <> ''),
	CONSTRAINT ssd_uraian_not_blank_check CHECK (BTRIM(uraian) <> '')
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ssd_tahun_kode_unique ON ssd(tahun_anggaran, LOWER(kode));
CREATE UNIQUE INDEX IF NOT EXISTS idx_ssd_tahun_id_unique ON ssd(tahun_anggaran, id);
CREATE INDEX IF NOT EXISTS idx_ssd_tahun_active ON ssd(tahun_anggaran, is_active);

CREATE TABLE IF NOT EXISTS subkegiatan_ssd (
	subkegiatan_id BIGINT NOT NULL,
	ssd_id BIGINT NOT NULL,
	tahun_anggaran VARCHAR(4) NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	PRIMARY KEY (subkegiatan_id, ssd_id),
	CONSTRAINT subkegiatan_ssd_tahun_anggaran_check CHECK (tahun_anggaran ~ '^\d{4}$'),
	CONSTRAINT subkegiatan_ssd_subkegiatan_fk FOREIGN KEY (tahun_anggaran, subkegiatan_id) REFERENCES subkegiatan(tahun_anggaran, id) ON DELETE CASCADE,
	CONSTRAINT subkegiatan_ssd_ssd_fk FOREIGN KEY (tahun_anggaran, ssd_id) REFERENCES ssd(tahun_anggaran, id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_subkegiatan_ssd_tahun_subkegiatan ON subkegiatan_ssd(tahun_anggaran, subkegiatan_id);
CREATE INDEX IF NOT EXISTS idx_subkegiatan_ssd_tahun_ssd ON subkegiatan_ssd(tahun_anggaran, ssd_id);

CREATE TABLE IF NOT EXISTS pelaksanaan_documents (
	id BIGSERIAL PRIMARY KEY,
	tahun_anggaran VARCHAR(4) NOT NULL,
	subkegiatan_id BIGINT,
	nama TEXT NOT NULL,
	original_name TEXT NOT NULL,
	mime_type TEXT NOT NULL,
	size BIGINT NOT NULL DEFAULT 0,
	url TEXT NOT NULL,
	is_dokumen_dssd BOOLEAN NOT NULL DEFAULT FALSE,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT pelaksanaan_documents_tahun_anggaran_check CHECK (tahun_anggaran ~ '^\d{4}$'),
	CONSTRAINT pelaksanaan_documents_nama_not_blank_check CHECK (BTRIM(nama) <> ''),
	CONSTRAINT pelaksanaan_documents_original_name_not_blank_check CHECK (BTRIM(original_name) <> ''),
	CONSTRAINT pelaksanaan_documents_size_non_negative_check CHECK (size >= 0),
	CONSTRAINT pelaksanaan_documents_subkegiatan_fk FOREIGN KEY (tahun_anggaran, subkegiatan_id) REFERENCES subkegiatan(tahun_anggaran, id) ON DELETE SET NULL (subkegiatan_id)
);

CREATE INDEX IF NOT EXISTS idx_pelaksanaan_documents_tahun_created ON pelaksanaan_documents(tahun_anggaran, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pelaksanaan_documents_subkegiatan ON pelaksanaan_documents(tahun_anggaran, subkegiatan_id);
CREATE INDEX IF NOT EXISTS idx_pelaksanaan_documents_is_dssd ON pelaksanaan_documents(tahun_anggaran, is_dokumen_dssd);

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

INSERT INTO admin_users (
	username,
	full_name,
	role,
	system_access,
	password_hash,
	is_active
) VALUES (
	'superadmin',
	'Super Admin',
	'superadmin',
	ARRAY['sibum', 'sikampung', 'sidoka', 'sidak', 'arsip_pegawai']::TEXT[],
	'$2a$10$3dHI5XvIZcE4b8BLaZgxyem2NYo1a1WaNfPS4yptzzv8ipjIUxMbi',
	TRUE
)
ON CONFLICT (username) DO NOTHING;

INSERT INTO kab_kota (kode_wilayah, nama, provinsi) VALUES
	('96.71', 'Kota Sorong', 'Papua Barat Daya'),
	('96.01', 'Kabupaten Sorong', 'Papua Barat Daya'),
	('96.02', 'Kabupaten Sorong Selatan', 'Papua Barat Daya'),
	('96.03', 'Kabupaten Raja Ampat', 'Papua Barat Daya'),
	('96.04', 'Kabupaten Tambrauw', 'Papua Barat Daya'),
	('96.05', 'Kabupaten Maybrat', 'Papua Barat Daya')
ON CONFLICT DO NOTHING;
