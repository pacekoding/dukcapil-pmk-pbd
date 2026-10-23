DELETE FROM stored_files
WHERE module IN ('optima-info', 'maceku-pkk')
   OR (module = 'arsip' AND related_entity_type = 'pelaksanaan_document');

UPDATE stored_files
SET visibility = 'private', updated_at = NOW()
WHERE visibility <> 'private';

ALTER TABLE stored_files
  DROP CONSTRAINT IF EXISTS stored_files_visibility_check;

ALTER TABLE stored_files
  ADD CONSTRAINT stored_files_visibility_check CHECK (visibility = 'private');

DELETE FROM arsip
WHERE sumber_aplikasi IN ('sidoka', 'sidak');

ALTER TABLE arsip
  DROP CONSTRAINT IF EXISTS arsip_subkegiatan_fk,
  DROP CONSTRAINT IF EXISTS arsip_sumber_aplikasi_check;

DROP INDEX IF EXISTS idx_arsip_subkegiatan;
DROP INDEX IF EXISTS idx_arsip_is_dssd;

ALTER TABLE arsip
  DROP COLUMN IF EXISTS subkegiatan_id,
  DROP COLUMN IF EXISTS is_dokumen_dssd;

ALTER TABLE arsip
  ADD CONSTRAINT arsip_sumber_aplikasi_check
  CHECK (sumber_aplikasi = 'arsip_pegawai');

DROP TABLE IF EXISTS aspirasiku_messages;
DROP TABLE IF EXISTS outgoing_letters;
DROP TABLE IF EXISTS maceku_pkk_archives;
DROP TABLE IF EXISTS maceku_pkk_profiles;
DROP TABLE IF EXISTS optima_info_articles;
DROP TABLE IF EXISTS subkegiatan_ssd;
DROP TABLE IF EXISTS ssd;
DROP TABLE IF EXISTS subkegiatan;

DELETE FROM portal_app_statuses
WHERE access_key IN (
  'aspirasiku',
  'sidoka',
  'sidak',
  'sisurat',
  'simonev',
  'optima_info',
  'maceku_pkk'
);

UPDATE admin_users
SET system_access = ARRAY(
  SELECT access_key
  FROM UNNEST(system_access) AS access_key
  WHERE access_key NOT IN (
    'aspirasiku',
    'sidoka',
    'sidak',
    'sisurat',
    'simonev',
    'optima_info',
    'maceku_pkk'
  )
),
updated_at = NOW();

ALTER TABLE admin_users
  DROP COLUMN IF EXISTS wilayah_kampung,
  DROP COLUMN IF EXISTS wilayah_distrik,
  DROP COLUMN IF EXISTS wilayah_kabupaten_kota;
