# Testing and QA Rules

## Purpose

Menetapkan standar pengujian agar fitur dokumen aman untuk production dan tidak merusak fitur lama.

## Scope

Berlaku untuk frontend, backend, API, database migration, file upload/download, role access, dan QA manual.

## Rules

### Backend Tests

Minimal coverage:

- validation request
- list pagination
- file type detection
- upload failure cleanup
- document query filter
- role forbidden
- not found download

Run:

```bash
cd apps/dukcapil-pbd-be
go test ./...
```

### Frontend Tests

Jika test runner belum tersedia, wajib manual QA checklist. Bila ditambahkan:

- component test untuk upload dialog
- form validation test
- table empty/loading/error state test
- route smoke test

Run current checks:

```bash
cd apps/dukcapil-pbd-fe
npm run lint
npm run build
```

### API QA

Test with curl/Postman:

- list empty docs
- upload missing file
- upload invalid format
- upload valid PDF
- search by subkegiatan
- filter by file type
- preview PDF
- download Word/Excel
- delete document with insufficient role

### Migration QA

For DB existing:

- Start from DB with `schema_migrations` at `000001`.
- Run app and confirm `000002` applies.
- Confirm `realisasi_documents` exists.
- Confirm old tables dropped if present.
- Confirm no error `relation does not exist`.

### File QA

- Upload same original filename twice.
- Upload max allowed size.
- Try unsupported file extension.
- Delete a document and verify download no longer works.
- Verify migrated legacy file path still downloads if migration moved metadata only.

### Role QA

- Operator can upload.
- Verifikator can validate but not upload if policy says no.
- Viewer cannot delete.
- Pimpinan sees dashboard summaries.

## Implementation Examples

Manual API upload:

```bash
curl -X POST http://localhost:8080/api/v1/realisasi-documents \
  -b cookies.txt \
  -F "file=@sample.pdf" \
  -F "subkegiatan_id=1" \
  -F "is_dokumen_sdd=true" \
  -F "nama_dokumen=Sample PDF"
```

Migration check:

```sql
SELECT version, dirty FROM schema_migrations;
SELECT COUNT(*) FROM realisasi_documents;
```

## Checklist

- [ ] `go test ./...` passes.
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.
- [ ] Migration tested on existing DB.
- [ ] Upload valid/invalid tested.
- [ ] Preview/download tested.
- [ ] Role access tested.
- [ ] Empty state tested.

## Anti-patterns

- Testing only happy path upload.
- Skipping migration test because fresh DB works.
- Ignoring production build because dev server works.
- Not testing download after deploy volume mount.
- Testing auth only as superadmin.

## Acceptance Criteria

- QA can reproduce all critical flows from this document.
- No production build/type errors.
- Existing DB migrates without manual table creation.
- Invalid uploads fail with clear messages.
