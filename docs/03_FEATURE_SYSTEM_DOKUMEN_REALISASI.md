# Feature: Sistem Dokumen Pendukung Realisasi Subkegiatan

## Purpose

Mendefinisikan fitur utama sistem dokumen pendukung realisasi subkegiatan agar frontend, backend, database, dan QA memiliki target implementasi yang sama.

## Scope

Fitur mencakup:

- Upload dokumen.
- Metadata dokumen.
- Relasi dokumen ke subkegiatan dan SSD.
- Search dan filter.
- Preview dan download.
- Status DSSD/non-DSSD.
- Kelengkapan dokumen wajib.
- Validasi dokumen.
- Audit log.
- Dashboard ringkasan.

## Rules

### Entity Utama

- Dokumen wajib terkait ke `subkegiatan_id`.
- SSD terkait diturunkan dari relasi `subkegiatan_ssd`.
- Tahun anggaran wajib diambil dari session user.
- Dokumen harus memiliki:
  - nama dokumen
  - original filename
  - stored filename/path
  - mime type
  - size
  - jenis file
  - is_dokumen_sdd
  - keterangan
  - uploaded_by
  - created_at

### Upload Dokumen

- Format allowed:
  - PDF
  - DOC
  - DOCX
  - XLS
  - XLSX
  - PNG
  - JPG/JPEG
- Upload wajib memakai multipart/form-data.
- Nama file fisik random.
- Original name tidak boleh dipakai sebagai path fisik.
- Label UI memakai istilah `DSSD`; nama field API/DB saat ini tetap `is_dokumen_sdd` sampai ada migration terpisah yang mengganti kontrak.

### Search and Filter

Filter wajib didesain untuk:

- tahun anggaran
- program
- kegiatan
- subkegiatan
- OPD/unit
- jenis dokumen
- status validasi
- tanggal upload
- DSSD/non-DSSD

Jika master program/kegiatan/OPD belum ada, jangan buat field dummy di UI. Siapkan API contract dan DB column saat model domainnya tersedia.

### Preview

- PDF: inline preview.
- Image: inline preview.
- Word/Excel: download only.
- Jika file fisik hilang, tampilkan 404 dan audit event `download_failed` bila audit sudah tersedia.

### Completeness Validation

- Kelengkapan dokumen harus berbasis aturan per jenis subkegiatan atau SSD.
- Jangan hardcode daftar dokumen wajib di frontend.
- Backend harus mengembalikan summary:
  - required_total
  - uploaded_total
  - missing_documents
  - completeness_status

### Validation Workflow

Status minimal:

- draft
- submitted
- valid
- invalid

Role:

- Operator upload/edit.
- Verifikator validasi.
- Pimpinan melihat ringkasan.
- Viewer membaca/download sesuai izin.
- Admin konfigurasi dan koreksi.

## Implementation Examples

Payload upload:

```ts
{
  file: File,
  subkegiatan_id: number,
  is_dokumen_sdd: boolean, // UI label: DSSD
  nama_dokumen?: string,
  keterangan?: string
}
```

List response item:

```json
{
  "id": 10,
  "subkegiatanId": 20,
  "fileName": "Laporan Final",
  "fileType": "pdf",
  "isDokumenSdd": true,
  "subkegiatanCode": "2.12.01",
  "subkegiatanName": "Pelayanan Administrasi Kependudukan",
  "ssdItems": [],
  "tanggalUpload": "2026-07-06T10:00:00Z"
}
```

## Checklist

- [ ] Dokumen tidak bisa dibuat tanpa subkegiatan.
- [ ] Upload menyimpan file fisik dan metadata.
- [ ] List bisa search/filter.
- [ ] Download original tersedia.
- [ ] Preview PDF/image tersedia.
- [ ] Status DSSD jelas.
- [ ] Audit event tersedia untuk aksi penting.
- [ ] Kelengkapan dokumen wajib bisa dihitung.

## Anti-patterns

- Menempelkan dokumen ke entitas realisasi UI lama.
- Menganggap semua dokumen adalah realisasi kegiatan.
- Menyimpan status validasi hanya di frontend.
- Menghapus dokumen tanpa audit.
- Membuat completeness rule hardcoded di React component.

## Acceptance Criteria

- Operator dapat upload dokumen dan menemukannya melalui search.
- Verifikator dapat melihat dokumen yang perlu divalidasi.
- Pimpinan dapat melihat ringkasan kelengkapan.
- Viewer dapat preview/download sesuai role.
