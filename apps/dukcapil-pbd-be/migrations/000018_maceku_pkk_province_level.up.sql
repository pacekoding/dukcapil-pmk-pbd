ALTER TABLE maceku_pkk_profiles
  DROP CONSTRAINT IF EXISTS maceku_pkk_profiles_tingkat_check,
  DROP CONSTRAINT IF EXISTS maceku_pkk_profiles_kabupaten_not_blank,
  DROP CONSTRAINT IF EXISTS maceku_pkk_profiles_hierarchy_check;

ALTER TABLE maceku_pkk_profiles
  ADD CONSTRAINT maceku_pkk_profiles_tingkat_check CHECK (
    tingkat_pkk IN (
      'PKK Provinsi',
      'PKK Kabupaten/Kota',
      'PKK Kecamatan/Distrik',
      'PKK Desa/Kampung'
    )
  ),
  ADD CONSTRAINT maceku_pkk_profiles_hierarchy_check CHECK (
    (
      tingkat_pkk = 'PKK Provinsi' AND
      BTRIM(kabupaten_kota) = '' AND
      BTRIM(distrik) = '' AND
      BTRIM(kampung) = ''
    ) OR (
      tingkat_pkk <> 'PKK Provinsi' AND
      BTRIM(kabupaten_kota) <> '' AND
      (
        (BTRIM(distrik) = '' AND BTRIM(kampung) = '') OR
        (BTRIM(distrik) <> '' AND BTRIM(kampung) = '') OR
        (BTRIM(distrik) <> '' AND BTRIM(kampung) <> '')
      )
    )
  );
