# API Contracts

## Purpose

Menetapkan kontrak API yang stabil untuk frontend dan backend sistem dokumen.

## Scope

Mencakup endpoint dokumen, search/filter, upload, preview, download, delete, validasi, dashboard, error, dan pagination.

## Rules

- Semua endpoint protected memakai auth middleware.
- Semua response sukses dibungkus `data`.
- Semua error memakai `message`.
- Tahun anggaran default dari session.
- Pagination wajib untuk list.
- Mutasi harus menghasilkan audit log sebelum production.

## Endpoints

### List Documents

```http
GET /api/v1/realisasi-documents?search=&file_type=&page=1&limit=10
```

Query params:

- `search`: nama dokumen, subkegiatan, SSD.
- `file_type`: `pdf | word | excel | image | semua`.
- `tahun_anggaran`: hanya untuk endpoint role khusus; default session.
- `validation_status`: future production.
- `date_from`, `date_to`: future production.

Response:

```json
{
  "data": {
    "data": [
      {
        "id": 1,
        "subkegiatanId": 10,
        "fileName": "Laporan Pelaksanaan",
        "storedFileName": "abc.pdf",
        "fileType": "pdf",
        "mimeType": "application/pdf",
        "fileSize": 2048,
        "downloadUrl": "/api/v1/realisasi-documents/1/download",
        "previewUrl": "/api/v1/realisasi-documents/1/preview",
        "isDokumenSdd": true,
        "keterangan": "",
        "subkegiatanCode": "2.12.01",
        "subkegiatanName": "Administrasi Kependudukan",
        "ssdItems": [],
        "tanggalUpload": "2026-07-06T10:00:00Z"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    },
    "summary": {
      "totalDocuments": 1,
      "totalPdf": 1,
      "totalWord": 0,
      "totalExcel": 0,
      "totalFileSize": 2048
    }
  }
}
```

### Upload Document

```http
POST /api/v1/realisasi-documents
Content-Type: multipart/form-data
```

Fields:

- `file`: required.
- `subkegiatan_id`: required.
- `is_dokumen_sdd`: required boolean string.
- `nama_dokumen`: optional.
- `keterangan`: optional.

Compatibility note:

- UI label must be `Dokumen DSSD`.
- API/DB field remains `is_dokumen_sdd` in the current implementation. Rename only through explicit API versioning and database migration.

Response: document item.

### Update Document Metadata

```http
PUT /api/v1/realisasi-documents/:id
Content-Type: application/json
```

Payload:

```json
{
  "subkegiatan_id": 10,
  "is_dokumen_sdd": true,
  "nama_dokumen": "Laporan Pelaksanaan",
  "keterangan": "Catatan opsional"
}
```

Rules:

- Tidak mengganti file fisik.
- `subkegiatan_id` wajib valid pada tahun anggaran session.
- `nama_dokumen` wajib tidak kosong.
- UI label tetap `Dokumen DSSD`, field API tetap `is_dokumen_sdd`.

Response: document item.

### Preview Document

```http
GET /api/v1/realisasi-documents/:id/preview
```

- PDF/image only.
- Returns inline file stream.
- Unsupported preview returns 400.

### Download Document

```http
GET /api/v1/realisasi-documents/:id/download
```

- Returns original document stream.
- Content-Disposition must be attachment.

### Delete Document

```http
DELETE /api/v1/realisasi-documents/:id
```

Production rule:

- Prefer soft delete.
- Hard delete only if retention policy allows.
- Audit required.

### Validation Future Contract

```http
PATCH /api/v1/realisasi-documents/:id/validation
```

Payload:

```json
{
  "status": "valid",
  "notes": "Dokumen sesuai."
}
```

Allowed statuses:

- draft
- submitted
- valid
- invalid

## Error Shape

```json
{
  "message": "Subkegiatan wajib dipilih"
}
```

Status code rules:

- 400: invalid input.
- 401: unauthenticated.
- 403: unauthorized role/year.
- 404: not found.
- 413: file too large.
- 500: internal server error with safe message.

## Implementation Examples

Frontend upload:

```ts
const formData = new FormData();
formData.append("file", file);
formData.append("subkegiatan_id", String(subkegiatanId));
formData.append("is_dokumen_sdd", String(isDokumenDssd));
```

## Checklist

- [ ] Endpoint protected.
- [ ] Response shape stable.
- [ ] Pagination present.
- [ ] Error message safe.
- [ ] Upload uses multipart.
- [ ] Download streams file.
- [ ] Preview restricted.
- [ ] Delete role restricted.

## Anti-patterns

- Returning raw DB rows with internal column names.
- Using different casing per endpoint.
- Returning HTML error pages from API.
- Accepting file upload as base64 JSON.
- Letting frontend set `uploaded_by`.

## Acceptance Criteria

- Frontend can implement all screens from this contract.
- Backend can reject invalid requests with specific messages.
- API is testable using curl/Postman without UI.
