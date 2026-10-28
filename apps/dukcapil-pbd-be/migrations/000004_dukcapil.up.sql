CREATE TABLE data_wilayah (
  tahun_anggaran VARCHAR(4) NOT NULL,
  id VARCHAR(64) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  region_type VARCHAR(16) NOT NULL,
  map_label TEXT NOT NULL,
  idm_sangat_tertinggal INTEGER NOT NULL DEFAULT 0,
  idm_tertinggal INTEGER NOT NULL DEFAULT 0,
  idm_berkembang INTEGER NOT NULL DEFAULT 0,
  idm_maju INTEGER NOT NULL DEFAULT 0,
  idm_mandiri INTEGER NOT NULL DEFAULT 0,
  bumdes_jumlah INTEGER NOT NULL DEFAULT 0,
  bumdes_aktif INTEGER NOT NULL DEFAULT 0,
  bumdes_tidak_aktif INTEGER NOT NULL DEFAULT 0,
  bumdes_bersama INTEGER NOT NULL DEFAULT 0,
  registration_penerbitan_kk INTEGER NOT NULL DEFAULT 0,
  registration_perubahan_kk INTEGER NOT NULL DEFAULT 0,
  registration_kia INTEGER NOT NULL DEFAULT 0,
  registration_nik_wni INTEGER NOT NULL DEFAULT 0,
  registration_perekaman_ktp_el INTEGER NOT NULL DEFAULT 0,
  registration_pencetakan_ktp_el INTEGER NOT NULL DEFAULT 0,
  registration_pindah_datang INTEGER NOT NULL DEFAULT 0,
  registration_pindah_keluar INTEGER NOT NULL DEFAULT 0,
  oap_luas_wilayah NUMERIC(12, 2) NOT NULL DEFAULT 0,
  oap_jumlah_oap INTEGER NOT NULL DEFAULT 0,
  oap_jumlah_non_oap INTEGER NOT NULL DEFAULT 0,
  oap_jumlah_jiwa INTEGER NOT NULL DEFAULT 0,
  civil_akta_kelahiran INTEGER NOT NULL DEFAULT 0,
  civil_akta_kematian INTEGER NOT NULL DEFAULT 0,
  civil_akta_perkawinan INTEGER NOT NULL DEFAULT 0,
  civil_akta_perceraian INTEGER NOT NULL DEFAULT 0,
  civil_lahir_mati INTEGER NOT NULL DEFAULT 0,
  civil_pengangkatan_anak INTEGER NOT NULL DEFAULT 0,
  civil_pengakuan_anak INTEGER NOT NULL DEFAULT 0,
  civil_pengesahan_anak INTEGER NOT NULL DEFAULT 0,
  civil_perubahan_nama INTEGER NOT NULL DEFAULT 0,
  civil_pembatalan_perkawinan INTEGER NOT NULL DEFAULT 0,
  civil_pembatalan_perceraian INTEGER NOT NULL DEFAULT 0,
  civil_perubahan_status_kewarganegaraan INTEGER NOT NULL DEFAULT 0,
  civil_pembetulan_akta INTEGER NOT NULL DEFAULT 0,
  civil_pembatalan_akta INTEGER NOT NULL DEFAULT 0,
  civil_peristiwa_penting_lainnya INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tahun_anggaran, id),
  CONSTRAINT data_wilayah_tahun_anggaran_check CHECK (tahun_anggaran ~ '^[0-9]{4}$'),
  CONSTRAINT data_wilayah_region_type_check CHECK (region_type IN ('Kabupaten', 'Kota')),
  CONSTRAINT data_wilayah_non_negative_check CHECK (
    idm_sangat_tertinggal >= 0 AND idm_tertinggal >= 0 AND idm_berkembang >= 0 AND idm_maju >= 0 AND idm_mandiri >= 0 AND
    bumdes_jumlah >= 0 AND bumdes_aktif >= 0 AND bumdes_tidak_aktif >= 0 AND bumdes_bersama >= 0 AND
    registration_penerbitan_kk >= 0 AND registration_perubahan_kk >= 0 AND registration_kia >= 0 AND registration_nik_wni >= 0 AND
    registration_perekaman_ktp_el >= 0 AND registration_pencetakan_ktp_el >= 0 AND
    registration_pindah_datang >= 0 AND registration_pindah_keluar >= 0 AND
    oap_luas_wilayah >= 0 AND oap_jumlah_oap >= 0 AND oap_jumlah_non_oap >= 0 AND oap_jumlah_jiwa >= 0 AND
    civil_akta_kelahiran >= 0 AND civil_akta_kematian >= 0 AND civil_akta_perkawinan >= 0 AND civil_akta_perceraian >= 0 AND
    civil_lahir_mati >= 0 AND civil_pengangkatan_anak >= 0 AND civil_pengakuan_anak >= 0 AND civil_pengesahan_anak >= 0 AND
    civil_perubahan_nama >= 0 AND civil_pembatalan_perkawinan >= 0 AND civil_pembatalan_perceraian >= 0 AND
    civil_perubahan_status_kewarganegaraan >= 0 AND civil_pembetulan_akta >= 0 AND civil_pembatalan_akta >= 0 AND
    civil_peristiwa_penting_lainnya >= 0
  )
);
CREATE INDEX data_wilayah_tahun_sort_idx ON data_wilayah (tahun_anggaran, sort_order);

CREATE TABLE data_wilayah_public_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1,
  featured_tahun_anggaran VARCHAR(4) NOT NULL,
  published_tahun_anggaran TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT data_wilayah_public_settings_singleton CHECK (id = 1),
  CONSTRAINT data_wilayah_public_settings_featured_check CHECK (
    featured_tahun_anggaran ~ '^[0-9]{4}$'
  )
);

INSERT INTO data_wilayah (
  tahun_anggaran, id, sort_order, name, short_name, region_type, map_label,
  idm_sangat_tertinggal, idm_tertinggal, idm_berkembang, idm_maju, idm_mandiri,
  registration_penerbitan_kk, registration_perubahan_kk, registration_kia,
  registration_nik_wni, registration_perekaman_ktp_el, registration_pencetakan_ktp_el,
  oap_luas_wilayah, oap_jumlah_oap, oap_jumlah_non_oap, oap_jumlah_jiwa,
  civil_akta_kelahiran, civil_akta_kematian, civil_akta_perkawinan, civil_akta_perceraian
) VALUES
  ('2026', 'kabupaten-sorong', 1, 'Kabupaten Sorong', 'Sorong', 'Kabupaten', 'Kab. Sorong', 60, 80, 66, 3, 0, 4311, 8945, 3861, 2756, 2511, 21637, 6544.23, 54379, 76322, 130701, 4213, 947, 390, 21),
  ('2026', 'kota-sorong', 2, 'Kota Sorong', 'Kota Sorong', 'Kota', 'Kota Sorong', 0, 0, 0, 0, 0, 9376, 14612, 1490, 4627, 4418, 27136, 656.64, 77487, 209765, 287252, 7208, 1941, 1118, 47),
  ('2026', 'raja-ampat', 3, 'Kabupaten Raja Ampat', 'Raja Ampat', 'Kabupaten', 'Raja Ampat', 16, 33, 75, 6, 0, 2688, 4543, 1997, 1713, 1466, 10624, 8034.44, 53035, 20713, 73748, 3998, 545, 741, 2),
  ('2026', 'sorong-selatan', 4, 'Kabupaten Sorong Selatan', 'Sorong Selatan', 'Kabupaten', 'Sorong Selatan', 28, 40, 73, 4, 0, 1342, 2568, 680, 1570, 880, 6031, 6594.31, 46829, 10684, 57513, 2571, 323, 359, 5),
  ('2026', 'maybrat', 5, 'Kabupaten Maybrat', 'Maybrat', 'Kabupaten', 'Maybrat', 107, 128, 59, 1, 0, 1230, 3222, 190, 696, 505, 5220, 5461.69, 43178, 3626, 46804, 1775, 300, 203, 4),
  ('2026', 'tambrauw', 6, 'Kabupaten Tambrauw', 'Tambrauw', 'Kabupaten', 'Tambrauw', 202, 64, 19, 0, 0, 631, 1253, 1025, 596, 330, 2861, 11529.18, 21302, 10086, 31388, 830, 120, 101, 1);

INSERT INTO data_wilayah_public_settings (
  id, featured_tahun_anggaran, published_tahun_anggaran
) VALUES (1, '2026', ARRAY['2026']::TEXT[]);
