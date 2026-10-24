BEGIN;
CREATE TABLE pelaksanaan_kegiatan (
 id BIGSERIAL PRIMARY KEY, subkegiatan_id BIGINT NOT NULL REFERENCES subkegiatan(id) ON DELETE RESTRICT,
 title TEXT NOT NULL CHECK(BTRIM(title)<>''),description TEXT NOT NULL DEFAULT '',
 start_date DATE NOT NULL,end_date DATE NOT NULL CHECK(end_date>=start_date),location TEXT NOT NULL,
 fiscal_year INTEGER NOT NULL CHECK(fiscal_year BETWEEN 1900 AND 9999),funding_source TEXT NOT NULL DEFAULT '',
 pptk_employee_id BIGINT NOT NULL REFERENCES arsip_pegawai(id) ON DELETE RESTRICT,
 responsible_employee_id BIGINT NOT NULL REFERENCES arsip_pegawai(id) ON DELETE RESTRICT,
 activity_type TEXT NOT NULL,kab_kota_id BIGINT REFERENCES kab_kota(id) ON DELETE RESTRICT,
 status TEXT NOT NULL DEFAULT 'Draft' CHECK(status IN('Draft','Berjalan','Selesai','Dibatalkan')),
 recommended_documents JSONB NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(recommended_documents)='array'),
 created_by BIGINT NOT NULL REFERENCES admin_users(id) ON DELETE RESTRICT,updated_by BIGINT NOT NULL REFERENCES admin_users(id) ON DELETE RESTRICT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX pelaksanaan_kegiatan_filter_idx ON pelaksanaan_kegiatan(fiscal_year,status,subkegiatan_id);
CREATE INDEX pelaksanaan_kegiatan_pptk_idx ON pelaksanaan_kegiatan(pptk_employee_id);
CREATE INDEX pelaksanaan_kegiatan_responsible_idx ON pelaksanaan_kegiatan(responsible_employee_id);
CREATE INDEX pelaksanaan_kegiatan_kab_kota_idx ON pelaksanaan_kegiatan(kab_kota_id);
ALTER TABLE surat_tugas ADD COLUMN activity_execution_id BIGINT REFERENCES pelaksanaan_kegiatan(id) ON DELETE RESTRICT;
ALTER TABLE spd ADD COLUMN activity_execution_id BIGINT REFERENCES pelaksanaan_kegiatan(id) ON DELETE RESTRICT;
CREATE INDEX surat_tugas_activity_idx ON surat_tugas(activity_execution_id);
CREATE INDEX spd_activity_idx ON spd(activity_execution_id);
CREATE TABLE dokumen_kegiatan (
 id BIGSERIAL PRIMARY KEY,activity_execution_id BIGINT NOT NULL REFERENCES pelaksanaan_kegiatan(id) ON DELETE RESTRICT,
 kind TEXT NOT NULL CHECK(kind IN('invitations','attendance','minutes','records','reports','receipts')),
 document_number TEXT NOT NULL DEFAULT '',document_date DATE NOT NULL,
 content JSONB NOT NULL CHECK(jsonb_typeof(content)='object'),snapshot JSONB,
 status TEXT NOT NULL DEFAULT 'Draft' CHECK(status IN('Draft','Final','Dibatalkan')),
 created_by BIGINT NOT NULL REFERENCES admin_users(id) ON DELETE RESTRICT,updated_by BIGINT NOT NULL REFERENCES admin_users(id) ON DELETE RESTRICT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 finalized_at TIMESTAMPTZ,finalized_by BIGINT REFERENCES admin_users(id) ON DELETE RESTRICT,
 cancelled_at TIMESTAMPTZ,cancelled_by BIGINT REFERENCES admin_users(id) ON DELETE RESTRICT,cancellation_reason TEXT NOT NULL DEFAULT '',
 CHECK(status<>'Final' OR(snapshot IS NOT NULL AND finalized_at IS NOT NULL AND finalized_by IS NOT NULL)),
 CHECK(status<>'Dibatalkan' OR(cancelled_at IS NOT NULL AND cancelled_by IS NOT NULL AND BTRIM(cancellation_reason)<>''))
);
CREATE INDEX dokumen_kegiatan_filter_idx ON dokumen_kegiatan(activity_execution_id,kind,status,document_date);
CREATE UNIQUE INDEX dokumen_kegiatan_number_unique ON dokumen_kegiatan(kind,LOWER(BTRIM(document_number))) WHERE BTRIM(document_number)<>'';
-- References for internal recipients/signers/chair/notetaker/follow-up owners in JSON content.
-- Preserve master integrity without copying employee identities into editable documents.
CREATE TABLE dokumen_kegiatan_pegawai (
 document_id BIGINT NOT NULL REFERENCES dokumen_kegiatan(id) ON DELETE CASCADE,
 employee_id BIGINT NOT NULL REFERENCES arsip_pegawai(id) ON DELETE RESTRICT,
 PRIMARY KEY(document_id,employee_id)
);
CREATE INDEX dokumen_kegiatan_pegawai_employee_idx ON dokumen_kegiatan_pegawai(employee_id);
CREATE TABLE peserta_dokumen_kegiatan (
 id BIGSERIAL PRIMARY KEY,document_id BIGINT NOT NULL REFERENCES dokumen_kegiatan(id) ON DELETE CASCADE,
 employee_id BIGINT REFERENCES arsip_pegawai(id) ON DELETE RESTRICT,
 name TEXT NOT NULL DEFAULT '',identification TEXT NOT NULL DEFAULT '',position TEXT NOT NULL DEFAULT '',institution TEXT NOT NULL DEFAULT '',
 phone TEXT NOT NULL DEFAULT '',address TEXT NOT NULL DEFAULT '',village TEXT NOT NULL DEFAULT '',kab_kota TEXT NOT NULL DEFAULT '',
 assistance_type TEXT NOT NULL DEFAULT '',quantity NUMERIC NOT NULL DEFAULT 0 CHECK(quantity>=0),unit TEXT NOT NULL DEFAULT '',
 attendance_status TEXT NOT NULL DEFAULT 'Hadir' CHECK(attendance_status IN('Hadir','Tidak Hadir','Izin')),
 signature_file_id BIGINT REFERENCES stored_files(id) ON DELETE RESTRICT,notes TEXT NOT NULL DEFAULT '',sort_order INTEGER NOT NULL DEFAULT 0,
 CHECK(employee_id IS NOT NULL OR BTRIM(name)<>'')
);
CREATE INDEX peserta_dokumen_kegiatan_doc_idx ON peserta_dokumen_kegiatan(document_id,sort_order);
CREATE INDEX peserta_dokumen_kegiatan_employee_idx ON peserta_dokumen_kegiatan(employee_id);
CREATE TABLE lampiran_kegiatan (
 id BIGSERIAL PRIMARY KEY,activity_execution_id BIGINT NOT NULL REFERENCES pelaksanaan_kegiatan(id) ON DELETE RESTRICT,
 file_id BIGINT NOT NULL UNIQUE REFERENCES stored_files(id) ON DELETE RESTRICT,
 kind TEXT NOT NULL CHECK(kind IN('photo','support')),category TEXT NOT NULL,caption TEXT NOT NULL DEFAULT '',
 taken_at TEXT NOT NULL DEFAULT '',location_description TEXT NOT NULL DEFAULT '',
 created_by BIGINT NOT NULL REFERENCES admin_users(id) ON DELETE RESTRICT,updated_by BIGINT NOT NULL REFERENCES admin_users(id) ON DELETE RESTRICT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),deleted_at TIMESTAMPTZ
);
CREATE INDEX lampiran_kegiatan_activity_idx ON lampiran_kegiatan(activity_execution_id,kind) WHERE deleted_at IS NULL;
CREATE TABLE dokumen_kegiatan_lampiran (
 document_id BIGINT NOT NULL REFERENCES dokumen_kegiatan(id) ON DELETE RESTRICT,
 attachment_id BIGINT NOT NULL REFERENCES lampiran_kegiatan(id) ON DELETE RESTRICT,
 PRIMARY KEY(document_id,attachment_id)
);
COMMIT;
