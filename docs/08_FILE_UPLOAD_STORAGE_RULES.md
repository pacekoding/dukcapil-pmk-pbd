# File Upload and Storage Rules

## Purpose

Menetapkan aturan upload, penyimpanan, preview, download, dan penghapusan file agar tidak terjadi kehilangan dokumen atau risiko keamanan.

## Scope

Berlaku untuk file PDF, Word, Excel, dan image yang diupload sebagai dokumen pendukung subkegiatan.

## Rules

### Allowed Formats

Allowed:

- `.pdf`
- `.doc`
- `.docx`
- `.xls`
- `.xlsx`
- `.png`
- `.jpg`
- `.jpeg`

Current implementation may support subset. Jika menambah image, update frontend accept, backend allowlist, fileType mapper, dan preview route.

### Size Limit

- Default max: 15MB per file.
- Jika perlu lebih besar, ubah backend limit, reverse proxy limit, dan UI helper.

### Storage Path

Gunakan path:

```txt
uploads/realisasi-documents/{tahun_anggaran}/{subkegiatan_id}/{random}.{ext}
```

Rules:

- Random filename minimal 16 bytes entropy.
- Original filename hanya metadata.
- Path DB harus relatif, bukan absolute.
- Jangan mengizinkan `..` atau path traversal.

### Upload Sequence

1. Validate auth/role.
2. Parse multipart.
3. Validate required fields.
4. Validate file extension and MIME.
5. Generate random filename.
6. Create directory.
7. Stream copy file to disk.
8. Insert DB metadata in transaction.
9. Write audit log.
10. On DB failure, remove new file.

### Download Sequence

1. Validate auth/role.
2. Load document metadata scoped by tahun anggaran.
3. Validate file path inside uploads.
4. Audit download attempt.
5. Stream file.

### Preview Sequence

- PDF and image only.
- Word/Excel must download.
- Preview must use `inline` disposition.

### Delete Strategy

Production preferred:

- Soft-delete DB row.
- Keep file until retention window expires.
- Audit delete.

If hard delete:

- Delete DB row first in transaction/audit.
- Delete file after DB success.
- Log if file delete fails.

### Prevent Accidental Loss

- Never overwrite existing stored file.
- Do not reuse original filename as stored filename.
- Keep backups of uploads volume.
- Do not run cleanup jobs without dry-run and retention rules.

## Implementation Examples

Path validation:

```go
clean := filepath.Clean(strings.TrimPrefix(storageURL, "/"))
if !strings.HasPrefix(filepath.ToSlash(clean), "uploads/realisasi-documents/") {
  return "", fmt.Errorf("storage path is outside uploads")
}
```

File input accept:

```tsx
accept="application/pdf,.pdf,.doc,.docx,.xls,.xlsx,image/png,image/jpeg"
```

## Checklist

- [ ] Extension allowlist.
- [ ] MIME allowlist.
- [ ] Random stored filename.
- [ ] Original filename stored.
- [ ] File copy streaming.
- [ ] DB failure removes newly copied file.
- [ ] Download streams file.
- [ ] Backup includes uploads.

## Anti-patterns

- Storing upload as base64.
- Using original filename in disk path.
- Allowing all MIME types.
- Deleting file before DB update.
- Serving private docs via unauthenticated static URL.

## Acceptance Criteria

- Upload invalid format fails before DB insert.
- Same filename can be uploaded multiple times without overwrite.
- Download large file does not spike memory.
- A deleted document can be audited and recovered if policy requires.
