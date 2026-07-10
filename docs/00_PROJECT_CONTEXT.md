# Project Context

## Purpose

Dokumen ini menetapkan konteks produk dan batas kerja teknis untuk aplikasi internal Dinas gabungan Dukcapil dan PMK Provinsi Papua Barat Daya. Semua implementasi harus mengacu pada konteks ini sebelum menambah fitur, mengubah API, atau mengubah struktur database.

## Scope

Sistem adalah aplikasi internal pemerintah untuk mengelola dokumen pendukung utama yang terkait dengan realisasi subkegiatan. Fokus sistem adalah dokumen, subkegiatan, SSD/DSSD, validasi, pencarian, pengunduhan, pratinjau, dan audit akuntabilitas.

Stack yang digunakan:

- Frontend: Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui-style components.
- Backend: Go, Echo framework.
- Database: PostgreSQL.
- Deployment: Docker Compose.
- Auth: JWT/session cookie sesuai implementasi project.

## Rules

- Sistem dokumen adalah sumber kebenaran untuk arsip pendukung subkegiatan.
- Subkegiatan dan SSD adalah master data; dokumen harus terhubung ke subkegiatan, dan SSD diturunkan dari relasi subkegiatan-SSD.
- Tahun anggaran adalah batas data utama. Query list wajib scoped ke tahun anggaran aktif/session.
- Istilah UI harus memakai Bahasa Indonesia formal, jelas, dan operasional.
- Semua perubahan yang menyentuh dokumen harus mempertimbangkan audit log.
- File tidak boleh hilang karena operasi UI biasa. Delete harus soft-delete atau memiliki audit dan konfirmasi kuat bila hard-delete dipakai.
- Preview hanya untuk format aman: PDF dan image. Word/Excel wajib download original.
- Dokumen DSSD/non-DSSD wajib eksplisit, bukan inferensi dari nama file.
- Role akses minimal: Admin, Operator, Verifikator, Pimpinan, Viewer.

## Implementation Examples

Domain utama:

```txt
Subkegiatan -> Dokumen
Subkegiatan -> SSD
Dokumen -> AuditLog
Dokumen -> Validasi
Dokumen -> UploadedBy / UpdatedBy / ValidatedBy
```

Contoh bahasa UI:

```txt
Upload Dokumen
Dokumen berhasil diupload.
Subkegiatan wajib dipilih.
Format file tidak didukung.
```

Contoh istilah yang harus dihindari:

```txt
Invalid input
Something went wrong
Submit
File error
```

## Checklist

- [ ] Fitur baru memiliki relasi ke tahun anggaran.
- [ ] Fitur dokumen memiliki audit event.
- [ ] Aksi destruktif punya konfirmasi.
- [ ] API list mendukung pagination.
- [ ] UI memakai bahasa Indonesia formal.
- [ ] Akses role sudah jelas.
- [ ] File upload tidak memuat seluruh file ke memory.
- [ ] Migration disiapkan untuk DB existing, bukan hanya init schema.

## Anti-patterns

- Membuat fitur dokumen menempel ke page realisasi lama.
- Menyimpan dokumen tanpa subkegiatan.
- Menampilkan error teknis database ke user.
- Menghapus file fisik sebelum transaksi database sukses.
- Mengandalkan nama file untuk menentukan status DSSD.
- Mengubah `000001` saja untuk perubahan schema pada DB yang sudah berjalan tanpa migration lanjutan.

## Acceptance Criteria

- Developer baru dapat memahami domain dan batas fitur dalam 10 menit.
- Setiap PR fitur dokumen dapat ditinjau terhadap aturan di dokumen ini.
- Tidak ada fitur baru yang bypass tahun anggaran, role, dan audit.
