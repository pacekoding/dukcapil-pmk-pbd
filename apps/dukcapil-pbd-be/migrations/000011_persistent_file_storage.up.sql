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
  CONSTRAINT stored_files_visibility_check CHECK (visibility IN ('public', 'private')),
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

ALTER TABLE maceku_pkk_profiles
  ADD COLUMN IF NOT EXISTS logo_file_id BIGINT;
ALTER TABLE maceku_pkk_profiles
  ADD CONSTRAINT maceku_pkk_profiles_logo_file_fk
  FOREIGN KEY (logo_file_id) REFERENCES stored_files(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_maceku_pkk_profiles_logo_file
  ON maceku_pkk_profiles (logo_file_id);

ALTER TABLE maceku_pkk_archives
  ADD COLUMN IF NOT EXISTS file_id BIGINT;
ALTER TABLE maceku_pkk_archives
  ADD CONSTRAINT maceku_pkk_archives_file_fk
  FOREIGN KEY (file_id) REFERENCES stored_files(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_maceku_pkk_archives_file
  ON maceku_pkk_archives (file_id)
  WHERE file_id IS NOT NULL;

ALTER TABLE optima_info_articles
  ADD COLUMN IF NOT EXISTS thumbnail_file_id BIGINT,
  ADD COLUMN IF NOT EXISTS attachment_file_id BIGINT;
ALTER TABLE optima_info_articles
  ADD CONSTRAINT optima_info_articles_thumbnail_file_fk
  FOREIGN KEY (thumbnail_file_id) REFERENCES stored_files(id) ON DELETE SET NULL;
ALTER TABLE optima_info_articles
  ADD CONSTRAINT optima_info_articles_attachment_file_fk
  FOREIGN KEY (attachment_file_id) REFERENCES stored_files(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_optima_info_articles_thumbnail_file
  ON optima_info_articles (thumbnail_file_id);
CREATE INDEX IF NOT EXISTS idx_optima_info_articles_attachment_file
  ON optima_info_articles (attachment_file_id);

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
  'maceku-pkk',
  'maceku_pkk_profile',
  p.id,
  'logo',
  p.logo_original_name,
  REGEXP_REPLACE(
    CASE
      WHEN p.logo_url LIKE '/uploads/%' THEN SUBSTRING(p.logo_url FROM 10)
      ELSE SUBSTRING(p.logo_url FROM 9)
    END,
    '^.*/',
    ''
  ),
  CASE
    WHEN p.logo_url LIKE '/uploads/%' THEN SUBSTRING(p.logo_url FROM 10)
    ELSE SUBSTRING(p.logo_url FROM 9)
  END,
  p.logo_mime_type,
  p.logo_size,
  'private',
  p.created_at,
  p.updated_at
FROM maceku_pkk_profiles p
WHERE p.logo_url ~ '^/?uploads/'
  AND p.logo_size > 0
  AND BTRIM(p.logo_original_name) <> ''
ON CONFLICT (storage_key) DO NOTHING;

UPDATE maceku_pkk_profiles p
SET logo_file_id = f.id
FROM stored_files f
WHERE f.module = 'maceku-pkk'
  AND f.related_entity_type = 'maceku_pkk_profile'
  AND f.related_entity_id = p.id
  AND f.category = 'logo'
  AND f.deleted_at IS NULL;

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
  uploaded_by,
  created_at,
  updated_at
)
SELECT
  'maceku-pkk',
  'maceku_pkk_archive',
  a.id,
  CASE a.kategori_arsip
    WHEN 'Program Kerja' THEN 'program-kerja'
    WHEN 'LKPJ' THEN 'lkpj'
    WHEN 'Laporan Kegiatan' THEN 'laporan-kegiatan'
    WHEN 'Surat Keputusan' THEN 'sk'
    WHEN 'Data Kepengurusan' THEN 'kepengurusan'
    ELSE 'lainnya'
  END,
  a.original_name,
  REGEXP_REPLACE(
    CASE
      WHEN a.file_url LIKE '/uploads/%' THEN SUBSTRING(a.file_url FROM 10)
      ELSE SUBSTRING(a.file_url FROM 9)
    END,
    '^.*/',
    ''
  ),
  CASE
    WHEN a.file_url LIKE '/uploads/%' THEN SUBSTRING(a.file_url FROM 10)
    ELSE SUBSTRING(a.file_url FROM 9)
  END,
  a.mime_type,
  a.size,
  'private',
  a.uploaded_by_user_id,
  a.created_at,
  a.updated_at
FROM maceku_pkk_archives a
WHERE a.file_url ~ '^/?uploads/'
  AND a.size > 0
  AND BTRIM(a.original_name) <> ''
ON CONFLICT (storage_key) DO NOTHING;

UPDATE maceku_pkk_archives a
SET file_id = f.id
FROM stored_files f
WHERE f.module = 'maceku-pkk'
  AND f.related_entity_type = 'maceku_pkk_archive'
  AND f.related_entity_id = a.id
  AND f.deleted_at IS NULL;

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
  uploaded_by,
  created_at,
  updated_at
)
SELECT
  'optima-info',
  'optima_info_article',
  a.id,
  'thumbnail',
  a.thumbnail_original_name,
  REGEXP_REPLACE(
    CASE
      WHEN a.thumbnail_url LIKE '/uploads/%' THEN SUBSTRING(a.thumbnail_url FROM 10)
      ELSE SUBSTRING(a.thumbnail_url FROM 9)
    END,
    '^.*/',
    ''
  ),
  CASE
    WHEN a.thumbnail_url LIKE '/uploads/%' THEN SUBSTRING(a.thumbnail_url FROM 10)
    ELSE SUBSTRING(a.thumbnail_url FROM 9)
  END,
  a.thumbnail_mime_type,
  a.thumbnail_size,
  CASE WHEN a.status = 'Published' THEN 'public' ELSE 'private' END,
  a.author_user_id,
  a.created_at,
  a.updated_at
FROM optima_info_articles a
WHERE a.thumbnail_url ~ '^/?uploads/'
  AND a.thumbnail_size > 0
  AND BTRIM(a.thumbnail_original_name) <> ''
ON CONFLICT (storage_key) DO NOTHING;

UPDATE optima_info_articles a
SET thumbnail_file_id = f.id
FROM stored_files f
WHERE f.module = 'optima-info'
  AND f.related_entity_type = 'optima_info_article'
  AND f.related_entity_id = a.id
  AND f.category = 'thumbnail'
  AND f.deleted_at IS NULL;

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
  uploaded_by,
  created_at,
  updated_at
)
SELECT
  'optima-info',
  'optima_info_article',
  a.id,
  'attachment',
  a.attachment_original_name,
  REGEXP_REPLACE(
    CASE
      WHEN a.attachment_url LIKE '/uploads/%' THEN SUBSTRING(a.attachment_url FROM 10)
      ELSE SUBSTRING(a.attachment_url FROM 9)
    END,
    '^.*/',
    ''
  ),
  CASE
    WHEN a.attachment_url LIKE '/uploads/%' THEN SUBSTRING(a.attachment_url FROM 10)
    ELSE SUBSTRING(a.attachment_url FROM 9)
  END,
  a.attachment_mime_type,
  a.attachment_size,
  CASE WHEN a.status = 'Published' THEN 'public' ELSE 'private' END,
  a.author_user_id,
  a.created_at,
  a.updated_at
FROM optima_info_articles a
WHERE a.attachment_url ~ '^/?uploads/'
  AND a.attachment_size > 0
  AND BTRIM(a.attachment_original_name) <> ''
ON CONFLICT (storage_key) DO NOTHING;

UPDATE optima_info_articles a
SET attachment_file_id = f.id
FROM stored_files f
WHERE f.module = 'optima-info'
  AND f.related_entity_type = 'optima_info_article'
  AND f.related_entity_id = a.id
  AND f.category = 'attachment'
  AND f.deleted_at IS NULL;

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
  CASE
    WHEN a.sumber_aplikasi = 'arsip_pegawai' THEN 'arsip_pegawai_document'
    ELSE 'pelaksanaan_document'
  END,
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
  AND f.related_entity_type = CASE
    WHEN a.sumber_aplikasi = 'arsip_pegawai' THEN 'arsip_pegawai_document'
    ELSE 'pelaksanaan_document'
  END
  AND f.deleted_at IS NULL;
