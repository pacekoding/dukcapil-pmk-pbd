CREATE TABLE IF NOT EXISTS aspirasiku_messages (
  id BIGSERIAL PRIMARY KEY,
  jenis TEXT NOT NULL,
  judul TEXT NOT NULL DEFAULT '',
  isi TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Baru',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT aspirasiku_messages_jenis_check CHECK (
    jenis IN ('Saran', 'Masukan', 'Keluhan', 'Pendapat', 'Lainnya')
  ),
  CONSTRAINT aspirasiku_messages_status_check CHECK (
    status IN ('Baru', 'Dibaca', 'Selesai')
  ),
  CONSTRAINT aspirasiku_messages_isi_not_blank CHECK (BTRIM(isi) <> ''),
  CONSTRAINT aspirasiku_messages_isi_length CHECK (CHAR_LENGTH(isi) <= 1000),
  CONSTRAINT aspirasiku_messages_judul_length CHECK (CHAR_LENGTH(judul) <= 160)
);

CREATE INDEX IF NOT EXISTS idx_aspirasiku_messages_status_created
  ON aspirasiku_messages (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_aspirasiku_messages_jenis_created
  ON aspirasiku_messages (jenis, created_at DESC);

INSERT INTO portal_app_statuses (access_key, status)
VALUES ('aspirasiku', 'Aktif')
ON CONFLICT (access_key) DO NOTHING;
