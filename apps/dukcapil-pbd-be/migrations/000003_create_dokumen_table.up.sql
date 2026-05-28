CREATE TABLE IF NOT EXISTS dokumen (
	id BIGSERIAL PRIMARY KEY,
	nama_kegiatan TEXT NOT NULL,
	jenis_kegiatan VARCHAR(32) NOT NULL,
	jenis_dokumen VARCHAR(32) NOT NULL,
	tanggal VARCHAR(64) NOT NULL,
	dibuat_oleh TEXT NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT dokumen_jenis_kegiatan_check CHECK (
		jenis_kegiatan IN ('Sosialisasi', 'Bimtek', 'Pendampingan', 'Monev', 'Rapat')
	),
	CONSTRAINT dokumen_jenis_dokumen_check CHECK (
		jenis_dokumen IN ('TOR', 'Laporan')
	)
);

CREATE INDEX IF NOT EXISTS idx_dokumen_nama_kegiatan ON dokumen(nama_kegiatan);
CREATE INDEX IF NOT EXISTS idx_dokumen_jenis_kegiatan ON dokumen(jenis_kegiatan);
CREATE INDEX IF NOT EXISTS idx_dokumen_jenis_dokumen ON dokumen(jenis_dokumen);
CREATE INDEX IF NOT EXISTS idx_dokumen_created_at ON dokumen(created_at DESC);
