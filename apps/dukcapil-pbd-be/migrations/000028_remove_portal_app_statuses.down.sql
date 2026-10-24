CREATE TABLE IF NOT EXISTS portal_app_statuses (
  access_key VARCHAR(64) PRIMARY KEY,
  status VARCHAR(32) NOT NULL DEFAULT 'Aktif',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT portal_app_statuses_status_check
    CHECK (status IN ('Aktif', 'Pemeliharaan', 'Nonaktif')),
  CONSTRAINT portal_app_statuses_access_key_not_blank_check
    CHECK (BTRIM(access_key) <> '')
);

INSERT INTO portal_app_statuses (access_key, status) VALUES
  ('sibum', 'Aktif'),
  ('sikampung', 'Pemeliharaan'),
  ('sitekad', 'Aktif'),
  ('siber', 'Aktif'),
  ('arsip_pegawai', 'Pemeliharaan')
ON CONFLICT (access_key) DO NOTHING;
