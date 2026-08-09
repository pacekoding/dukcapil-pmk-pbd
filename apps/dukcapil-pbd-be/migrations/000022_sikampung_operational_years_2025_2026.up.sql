-- Transisi data SIKAMPUNG lama: data IDM 2023 dipakai sebagai baseline 2025 dan 2026.
WITH source AS (
  SELECT
    kode_desa,
    desa,
    distrik,
    kabupaten,
    iks,
    ike,
    ikl,
    nilai_idm,
    status_idm
  FROM sikampung_data
  WHERE tahun_anggaran = '2023'
),
target_years(tahun_anggaran) AS (
  VALUES ('2025'), ('2026')
),
upserted AS (
  INSERT INTO sikampung_data (
    tahun_anggaran,
    kode_desa,
    desa,
    distrik,
    kabupaten,
    iks,
    ike,
    ikl,
    nilai_idm,
    status_idm
  )
  SELECT
    target_years.tahun_anggaran,
    source.kode_desa,
    source.desa,
    source.distrik,
    source.kabupaten,
    source.iks,
    source.ike,
    source.ikl,
    source.nilai_idm,
    source.status_idm
  FROM source
  CROSS JOIN target_years
  ON CONFLICT (tahun_anggaran, (LOWER(kode_desa)))
  DO UPDATE SET
    desa = EXCLUDED.desa,
    distrik = EXCLUDED.distrik,
    kabupaten = EXCLUDED.kabupaten,
    iks = EXCLUDED.iks,
    ike = EXCLUDED.ike,
    ikl = EXCLUDED.ikl,
    nilai_idm = EXCLUDED.nilai_idm,
    status_idm = EXCLUDED.status_idm,
    updated_at = NOW()
  RETURNING 1
),
pruned_active_years AS (
  DELETE FROM sikampung_data target
  WHERE target.tahun_anggaran IN ('2025', '2026')
    AND EXISTS (SELECT 1 FROM upserted)
    AND NOT EXISTS (
      SELECT 1
      FROM source
      WHERE LOWER(source.kode_desa) = LOWER(target.kode_desa)
    )
  RETURNING 1
)
DELETE FROM sikampung_data
WHERE tahun_anggaran ~ '^[0-9]{4}$'
  AND tahun_anggaran::INTEGER < 2025;
