CREATE TABLE IF NOT EXISTS kegiatan (
	id BIGSERIAL PRIMARY KEY,
	nama TEXT NOT NULL,
	jenis VARCHAR(32) NOT NULL,
	tanggal VARCHAR(64) NOT NULL,
	lokasi TEXT NOT NULL,
	status VARCHAR(32) NOT NULL,
	bidang VARCHAR(32) NOT NULL,
	penanggung_jawab TEXT NOT NULL,
	peserta INTEGER NOT NULL DEFAULT 0,
	progres INTEGER NOT NULL DEFAULT 0,
	deskripsi TEXT NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT kegiatan_jenis_check CHECK (
		jenis IN ('Sosialisasi', 'Bimtek', 'Pendampingan', 'Monev', 'Rapat')
	),
	CONSTRAINT kegiatan_status_check CHECK (
		status IN ('Draft', 'Berjalan', 'Selesai')
	),
	CONSTRAINT kegiatan_bidang_check CHECK (
		bidang IN ('Dukcapil', 'PMK', 'Sekretariat')
	),
	CONSTRAINT kegiatan_peserta_check CHECK (peserta >= 0),
	CONSTRAINT kegiatan_progres_check CHECK (progres >= 0 AND progres <= 100)
);

CREATE TABLE IF NOT EXISTS kegiatan_dokumentasi (
	id BIGSERIAL PRIMARY KEY,
	kegiatan_id BIGINT NOT NULL REFERENCES kegiatan(id) ON DELETE CASCADE,
	url TEXT NOT NULL,
	caption TEXT NOT NULL,
	file_name TEXT,
	uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kegiatan_status ON kegiatan(status);
CREATE INDEX IF NOT EXISTS idx_kegiatan_bidang ON kegiatan(bidang);
CREATE INDEX IF NOT EXISTS idx_kegiatan_jenis ON kegiatan(jenis);
CREATE INDEX IF NOT EXISTS idx_kegiatan_created_at ON kegiatan(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kegiatan_dokumentasi_kegiatan_id ON kegiatan_dokumentasi(kegiatan_id);
CREATE INDEX IF NOT EXISTS idx_kegiatan_dokumentasi_uploaded_at ON kegiatan_dokumentasi(uploaded_at DESC);
