CREATE INDEX IF NOT EXISTS idx_arsip_pegawai_document_filters
  ON arsip (
    pegawai_id,
    kategori,
    bidang,
    status_verifikasi,
    tahun_dokumen,
    created_at DESC
  )
  WHERE sumber_aplikasi = 'arsip_pegawai';
