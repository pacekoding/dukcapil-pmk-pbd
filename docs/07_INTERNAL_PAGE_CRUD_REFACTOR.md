# Refactor CRUD Internal Berbasis Halaman

## Audit resource

| Resource | Operasi existing | Route target |
| --- | --- | --- |
| Pegawai | create, edit, detail, delete, foto/dokumen | `/internal/pegawai/add`, `/:id/edit`, `/:id/preview` |
| Arsip | list/read dokumen pegawai | detail melalui preview Pegawai; tidak memiliki add/edit sendiri |
| Pendaftaran Penduduk | edit agregat wilayah existing | `/:id/edit`, `/:id/preview`; tanpa `/add` |
| Pencatatan Sipil | edit agregat wilayah existing | `/:id/edit`, `/:id/preview`; tanpa `/add` |
| Kab/Kota | create, edit, delete | `/add`, `/:id/edit`, `/:id/preview` |
| Subkegiatan | create, edit, delete | `/add`, `/:id/edit`, `/:id/preview` |
| Pengguna | create, edit, delete, reset password | `/add`, `/:id/edit`, `/:id/preview`; reset tetap dialog singkat |
| Struktur Organisasi | create/edit/delete bidang, seksi, jabatan | `/:kind/add`, `/:kind/:id/edit`, `/:kind/:id/preview` |
| Data Wilayah Release | satu konfigurasi, bukan koleksi CRUD | form pengaturan tetap pada halaman resource |
| SIBER Data Wilayah | edit agregat wilayah existing | `/:id/edit`, `/:id/preview`; tanpa `/add` |
| SIKAMPUNG | create, edit, detail, delete | `/add`, `/:id/edit`, `/:id/preview` |
| SITEKAD Kelompok Binaan | create, edit, detail, delete | `/add`, `/:id/edit`, `/:id/preview` |
| SITEKAD Capaian/Kendala | create, edit, detail, delete | `/add`, `/:id/edit`, `/:id/preview` |
| Pelaksanaan Kegiatan | create, edit, detail, delete | `/add`, `/:id/edit`, `/:id/preview` |
| Surat Tugas dan SPD | create, edit, preview, lifecycle | `/<jenis>/add`, `/<jenis>/:id/edit`, `/<jenis>/:id/preview`; relasi kegiatan dibawa di payload/query |
| Undangan, Daftar Hadir, Notula, Berita Acara, Laporan | create, edit, preview, lifecycle | `/<jenis>/add`, `/<jenis>/:id/edit`, `/<jenis>/:id/preview` |
| Dokumentasi/Lampiran | upload, edit metadata, preview file, delete | nested di bawah kegiatan; upload `/add`, metadata `/:id/edit`, preview `/:id/preview` |
| Tanda Terima/Daftar Penerima | create, edit, preview, lifecycle | nested di bawah kegiatan; bukan submenu utama |

Dialog yang dipertahankan hanya untuk hapus, pembatalan, finalisasi, reset password, perubahan tahun anggaran, dan aksi singkat lainnya.

## Konvensi

- Semua halaman add/edit/preview menggunakan `CrudPage` dan `AppBreadcrumb`.
- Current breadcrumb memakai `aria-current="page"`; level yang memiliki tujuan memakai `Link`.
- Add/edit memakai form reusable yang sama dan redirect ke preview setelah berhasil.
- Preview memakai layout detail, tidak menampilkan form disabled.
- Tombol Batal memakai route list/preview eksplisit. Form yang berubah meminta konfirmasi saat tombol Batal ditekan.
- Filter daftar tetap berada di halaman daftar. Setelah simpan, pengguna diarahkan ke preview record; tombol breadcrumb/Kembali mengarah ke daftar resource yang sama.
- ID route divalidasi sebelum request; data yang tidak ditemukan menampilkan not-found state atau `notFound()` pada server wrapper.

## Implementasi

Fondasi reusable:

- `AppBreadcrumb`: breadcrumb semantik, dapat diklik, responsif, dan memiliki `aria-current`.
- `CrudPage`: heading, deskripsi, action, judul dokumen browser, lebar konten, dan breadcrumb yang konsisten.
- `DetailGrid`: tampilan detail read-only tanpa input disabled.
- `useUnsavedChanges`: peringatan browser saat form berubah dan konfirmasi pada tombol Batal.

Route penuh telah ditambahkan untuk:

- Pegawai, Kab/Kota, Pengguna, Subkegiatan, dan tiga jenis Struktur Organisasi.
- Data Kependudukan SIBER, Pendaftaran Penduduk, dan Pencatatan Sipil (edit/preview; tidak ada add karena record mengikuti master wilayah).
- Data Kampung IDM, BUM Kampung, Kelompok Binaan, serta Capaian & Kendala.
- Pelaksanaan Kegiatan, Surat Tugas, SPD, Surat Undangan, Daftar Hadir, Notula, Berita Acara, Laporan, dan Daftar Penerima.
- Lampiran kegiatan dengan route nested `/pelaksanaan-kegiatan/:activityId/lampiran/...`.

Backend Subkegiatan ditambah operasi `PUT /subkegiatan/:id` dan `DELETE /subkegiatan/:id` agar pola CRUD halaman lengkap dan konsisten. SIKAMPUNG juga memperoleh `GET /sikampung/:id`, sehingga halaman edit/preview mengambil record langsung berdasarkan ID dan tidak bergantung pada halaman pertama hasil daftar.

## Pengecualian yang disengaja

- `Data Wilayah Release` adalah satu halaman konfigurasi, bukan koleksi record; tetap berupa halaman pengaturan tunggal.
- `Arsip` adalah indeks dokumen pegawai; detailnya dibuka melalui Preview Pegawai dan file tetap memakai URL preview/download.
- Dialog tetap digunakan untuk konfirmasi hapus, reset password, penautan arsip, finalisasi, dan pembatalan dokumen.
- Pergantian tahun dan sidebar mobile tetap memakai overlay karena merupakan aksi global/navigasi, bukan form CRUD utama.

## Verifikasi 24 Oktober 2026

- ESLint: lulus tanpa error maupun warning.
- Next.js production build: berhasil; route add/edit/preview tercantum dalam route manifest.
- Frontend tests: 12 lulus, 0 gagal.
- Backend `go test ./...`: seluruh paket lulus.
- HTTP smoke test tanpa sesi: route `/internal/pegawai/add` mengembalikan `307 /login`, sehingga proteksi route baru aktif.
