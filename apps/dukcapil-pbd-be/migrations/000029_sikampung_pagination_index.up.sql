CREATE INDEX IF NOT EXISTS idx_sikampung_data_pagination
  ON sikampung_data(tahun_anggaran, kabupaten, distrik, desa, kode_desa, id);
