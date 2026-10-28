# Master struktur organisasi pegawai

## Perilaku

Menu **Pengaturan > Struktur Organisasi** berada di `/internal/pengaturan/struktur-organisasi`, dengan tab Bidang, Seksi, dan Jabatan. Masing-masing menyediakan pencarian, tambah, edit, aktif/nonaktif, dan hapus dengan konfirmasi. Tersedia filter bidang, seksi, dan status sesuai tab.

Pengelolaan mengikuti hak Pengaturan existing: hanya `superadmin`. `admin_sekretariat` mendapat akses baca API master untuk form pegawai; role lain dan akses publik ditolak.

Form tambah/edit pada daftar pegawai dan form edit pada detail pegawai menggunakan dropdown. Pilihan bidang berubah akan mengosongkan seksi/jabatan. Pilihan seksi berubah akan mempertahankan jabatan hanya jika masih sesuai. Master dimuat bersamaan sebelum digunakan; respons yang datang setelah form ditutup diabaikan. Form menyimpan ID, dan backend mengambil label dari master.

Pangkat/Golongan pada form tambah dan edit menggunakan dropdown 17 pangkat PNS, dari Juru Muda (I/a) sampai Pembina Utama (IV/e), mengacu pada https://bkpsdm.cirebonkota.go.id/lainnya/pangkat. Nilai lama dengan format lain tetap ditampilkan saat edit. Field tetap memakai `rank`/`pangkat_golongan`; perubahan ini tidak memerlukan migrasi database. Komponen bersama: `apps/dukcapil-pbd-fe/components/pegawai/rank-select.tsx`.

Opsi baru memerlukan master dan induk aktif. Saat edit, ID nonaktif yang sudah dimiliki pegawai tetap ditampilkan dan dapat dipertahankan. Backend memvalidasi semua kombinasi, termasuk status aktif. Pemeriksaan dan penyimpanan memakai transaksi dan penguncian master agar perubahan bersamaan tidak melewati validasi.

Asumsi: bidang dan jabatan wajib untuk penyimpanan pegawai baru/perubahan pegawai; seksi opsional. Jabatan boleh langsung di bawah bidang atau berada pada satu seksi. Jabatan langsung di bawah bidang juga valid untuk pegawai yang memilih seksi pada bidang tersebut. Mengganti induk master yang sudah direferensikan ditolak; nama, kode, dan status masih dapat diperbarui.

## Schema dan kompatibilitas

Migration `000033_organization_masters.up.sql` menambahkan:

| Tabel | Kolom |
| --- | --- |
| `organisasi_bidang` | `id`, `name`, `code`, `is_active`, `created_at`, `updated_at` |
| `organisasi_seksi` | kolom umum di atas dan `bidang_id` wajib |
| `organisasi_jabatan` | kolom umum di atas, `bidang_id` wajib, `seksi_id` nullable |
| `arsip_pegawai` | `bidang_id`, `seksi_id`, `jabatan_id` nullable untuk transisi data lama |

Terdapat unique index nama yang mengabaikan case dan menormalkan whitespace, sesuai cakupan induk. Composite foreign key memastikan seksi/jabatan berada di bidang yang benar, dengan delete RESTRICT. Backend juga memastikan jabatan seksi sesuai seksi pegawai. Master yang digunakan anak atau pegawai tidak dapat dihapus. Nonaktifkan master untuk menghentikan pemilihan baru.

Backfill hanya memakai data pegawai existing, tanpa menambahkan contoh sebagai seed:

1. Normalisasi whitespace/case untuk mengelompokkan bidang unik.
2. Bentuk seksi unik per bidang.
3. Bentuk jabatan unik per bidang/seksi, termasuk jabatan tanpa seksi.
4. Isi FK pegawai; batalkan migration jika nilai dengan induk yang diketahui gagal dipetakan.
5. Pertahankan seluruh kolom teks `bidang`, `unit`, dan `jabatan` tanpa perubahan pada migration up.

Data lama yang tidak memiliki bidang tetap utuh dan dapat dibaca melalui fallback teks; migration tidak menebak induknya. Form edit memberi konteks label lama dan meminta pilihan master untuk melengkapi relasi. Respons pegawai menyediakan `bidangId`, `seksiId`, `jabatanId` serta label existing `bidang`, `unit`, `position`. Label diambil dari master dalam query, sehingga rename langsung terbaca pada daftar, detail, pencarian, dan ekspor. Kolom teks tetap diisi dari master untuk kompatibilitas; input label bebas tidak menjadi sumber kebenaran.

Migration down menyalin label master terbaru ke kolom lama sebelum menghapus FK dan tabel master. Rollback tidak mempertahankan master yang belum dipakai maupun status/kode master; pegawai dan label organisasinya dipertahankan.

## API

Prefix mengikuti aplikasi: `/api/v1`. Proxy frontend memakai `/api/backend`.

| Metode | Path | Akses |
| --- | --- | --- |
| GET | `/organization/fields` | superadmin, admin_sekretariat |
| GET | `/organization/sections` | superadmin, admin_sekretariat |
| GET | `/organization/positions` | superadmin, admin_sekretariat |
| POST | `/organization/{fields,sections,positions}` | superadmin |
| PUT | `/organization/{fields,sections,positions}/:id` | superadmin |
| DELETE | `/organization/{fields,sections,positions}/:id` | superadmin |

Payload master: `name`, `code`, `isActive`, `bidangId`, `seksiId` sesuai jenis. Nama wajib, status create default aktif. Payload pegawai wajib menyertakan `bidangId` dan `jabatanId`; `seksiId` boleh null. Endpoint pegawai tetap `/pegawai` dan `/pegawai/:id`.

Filter GET: `search`, `active=true|false`, `bidang_id` untuk seksi/jabatan, `seksi_id` untuk jabatan. `seksi_id=<id>` menyertakan jabatan seksi tersebut dan jabatan langsung di bawah bidang; `seksi_id=0` hanya jabatan tanpa seksi. `active=true` juga mensyaratkan induk aktif. Tanpa filter status, data nonaktif tersedia untuk pengelolaan dan hydration edit.

Validasi gagal: HTTP 400; duplikasi/data masih dipakai: 409; ID tidak ditemukan: 404. Error internal tidak membocorkan detail database.

## File implementasi

File baru backend:

- `apps/dukcapil-pbd-be/internal/model/organization.go`
- `apps/dukcapil-pbd-be/internal/repository/organization.go`
- `apps/dukcapil-pbd-be/internal/controller/organization.go`
- `apps/dukcapil-pbd-be/internal/controller/organization_test.go`
- `apps/dukcapil-pbd-be/internal/repository/organization_integration_test.go`
- `apps/dukcapil-pbd-be/internal/router/organization_test.go`
- `apps/dukcapil-pbd-be/migrations/000033_organization_masters.up.sql`
- `apps/dukcapil-pbd-be/migrations/000033_organization_masters.down.sql`

File backend yang diubah: `cmd/api/main.go`, `internal/router/router.go`, dan `internal/{model,repository,controller}/arsip_pegawai.go` pada `apps/dukcapil-pbd-be`.

File baru frontend:

- `apps/dukcapil-pbd-fe/app/internal/pengaturan/struktur-organisasi/page.tsx`
- `apps/dukcapil-pbd-fe/components/organization/organization-select.tsx`
- `apps/dukcapil-pbd-fe/lib/api/organization.ts`
- `apps/dukcapil-pbd-fe/lib/organization.ts`
- `apps/dukcapil-pbd-fe/types/organization.ts`
- `apps/dukcapil-pbd-fe/tests/organization.test.mjs`

File frontend yang diubah: `app/internal/pegawai/page.tsx`, `app/internal/pegawai/[id]/detail-client.tsx`, `components/dashboard/topbar.tsx`, `lib/navigation.ts`, `lib/api/endpoints.ts`, `types/pegawai.ts`, dan `package.json` pada `apps/dukcapil-pbd-fe`.

## Verifikasi dan aktivasi

Pemeriksaan yang dijalankan: gofmt, Prettier, frontend lint, TypeScript, `npm test` (4 kasus), `npm run build`, `go test ./...`, dan backend build. Test controller/router mencakup validasi, filter, kode error, dan akses role. Integration test PostgreSQL mencakup backfill, duplikasi, CRUD, relasi invalid, rename label, delete/move data yang dipakai, pilihan nonaktif, penyimpanan/perubahan ID pegawai, rollback, dan reapply migration.

Integration test memerlukan database PostgreSQL **kosong dan khusus uji**. Guard menolak database yang sudah memiliki tabel:

```sh
cd apps/dukcapil-pbd-be
ORGANIZATION_TEST_DATABASE_URL='postgres://postgres@127.0.0.1:55433/postgres?sslmode=disable' go test ./internal/repository -run TestOrganizationIntegration -v
```

Frontend test memakai Node 24 seperti Dockerfile, tanpa dependency test tambahan:

```sh
cd apps/dukcapil-pbd-fe
npm test
```

Smoke test HTTP pada build frontend/backend terpisah juga memverifikasi login, proxy, CRUD organisasi, tambah/edit pegawai, penolakan relasi invalid, perlindungan delete, akses halaman terautentikasi, dan penolakan akses anonim. Pemeriksaan visual di Chrome pada layanan Docker lokal sudah diselesaikan: submenu aktif, ketiga tab, tabel kosong dan filter, form tambah jabatan, serta dropdown Bidang/Seksi/Jabatan pada Tambah Pegawai. Seksi dan Jabatan dinonaktifkan sebelum Bidang dipilih. Tidak ada data contoh yang disimpan pada database aplikasi.

Pengujian otomatis memakai database terpisah. Pada 24 Oktober 2026, frontend dan backend Docker lokal telah dibangun ulang dan diaktifkan. Database aplikasi berhasil naik dari migration 32 ke 33, dengan `dirty = false`. Backend health melaporkan database `ok`, dan frontend merespons HTTP 200. Jumlah pegawai sebelum dan sesudah tetap 0; ketiga master juga kosong, siap diisi pengguna. Backup sebelum deployment tersedia di `/tmp/dukcapil-before-organization-20261024.dump` (izin file 0600).

Perintah aktivasi ulang untuk pembaruan berikutnya; backend menjalankan migration embedded saat startup:

```sh
docker compose up -d --build dukcapil-pbd-be dukcapil-pbd-fe
```
