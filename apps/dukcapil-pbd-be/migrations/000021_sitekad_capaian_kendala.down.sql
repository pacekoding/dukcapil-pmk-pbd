ALTER TABLE sitekad_potensi_kampung
  ADD COLUMN IF NOT EXISTS capaian_utama TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS kendala_lapangan TEXT NOT NULL DEFAULT '';

WITH latest AS (
  SELECT DISTINCT ON (kelompok_id)
    kelompok_id,
    deskripsi_capaian,
    kendala_hambatan
  FROM sitekad_capaian_kendala
  ORDER BY kelompok_id, tahun_binaan DESC, updated_at DESC, id DESC
)
UPDATE sitekad_potensi_kampung AS kelompok
SET
  capaian_utama = latest.deskripsi_capaian,
  kendala_lapangan = latest.kendala_hambatan
FROM latest
WHERE kelompok.id = latest.kelompok_id;

DROP TABLE IF EXISTS sitekad_capaian_kendala;
