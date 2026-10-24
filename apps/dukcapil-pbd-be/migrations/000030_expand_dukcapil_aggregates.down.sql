ALTER TABLE data_wilayah
  DROP CONSTRAINT data_wilayah_non_negative_check;

ALTER TABLE data_wilayah
  DROP COLUMN registration_pindah_datang,
  DROP COLUMN registration_pindah_keluar,
  DROP COLUMN civil_lahir_mati,
  DROP COLUMN civil_pengangkatan_anak,
  DROP COLUMN civil_pengakuan_anak,
  DROP COLUMN civil_pengesahan_anak,
  DROP COLUMN civil_perubahan_nama,
  DROP COLUMN civil_pembatalan_perkawinan,
  DROP COLUMN civil_pembatalan_perceraian,
  DROP COLUMN civil_perubahan_status_kewarganegaraan,
  DROP COLUMN civil_pembetulan_akta,
  DROP COLUMN civil_pembatalan_akta,
  DROP COLUMN civil_peristiwa_penting_lainnya;

ALTER TABLE data_wilayah
  ADD CONSTRAINT data_wilayah_non_negative_check CHECK (
    idm_sangat_tertinggal >= 0 AND idm_tertinggal >= 0 AND idm_berkembang >= 0 AND idm_maju >= 0 AND idm_mandiri >= 0 AND
    bumdes_jumlah >= 0 AND bumdes_aktif >= 0 AND bumdes_tidak_aktif >= 0 AND bumdes_bersama >= 0 AND
    registration_penerbitan_kk >= 0 AND registration_perubahan_kk >= 0 AND registration_kia >= 0 AND registration_nik_wni >= 0 AND
    registration_perekaman_ktp_el >= 0 AND registration_pencetakan_ktp_el >= 0 AND
    oap_luas_wilayah >= 0 AND oap_jumlah_oap >= 0 AND oap_jumlah_non_oap >= 0 AND oap_jumlah_jiwa >= 0 AND
    civil_akta_kelahiran >= 0 AND civil_akta_kematian >= 0 AND civil_akta_perkawinan >= 0 AND civil_akta_perceraian >= 0
  );
