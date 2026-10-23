CREATE TABLE IF NOT EXISTS stored_files (
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
  visibility VARCHAR(16) NOT NULL,
  uploaded_by BIGINT,
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
  CONSTRAINT stored_files_visibility_check CHECK (visibility = 'private'),
  CONSTRAINT stored_files_uploaded_by_fk
    FOREIGN KEY (uploaded_by) REFERENCES admin_users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_stored_files_module_entity
  ON stored_files (module, related_entity_type, related_entity_id)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_stored_files_category
  ON stored_files (category)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_stored_files_visibility
  ON stored_files (visibility)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_stored_files_created_at
  ON stored_files (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stored_files_deleted_at
  ON stored_files (deleted_at);

ALTER TABLE arsip
  ADD COLUMN IF NOT EXISTS file_id BIGINT;
ALTER TABLE arsip
  ADD CONSTRAINT arsip_file_fk
  FOREIGN KEY (file_id) REFERENCES stored_files(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_arsip_file
  ON arsip (file_id)
  WHERE file_id IS NOT NULL;

INSERT INTO stored_files (
  module,
  related_entity_type,
  related_entity_id,
  category,
  original_filename,
  stored_filename,
  storage_key,
  mime_type,
  file_size,
  visibility,
  created_at,
  updated_at
)
SELECT
  'arsip',
  'arsip_pegawai_document',
  a.id,
  a.sumber_aplikasi,
  a.original_name,
  REGEXP_REPLACE(
    CASE
      WHEN a.url LIKE '/uploads/%' THEN SUBSTRING(a.url FROM 10)
      ELSE SUBSTRING(a.url FROM 9)
    END,
    '^.*/',
    ''
  ),
  CASE
    WHEN a.url LIKE '/uploads/%' THEN SUBSTRING(a.url FROM 10)
    ELSE SUBSTRING(a.url FROM 9)
  END,
  a.mime_type,
  a.size,
  'private',
  a.created_at,
  a.created_at
FROM arsip a
WHERE a.url ~ '^/?uploads/'
  AND a.size > 0
  AND BTRIM(a.original_name) <> ''
ON CONFLICT (storage_key) DO NOTHING;

UPDATE arsip a
SET file_id = f.id
FROM stored_files f
WHERE f.module = 'arsip'
  AND f.related_entity_id = a.id
  AND f.related_entity_type = 'arsip_pegawai_document'
  AND f.deleted_at IS NULL;
