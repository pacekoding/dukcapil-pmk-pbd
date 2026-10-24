BEGIN;
CREATE TABLE surat_tugas (
 id BIGSERIAL PRIMARY KEY,
 number TEXT NOT NULL DEFAULT '', document_date DATE NOT NULL, issue_place TEXT NOT NULL,
 bases JSONB NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(bases)='array'),
 instructions JSONB NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(instructions)='array'),
 origin TEXT NOT NULL, destination TEXT NOT NULL,
 departure_date DATE NOT NULL, return_date DATE NOT NULL CHECK(return_date >= departure_date),
 trip_type TEXT NOT NULL, transport TEXT NOT NULL DEFAULT '',
 signer_id BIGINT NOT NULL REFERENCES arsip_pegawai(id) ON DELETE RESTRICT,
 status TEXT NOT NULL DEFAULT 'Draft' CHECK(status IN ('Draft','Final','Dibatalkan')),
 snapshot JSONB,
 created_by BIGINT NOT NULL REFERENCES admin_users(id) ON DELETE RESTRICT,
 updated_by BIGINT NOT NULL REFERENCES admin_users(id) ON DELETE RESTRICT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 finalized_at TIMESTAMPTZ, finalized_by BIGINT REFERENCES admin_users(id) ON DELETE RESTRICT,
 cancelled_at TIMESTAMPTZ, cancelled_by BIGINT REFERENCES admin_users(id) ON DELETE RESTRICT,
 cancellation_reason TEXT NOT NULL DEFAULT '',
 CHECK(status <> 'Final' OR (snapshot IS NOT NULL AND finalized_at IS NOT NULL AND finalized_by IS NOT NULL AND BTRIM(number)<>'')),
 CHECK(status <> 'Dibatalkan' OR (cancelled_at IS NOT NULL AND cancelled_by IS NOT NULL AND BTRIM(cancellation_reason)<>''))
);
CREATE UNIQUE INDEX surat_tugas_number_unique ON surat_tugas(LOWER(BTRIM(number))) WHERE BTRIM(number)<>'';
CREATE INDEX surat_tugas_filter_idx ON surat_tugas(document_date,status);
CREATE INDEX surat_tugas_signer_idx ON surat_tugas(signer_id);
CREATE TABLE surat_tugas_pelaksana (
 assignment_letter_id BIGINT NOT NULL REFERENCES surat_tugas(id) ON DELETE CASCADE,
 employee_id BIGINT NOT NULL REFERENCES arsip_pegawai(id) ON DELETE RESTRICT,
 sort_order INTEGER NOT NULL DEFAULT 0,
 PRIMARY KEY(assignment_letter_id,employee_id)
);
CREATE INDEX surat_tugas_pelaksana_employee_idx ON surat_tugas_pelaksana(employee_id);
CREATE TABLE spd (
 id BIGSERIAL PRIMARY KEY,
 assignment_letter_id BIGINT NOT NULL REFERENCES surat_tugas(id) ON DELETE RESTRICT,
 employee_id BIGINT NOT NULL,
 FOREIGN KEY(assignment_letter_id,employee_id) REFERENCES surat_tugas_pelaksana(assignment_letter_id,employee_id) ON DELETE RESTRICT,
 number TEXT NOT NULL DEFAULT '', sheet_number TEXT NOT NULL DEFAULT '1', code TEXT NOT NULL DEFAULT '',
 document_date DATE NOT NULL, issue_place TEXT NOT NULL,
 signer_id BIGINT NOT NULL REFERENCES arsip_pegawai(id) ON DELETE RESTRICT,
 signer_role TEXT NOT NULL DEFAULT 'Pejabat Pembuat Komitmen', expense_level TEXT NOT NULL DEFAULT '',
 followers JSONB NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(followers)='array'),
 approvals JSONB NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(approvals)='array'),
 skpd TEXT NOT NULL, subkegiatan_id BIGINT REFERENCES subkegiatan(id) ON DELETE RESTRICT,
 account_code TEXT NOT NULL DEFAULT '', funding_source TEXT NOT NULL DEFAULT '', fiscal_year INTEGER NOT NULL CHECK(fiscal_year BETWEEN 1900 AND 9999),
 notes TEXT NOT NULL DEFAULT '',
 returned_place TEXT NOT NULL DEFAULT '', returned_date TEXT NOT NULL DEFAULT '',
 return_officer_name TEXT NOT NULL DEFAULT '', return_officer_nip TEXT NOT NULL DEFAULT '', return_officer_position TEXT NOT NULL DEFAULT '',
 status TEXT NOT NULL DEFAULT 'Draft' CHECK(status IN ('Draft','Final','Dibatalkan')),
 snapshot JSONB,
 created_by BIGINT NOT NULL REFERENCES admin_users(id) ON DELETE RESTRICT,
 updated_by BIGINT NOT NULL REFERENCES admin_users(id) ON DELETE RESTRICT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 finalized_at TIMESTAMPTZ, finalized_by BIGINT REFERENCES admin_users(id) ON DELETE RESTRICT,
 cancelled_at TIMESTAMPTZ, cancelled_by BIGINT REFERENCES admin_users(id) ON DELETE RESTRICT,
 cancellation_reason TEXT NOT NULL DEFAULT '',
 CHECK(status <> 'Final' OR (snapshot IS NOT NULL AND finalized_at IS NOT NULL AND finalized_by IS NOT NULL AND BTRIM(number)<>'')),
 CHECK(status <> 'Dibatalkan' OR (cancelled_at IS NOT NULL AND cancelled_by IS NOT NULL AND BTRIM(cancellation_reason)<>''))
);
CREATE UNIQUE INDEX spd_number_unique ON spd(LOWER(BTRIM(number))) WHERE BTRIM(number)<>'';
CREATE UNIQUE INDEX spd_active_member_unique ON spd(assignment_letter_id,employee_id) WHERE status<>'Dibatalkan';
CREATE INDEX spd_filter_idx ON spd(fiscal_year,status);
CREATE INDEX spd_employee_idx ON spd(employee_id);
CREATE INDEX spd_signer_idx ON spd(signer_id);
CREATE INDEX spd_subkegiatan_idx ON spd(subkegiatan_id);
COMMIT;
