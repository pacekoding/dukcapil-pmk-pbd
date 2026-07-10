DROP TABLE IF EXISTS kab_kota;

ALTER TABLE admin_users
	DROP COLUMN IF EXISTS system_access;
