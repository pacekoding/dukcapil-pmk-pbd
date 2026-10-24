# Pelaksanaan Kegiatan

Modul menggantikan nama menu Perjalanan Dinas dan menghubungkan dokumen administratif melalui satu record pelaksanaan kegiatan. Tersedia untuk `superadmin`, `admin_dukcapil`, `admin_pmk`, dan `admin_sekretariat`. Akses anonim ditolak oleh backend dan proteksi halaman internal.

## Penggunaan

1. Isi master Pegawai dan Subkegiatan yang sudah tersedia di aplikasi.
2. Buka `/internal/pelaksanaan-kegiatan`, pilih **Buat Kegiatan**, lalu pilih Program → Kegiatan → Subkegiatan, PPTK, dan penanggung jawab.
3. Buka detail kegiatan untuk membuat dokumen, melihat kelengkapan realisasi, atau mengunggah dokumentasi/lampiran.
4. Simpan dokumen sebagai Draft, periksa Preview, kemudian Finalisasi. Final tidak dapat diedit atau dihapus. Pembatalan memerlukan alasan dan mempertahankan histori.

Delapan submenu utama: Surat Tugas, Surat Perjalanan Dinas, Surat Undangan, Daftar Hadir, Notula, Berita Acara, Laporan Kegiatan, dan Dokumentasi. Tanda Terima/Daftar Penerima serta Lampiran/Dokumen Pendukung dibuka dari detail kegiatan, bukan submenu tambahan.

## Relasi dan master existing

```text
subkegiatan existing (program, kegiatan, subkegiatan)
  └─ pelaksanaan_kegiatan
       ├─ surat_tugas existing → spd existing
       ├─ dokumen_kegiatan
       │    ├─ peserta_dokumen_kegiatan → arsip_pegawai (internal)
       │    ├─ dokumen_kegiatan_pegawai → arsip_pegawai
       │    └─ dokumen_kegiatan_lampiran → lampiran_kegiatan
       └─ lampiran_kegiatan → stored_files → storage.Service existing
```

Master existing menyimpan Program/Kegiatan sebagai kolom teks pada `subkegiatan`, bukan tabel dengan `program_id` dan `activity_id` tersendiri. Karena itu pelaksanaan menggunakan satu FK `subkegiatan_id` dan mengambil label Program/Kegiatan dari master tersebut. Tidak dibuat master anggaran kedua.

Metadata pelaksanaan: nama, deskripsi, tanggal mulai/selesai, lokasi, tahun, sumber dana, PPTK, penanggung jawab, jenis, kabupaten/kota opsional, status, rekomendasi dokumen, dan audit. Status kegiatan: Draft/Berjalan/Selesai/Dibatalkan. Rekomendasi awal mengikuti jenis kegiatan dan dapat diedit; dokumen lain tetap opsional dan tidak menghalangi finalisasi.

Surat Tugas baru wajib terkait kegiatan; pilihan kegiatan mengisi lokasi, tanggal, uraian tugas, dan penanggung jawab. SPD mengikuti kegiatan Surat Tugas sumber, pelaksana, perjalanan, subkegiatan, tahun, dan sumber dana. SPD dari Surat Tugas legacy perlu penautan terlebih dahulu.

## Dokumen dan snapshot

`dokumen_kegiatan.kind`: `invitations`, `attendance`, `minutes`, `records`, `reports`, `receipts`. Satu tabel metadata/lifecycle dipakai bersama dengan isi terstruktur JSONB. Peserta dan referensi pegawai disimpan secara relasional; identitas internal Draft dibaca dari master, bukan disalin sebagai identitas baru.

- Undangan: sifat, lampiran, hal, banyak penerima internal/eksternal, hari/tanggal, waktu, tempat, acara, pembuka/penutup, penandatangan, tembusan.
- Daftar hadir: peserta internal/manual, identitas opsional, instansi, telepon, kehadiran Hadir/Tidak Hadir/Izin, keterangan. PDF menyediakan kolom tanda tangan kosong.
- Notula: pimpinan/notulis dari master, peserta, agenda, enam bagian narasi, tindak lanjut dengan penanggung jawab, target, dan status.
- Berita acara: jenis bebas (termasuk Serah Terima), bagian narasi, banyak pihak/peran penandatangan, barang/bantuan, jumlah, satuan, kondisi.
- Laporan: sebelas bagian yang dapat diedit/ditambah/dihapus. Template awal memakai metadata kegiatan, peserta dari daftar hadir/Surat Tugas, narasi notula/berita acara, serta caption foto. Dokumen terkait dan foto tersedia pada detail/hasil PDF.
- Tanda terima: penerima, identitas opsional, alamat/kampung/kabupaten, bantuan/barang, jumlah/satuan, tanda tangan manual, keterangan.

Final menyimpan snapshot pelaksanaan, OPD, pegawai/peserta (termasuk identitas internal dan pangkat), penerima, penandatangan, pimpinan/notulis, narasi, dan referensi terkait. Renderer memilih snapshot saat tersedia. Perubahan master dan kegiatan sesudahnya tidak mengubah arsip. Audit mencatat pengguna/waktu pembuatan, perubahan, finalisasi, pembatalan, dan alasannya.

Surat Tugas/SPD legacy tidak di-backfill secara spekulatif. Penautan eksplisit memperbarui FK kegiatan pada Surat Tugas dan seluruh SPD terkait tanpa mengubah snapshot atau isi arsip Final. Dokumen yang sudah terkait tidak dapat dipindahkan ke kegiatan lain.

## Penyimpanan

Gunakan `internal/fileasset`, `internal/storage.Service`, dan `stored_files` existing. Semua file kegiatan privat.

- Dokumentasi: JPG/JPEG/PNG/WEBP/PDF; caption, tanggal pengambilan, lokasi, kategori, pengunggah.
- Pendukung: format di atas ditambah DOCX/XLSX. Kategori bebas dapat diisi TOR/KAK, DPA/DPPA, materi, daftar penerima, tiket, invoice, dokumen keuangan, dan sebagainya.
- DOCX/XLSX hanya dibuka untuk kebijakan `activity-attachment`; kebijakan arsip modul lain tetap memakai format lamanya. Paket OOXML diperiksa, termasuk isi Content Types, part utama, batas ukuran ekspansi, dan penolakan VBA/macro.
- Validasi ukuran client mengikuti `NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB`; backend menggunakan `MAX_UPLOAD_SIZE_MB` dan menghitung byte aktual.
- Unggah gagal pada transaksi metadata membersihkan binary baru. Hapus melakukan soft-delete metadata lalu menghapus binary setelah commit.
- Foto yang sudah direferensikan snapshot laporan dilindungi dari penghapusan. Caption dapat diperbarui untuk penggunaan berikutnya; snapshot menyimpan caption lama. Parent lock menyelaraskan perubahan lampiran dengan finalisasi laporan.
- Preview gambar/PDF, unduh semua format, edit caption, galeri, dan hapus tersedia. DOCX/XLSX diunduh untuk dibuka pada aplikasi dokumen.

## PDF dan acuan

Preview dan unduhan memakai `lib/activity-pdf.ts` (jsPDF existing); Surat Tugas/SPD tetap memakai `lib/travel-pdf.ts`. A4 portrait digunakan untuk naskah; daftar hadir/daftar penerima memakai landscape. Tabel dipaginasi dengan header berulang dan ruang tanda tangan manual. Banyak penandatangan disusun berkolom. Foto dapat menjadi lampiran laporan; PDF dokumentasi dicatat sebagai referensi lampiran.

Acuan primer: [Permendagri 1/2023](https://peraturan.go.id/files/bn144-2023.pdf), lampiran format Berita Acara (halaman PDF 33), Laporan (37), Notula (39), dan Undangan (40). Untuk konteks pelaporan PPTK: [Permendagri 77/2020](https://peraturan.bpk.go.id/Download/155483/Permendagri%20Nomor%2077%20Tahun%202020.pdf). Template tidak menetapkan semua dokumen sebagai wajib untuk setiap kegiatan; kelengkapan mengikuti jenis dan ketentuan internal OPD.

Tidak ditambahkan CRUD NPD/SPP/SPM/SP2D/BKU/LPJ/STS, penghitungan biaya perjalanan/pajak, atau proses pengadaan. File keuangan dapat diarsipkan sebagai lampiran. Tidak ditambahkan import Excel: utility XLSX existing berfungsi untuk ekspor, sehingga penerima diisi manual/internal pada tahap ini.

## Migrasi 35

`000035_activity_execution.up.sql` membuat enam tabel: `pelaksanaan_kegiatan`, `dokumen_kegiatan`, `dokumen_kegiatan_pegawai`, `peserta_dokumen_kegiatan`, `lampiran_kegiatan`, `dokumen_kegiatan_lampiran`. Tambahan pada `surat_tugas` dan `spd` hanya FK nullable `activity_execution_id` beserta indeks. Tidak menulis ulang isi/snapshot arsip existing.

Down menghapus tabel modul baru dan dua kolom FK; data Surat Tugas/SPD dan master existing dipertahankan. Down menghapus data kegiatan/dokumen baru, sehingga backup database dan storage diperlukan sebelum rollback operasional. Pengujian rollback dilakukan hanya pada database disposable.

## Endpoint

Prefix backend `/api/v1`; frontend memanggil proxy `/api/backend`.

| Metode | Path | Fungsi |
| --- | --- | --- |
| GET, POST | `/activity-executions` | daftar/filter dan buat kegiatan |
| GET | `/activity-executions/options` | proyeksi master pegawai/subkegiatan/OPD |
| GET, PUT, DELETE | `/activity-executions/:id` | detail pusat dokumen, ubah, hapus Draft tanpa relasi |
| GET | `/activity-executions/:id/templates/:kind` | isi awal dokumen |
| POST | `/activity-executions/:id/attachments` | unggah multipart |
| GET, POST | `/activity-documents` | daftar dan buat Draft |
| GET, PUT, DELETE | `/activity-documents/:id` | detail, ubah/hapus Draft |
| POST | `/activity-documents/:id/finalize` | finalisasi dan snapshot |
| POST | `/activity-documents/:id/cancel` | batalkan dengan alasan |
| GET | `/activity-attachments` | daftar lampiran |
| PUT, DELETE | `/activity-attachments/:id` | edit informasi/hapus lampiran |
| GET, HEAD | `/activity-files/:file_id/preview` | file privat, dukungan Range |
| GET, HEAD | `/activity-files/:file_id/download` | unduh privat, dukungan Range |
| POST | `/travel/assignment-letters/:id/link-activity` | tautkan arsip legacy beserta SPD |

Endpoint Surat Tugas/SPD existing tetap digunakan. Filter kegiatan: `year` (`all` untuk semua), `search`, `status`, `subkegiatan_id`, `activity_type`, `kab_kota_id`. Dokumen/lampiran menggunakan `activity_execution_id` dan `kind`; Surat Tugas/SPD juga menerima `activity_execution_id`.

Routes frontend mengikuti delapan submenu pada `/internal/pelaksanaan-kegiatan`; detail `/:id`, daftar penerima `/daftar-penerima`. Routes `/internal/perjalanan-dinas/surat-tugas` dan `/spd` mengalihkan ke alamat baru dengan query dipertahankan.

## Berkas implementasi

Backend baru:

- `internal/model/activity_execution.go`
- `internal/repository/activity_execution.go`
- `internal/repository/activity_execution_integration_test.go`
- `internal/controller/activity_execution.go`
- `internal/fileasset/office.go`, `office_test.go`
- `migrations/000035_activity_execution.up.sql`, `.down.sql`

Backend diubah: `cmd/api/main.go`, `internal/router/router.go`, `internal/model/travel.go`, `internal/repository/travel.go`, `internal/repository/travel_integration_test.go`, `internal/controller/travel.go`, `internal/repository/stored_file.go`, `internal/fileasset/service.go`.

Frontend baru:

- `types/activity-execution.ts`
- `lib/activity-execution.ts`, `lib/activity-pdf.ts`, `lib/api/activity-execution.ts`
- `components/activity/activity-list.tsx`, `activity-form.tsx`, `activity-detail.tsx`, `activity-files.tsx`, `document-page.tsx`, `document-form.tsx`
- `app/internal/pelaksanaan-kegiatan/page.tsx`, `[id]/page.tsx`
- `app/internal/pelaksanaan-kegiatan/{surat-tugas,spd,surat-undangan,daftar-hadir,notula,berita-acara,laporan,dokumentasi,daftar-penerima}/page.tsx`
- `tests/activity.test.mjs`, `tests/activity-pdf.test.mjs`
- `scripts/verify-activity-pdf.mjs`

Frontend diubah: `types/travel.ts`, `lib/travel.ts`, `lib/api/travel.ts`, `lib/api/file-policy.ts`, `lib/navigation.ts`, `lib/internal-access.ts`, `components/dashboard/sidebar.tsx`, `topbar.tsx`, `components/travel/assignment-form.tsx`, `order-form.tsx`, `travel-page.tsx`, `form-controls.tsx`, dua routes legacy Perjalanan Dinas, `tests/travel.test.mjs`.

Dokumentasi: berkas ini serta tambahan aturan pada `02_FILE_UPLOAD_STORAGE_RULES.md` dan catatan route pada `05_PERJALANAN_DINAS.md`. Daftar ini mencakup perubahan modul kegiatan; perubahan lain yang sudah ada pada worktree tidak dianggap bagian tugas ini.

## Verifikasi 24 Oktober 2026

- Formatter Go/Prettier, lint, TypeScript check, 12 tes frontend, seluruh Go tests, build Go, build Next.js, dan kedua image Docker lulus.
- PostgreSQL disposable: migrasi bersih ke 35, CRUD kegiatan, Surat Tugas/SPD, enam jenis dokumen, finalisasi/cancel, audit, FK, snapshot setelah perubahan master, kelengkapan opsional, search/filter, penautan legacy, dan rollback/reapply lulus.
- Upload gambar/PDF/DOCX/XLSX, penolakan DOCX pada dokumentasi foto, akses privat empat role, GET/HEAD Range, penolakan anonim, soft-delete, serta perlindungan foto snapshot lulus.
- Smoke HTTP melalui frontend produksi pratinjau: empat role × sepuluh routes, semua jenis dokumen, detail pusat kegiatan, proxy file privat, redirect legacy, dan penolakan anonim lulus.
- Chrome headless desktop/seluler: pembuatan dan penyimpanan Draft daftar hadir, preview PDF blob, 11 bagian editor laporan, dan isian awal Surat Tugas lulus tanpa runtime exception. Detail seluler diperiksa pada lebar 390 px tanpa overflow horizontal.
- Enam PDF utama dirender serta diperiksa secara visual; uji 85 peserta menghasilkan 16 halaman dengan header tabel berulang dan peserta terakhir tetap tercetak. Laporan panjang menghasilkan tujuh halaman. Tidak ditemukan teks di luar batas area cetak.

Reproduksi tes integrasi (database tujuan wajib kosong/disposable):

```bash
cd apps/dukcapil-pbd-be
ACTIVITY_FIXTURE_OUTPUT=/tmp/activity-fixtures.json go test ./internal/repository -run TestActivityExecutionIntegration -v -count=1
# Set ACTIVITY_TEST_DATABASE_URL ke PostgreSQL disposable terlebih dahulu.
```

```bash
cd apps/dukcapil-pbd-fe
node --experimental-strip-types scripts/verify-activity-pdf.mjs /tmp/activity-fixtures.json /tmp/activity-pdf
```

### Pembaruan aplikasi lokal

Migrasi lokal berhasil pada versi **35**, `dirty=false`. Backend/frontend Docker telah dibangun dan dijalankan kembali. Health backend, pengalihan sembilan halaman internal untuk anonim, dan penolakan empat endpoint privat telah diperiksa pada layanan aktif.

Checksum baris sebelum/sesudah untuk Pegawai, tiga master organisasi, Subkegiatan, Surat Tugas, SPD, dan `stored_files` identik. Tidak ada kegiatan/dokumen contoh yang dimasukkan ke database aplikasi aktif; pengujian CRUD dilakukan pada database sementara.

Cadangan lokal sebelum migrasi:

- `/tmp/dukcapil-before-activity-20261024.dump`
- `/tmp/dukcapil-before-activity-uploads-20261024.tar.gz`
- `/tmp/dukcapil-before-activity-20261024.stats`

Batas pemeriksaan: tes login per role pada layanan aktif tidak dijalankan. Pemeriksaan persetujuan otomatis menolak pendekatan membaca kunci JWT konfigurasi untuk membentuk cookie, karena melewati alur login normal. Pemeriksaan layanan aktif kemudian memakai health/proteksi anonim dan checksum tanpa kredensial. Akses per role serta CRUD telah diverifikasi pada pratinjau terisolasi; login layanan aktif dapat diperiksa melalui sesi pengguna biasa.
