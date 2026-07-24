ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS wilayah_kabupaten_kota TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS wilayah_distrik TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS wilayah_kampung TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS maceku_pkk_profiles (
  id BIGSERIAL PRIMARY KEY,
  nama_pkk TEXT NOT NULL,
  tingkat_pkk VARCHAR(32) NOT NULL,
  kabupaten_kota TEXT NOT NULL,
  distrik TEXT NOT NULL DEFAULT '',
  kampung TEXT NOT NULL DEFAULT '',
  alamat_sekretariat TEXT NOT NULL DEFAULT '',
  nama_ketua TEXT NOT NULL DEFAULT '',
  nama_sekretaris TEXT NOT NULL DEFAULT '',
  nomor_telepon TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  periode_kepengurusan TEXT NOT NULL DEFAULT '',
  deskripsi_singkat TEXT NOT NULL DEFAULT '',
  logo_url TEXT NOT NULL DEFAULT '',
  logo_original_name TEXT NOT NULL DEFAULT '',
  logo_mime_type TEXT NOT NULL DEFAULT '',
  logo_size BIGINT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by_user_id BIGINT,
  updated_by_user_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT maceku_pkk_profiles_nama_not_blank CHECK (BTRIM(nama_pkk) <> ''),
  CONSTRAINT maceku_pkk_profiles_tingkat_check CHECK (
    tingkat_pkk IN ('PKK Kabupaten/Kota', 'PKK Kecamatan/Distrik', 'PKK Desa/Kampung')
  ),
  CONSTRAINT maceku_pkk_profiles_kabupaten_not_blank CHECK (BTRIM(kabupaten_kota) <> ''),
  CONSTRAINT maceku_pkk_profiles_hierarchy_check CHECK (
    (BTRIM(distrik) = '' AND BTRIM(kampung) = '') OR
    (BTRIM(distrik) <> '' AND BTRIM(kampung) = '') OR
    (BTRIM(distrik) <> '' AND BTRIM(kampung) <> '')
  ),
  CONSTRAINT maceku_pkk_profiles_logo_size_nonnegative CHECK (logo_size >= 0),
  CONSTRAINT maceku_pkk_profiles_created_by_fk FOREIGN KEY (created_by_user_id) REFERENCES admin_users(id) ON DELETE SET NULL,
  CONSTRAINT maceku_pkk_profiles_updated_by_fk FOREIGN KEY (updated_by_user_id) REFERENCES admin_users(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_maceku_pkk_profiles_scope_unique
  ON maceku_pkk_profiles (
    LOWER(tingkat_pkk),
    LOWER(kabupaten_kota),
    LOWER(COALESCE(distrik, '')),
    LOWER(COALESCE(kampung, ''))
  );
CREATE INDEX IF NOT EXISTS idx_maceku_pkk_profiles_nama
  ON maceku_pkk_profiles (LOWER(nama_pkk));
CREATE INDEX IF NOT EXISTS idx_maceku_pkk_profiles_status
  ON maceku_pkk_profiles (is_active, updated_at DESC);

CREATE TABLE IF NOT EXISTS maceku_pkk_archives (
  id BIGSERIAL PRIMARY KEY,
  profile_id BIGINT NOT NULL,
  judul_dokumen TEXT NOT NULL,
  kategori_arsip VARCHAR(32) NOT NULL,
  tahun_dokumen VARCHAR(4) NOT NULL DEFAULT '',
  nomor_dokumen TEXT NOT NULL DEFAULT '',
  tanggal_dokumen DATE,
  deskripsi TEXT NOT NULL DEFAULT '',
  file_url TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size BIGINT NOT NULL DEFAULT 0,
  uploaded_by_user_id BIGINT,
  uploaded_by_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT maceku_pkk_archives_profile_fk FOREIGN KEY (profile_id) REFERENCES maceku_pkk_profiles(id) ON DELETE CASCADE,
  CONSTRAINT maceku_pkk_archives_uploaded_by_fk FOREIGN KEY (uploaded_by_user_id) REFERENCES admin_users(id) ON DELETE SET NULL,
  CONSTRAINT maceku_pkk_archives_title_not_blank CHECK (BTRIM(judul_dokumen) <> ''),
  CONSTRAINT maceku_pkk_archives_category_check CHECK (
    kategori_arsip IN (
      'Program Kerja',
      'LKPJ',
      'Laporan Kegiatan',
      'Surat Keputusan',
      'Data Kepengurusan',
      'Administrasi',
      'Dokumentasi',
      'Lainnya'
    )
  ),
  CONSTRAINT maceku_pkk_archives_year_check CHECK (
    tahun_dokumen = '' OR tahun_dokumen ~ '^\d{4}$'
  ),
  CONSTRAINT maceku_pkk_archives_size_nonnegative CHECK (size >= 0)
);

CREATE INDEX IF NOT EXISTS idx_maceku_pkk_archives_profile_created
  ON maceku_pkk_archives (profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_maceku_pkk_archives_category_year
  ON maceku_pkk_archives (kategori_arsip, tahun_dokumen);

INSERT INTO portal_app_statuses (access_key, status)
VALUES ('maceku_pkk', 'Aktif')
ON CONFLICT (access_key) DO NOTHING;
