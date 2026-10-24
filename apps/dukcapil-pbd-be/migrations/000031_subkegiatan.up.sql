CREATE TABLE IF NOT EXISTS subkegiatan (
  id BIGSERIAL PRIMARY KEY,
  bidang TEXT NOT NULL,
  program TEXT NOT NULL,
  kegiatan TEXT NOT NULL,
  subkegiatan TEXT NOT NULL,
  kinerja TEXT NOT NULL,
  indikator TEXT NOT NULL,
  satuan TEXT NOT NULL,
  definisi_operasional TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subkegiatan_unique_hierarchy
  ON subkegiatan (
    LOWER(bidang),
    LOWER(program),
    LOWER(kegiatan),
    LOWER(subkegiatan)
  );
