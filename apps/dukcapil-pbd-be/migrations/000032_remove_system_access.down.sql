ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS system_access TEXT[] NOT NULL DEFAULT '{}';

UPDATE admin_users
SET system_access = CASE role
  WHEN 'superadmin' THEN ARRAY['sibum', 'sikampung', 'sitekad', 'siber', 'arsip_pegawai']::TEXT[]
  WHEN 'admin_pmk' THEN ARRAY['sibum', 'sikampung', 'sitekad']::TEXT[]
  WHEN 'admin_dukcapil' THEN ARRAY['siber']::TEXT[]
  WHEN 'admin_sekretariat' THEN ARRAY['arsip_pegawai']::TEXT[]
  ELSE ARRAY[]::TEXT[]
END;
