CREATE TABLE IF NOT EXISTS admin_users (
	id BIGSERIAL PRIMARY KEY,
	username VARCHAR(64) NOT NULL UNIQUE,
	full_name VARCHAR(120) NOT NULL,
	role VARCHAR(32) NOT NULL,
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

INSERT INTO data_wilayah (
	tahun_anggaran, id, sort_order, name, short_name, region_type, map_label,
	idm_sangat_tertinggal, idm_tertinggal, idm_berkembang, idm_maju, idm_mandiri,
	bumdes_jumlah, bumdes_aktif, bumdes_tidak_aktif, bumdes_bersama,
	registration_penerbitan_kk, registration_perubahan_kk, registration_kia, registration_nik_wni, registration_perekaman_ktp_el, registration_pencetakan_ktp_el,
	oap_luas_wilayah, oap_jumlah_oap, oap_jumlah_non_oap, oap_jumlah_jiwa,
	civil_akta_kelahiran, civil_akta_kematian, civil_akta_perkawinan, civil_akta_perceraian
) VALUES
	('2025', 'kabupaten-sorong', 1, 'Kabupaten Sorong', 'Sorong', 'Kabupaten', 'Kab. Sorong', 60, 80, 66, 3, 0, 0, 0, 0, 0, 4311, 8945, 3861, 2756, 2511, 21637, 6544.23, 54379, 76322, 130701, 4213, 947, 390, 21),
	('2025', 'kota-sorong', 2, 'Kota Sorong', 'Kota Sorong', 'Kota', 'Kota Sorong', 0, 0, 0, 0, 0, 0, 0, 0, 0, 9376, 14612, 1490, 4627, 4418, 27136, 656.64, 77487, 209765, 287252, 7208, 1941, 1118, 47),
	('2025', 'raja-ampat', 3, 'Kabupaten Raja Ampat', 'Raja Ampat', 'Kabupaten', 'Raja Ampat', 16, 33, 75, 6, 0, 0, 0, 0, 0, 2688, 4543, 1997, 1713, 1466, 10624, 8034.44, 53035, 20713, 73748, 3998, 545, 741, 2),
	('2025', 'sorong-selatan', 4, 'Kabupaten Sorong Selatan', 'Sorong Selatan', 'Kabupaten', 'Sorong Selatan', 28, 40, 73, 4, 0, 0, 0, 0, 0, 1342, 2568, 680, 1570, 880, 6031, 6594.31, 46829, 10684, 57513, 2571, 323, 359, 5),
	('2025', 'maybrat', 5, 'Kabupaten Maybrat', 'Maybrat', 'Kabupaten', 'Maybrat', 107, 128, 59, 1, 0, 0, 0, 0, 0, 1230, 3222, 190, 696, 505, 5220, 5461.69, 43178, 3626, 46804, 1775, 300, 203, 4),
	('2025', 'tambrauw', 6, 'Kabupaten Tambrauw', 'Tambrauw', 'Kabupaten', 'Tambrauw', 202, 64, 19, 0, 0, 0, 0, 0, 0, 631, 1253, 1025, 596, 330, 2861, 11529.18, 21302, 10086, 31388, 830, 120, 101, 1)
ON CONFLICT (tahun_anggaran, id) DO NOTHING;

INSERT INTO data_wilayah_public_settings (
	id,
	featured_tahun_anggaran,
	published_tahun_anggaran
) VALUES (
	1,
	'2025',
	ARRAY['2025']::TEXT[]
)
ON CONFLICT (id) DO NOTHING;
