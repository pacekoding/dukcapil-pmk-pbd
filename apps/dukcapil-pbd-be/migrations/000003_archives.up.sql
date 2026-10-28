CREATE TABLE arsip (
  id BIGSERIAL PRIMARY KEY,
  tahun_anggaran VARCHAR(4) NOT NULL,
  sumber_aplikasi VARCHAR(32) NOT NULL DEFAULT 'arsip_pegawai',
  bidang VARCHAR(16) NOT NULL,
  pegawai_id BIGINT REFERENCES arsip_pegawai(id) ON DELETE CASCADE,
  nama TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size BIGINT NOT NULL DEFAULT 0,
  url TEXT NOT NULL DEFAULT '',
  file_id BIGINT REFERENCES stored_files(id) ON DELETE SET NULL,
  kategori TEXT NOT NULL DEFAULT '',
  nomor_dokumen TEXT NOT NULL DEFAULT '',
  tahun_dokumen VARCHAR(4) NOT NULL DEFAULT '',
  status_verifikasi VARCHAR(32) NOT NULL DEFAULT 'Lengkap',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT arsip_tahun_anggaran_check CHECK (tahun_anggaran ~ '^[0-9]{4}$'),
  CONSTRAINT arsip_sumber_aplikasi_check CHECK (sumber_aplikasi = 'arsip_pegawai'),
  CONSTRAINT arsip_bidang_check CHECK (bidang IN ('sekretariat', 'dukcapil', 'pmk')),
  CONSTRAINT arsip_nama_not_blank CHECK (BTRIM(nama) <> ''),
  CONSTRAINT arsip_original_name_not_blank CHECK (BTRIM(original_name) <> ''),
  CONSTRAINT arsip_size_non_negative CHECK (size >= 0),
  CONSTRAINT arsip_status_verifikasi_check CHECK (
    status_verifikasi IN ('Lengkap', 'Perlu Verifikasi')
  )
);

CREATE INDEX arsip_tahun_created_idx ON arsip (tahun_anggaran, created_at DESC);
CREATE INDEX arsip_sumber_bidang_idx ON arsip (tahun_anggaran, sumber_aplikasi, bidang);
CREATE INDEX arsip_pegawai_idx ON arsip (pegawai_id);
CREATE UNIQUE INDEX arsip_file_unique ON arsip (file_id) WHERE file_id IS NOT NULL;
CREATE INDEX arsip_pegawai_document_filters_idx
  ON arsip (pegawai_id, kategori, bidang, status_verifikasi, tahun_dokumen, created_at DESC)
  WHERE sumber_aplikasi = 'arsip_pegawai';
