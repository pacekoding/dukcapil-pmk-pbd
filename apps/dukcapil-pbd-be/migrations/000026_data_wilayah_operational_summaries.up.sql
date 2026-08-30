-- Sinkronkan ringkasan PMK di data_wilayah dari tabel operasional.
WITH sikampung_summary AS (
  SELECT
    tahun_anggaran,
    LOWER(REGEXP_REPLACE(BTRIM(kabupaten), '\s+', ' ', 'g')) AS region_key,
    COUNT(*) FILTER (WHERE status_idm = 'Sangat Tertinggal')::INTEGER AS sangat_tertinggal,
    COUNT(*) FILTER (WHERE status_idm = 'Tertinggal')::INTEGER AS tertinggal,
    COUNT(*) FILTER (WHERE status_idm = 'Berkembang')::INTEGER AS berkembang,
    COUNT(*) FILTER (WHERE status_idm = 'Maju')::INTEGER AS maju,
    COUNT(*) FILTER (WHERE status_idm = 'Mandiri')::INTEGER AS mandiri
  FROM sikampung_data
  GROUP BY tahun_anggaran, region_key
),
region_keys AS (
  SELECT
    tahun_anggaran,
    id,
    CASE
      WHEN region_type = 'Kabupaten'
        THEN LOWER(REGEXP_REPLACE(BTRIM(REGEXP_REPLACE(name, '^Kabupaten\s+', '', 'i')), '\s+', ' ', 'g'))
      ELSE LOWER(REGEXP_REPLACE(BTRIM(name), '\s+', ' ', 'g'))
    END AS region_key
  FROM data_wilayah
)
UPDATE data_wilayah target
SET
  idm_sangat_tertinggal = sikampung_summary.sangat_tertinggal,
  idm_tertinggal = sikampung_summary.tertinggal,
  idm_berkembang = sikampung_summary.berkembang,
  idm_maju = sikampung_summary.maju,
  idm_mandiri = sikampung_summary.mandiri,
  updated_at = NOW()
FROM region_keys
JOIN sikampung_summary
  ON sikampung_summary.tahun_anggaran = region_keys.tahun_anggaran
 AND sikampung_summary.region_key = region_keys.region_key
WHERE target.tahun_anggaran = region_keys.tahun_anggaran
  AND target.id = region_keys.id;

WITH
bum_kampung_years AS (
  SELECT DISTINCT tahun_anggaran
  FROM bum_kampung
)
UPDATE data_wilayah target
SET
  bumdes_jumlah = 0,
  bumdes_aktif = 0,
  bumdes_tidak_aktif = 0,
  bumdes_bersama = 0,
  updated_at = NOW()
WHERE EXISTS (
  SELECT 1
  FROM bum_kampung_years
  WHERE bum_kampung_years.tahun_anggaran = target.tahun_anggaran
);

WITH
bum_kampung_summary AS (
  SELECT
    tahun_anggaran,
    LOWER(REGEXP_REPLACE(BTRIM(kabupaten_kota), '\s+', ' ', 'g')) AS region_key,
    COUNT(*)::INTEGER AS jumlah,
    COUNT(*) FILTER (
      WHERE status IN ('Dokumen Badan Hukum Terverifikasi', 'Nama Terverifikasi')
    )::INTEGER AS aktif,
    COUNT(*) FILTER (
      WHERE status NOT IN ('Dokumen Badan Hukum Terverifikasi', 'Nama Terverifikasi')
    )::INTEGER AS tidak_aktif,
    COUNT(*) FILTER (WHERE kategori = 'BUMKam bersama')::INTEGER AS bersama
  FROM bum_kampung
  GROUP BY tahun_anggaran, region_key
),
region_keys AS (
  SELECT
    tahun_anggaran,
    id,
    CASE
      WHEN region_type = 'Kabupaten'
        THEN LOWER(REGEXP_REPLACE(BTRIM(REGEXP_REPLACE(name, '^Kabupaten\s+', '', 'i')), '\s+', ' ', 'g'))
      ELSE LOWER(REGEXP_REPLACE(BTRIM(name), '\s+', ' ', 'g'))
    END AS region_key
  FROM data_wilayah
)
UPDATE data_wilayah target
SET
  bumdes_jumlah = bum_kampung_summary.jumlah,
  bumdes_aktif = bum_kampung_summary.aktif,
  bumdes_tidak_aktif = bum_kampung_summary.tidak_aktif,
  bumdes_bersama = bum_kampung_summary.bersama,
  updated_at = NOW()
FROM region_keys
JOIN bum_kampung_summary
  ON bum_kampung_summary.tahun_anggaran = region_keys.tahun_anggaran
 AND bum_kampung_summary.region_key = region_keys.region_key
WHERE target.tahun_anggaran = region_keys.tahun_anggaran
  AND target.id = region_keys.id;
