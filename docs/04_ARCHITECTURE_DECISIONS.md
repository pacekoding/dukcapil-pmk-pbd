# Architecture Decisions

## Purpose

Mencatat keputusan arsitektur yang wajib diikuti agar sistem stabil, auditable, dan mudah dikembangkan.

## Scope

Berlaku untuk frontend, backend, database, file storage, auth, audit, dan deployment.

## Rules

### ADR-001: Dokumen Berdiri Sendiri dari Page Realisasi

- Dokumen disimpan pada `realisasi_documents`.
- Dokumen terkait langsung ke `subkegiatan`.
- SSD terkait diambil dari relasi subkegiatan-SSD.
- Page realisasi subkegiatan tidak menjadi dependency sistem dokumen.

Reason:

- User meminta page realisasi dihapus tetapi arsip dokumen tetap hidup.
- Dokumen adalah arsip pemerintah yang dapat berdiri sendiri sebagai bukti pendukung.

### ADR-002: Tahun Anggaran dari Session

- Backend mengambil tahun anggaran aktif dari claims/session.
- Query lintas tahun hanya boleh untuk role dan endpoint khusus.
- Frontend tidak boleh bebas mengirim tahun anggaran untuk bypass session.

### ADR-003: File Fisik di Filesystem, Metadata di PostgreSQL

- Metadata tersimpan di DB.
- File disimpan di volume `/uploads`.
- DB menyimpan URL/path relatif.
- Backup harus mencakup DB dan volume file.

### ADR-004: API Protected by Role

- Semua endpoint dokumen berada di protected API.
- Mutasi upload/edit/delete/validate dibatasi role.
- Download bisa dibatasi role sesuai kebijakan instansi.

### ADR-005: Audit Log sebagai Fitur Wajib Production

- Audit bukan optional untuk production.
- Minimal event:
  - upload
  - edit metadata
  - validate
  - download
  - preview
  - delete
  - restore

### ADR-006: shadcn-style Components

- UI memakai komponen yang sudah ada.
- Jangan menambah UI library baru tanpa ADR.
- Modal, table, badge, button, input harus konsisten.

## Implementation Examples

Endpoint ownership:

```txt
GET    /api/v1/realisasi-documents
POST   /api/v1/realisasi-documents
GET    /api/v1/realisasi-documents/:id/preview
GET    /api/v1/realisasi-documents/:id/download
DELETE /api/v1/realisasi-documents/:id
```

Directory storage:

```txt
uploads/realisasi-documents/{tahun_anggaran}/{subkegiatan_id}/{random}.{ext}
```

## Checklist

- [ ] Keputusan baru ditambahkan sebagai ADR.
- [ ] Keputusan lama tidak dilanggar diam-diam.
- [ ] Endpoint baru mengikuti ownership domain.
- [ ] File storage dan DB berjalan sinkron.
- [ ] Role dan audit dipertimbangkan.

## Anti-patterns

- Menghidupkan kembali page realisasi untuk kebutuhan arsip.
- Menambahkan state dokumen hanya di frontend.
- Menggunakan localStorage untuk role/permission.
- Menambah dependency UI tanpa alasan kuat.

## Acceptance Criteria

- Developer dapat menjelaskan kenapa dokumen langsung ke subkegiatan.
- Perubahan besar punya ADR baru.
- Tidak ada endpoint dokumen yang bergantung pada route realisasi lama.
