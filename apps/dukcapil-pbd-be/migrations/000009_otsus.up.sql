BEGIN;

CREATE TABLE labelisasi_otsus (
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
  CONSTRAINT labelisasi_otsus_year_subkegiatan_unique UNIQUE (tahun_anggaran, subkegiatan_id)
);

CREATE INDEX labelisasi_otsus_year_search_idx ON labelisasi_otsus (tahun_anggaran, subkegiatan_id, status);

CREATE TABLE dokumentasi_otsus (
  id BIGSERIAL PRIMARY KEY,
  otsus_label_id BIGINT NOT NULL REFERENCES labelisasi_otsus(id) ON DELETE CASCADE,
  file_id BIGINT NOT NULL UNIQUE REFERENCES stored_files(id) ON DELETE RESTRICT,
  caption TEXT NOT NULL DEFAULT '',
  created_by BIGINT NOT NULL REFERENCES admin_users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX dokumentasi_otsus_label_idx ON dokumentasi_otsus (otsus_label_id, created_at DESC);

CREATE TABLE lpj_otsus (
  id BIGSERIAL PRIMARY KEY,
  otsus_label_id BIGINT NOT NULL UNIQUE REFERENCES labelisasi_otsus(id) ON DELETE CASCADE,
  file_id BIGINT NOT NULL UNIQUE REFERENCES stored_files(id) ON DELETE RESTRICT,
  created_by BIGINT NOT NULL REFERENCES admin_users(id) ON DELETE RESTRICT,
  updated_by BIGINT NOT NULL REFERENCES admin_users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE versi_dpa_otsus (
  id BIGSERIAL PRIMARY KEY,
  otsus_label_id BIGINT NOT NULL REFERENCES labelisasi_otsus(id) ON DELETE CASCADE,
  jenis TEXT NOT NULL CHECK (jenis IN ('AWAL', 'PERGESERAN', 'PERUBAHAN')),
  versi INTEGER NOT NULL CHECK (versi > 0),
  file_id BIGINT NOT NULL UNIQUE REFERENCES stored_files(id) ON DELETE RESTRICT,
  catatan TEXT NOT NULL DEFAULT '',
  uploaded_by BIGINT NOT NULL REFERENCES admin_users(id) ON DELETE RESTRICT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT otsus_dpa_label_version_unique UNIQUE (otsus_label_id, versi)
);
CREATE INDEX versi_dpa_otsus_label_idx ON versi_dpa_otsus (otsus_label_id, versi DESC);

COMMIT;
