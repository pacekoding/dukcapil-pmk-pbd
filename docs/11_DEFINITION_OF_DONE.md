# Definition of Done

## Purpose

Menetapkan syarat selesai untuk fitur, bug fix, dan perubahan arsitektur.

## Scope

Berlaku untuk semua pekerjaan frontend, backend, database, upload file, security, dan dokumentasi.

## Rules

### Functional Done

- Fitur memenuhi requirement.
- UI states lengkap:
  - default
  - loading
  - empty
  - error
  - success
- API response sesuai contract.
- Role access sesuai matrix.
- Audit event tersedia untuk mutasi production.

### Technical Done

- TypeScript build sukses.
- Go compile/test sukses.
- Migration tersedia untuk DB fresh dan existing.
- Query diberi index yang relevan.
- File upload/download memory-safe.
- No dead route/menu/import.

### UX Done

- Bahasa Indonesia formal.
- Primary action jelas.
- Form tidak memenuhi halaman utama.
- Validasi field spesifik.
- Mobile usable.
- A11y label dan error association tersedia.

### Security Done

- Auth middleware diterapkan.
- Authorization tidak hanya di frontend.
- File path aman.
- Sensitive data tidak dilog.
- Delete/validate/download diaudit.

### Documentation Done

- `/docs` update bila ada perubahan arsitektur/API/schema.
- README atau workflow update bila command berubah.
- Migration note ditulis bila DB existing perlu perhatian.

## Implementation Examples

PR checklist:

```txt
[ ] Requirement implemented
[ ] Migration added/tested
[ ] API contract updated
[ ] FE type updated
[ ] UI states covered
[ ] Role access checked
[ ] Audit considered
[ ] go test ./...
[ ] npm run lint
[ ] npm run build
```

Done for upload feature:

```txt
User can upload a valid PDF.
Invalid DOCX spoofed as .exe is rejected.
Document appears in table after upload.
Download streams original file.
Audit log records upload and download.
```

## Checklist

- [ ] No broken imports/routes.
- [ ] No generic error messages.
- [ ] No schema drift.
- [ ] No unaudited destructive action.
- [ ] No direct file exposure.
- [ ] No production build failure.
- [ ] No missing mobile path.
- [ ] No regression to search/filter/download.

## Anti-patterns

- Declaring done after UI-only implementation.
- Ignoring migration because local DB was reset.
- Hiding buttons instead of enforcing backend role.
- Treating `go test` skipped due sandbox/cache as success without rerun.
- Leaving obsolete docs/routes after deleting a feature.

## Acceptance Criteria

- Reviewer can verify completion using only this checklist plus linked docs.
- Production deploy does not require manual DB patch unless explicitly documented.
- Feature can be used by target role without developer assistance.
