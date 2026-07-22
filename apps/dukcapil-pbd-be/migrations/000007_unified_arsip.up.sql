CREATE TABLE IF NOT EXISTS arsip_pegawai (
	id BIGSERIAL PRIMARY KEY,
	nip VARCHAR(32) NOT NULL,
	nik VARCHAR(32) NOT NULL DEFAULT '',
	nama TEXT NOT NULL,
	jabatan TEXT NOT NULL DEFAULT '',
	unit TEXT NOT NULL DEFAULT '',
	pangkat_golongan TEXT NOT NULL DEFAULT '',
	email TEXT NOT NULL DEFAULT '',
	telepon TEXT NOT NULL DEFAULT '',
	no_rekening TEXT NOT NULL DEFAULT '',
	alamat TEXT NOT NULL DEFAULT '',
	status VARCHAR(16) NOT NULL DEFAULT 'Aktif',
	photo_color TEXT NOT NULL DEFAULT 'bg-blue-100 text-blue-700',
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT arsip_pegawai_nip_not_blank_check CHECK (BTRIM(nip) <> ''),
	CONSTRAINT arsip_pegawai_nama_not_blank_check CHECK (BTRIM(nama) <> ''),
	CONSTRAINT arsip_pegawai_status_check CHECK (status IN ('Aktif', 'Cuti', 'Mutasi'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_arsip_pegawai_nip_unique ON arsip_pegawai(LOWER(nip));
CREATE INDEX IF NOT EXISTS idx_arsip_pegawai_nama ON arsip_pegawai(LOWER(nama));

CREATE TABLE IF NOT EXISTS arsip (
	id BIGSERIAL PRIMARY KEY,
	tahun_anggaran VARCHAR(4) NOT NULL,
	sumber_aplikasi VARCHAR(32) NOT NULL,
	bidang VARCHAR(16) NOT NULL,
	subkegiatan_id BIGINT,
	pegawai_id BIGINT,
	nama TEXT NOT NULL,
	original_name TEXT NOT NULL,
	mime_type TEXT NOT NULL,
	size BIGINT NOT NULL DEFAULT 0,
	url TEXT NOT NULL,
	is_dokumen_dssd BOOLEAN NOT NULL DEFAULT FALSE,
	kategori TEXT NOT NULL DEFAULT '',
	nomor_dokumen TEXT NOT NULL DEFAULT '',
	tahun_dokumen VARCHAR(4) NOT NULL DEFAULT '',
	status_verifikasi VARCHAR(32) NOT NULL DEFAULT 'Lengkap',
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT arsip_tahun_anggaran_check CHECK (tahun_anggaran ~ '^\d{4}$'),
	CONSTRAINT arsip_sumber_aplikasi_check CHECK (sumber_aplikasi IN ('sidoka', 'sidak', 'arsip_pegawai')),
	CONSTRAINT arsip_bidang_check CHECK (bidang IN ('sekretariat', 'dukcapil', 'pmk')),
	CONSTRAINT arsip_nama_not_blank_check CHECK (BTRIM(nama) <> ''),
	CONSTRAINT arsip_original_name_not_blank_check CHECK (BTRIM(original_name) <> ''),
	CONSTRAINT arsip_size_non_negative_check CHECK (size >= 0),
	CONSTRAINT arsip_status_verifikasi_check CHECK (status_verifikasi IN ('Lengkap', 'Perlu Verifikasi')),
	CONSTRAINT arsip_subkegiatan_fk FOREIGN KEY (tahun_anggaran, subkegiatan_id) REFERENCES subkegiatan(tahun_anggaran, id) ON DELETE SET NULL (subkegiatan_id),
	CONSTRAINT arsip_pegawai_fk FOREIGN KEY (pegawai_id) REFERENCES arsip_pegawai(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_arsip_tahun_created ON arsip(tahun_anggaran, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_arsip_sumber_bidang ON arsip(tahun_anggaran, sumber_aplikasi, bidang);
CREATE INDEX IF NOT EXISTS idx_arsip_subkegiatan ON arsip(tahun_anggaran, subkegiatan_id);
CREATE INDEX IF NOT EXISTS idx_arsip_pegawai ON arsip(pegawai_id);
CREATE INDEX IF NOT EXISTS idx_arsip_is_dssd ON arsip(tahun_anggaran, is_dokumen_dssd);

DO $$
BEGIN
	IF to_regclass('public.pelaksanaan_documents') IS NOT NULL THEN
		EXECUTE $migrate$
			INSERT INTO arsip (
				id,
				tahun_anggaran,
				sumber_aplikasi,
				bidang,
				subkegiatan_id,
				nama,
				original_name,
				mime_type,
				size,
				url,
				is_dokumen_dssd,
				created_at
			)
			SELECT
				d.id,
				d.tahun_anggaran,
				CASE
					WHEN s.kode LIKE '2.12%' THEN 'sidak'
					WHEN s.kode LIKE '2.13%' THEN 'sidoka'
					ELSE 'sidoka'
				END,
				CASE
					WHEN s.kode LIKE '2.12%' THEN 'dukcapil'
					WHEN s.kode LIKE '2.13%' THEN 'pmk'
					ELSE 'pmk'
				END,
				d.subkegiatan_id,
				d.nama,
				d.original_name,
				d.mime_type,
				d.size,
				d.url,
				d.is_dokumen_dssd,
				d.created_at
			FROM pelaksanaan_documents d
			LEFT JOIN subkegiatan s
				ON s.tahun_anggaran = d.tahun_anggaran
				AND s.id = d.subkegiatan_id
			ON CONFLICT (id) DO NOTHING
		$migrate$;
	END IF;
END $$;

SELECT setval(
	pg_get_serial_sequence('arsip', 'id'),
	COALESCE((SELECT MAX(id) FROM arsip), 1),
	(SELECT COUNT(*) > 0 FROM arsip)
);

DROP TABLE IF EXISTS pelaksanaan_documents;
