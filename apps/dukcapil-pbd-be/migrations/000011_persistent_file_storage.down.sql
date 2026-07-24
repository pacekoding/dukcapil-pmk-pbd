ALTER TABLE arsip DROP CONSTRAINT IF EXISTS arsip_file_fk;
DROP INDEX IF EXISTS idx_arsip_file;
ALTER TABLE arsip DROP COLUMN IF EXISTS file_id;

ALTER TABLE optima_info_articles
  DROP CONSTRAINT IF EXISTS optima_info_articles_thumbnail_file_fk,
  DROP CONSTRAINT IF EXISTS optima_info_articles_attachment_file_fk;
DROP INDEX IF EXISTS idx_optima_info_articles_thumbnail_file;
DROP INDEX IF EXISTS idx_optima_info_articles_attachment_file;
ALTER TABLE optima_info_articles
  DROP COLUMN IF EXISTS thumbnail_file_id,
  DROP COLUMN IF EXISTS attachment_file_id;

ALTER TABLE maceku_pkk_archives
  DROP CONSTRAINT IF EXISTS maceku_pkk_archives_file_fk;
DROP INDEX IF EXISTS idx_maceku_pkk_archives_file;
ALTER TABLE maceku_pkk_archives DROP COLUMN IF EXISTS file_id;

ALTER TABLE maceku_pkk_profiles
  DROP CONSTRAINT IF EXISTS maceku_pkk_profiles_logo_file_fk;
DROP INDEX IF EXISTS idx_maceku_pkk_profiles_logo_file;
ALTER TABLE maceku_pkk_profiles DROP COLUMN IF EXISTS logo_file_id;

DROP TABLE IF EXISTS stored_files;
