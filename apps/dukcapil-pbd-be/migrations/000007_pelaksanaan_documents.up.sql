CREATE TABLE IF NOT EXISTS pelaksanaan_documents (
	id BIGSERIAL PRIMARY KEY,
	tahun_anggaran VARCHAR(4) NOT NULL,
	subkegiatan_id BIGINT,
	nama TEXT NOT NULL,
	original_name TEXT NOT NULL,
	mime_type TEXT NOT NULL,
	size BIGINT NOT NULL DEFAULT 0,
	url TEXT NOT NULL,
	is_dokumen_dssd BOOLEAN NOT NULL DEFAULT FALSE,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT pelaksanaan_documents_tahun_anggaran_check CHECK (tahun_anggaran ~ '^\d{4}$'),
	CONSTRAINT pelaksanaan_documents_nama_not_blank_check CHECK (BTRIM(nama) <> ''),
	CONSTRAINT pelaksanaan_documents_original_name_not_blank_check CHECK (BTRIM(original_name) <> ''),
	CONSTRAINT pelaksanaan_documents_size_non_negative_check CHECK (size >= 0),
	CONSTRAINT pelaksanaan_documents_subkegiatan_fk FOREIGN KEY (tahun_anggaran, subkegiatan_id) REFERENCES subkegiatan(tahun_anggaran, id) ON DELETE SET NULL (subkegiatan_id)
);

DO $$
DECLARE
	legacy_table TEXT := 'rea' || 'lisasi_documents';
BEGIN
	IF to_regclass('public.' || legacy_table) IS NOT NULL THEN
		EXECUTE format($query$
			INSERT INTO pelaksanaan_documents (
				id,
				tahun_anggaran,
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
				id,
				tahun_anggaran,
				subkegiatan_id,
				COALESCE(NULLIF(BTRIM(file_name), ''), original_name),
				original_name,
				mime_type,
				size,
				url,
				COALESCE(is_dokumen_sdd, FALSE),
				created_at
			FROM %I
			ON CONFLICT (id) DO NOTHING
		$query$, legacy_table);

		EXECUTE format('DROP TABLE %I', legacy_table);
	END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_pelaksanaan_documents_tahun_created ON pelaksanaan_documents(tahun_anggaran, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pelaksanaan_documents_subkegiatan ON pelaksanaan_documents(tahun_anggaran, subkegiatan_id);
CREATE INDEX IF NOT EXISTS idx_pelaksanaan_documents_is_dssd ON pelaksanaan_documents(tahun_anggaran, is_dokumen_dssd);

SELECT setval(
	pg_get_serial_sequence('pelaksanaan_documents', 'id'),
	COALESCE((SELECT MAX(id) FROM pelaksanaan_documents), 1),
	(SELECT COUNT(*) > 0 FROM pelaksanaan_documents)
);
