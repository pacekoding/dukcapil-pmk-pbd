# PostgreSQL Database Design

## Purpose

Menetapkan desain database production untuk sistem dokumen yang konsisten, aman, auditable, dan performant.

## Scope

Mencakup tabel dokumen, subkegiatan, SSD, validasi, audit log, index, constraint, migration, dan backup.

## Rules

### Core Tables

Minimal tabel:

- `subkegiatan`
- `ssd`
- `subkegiatan_ssd`
- `realisasi_documents`
- `document_audit_logs` (wajib sebelum production)
- `document_validation_statuses` atau kolom validasi pada dokumen

### realisasi_documents

Kolom minimal:

```sql
id BIGSERIAL PRIMARY KEY,
tahun_anggaran VARCHAR(4) NOT NULL,
subkegiatan_id BIGINT NOT NULL,
file_name TEXT NOT NULL,
original_name TEXT NOT NULL,
mime_type TEXT NOT NULL,
size BIGINT NOT NULL DEFAULT 0,
url TEXT NOT NULL,
is_dokumen_sdd BOOLEAN NOT NULL DEFAULT FALSE,
keterangan TEXT NOT NULL DEFAULT '',
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

Untuk production tambahkan:

```sql
uploaded_by BIGINT NOT NULL,
updated_by BIGINT,
validated_by BIGINT,
validation_status VARCHAR(32) NOT NULL DEFAULT 'draft',
validated_at TIMESTAMPTZ,
deleted_at TIMESTAMPTZ,
deleted_by BIGINT
```

### Constraints

- `tahun_anggaran` harus regex 4 digit.
- `subkegiatan_id` FK ke `(tahun_anggaran, id)` di `subkegiatan`.
- `size >= 0`.
- `file_name` dan `original_name` tidak blank.
- `validation_status` harus check constraint.

### Indexes

Wajib:

```sql
CREATE INDEX idx_realisasi_documents_tahun_created
ON realisasi_documents(tahun_anggaran, created_at DESC);

CREATE INDEX idx_realisasi_documents_subkegiatan
ON realisasi_documents(tahun_anggaran, subkegiatan_id);

CREATE INDEX idx_realisasi_documents_is_sdd
ON realisasi_documents(tahun_anggaran, is_dokumen_sdd);
```

Saat status validasi tersedia:

```sql
CREATE INDEX idx_realisasi_documents_validation
ON realisasi_documents(tahun_anggaran, validation_status);
```

Untuk search besar:

```sql
CREATE INDEX idx_realisasi_documents_search
ON realisasi_documents
USING GIN (to_tsvector('simple', file_name || ' ' || original_name || ' ' || keterangan));
```

### Audit Logs

Tabel wajib:

```sql
CREATE TABLE document_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  document_id BIGINT NOT NULL,
  tahun_anggaran VARCHAR(4) NOT NULL,
  actor_id BIGINT NOT NULL,
  actor_role VARCHAR(32) NOT NULL,
  action VARCHAR(32) NOT NULL,
  ip_address INET,
  user_agent TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Action allowed:

- upload
- update
- validate
- reject
- preview
- download
- delete
- restore

### Migrations

- Jangan hanya mengubah migration yang sudah pernah applied di DB existing.
- Tambahkan migration baru untuk perubahan schema.
- Migration harus idempotent jika memperbaiki environment existing.
- Down migration tidak boleh menghapus data production tanpa instruksi eksplisit.

### Backup

- Backup DB tanpa volume file tidak cukup.
- Backup harus mencakup:
  - PostgreSQL dump
  - uploads volume
  - migration version

## Implementation Examples

Migration repair untuk DB existing:

```sql
CREATE TABLE IF NOT EXISTS realisasi_documents (...);
CREATE INDEX IF NOT EXISTS ...;
```

Soft delete query:

```sql
UPDATE realisasi_documents
SET deleted_at = NOW(), deleted_by = $1
WHERE id = $2 AND tahun_anggaran = $3;
```

## Checklist

- [ ] FK memakai tahun anggaran.
- [ ] Index sesuai filter UI.
- [ ] Audit table tersedia sebelum production.
- [ ] Migration baru dibuat untuk DB existing.
- [ ] Delete strategy jelas.
- [ ] Backup file dan DB satu paket.

## Anti-patterns

- Menghapus data dengan hard delete tanpa audit.
- Menyimpan file binary di PostgreSQL untuk dokumen besar.
- Query search tanpa index pada data besar.
- Mengubah `000001` saja setelah production.
- FK hanya ke `id` tanpa tahun anggaran pada master tahunan.

## Acceptance Criteria

- DB existing dapat migrate tanpa error `relation does not exist`.
- Query list dokumen memakai index utama.
- Dokumen tidak orphan dari subkegiatan.
- Audit dapat menjawab siapa melakukan apa, kapan, dari mana.
