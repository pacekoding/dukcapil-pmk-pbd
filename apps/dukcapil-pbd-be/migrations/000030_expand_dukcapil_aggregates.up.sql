ALTER TABLE data_wilayah
  DROP CONSTRAINT data_wilayah_non_negative_check;

ALTER TABLE data_wilayah
  ADD COLUMN registration_pindah_datang INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN registration_pindah_keluar INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN civil_lahir_mati INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN civil_pengangkatan_anak INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN civil_pengakuan_anak INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN civil_pengesahan_anak INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN civil_perubahan_nama INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN civil_pembatalan_perkawinan INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN civil_pembatalan_perceraian INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN civil_perubahan_status_kewarganegaraan INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN civil_pembetulan_akta INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN civil_pembatalan_akta INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN civil_peristiwa_penting_lainnya INTEGER NOT NULL DEFAULT 0;

ALTER TABLE data_wilayah
  ADD CONSTRAINT data_wilayah_non_negative_check CHECK (
    idm_sangat_tertinggal >= 0 AND idm_tertinggal >= 0 AND idm_berkembang >= 0 AND idm_maju >= 0 AND idm_mandiri >= 0 AND
    bumdes_jumlah >= 0 AND bumdes_aktif >= 0 AND bumdes_tidak_aktif >= 0 AND bumdes_bersama >= 0 AND
    registration_penerbitan_kk >= 0 AND registration_perubahan_kk >= 0 AND registration_kia >= 0 AND registration_nik_wni >= 0 AND
    registration_perekaman_ktp_el >= 0 AND registration_pencetakan_ktp_el >= 0 AND
    registration_pindah_datang >= 0 AND registration_pindah_keluar >= 0 AND
    oap_luas_wilayah >= 0 AND oap_jumlah_oap >= 0 AND oap_jumlah_non_oap >= 0 AND oap_jumlah_jiwa >= 0 AND
    civil_akta_kelahiran >= 0 AND civil_akta_kematian >= 0 AND civil_akta_perkawinan >= 0 AND civil_akta_perceraian >= 0 AND
    civil_lahir_mati >= 0 AND civil_pengangkatan_anak >= 0 AND civil_pengakuan_anak >= 0 AND
    civil_pengesahan_anak >= 0 AND civil_perubahan_nama >= 0 AND civil_pembatalan_perkawinan >= 0 AND
    civil_pembatalan_perceraian >= 0 AND civil_perubahan_status_kewarganegaraan >= 0 AND
    civil_pembetulan_akta >= 0 AND civil_pembatalan_akta >= 0 AND civil_peristiwa_penting_lainnya >= 0
  );
