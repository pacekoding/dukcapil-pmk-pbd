# Go Echo Performance and Backend Rules

## Purpose

Dokumen ini menetapkan aturan backend Go Echo untuk menjaga performa, keamanan, dan maintainability sistem dokumen pemerintah.

## Scope

Berlaku untuk handler, service/repository, middleware, database access, upload/download file, logging, error handling, dan deployment runtime.

## Rules

### Handler / Service / Repository Separation

- Handler Echo hanya boleh:
  - parse input
  - validasi request dasar
  - memanggil service/repository
  - mapping error ke HTTP response
- Repository hanya mengurus query dan transaksi DB.
- Business rule yang dipakai lintas endpoint harus masuk service atau helper domain, bukan di handler.
- Jangan letakkan query besar langsung di router.

### Request Context and Cancellation

- Semua query harus memakai `c.Request().Context()`.
- Repository method wajib menerima `context.Context`.
- Operasi upload harus berhenti bila request context canceled sebelum DB write.

### Input Validation

- Validasi server tidak boleh bergantung pada validasi frontend.
- Validasi wajib:
  - tahun anggaran format `^\d{4}$`
  - subkegiatan_id positif
  - file wajib ada
  - format file allowlist
  - ukuran file maksimal
  - pagination positif dan dibatasi

### JSON Response Shape

- Sukses list:

```json
{
  "data": {
    "data": [],
    "meta": {
      "page": 1,
      "limit": 10,
      "total": 0,
      "totalPages": 1
    },
    "summary": {}
  }
}
```

- Error:

```json
{
  "message": "Dokumen gagal dimuat"
}
```

- Jangan expose error SQL mentah ke client.

### Middleware

- Auth middleware wajib berjalan sebelum protected routes.
- Role middleware harus membatasi mutasi data.
- CORS harus dikonfigurasi eksplisit di production.
- Tambahkan request ID middleware sebelum production bila belum ada.

### Logging

- Log server boleh menyimpan:
  - user id
  - role
  - endpoint
  - document id
  - action
  - latency
- Jangan log token, password, atau full file content.
- Error database detail cukup di server log, bukan response.

### Error Handling

- Repository mengembalikan error yang dibungkus konteks.
- Handler menerjemahkan ke HTTP status.
- `gorm.ErrRecordNotFound` harus menjadi 404, bukan 500.
- File missing pada download menjadi 404.

### Pagination

- Semua list wajib pagination.
- Default limit: 10.
- Max limit: 100.
- Query total dan data harus menggunakan filter yang sama.

### Database Connection Pooling

- Set pool di database init, minimal:
  - max open connections
  - max idle connections
  - connection max lifetime
- Nilai awal production:
  - max open: 20
  - max idle: 10
  - lifetime: 30m
- Sesuaikan dengan kapasitas PostgreSQL dan container.

### Query Optimization

- Index wajib untuk filter:
  - `tahun_anggaran`
  - `subkegiatan_id`
  - `created_at`
  - `is_dokumen_sdd`
  - status validasi bila ditambahkan
- Search teks sederhana boleh `LOWER(...) LIKE`, tetapi untuk data besar gunakan `GIN` + `to_tsvector`.
- Hindari N+1 query untuk SSD. Attach SSD dalam satu query berdasarkan list subkegiatan_id.

### Transactions

- Gunakan transaction untuk:
  - create dokumen + audit log
  - update metadata + audit log
  - validasi + audit log
  - delete + audit log
- File write dan DB write harus punya recovery path:
  - file berhasil, DB gagal: hapus file yang baru ditulis
  - DB berhasil, file gagal: jangan commit DB

### File Upload Handling

- Gunakan multipart streaming dari file header, bukan membaca semua ke memory.
- Batas ukuran harus dicek sebelum copy.
- File name fisik harus random, bukan original filename.
- Simpan original filename di DB.
- Content-type tidak cukup; validasi extension juga.
- Jangan menjalankan parser Office/PDF pada request path tanpa sandbox.

### Streaming Downloads

- Gunakan `http.ServeFile` atau streaming reader.
- Set `Content-Disposition`.
- Preview PDF memakai `inline`, download memakai `attachment`.
- Jangan load file penuh ke memory.

### Graceful Shutdown

- Echo server harus mendukung graceful shutdown dengan timeout.
- Stop menerima request baru, tunggu request aktif selesai.
- Tutup DB pool setelah shutdown.

### Benchmarking and Profiling

- Endpoint list dokumen harus diuji dengan 10k-100k rows.
- Benchmark query search/filter sebelum production.
- Aktifkan `pprof` hanya di environment internal dan dilindungi auth/network.

## Implementation Examples

Repository signature:

```go
func (r *DocumentRepository) List(ctx context.Context, params DocumentListParams) (DocumentListResponse, error) {
  db := r.db.WithContext(ctx)
  // query
}
```

Safe upload copy:

```go
source, err := header.Open()
if err != nil { return err }
defer source.Close()

target, err := os.Create(targetPath)
if err != nil { return err }
defer target.Close()

_, err = io.Copy(target, source)
```

## Checklist

- [ ] Handler tidak berisi query kompleks.
- [ ] Semua DB call memakai context.
- [ ] Pagination punya max limit.
- [ ] File upload streaming.
- [ ] File download streaming.
- [ ] Transaction untuk data + audit.
- [ ] Error response tidak bocor detail internal.
- [ ] Query list memakai index.
- [ ] Role middleware diterapkan.

## Anti-patterns

- `io.ReadAll(file)` untuk upload besar.
- Query tanpa `tahun_anggaran`.
- `SELECT *` untuk list table besar.
- Mengembalikan `err.Error()` langsung ke user.
- Delete file fisik sebelum DB delete berhasil.
- Membuat endpoint list tanpa limit.

## Acceptance Criteria

- Endpoint list tetap stabil pada puluhan ribu dokumen.
- Upload 15MB tidak menaikkan memory secara ekstrem.
- Request canceled menghentikan query DB.
- Download file besar tidak memuat file penuh ke memory.
