CREATE TABLE IF NOT EXISTS portal_app_statuses (
	access_key TEXT PRIMARY KEY,
	status TEXT NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT portal_app_statuses_status_check CHECK (status IN ('Aktif', 'Pemeliharaan', 'Nonaktif')),
	CONSTRAINT portal_app_statuses_access_key_not_blank_check CHECK (BTRIM(access_key) <> '')
);

INSERT INTO portal_app_statuses (access_key, status)
VALUES
	('sibum', 'Aktif'),
	('sikampung', 'Pemeliharaan'),
	('sidoka', 'Pemeliharaan'),
	('sidak', 'Pemeliharaan'),
	('arsip_pegawai', 'Pemeliharaan')
ON CONFLICT (access_key) DO NOTHING;
