CREATE TABLE organisasi_bidang (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL CHECK (BTRIM(REGEXP_REPLACE(name, '\s+', ' ', 'g')) <> ''),
  code TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX organisasi_bidang_name_unique
  ON organisasi_bidang (LOWER(BTRIM(REGEXP_REPLACE(name, '\s+', ' ', 'g'))));

CREATE TABLE organisasi_seksi (
  id BIGSERIAL PRIMARY KEY,
  bidang_id BIGINT NOT NULL REFERENCES organisasi_bidang(id) ON DELETE RESTRICT,
  name TEXT NOT NULL CHECK (BTRIM(REGEXP_REPLACE(name, '\s+', ' ', 'g')) <> ''),
  code TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (id, bidang_id)
);
CREATE UNIQUE INDEX organisasi_seksi_name_unique
  ON organisasi_seksi (bidang_id, LOWER(BTRIM(REGEXP_REPLACE(name, '\s+', ' ', 'g'))));

CREATE TABLE organisasi_jabatan (
  id BIGSERIAL PRIMARY KEY,
  bidang_id BIGINT NOT NULL REFERENCES organisasi_bidang(id) ON DELETE RESTRICT,
  seksi_id BIGINT,
  name TEXT NOT NULL CHECK (BTRIM(REGEXP_REPLACE(name, '\s+', ' ', 'g')) <> ''),
  code TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (id, bidang_id),
  FOREIGN KEY (seksi_id, bidang_id)
    REFERENCES organisasi_seksi(id, bidang_id) ON DELETE RESTRICT
);
CREATE UNIQUE INDEX organisasi_jabatan_name_unique
  ON organisasi_jabatan (
    bidang_id,
    COALESCE(seksi_id, 0),
    LOWER(BTRIM(REGEXP_REPLACE(name, '\s+', ' ', 'g')))
  );
CREATE INDEX organisasi_jabatan_seksi_idx ON organisasi_jabatan (seksi_id);

CREATE TABLE arsip_pegawai (
  id BIGSERIAL PRIMARY KEY,
  bidang_id BIGINT REFERENCES organisasi_bidang(id) ON DELETE RESTRICT,
  seksi_id BIGINT,
  jabatan_id BIGINT,
  nip VARCHAR(32) NOT NULL,
  nik VARCHAR(32) NOT NULL DEFAULT '',
  nama TEXT NOT NULL,
  tempat_lahir TEXT NOT NULL DEFAULT '',
  tanggal_lahir DATE,
  jabatan TEXT NOT NULL DEFAULT '',
  bidang TEXT NOT NULL DEFAULT '',
  unit TEXT NOT NULL DEFAULT '',
  pangkat_golongan TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  telepon TEXT NOT NULL DEFAULT '',
  no_rekening TEXT NOT NULL DEFAULT '',
  alamat TEXT NOT NULL DEFAULT '',
  status VARCHAR(16) NOT NULL DEFAULT 'Aktif',
  photo_color TEXT NOT NULL DEFAULT 'bg-blue-100 text-blue-700',
  photo_file_id BIGINT REFERENCES stored_files(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT arsip_pegawai_nip_not_blank CHECK (BTRIM(nip) <> ''),
  CONSTRAINT arsip_pegawai_nama_not_blank CHECK (BTRIM(nama) <> ''),
  CONSTRAINT arsip_pegawai_status_check CHECK (status IN ('Aktif', 'Nonaktif', 'Cuti', 'Mutasi')),
  CONSTRAINT arsip_pegawai_seksi_bidang_fk FOREIGN KEY (seksi_id, bidang_id)
    REFERENCES organisasi_seksi(id, bidang_id) ON DELETE RESTRICT,
  CONSTRAINT arsip_pegawai_jabatan_bidang_fk FOREIGN KEY (jabatan_id, bidang_id)
    REFERENCES organisasi_jabatan(id, bidang_id) ON DELETE RESTRICT,
  CONSTRAINT arsip_pegawai_organization_parent_check CHECK (
    (seksi_id IS NULL AND jabatan_id IS NULL) OR bidang_id IS NOT NULL
  )
);

CREATE UNIQUE INDEX arsip_pegawai_nip_unique ON arsip_pegawai (LOWER(nip));
CREATE INDEX arsip_pegawai_nama_idx ON arsip_pegawai (LOWER(nama));
CREATE INDEX arsip_pegawai_bidang_text_idx ON arsip_pegawai (LOWER(bidang));
CREATE INDEX arsip_pegawai_bidang_idx ON arsip_pegawai (bidang_id);
CREATE INDEX arsip_pegawai_seksi_idx ON arsip_pegawai (seksi_id);
CREATE INDEX arsip_pegawai_jabatan_idx ON arsip_pegawai (jabatan_id);
CREATE INDEX arsip_pegawai_photo_file_idx ON arsip_pegawai (photo_file_id);
