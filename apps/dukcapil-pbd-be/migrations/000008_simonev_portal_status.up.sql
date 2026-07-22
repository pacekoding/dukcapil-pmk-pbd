INSERT INTO portal_app_statuses (access_key, status)
VALUES ('simonev', 'Aktif')
ON CONFLICT (access_key) DO NOTHING;
