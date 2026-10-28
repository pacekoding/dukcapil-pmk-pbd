CREATE TABLE admin_users (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(64) NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  role VARCHAR(32) NOT NULL,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT admin_users_username_not_blank CHECK (BTRIM(username) <> ''),
  CONSTRAINT admin_users_full_name_not_blank CHECK (BTRIM(full_name) <> ''),
  CONSTRAINT admin_users_role_check CHECK (
    role IN ('superadmin', 'admin_dukcapil', 'admin_pmk', 'admin_sekretariat')
  )
);

CREATE UNIQUE INDEX admin_users_username_unique ON admin_users (LOWER(username));
CREATE INDEX admin_users_role_idx ON admin_users (role);
CREATE INDEX admin_users_active_idx ON admin_users (is_active);

CREATE TABLE kab_kota (
  id BIGSERIAL PRIMARY KEY,
  kode_wilayah VARCHAR(32) NOT NULL,
  nama TEXT NOT NULL,
  provinsi TEXT NOT NULL DEFAULT 'Papua Barat Daya',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT kab_kota_kode_not_blank CHECK (BTRIM(kode_wilayah) <> ''),
  CONSTRAINT kab_kota_nama_not_blank CHECK (BTRIM(nama) <> ''),
  CONSTRAINT kab_kota_provinsi_not_blank CHECK (BTRIM(provinsi) <> '')
);

CREATE UNIQUE INDEX kab_kota_kode_unique ON kab_kota (LOWER(kode_wilayah));
CREATE UNIQUE INDEX kab_kota_nama_unique ON kab_kota (LOWER(nama));

CREATE TABLE stored_files (
  id BIGSERIAL PRIMARY KEY,
  module VARCHAR(64) NOT NULL,
  related_entity_type VARCHAR(96) NOT NULL,
  related_entity_id BIGINT NOT NULL,
  category VARCHAR(64) NOT NULL,
  original_filename TEXT NOT NULL,
  stored_filename TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  mime_type VARCHAR(128) NOT NULL,
  file_size BIGINT NOT NULL,
  checksum_sha256 VARCHAR(64) NOT NULL DEFAULT '',
  visibility VARCHAR(16) NOT NULL DEFAULT 'private',
  uploaded_by BIGINT REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT stored_files_storage_key_unique UNIQUE (storage_key),
  CONSTRAINT stored_files_module_not_blank CHECK (BTRIM(module) <> ''),
  CONSTRAINT stored_files_related_type_not_blank CHECK (BTRIM(related_entity_type) <> ''),
  CONSTRAINT stored_files_related_id_positive CHECK (related_entity_id > 0),
  CONSTRAINT stored_files_category_not_blank CHECK (BTRIM(category) <> ''),
  CONSTRAINT stored_files_original_filename_not_blank CHECK (BTRIM(original_filename) <> ''),
  CONSTRAINT stored_files_stored_filename_not_blank CHECK (BTRIM(stored_filename) <> ''),
  CONSTRAINT stored_files_storage_key_relative CHECK (
    BTRIM(storage_key) <> ''
    AND storage_key !~ '^/'
    AND storage_key !~ '(^|/)\.\.(/|$)'
  ),
  CONSTRAINT stored_files_size_positive CHECK (file_size > 0),
  CONSTRAINT stored_files_checksum_check CHECK (
    checksum_sha256 = '' OR checksum_sha256 ~ '^[0-9a-f]{64}$'
  ),
  CONSTRAINT stored_files_visibility_check CHECK (visibility = 'private')
);

CREATE INDEX stored_files_entity_idx
  ON stored_files (module, related_entity_type, related_entity_id)
  WHERE deleted_at IS NULL;
CREATE INDEX stored_files_category_idx ON stored_files (category) WHERE deleted_at IS NULL;
CREATE INDEX stored_files_created_idx ON stored_files (created_at DESC);
CREATE INDEX stored_files_deleted_idx ON stored_files (deleted_at);

INSERT INTO kab_kota (kode_wilayah, nama) VALUES
  ('96.71', 'Kota Sorong'),
  ('96.01', 'Kabupaten Sorong'),
  ('96.02', 'Kabupaten Sorong Selatan'),
  ('96.03', 'Kabupaten Raja Ampat'),
  ('96.04', 'Kabupaten Tambrauw'),
  ('96.05', 'Kabupaten Maybrat');
