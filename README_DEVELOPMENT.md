# Development README

## Purpose

Panduan ringkas untuk developer yang mengerjakan sistem dokumen internal Dinas gabungan Dukcapil dan PMK Provinsi Papua Barat Daya.

## Scope

Mencakup cara memahami project, menjalankan service, aturan perubahan, checks wajib, dan referensi dokumentasi.

## Rules

- Baca `/docs/00_PROJECT_CONTEXT.md` sebelum mengubah domain dokumen.
- Untuk UI, ikuti `/docs/01_UI_UX_RULES_SHADCN.md`.
- Untuk backend Go Echo, ikuti `/docs/02_GO_ECHO_PERFORMANCE_BEST_PRACTICES.md`.
- Untuk perubahan schema, selalu cek `/docs/05_DATABASE_DESIGN_POSTGRESQL.md`.
- Jangan menghidupkan kembali route/page `realisasi-subkegiatan`; sistem dokumen berdiri sendiri pada arsip dokumen.

## Local Development

Start database:

```bash
docker compose up -d dukcapil-pbd-db
```

Run backend:

```bash
cd apps/dukcapil-pbd-be
go run ./cmd/api
```

Run frontend:

```bash
cd apps/dukcapil-pbd-fe
npm run dev
```

Production-like Docker rebuild:

```bash
docker compose up -d --build dukcapil-pbd-be dukcapil-pbd-fe
```

## Required Checks

Backend:

```bash
cd apps/dukcapil-pbd-be
go test ./...
```

Frontend:

```bash
cd apps/dukcapil-pbd-fe
npm run lint
npm run build
```

## Implementation Examples

Upload dokumen dari frontend harus memakai `FormData`, bukan JSON base64:

```ts
const formData = new FormData();
formData.append("file", file);
formData.append("subkegiatan_id", String(subkegiatanId));
formData.append("is_dokumen_sdd", String(isDokumenDssd));
```

Route arsip dokumen harus tetap menjadi entry point utama:

```txt
/dashboard/arsip-dokumen-realisasi
```

## Migration Notes

- Migration files are embedded by Go using `embed`.
- If a new migration is added, rebuild backend container.
- Editing `000001` only affects fresh DB. Existing DB needs a new migration version.
- Check migration status in PostgreSQL:

```sql
SELECT version, dirty FROM schema_migrations;
```

## Documentation Map

- `docs/00_PROJECT_CONTEXT.md`: product and domain context.
- `docs/01_UI_UX_RULES_SHADCN.md`: dashboard UI rules.
- `docs/02_GO_ECHO_PERFORMANCE_BEST_PRACTICES.md`: backend rules.
- `docs/03_FEATURE_SYSTEM_DOKUMEN_REALISASI.md`: feature definition.
- `docs/04_ARCHITECTURE_DECISIONS.md`: ADRs.
- `docs/05_DATABASE_DESIGN_POSTGRESQL.md`: schema and migration rules.
- `docs/06_API_CONTRACTS.md`: API contracts.
- `docs/07_SECURITY_AUTHORIZATION_AUDIT.md`: auth, role, audit.
- `docs/08_FILE_UPLOAD_STORAGE_RULES.md`: file storage rules.
- `docs/09_TESTING_QA_RULES.md`: QA and testing.
- `docs/10_DEVELOPMENT_WORKFLOW.md`: working process.
- `docs/11_DEFINITION_OF_DONE.md`: completion checklist.

## Checklist

- [ ] Read relevant docs before coding.
- [ ] Follow existing code patterns.
- [ ] Add migration for schema change.
- [ ] Run backend tests.
- [ ] Run frontend lint/build.
- [ ] Update docs if behavior changes.
- [ ] Verify Docker build if deployment files changed.

## Anti-patterns

- Making schema changes without migration.
- Adding UI library for one component.
- Returning raw backend errors to users.
- Uploading files via base64 JSON.
- Creating feature docs after implementation only when requested.

## Acceptance Criteria

- Developer can run local services.
- Developer knows mandatory checks.
- Developer knows where to update docs for each type of change.
