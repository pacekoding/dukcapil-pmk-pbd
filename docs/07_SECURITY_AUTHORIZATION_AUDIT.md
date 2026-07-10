# Security, Authorization, and Audit

## Purpose

Menetapkan kontrol keamanan dan audit untuk sistem dokumen pemerintah agar memenuhi kebutuhan akuntabilitas internal.

## Scope

Mencakup auth, role access, audit logs, download tracking, file safety, data retention, dan operational security.

## Rules

### Roles

Minimal role:

- Admin: kelola master, user, konfigurasi, koreksi dokumen.
- Operator: upload dan edit metadata dokumen milik unit/tahun.
- Verifikator: validasi/reject dokumen.
- Pimpinan: lihat dashboard, ringkasan, download bila diberi izin.
- Viewer: read-only sesuai scope.

### Authorization Matrix

| Action | Admin | Operator | Verifikator | Pimpinan | Viewer |
| --- | --- | --- | --- | --- | --- |
| List dokumen | yes | yes | yes | yes | yes |
| Upload | yes | yes | no | no | no |
| Edit metadata | yes | yes | no | no | no |
| Validate | yes | no | yes | no | no |
| Download | yes | yes | yes | yes | configurable |
| Delete | yes | restricted | no | no | no |
| Manage users | yes | no | no | no | no |

### Audit Requirements

Audit event wajib untuk:

- upload
- edit metadata
- validate/reject
- preview
- download
- delete
- restore

Audit fields:

- actor_id
- actor_role
- action
- document_id
- tahun_anggaran
- IP address
- user agent
- metadata JSON
- created_at

### Authentication

- Token/session harus HttpOnly.
- Jangan simpan token di localStorage.
- Session harus punya tahun anggaran aktif.
- Switch tahun anggaran harus diaudit.

### File Security

- Jangan expose path filesystem absolut.
- Path download harus lewat API, bukan direct directory browsing.
- Validate extension dan MIME allowlist.
- Jangan execute file.
- Jangan parse Office files di process utama.

### Data Protection

- Dokumen pemerintah tidak boleh terkirim ke third-party service tanpa approval.
- Backup harus encrypted.
- Production CORS tidak boleh `*`.

## Implementation Examples

Audit event:

```json
{
  "documentId": 10,
  "action": "download",
  "actorId": 3,
  "actorRole": "verifikator",
  "metadata": {
    "fileName": "Laporan.pdf"
  }
}
```

Role check in handler:

```go
claims, ok := authmiddleware.ClaimsFromContext(c)
if !ok { return echo.NewHTTPError(http.StatusUnauthorized, "session login tidak valid") }
if claims.Role != "superadmin" { return echo.NewHTTPError(http.StatusForbidden, "akses ditolak") }
```

## Checklist

- [ ] Role matrix diterapkan.
- [ ] Mutasi dokumen diaudit.
- [ ] Download/preview diaudit sebelum production.
- [ ] Token tidak tersimpan di localStorage.
- [ ] CORS production eksplisit.
- [ ] Delete menggunakan konfirmasi dan audit.
- [ ] File path tidak bocor.

## Anti-patterns

- Mengandalkan UI hide button sebagai authorization.
- Menggunakan role dari client payload.
- Menghapus dokumen tanpa audit.
- Menyediakan direct static URL untuk dokumen privat.
- Menampilkan stack trace ke user.

## Acceptance Criteria

- Auditor dapat melihat siapa upload/download/delete dokumen.
- User tidak bisa mengakses dokumen di luar role/tahun anggaran.
- File private hanya bisa diakses melalui endpoint yang diautentikasi.
