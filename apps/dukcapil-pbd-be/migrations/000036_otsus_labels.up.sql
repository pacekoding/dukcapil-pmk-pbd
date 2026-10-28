BEGIN;

CREATE TABLE otsus_labels (
  id BIGSERIAL PRIMARY KEY,
  tahun_anggaran VARCHAR(4) NOT NULL CHECK (tahun_anggaran ~ '^[0-9]{4}$'),
  subkegiatan_id BIGINT NOT NULL REFERENCES subkegiatan(id) ON DELETE RESTRICT,
  pagu BIGINT NOT NULL CHECK (pagu >= 0),
  realisasi BIGINT NOT NULL CHECK (realisasi >= 0 AND realisasi <= pagu),
  status TEXT NOT NULL CHECK (status IN ('BELUM_MULAI', 'BERJALAN', 'SELESAI')),
  keterangan TEXT NOT NULL DEFAULT '',
  created_by BIGINT NOT NULL REFERENCES admin_users(id) ON DELETE RESTRICT,
  updated_by BIGINT NOT NULL REFERENCES admin_users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT otsus_labels_year_subkegiatan_unique UNIQUE (tahun_anggaran, subkegiatan_id)
);

CREATE INDEX otsus_labels_year_search_idx ON otsus_labels (tahun_anggaran, subkegiatan_id, status);

CREATE TABLE otsus_documentations (
  id BIGSERIAL PRIMARY KEY,
  otsus_label_id BIGINT NOT NULL REFERENCES otsus_labels(id) ON DELETE CASCADE,
  file_id BIGINT NOT NULL UNIQUE REFERENCES stored_files(id) ON DELETE RESTRICT,
  caption TEXT NOT NULL DEFAULT '',
  created_by BIGINT NOT NULL REFERENCES admin_users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX otsus_documentations_label_idx ON otsus_documentations (otsus_label_id, created_at DESC);

CREATE TABLE otsus_lpj (
  id BIGSERIAL PRIMARY KEY,
  otsus_label_id BIGINT NOT NULL UNIQUE REFERENCES otsus_labels(id) ON DELETE CASCADE,
  file_id BIGINT NOT NULL UNIQUE REFERENCES stored_files(id) ON DELETE RESTRICT,
  created_by BIGINT NOT NULL REFERENCES admin_users(id) ON DELETE RESTRICT,
  updated_by BIGINT NOT NULL REFERENCES admin_users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE otsus_dpa_versions (
  id BIGSERIAL PRIMARY KEY,
  otsus_label_id BIGINT NOT NULL REFERENCES otsus_labels(id) ON DELETE CASCADE,
  jenis TEXT NOT NULL CHECK (jenis IN ('AWAL', 'PERGESERAN', 'PERUBAHAN')),
  versi INTEGER NOT NULL CHECK (versi > 0),
  file_id BIGINT NOT NULL UNIQUE REFERENCES stored_files(id) ON DELETE RESTRICT,
  catatan TEXT NOT NULL DEFAULT '',
  uploaded_by BIGINT NOT NULL REFERENCES admin_users(id) ON DELETE RESTRICT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT otsus_dpa_label_version_unique UNIQUE (otsus_label_id, versi)
);
CREATE INDEX otsus_dpa_versions_label_idx ON otsus_dpa_versions (otsus_label_id, versi DESC);

COMMIT;
