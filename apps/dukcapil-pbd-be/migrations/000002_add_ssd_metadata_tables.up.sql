CREATE TABLE IF NOT EXISTS ssd_variables (
	id BIGSERIAL PRIMARY KEY,
	ssd_id BIGINT NOT NULL REFERENCES ssd(id) ON DELETE CASCADE,
	tahun_anggaran VARCHAR(4) NOT NULL,
	sort_order INTEGER NOT NULL DEFAULT 0,
	nama_variabel TEXT NOT NULL,
	alias_kode_teknis VARCHAR(160) NOT NULL DEFAULT '',
	tipe_data_komputer VARCHAR(120) NOT NULL DEFAULT '',
	referensi_waktu TEXT NOT NULL DEFAULT '',
	konsep_dasar TEXT NOT NULL DEFAULT '',
	definisi_variabel TEXT NOT NULL DEFAULT '',
	referensi_pemilihan TEXT NOT NULL DEFAULT '',
	klasifikasi_isian TEXT NOT NULL DEFAULT '',
	aturan_validasi TEXT NOT NULL DEFAULT '',
	kalimat_pertanyaan TEXT NOT NULL DEFAULT '',
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT ssd_variables_tahun_anggaran_check CHECK (tahun_anggaran ~ '^\d{4}$'),
	CONSTRAINT ssd_variables_nama_variabel_not_blank_check CHECK (BTRIM(nama_variabel) <> '')
);

CREATE INDEX IF NOT EXISTS idx_ssd_variables_ssd_sort_order ON ssd_variables(ssd_id, sort_order, id);
CREATE INDEX IF NOT EXISTS idx_ssd_variables_tahun ON ssd_variables(tahun_anggaran);

CREATE TABLE IF NOT EXISTS ssd_indicators (
	id BIGSERIAL PRIMARY KEY,
	variable_id BIGINT NOT NULL REFERENCES ssd_variables(id) ON DELETE CASCADE,
	tahun_anggaran VARCHAR(4) NOT NULL,
	sort_order INTEGER NOT NULL DEFAULT 0,
	nama_indikator TEXT NOT NULL,
	konsep_indikator TEXT NOT NULL DEFAULT '',
	level_estimasi_hasil TEXT NOT NULL DEFAULT '',
	ukuran_indikator VARCHAR(120) NOT NULL DEFAULT '',
	satuan_indikator VARCHAR(120) NOT NULL DEFAULT '',
	klasifikasi_penyajian TEXT NOT NULL DEFAULT '',
	definisi_indikator TEXT NOT NULL DEFAULT '',
	metode_rumus TEXT NOT NULL DEFAULT '',
	interpretasi_hasil TEXT NOT NULL DEFAULT '',
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT ssd_indicators_tahun_anggaran_check CHECK (tahun_anggaran ~ '^\d{4}$'),
	CONSTRAINT ssd_indicators_nama_indikator_not_blank_check CHECK (BTRIM(nama_indikator) <> '')
);

CREATE INDEX IF NOT EXISTS idx_ssd_indicators_variable_sort_order ON ssd_indicators(variable_id, sort_order, id);
CREATE INDEX IF NOT EXISTS idx_ssd_indicators_tahun ON ssd_indicators(tahun_anggaran);
