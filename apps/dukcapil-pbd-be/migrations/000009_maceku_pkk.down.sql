DELETE FROM portal_app_statuses WHERE access_key = 'maceku_pkk';

DROP TABLE IF EXISTS maceku_pkk_archives;
DROP TABLE IF EXISTS maceku_pkk_profiles;

ALTER TABLE admin_users
  DROP COLUMN IF EXISTS wilayah_kampung,
  DROP COLUMN IF EXISTS wilayah_distrik,
  DROP COLUMN IF EXISTS wilayah_kabupaten_kota;
