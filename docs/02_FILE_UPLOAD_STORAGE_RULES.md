# File Upload and Persistent Storage Rules

## Tujuan

Dokumen ini adalah kontrak implementasi upload, penyimpanan, preview, download,
penghapusan, migrasi, dan backup file portal DUKCAPIL-PBD.

## Cakupan

Storage persisten dipakai oleh:

- dokumen pelaksanaan dan arsip pegawai;
- logo serta arsip MACEKU PKK;
- thumbnail, gambar isi, dan lampiran OPTIMA INFO.

Import XLSX yang hanya diproses sementara bukan arsip persisten dan tidak masuk
ke tabel `stored_files`.

## Arsitektur

- File binary disimpan di filesystem host.
- PostgreSQL menyimpan metadata dan storage key relatif, bukan binary/base64.
- Docker memasang `${UPLOADS_HOST_PATH}` ke `${STORAGE_ROOT}`.
- Nilai Compose yang direkomendasikan untuk `STORAGE_ROOT` adalah
  `/app/storage/uploads`.
- Backend harus gagal saat startup jika storage root tidak dapat dibuat, dibaca,
  atau ditulis.
- Semua operasi filesystem melalui `internal/storage.Service`:
  `Save`, `Open`, `Delete`, `Exists`, dan `GetMetadata`.

Contoh path file baru:

```txt
private/arsip/sidoka-pmk/2026/{uuid}.pdf
private/maceku-pkk/lkpj/2026/{uuid}.pdf
private/maceku-pkk/kepengurusan/2026/{uuid}.webp
public/optima-info/images/2026/{uuid}.jpg
public/optima-info/documents/2026/{uuid}.pdf
```

`storage_key` di database selalu relatif terhadap `STORAGE_ROOT`. Path absolut,
path kosong, null byte, dan traversal `..` ditolak.

## Format dan Batas

Format arsip yang diizinkan:

| Jenis | Ekstensi | MIME |
| --- | --- | --- |
| PDF | `.pdf` | `application/pdf` |
| JPEG | `.jpg`, `.jpeg` | `image/jpeg` |
| PNG | `.png` | `image/png` |
| WebP | `.webp` | `image/webp` |

Validasi backend harus mencocokkan ekstensi, declared MIME, dan magic bytes.
File kosong, file palsu dengan ekstensi benar, dan format lain ditolak.

`MAX_UPLOAD_SIZE_MB` mengatur batas file aktual. Backend tetap menghitung byte
yang dibaca dan tidak hanya mempercayai ukuran multipart dari client. Compose
meneruskan nilai yang sama ke validasi frontend.

## Metadata

Tabel `stored_files` menyimpan:

- module, related entity type, related entity ID, dan category;
- original filename dan UUID stored filename;
- storage key, MIME, file size, dan SHA-256;
- visibility `private` atau `public`;
- uploaded user, created/updated time, dan soft-delete time.

Nama asli hanya digunakan sebagai metadata dan `Content-Disposition`. Nama asli
disanitasi, tetapi Unicode dan spasi yang aman tetap dipertahankan.

## Urutan Upload

1. Validasi login, role, system access, wilayah, tahun anggaran, dan metadata.
2. Validasi ukuran, ekstensi, MIME, dan magic bytes.
3. Buat path server dari allowlist segment dan UUID v4.
4. Stream ke file sementara di direktori tujuan sambil menghitung SHA-256.
5. `fsync`, publish secara atomik tanpa overwrite, lalu sinkronkan direktori.
6. Simpan metadata file dan foreign key parent dalam transaksi database.
7. Jika transaksi database gagal, hapus file baru.
8. Jika file parent diganti, commit metadata baru dan soft-delete metadata lama,
   lalu hapus binary lama setelah transaksi berhasil.

Upload dengan nama asli yang sama harus menghasilkan storage key berbeda.

## Akses File

Endpoint private:

```txt
GET|HEAD /api/v1/files/{file_id}/preview
GET|HEAD /api/v1/files/{file_id}/download
```

Endpoint public:

```txt
GET|HEAD /api/v1/website/files/{file_id}/preview
GET|HEAD /api/v1/website/files/{file_id}/download
```

Frontend mengakses endpoint tersebut melalui proxy same-origin
`/api/backend/...`.

Aturan akses:

- OPTIMA dashboard memerlukan system access `optima_info`.
- File OPTIMA public hanya tersedia jika visibility public, artikel induk
  berstatus `Published`, dan tanggal tayang aktif.
- MACEKU memerlukan system access `maceku_pkk` dan scope wilayah yang sesuai.
- Arsip private dibatasi oleh tahun anggaran pada token user.
- Super Admin tetap melalui endpoint terproteksi untuk file private.
- Storage key tidak dikirim ke response JSON.

Preview menggunakan `Content-Disposition: inline`; download menggunakan
`attachment`. Response mengirim MIME yang benar, `nosniff`, `Accept-Ranges`,
`ETag` jika checksum tersedia, dan mendukung Range request untuk PDF viewer.

Jangan menyajikan file private melalui static route atau URL filesystem.

## Penghapusan

- Metadata `stored_files` di-soft-delete di dalam transaksi.
- Binary dihapus setelah transaksi database berhasil.
- Kegagalan penghapusan binary dicatat dan tidak membatalkan transaksi parent.
- Penghapusan parent harus mencakup seluruh metadata file anak.
- Cleanup otomatis hanya boleh ditambahkan dengan retention policy, dry-run,
  dan audit yang eksplisit.

## Konfigurasi Host

Mac:

```env
UPLOADS_HOST_PATH=/Users/Shared/dukcapil-pmk/uploads
STORAGE_ROOT=/app/storage/uploads
MAX_UPLOAD_SIZE_MB=20
```

Linux:

```env
UPLOADS_HOST_PATH=/srv/dukcapil-pmk/uploads
STORAGE_ROOT=/app/storage/uploads
MAX_UPLOAD_SIZE_MB=20
```

Siapkan direktori Linux agar UID/GID backend `10001:10001` dapat menulis:

```bash
sudo install -d -m 0770 -o 10001 -g 10001 /srv/dukcapil-pmk/uploads
```

## Migrasi Volume Docker Lama

Versi lama menggunakan named volume pada `/app/uploads`. Sebelum menjalankan
Compose baru, salin isinya ke bind mount host dan jangan hapus volume lama:

```bash
set -a
. ./.env
set +a
mkdir -p "$UPLOADS_HOST_PATH"
docker run --rm \
  -v dukcapil-pbd_dukcapil-pbd-uploads:/source:ro \
  -v "$UPLOADS_HOST_PATH":/target \
  alpine:3.20 sh -c 'cp -a /source/. /target/'
```

Nama volume dapat diperiksa dengan `docker volume ls`. Setelah aplikasi baru
aktif, bandingkan jumlah file dan checksum file penting sebelum mempertimbangkan
penghapusan volume lama.

Migrasi SQL `000011_persistent_file_storage` membackfill metadata dan foreign key
untuk path legacy `/uploads/...`. Row legacy yang binary-nya sudah hilang tetap
tidak dapat direkonstruksi; file tersebut harus diunggah ulang.

## Backup dan Restore

Backup konsisten harus berisi dua artefak dari waktu yang sama:

```bash
set -a
. ./.env
set +a
mkdir -p backups
docker compose exec -T dukcapil-pbd-db sh -lc \
  'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' \
  > backups/dukcapil-pbd.dump
tar -C "$(dirname "$UPLOADS_HOST_PATH")" \
  -czf backups/dukcapil-pbd-uploads.tar.gz "$(basename "$UPLOADS_HOST_PATH")"
```

Restore dilakukan dengan menghentikan traffic upload, mengembalikan folder file
ke `UPLOADS_HOST_PATH`, lalu menjalankan `pg_restore` ke database tujuan. Setelah
restore, periksa permission direktori, jalankan aplikasi, dan validasi checksum
serta endpoint preview/download.

Jangan menjalankan:

```bash
docker compose down -v
```

Opsi `-v` menghapus volume PostgreSQL. Bind mount upload tetap harus dibackup
karena penghapusan folder host tidak dilindungi Docker.

## Checklist Verifikasi

- [ ] Storage root startup check berhasil.
- [ ] PDF, JPEG, PNG, dan WebP valid dapat diunggah.
- [ ] Format palsu, file kosong, dan file terlalu besar ditolak.
- [ ] Dua upload bernama sama menghasilkan UUID berbeda.
- [ ] Kegagalan database tidak meninggalkan file orphan.
- [ ] Metadata hanya menyimpan path relatif dan checksum SHA-256.
- [ ] User tanpa izin tidak dapat preview/download file private.
- [ ] Draft OPTIMA tidak dapat diakses dari endpoint public.
- [ ] Thumbnail dan PDF dapat dirender melalui proxy Next.js.
- [ ] File tetap ada setelah rebuild dan restart container.
- [ ] Backup PostgreSQL dan folder uploads tersedia.
