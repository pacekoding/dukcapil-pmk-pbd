ALTER TABLE admin_users
	ADD COLUMN IF NOT EXISTS system_access TEXT[] NOT NULL DEFAULT '{}';

UPDATE admin_users
SET system_access = ARRAY['sibum', 'sikampung', 'sidoka', 'arsip_pegawai']
WHERE role = 'superadmin' AND (system_access IS NULL OR cardinality(system_access) = 0);

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
