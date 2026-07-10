ALTER TABLE data_wilayah
	ADD COLUMN IF NOT EXISTS bumdes_jumlah INTEGER NOT NULL DEFAULT 0,
	ADD COLUMN IF NOT EXISTS bumdes_aktif INTEGER NOT NULL DEFAULT 0,
	ADD COLUMN IF NOT EXISTS bumdes_tidak_aktif INTEGER NOT NULL DEFAULT 0,
	ADD COLUMN IF NOT EXISTS bumdes_bersama INTEGER NOT NULL DEFAULT 0;

ALTER TABLE data_wilayah
	DROP CONSTRAINT IF EXISTS data_wilayah_non_negative_check;

ALTER TABLE data_wilayah
	ADD CONSTRAINT data_wilayah_non_negative_check CHECK (
		idm_sangat_tertinggal >= 0 AND idm_tertinggal >= 0 AND idm_berkembang >= 0 AND idm_maju >= 0 AND idm_mandiri >= 0 AND
		bumdes_jumlah >= 0 AND bumdes_aktif >= 0 AND bumdes_tidak_aktif >= 0 AND bumdes_bersama >= 0 AND
		registration_penerbitan_kk >= 0 AND registration_perubahan_kk >= 0 AND registration_kia >= 0 AND registration_nik_wni >= 0 AND
		registration_perekaman_ktp_el >= 0 AND registration_pencetakan_ktp_el >= 0 AND
		oap_luas_wilayah >= 0 AND oap_jumlah_oap >= 0 AND oap_jumlah_non_oap >= 0 AND oap_jumlah_jiwa >= 0 AND
		civil_akta_kelahiran >= 0 AND civil_akta_kematian >= 0 AND civil_akta_perkawinan >= 0 AND civil_akta_perceraian >= 0
	);
