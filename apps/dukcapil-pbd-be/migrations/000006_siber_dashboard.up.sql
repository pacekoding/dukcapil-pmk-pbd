INSERT INTO portal_app_statuses (access_key, status)
VALUES ('siber', 'Aktif')
ON CONFLICT (access_key) DO NOTHING;

INSERT INTO data_wilayah (
	tahun_anggaran,
	id,
	sort_order,
	name,
	short_name,
	region_type,
	map_label,
	idm_sangat_tertinggal,
	idm_tertinggal,
	idm_berkembang,
	idm_maju,
	idm_mandiri,
	bumdes_jumlah,
	bumdes_aktif,
	bumdes_tidak_aktif,
	bumdes_bersama,
	registration_penerbitan_kk,
	registration_perubahan_kk,
	registration_kia,
	registration_nik_wni,
	registration_perekaman_ktp_el,
	registration_pencetakan_ktp_el,
	oap_luas_wilayah,
	oap_jumlah_oap,
	oap_jumlah_non_oap,
	oap_jumlah_jiwa,
	civil_akta_kelahiran,
	civil_akta_kematian,
	civil_akta_perkawinan,
	civil_akta_perceraian
)
VALUES
	(
		'2026', 'kabupaten-sorong', 1, 'Kabupaten Sorong', 'Sorong', 'Kabupaten', 'Kab. Sorong',
		60, 80, 66, 3, 0,
		0, 0, 0, 0,
		4311, 8945, 3861, 2756, 2511, 21637,
		6544.23, 54379, 76322, 130701,
		4213, 947, 390, 21
	),
	(
		'2026', 'kota-sorong', 2, 'Kota Sorong', 'Kota Sorong', 'Kota', 'Kota Sorong',
		0, 0, 0, 0, 0,
		0, 0, 0, 0,
		9376, 14612, 1490, 4627, 4418, 27136,
		656.64, 77487, 209765, 287252,
		7208, 1941, 1118, 47
	),
	(
		'2026', 'raja-ampat', 3, 'Kabupaten Raja Ampat', 'Raja Ampat', 'Kabupaten', 'Raja Ampat',
		16, 33, 75, 6, 0,
		0, 0, 0, 0,
		2688, 4543, 1997, 1713, 1466, 10624,
		8034.44, 53035, 20713, 73748,
		3998, 545, 741, 2
	),
	(
		'2026', 'sorong-selatan', 4, 'Kabupaten Sorong Selatan', 'Sorong Selatan', 'Kabupaten', 'Sorong Selatan',
		28, 40, 73, 4, 0,
		0, 0, 0, 0,
		1342, 2568, 680, 1570, 880, 6031,
		6594.31, 46829, 10684, 57513,
		2571, 323, 359, 5
	),
	(
		'2026', 'maybrat', 5, 'Kabupaten Maybrat', 'Maybrat', 'Kabupaten', 'Maybrat',
		107, 128, 59, 1, 0,
		0, 0, 0, 0,
		1230, 3222, 190, 696, 505, 5220,
		5461.69, 43178, 3626, 46804,
		1775, 300, 203, 4
	),
	(
		'2026', 'tambrauw', 6, 'Kabupaten Tambrauw', 'Tambrauw', 'Kabupaten', 'Tambrauw',
		202, 64, 19, 0, 0,
		0, 0, 0, 0,
		631, 1253, 1025, 596, 330, 2861,
		11529.18, 21302, 10086, 31388,
		830, 120, 101, 1
	)
ON CONFLICT (tahun_anggaran, id) DO NOTHING;

INSERT INTO data_wilayah_public_settings (
	id,
	featured_tahun_anggaran,
	published_tahun_anggaran
)
VALUES (1, '2026', ARRAY['2026']::TEXT[])
ON CONFLICT (id) DO NOTHING;
