# Perjalanan Dinas: Surat Tugas dan SPD

## Hasil implementasi

Menu **Perjalanan Dinas** memiliki submenu **Surat Tugas** dan **SPD**, dengan route:

- `/internal/perjalanan-dinas/surat-tugas`
- `/internal/perjalanan-dinas/spd`

Semua role internal existing (`superadmin`, `admin_sekretariat`, `admin_dukcapil`, `admin_pmk`) mendapat akses baca dan CRUD karena aplikasi belum memiliki permission granular. Sidebar, guard route, dan API memakai aturan ini. Pengguna anonim ditolak. Endpoint master khusus perjalanan hanya mengirim nama, NIP, pangkat, jabatan, bidang, seksi, dan status pegawai; tidak mengirim NIK, rekening, kontak pribadi, maupun arsip pegawai.

Surat Tugas mendukung dasar dan isi penugasan berupa banyak poin, satu atau banyak pelaksana, metadata perjalanan, penandatangan dari master Pegawai, pencarian, filter, preview, PDF, duplikasi, finalisasi, pembatalan, dan hapus Draft. Duplikasi membuat Draft baru tanpa nomor.

SPD dibuat dari Surat Tugas dan salah satu pelaksananya. Nama/NIP/jabatan, maksud, tempat, tanggal, durasi, dan transportasi berasal dari sumber; tidak diketik ulang. Pengikut, pengesahan bertahap, pembebanan anggaran, pejabat penerbit, dan keterangan disimpan terstruktur. Program, kegiatan, dan subkegiatan menggunakan master `subkegiatan`. Kode rekening dan sumber dana berupa input karena belum ada master rekening/sumber dana pada aplikasi.

## Referensi dan format dokumen

Referensi utama yang dibaca dan diperiksa secara visual:

- [Permendagri 1/2023, naskah resmi beserta lampiran](https://peraturan.go.id/files/bn144-2023.pdf): lampiran halaman tercetak 21 (Surat Tugas), 22 (SPD), dan 23 (pengesahan perjalanan).
- [Metadata resmi Permendagri 1/2023](https://peraturan.bpk.go.id/Details/245536/permendagri-no-1-tahun-2023).
- [Permendagri 77/2020](https://peraturan.bpk.go.id/Download/155483/Permendagri%20Nomor%2077%20Tahun%202020.pdf): konteks pengelolaan keuangan daerah dan belanja perjalanan dinas pada halaman tercetak 40.
- [Perbup Blora 47/2024 tentang Pedoman Tata Naskah Dinas](https://jdih.jatengprov.go.id/datacenter/files/inventarisasi-hukum/5/PERBUP-47-%202024-TATA%20NASKAH%20DINAS.pdf): pembanding pemerintah daerah yang merujuk Permendagri 1/2023.
- [Perbup Gianyar 57/2023](https://peraturan.bpk.go.id/Download/330961/2023pb5104057gianyar.pdf): pembanding format perjalanan daerah. Istilah SPPD dan perbedaan format lokalnya tidak diadopsi sebagai format utama.

Surat Tugas memakai kop perangkat daerah, judul/nomor, Dasar, **MEMERINTAHKAN** sesuai teks pada lampiran, Kepada, Untuk, metadata perjalanan, tempat/tanggal terbit, dan blok penandatangan dari master. Tidak ada nama Kepala Dinas yang di-hardcode.

SPD memakai kop perangkat daerah, lembar/kode/nomor, sepuluh kelompok isian, pengikut dengan kolom nama/tanggal lahir/keterangan, pembebanan anggaran, dan blok penandatangan. Lembar pengesahan tersendiri berisi keberangkatan, kedatangan/keberangkatan setiap tahapan, kembali, catatan, dan ruang pengesahan. Ruang kosong untuk tanda tangan/pengesahan tetap tersedia.

Renderer A4 portrait memakai jsPDF existing. Preview dan export memakai fungsi yang sama. Teks dibungkus, row yang muat pada satu halaman dijaga tetap utuh, tanda tangan dijaga sebagai blok, dan nomor halaman dicetak. Banyak pelaksana/pengikut/tahapan dapat menghasilkan halaman lanjutan; data tidak dipotong. Font standar PDF Helvetica digunakan sebagai sans-serif tanpa menambah berkas font proprietary. Kop memakai logo PBD existing. Draft dan dokumen Dibatalkan diberi label status pada setiap halaman. Hasil PDF tidak mencetak navigasi/dashboard.

## Konfigurasi kop

Satu konfigurasi backend (`DefaultTravelOffice` dan override environment) dipakai oleh seluruh template dan direkam pada snapshot:

- `OFFICE_GOVERNMENT_NAME`
- `OFFICE_PROVINCE_NAME`
- `OFFICE_AGENCY_NAME`
- `OFFICE_ADDRESS`
- `OFFICE_PHONE`
- `OFFICE_EMAIL`
- `OFFICE_WEBSITE`

Docker Compose meneruskan konfigurasi tersebut. Nilai kosong memakai default aplikasi. Default nama OPD/email/alamat mengambil konteks profil existing; alamat default adalah Kantor Gubernur Papua Barat Daya, Kota Sorong. Nomor telepon/website yang belum tersedia tidak dikarang. Logo menggunakan `/logo-pbd.png`.

## Database dan relasi

Migration baru: `000034_travel_documents.up.sql` dan `.down.sql`.

| Tabel | Isi utama |
| --- | --- |
| `surat_tugas` | nomor, tanggal/tempat surat, dasar dan penugasan JSONB array, asal/tujuan, tanggal perjalanan, jenis/transportasi, signer FK, status, snapshot JSONB, audit |
| `surat_tugas_pelaksana` | `assignment_letter_id`, `employee_id`, `sort_order`; PK pasangan Surat Tugas–pegawai |
| `spd` | FK Surat Tugas/pelaksana/signer/subkegiatan, identitas SPD, tingkat biaya, pengikut JSONB array, pengesahan JSONB array, pembebanan anggaran, kepulangan, status, snapshot JSONB, audit |

Composite FK SPD `(assignment_letter_id, employee_id)` mengacu ke pelaksana Surat Tugas. Pelaksana tidak dapat dihapus dari Surat Tugas jika sudah dipakai SPD; perubahan gagal secara atomik. FK master menggunakan RESTRICT. Nomor non-kosong harus unik per jenis dokumen. Satu pelaksana hanya boleh memiliki satu SPD yang belum dibatalkan untuk satu Surat Tugas; penerbitan ulang sesudah pembatalan dapat memakai nomor baru.

Pengikut dan tahapan adalah array objek JSONB, bukan textarea/HTML. Data pegawai tetap hanya ada pada master existing; snapshot historis bukan master pegawai baru. Migration up tidak mengubah isi tabel pegawai atau Subkegiatan. Migration down menghapus tiga tabel modul baru sehingga harus disertai backup apabila sudah ada dokumen perjalanan.

Kedua dokumen menyimpan `created_by`, `updated_by`, `created_at`, `updated_at`, `finalized_at`, `finalized_by`, `cancelled_at`, `cancelled_by`, dan `cancellation_reason`. Identitas pengguna berasal dari JWT terverifikasi, bukan payload browser.

## Lifecycle dan snapshot

- **Draft**: dapat diedit, diberi nomor, dipreview, dan dihapus sesuai aturan relasi.
- **Final**: tidak dapat diedit atau dihapus; dapat dipreview, diunduh, dicetak, atau dibatalkan.
- **Dibatalkan**: tetap disimpan, tidak dapat dihapus, dengan alasan, waktu, dan pelaku pembatalan.

Draft Surat Tugas boleh menjadi sumber Draft SPD. Finalisasi SPD mensyaratkan Surat Tugas sudah Final. Surat Tugas tidak boleh dibatalkan selama masih memiliki SPD yang belum dibatalkan. Hapus Surat Tugas ditolak jika memiliki SPD pada status apa pun.

Pada finalisasi Surat Tugas, snapshot menyimpan nama, NIP, pangkat/golongan, jabatan, bidang/seksi pelaksana, identitas penandatangan, dan kop OPD. Pada finalisasi SPD, snapshot menyimpan identitas pelaksana dari Surat Tugas Final, penandatangan SPD, nomor/isi/perjalanan sumber, label program/kegiatan/subkegiatan, dan kop. Field SPD lainnya sudah immutable pada status Final. Perubahan master pegawai, jabatan, Subkegiatan, atau konfigurasi kop berikutnya tidak mengubah dokumen Final lama. Pembatalan Draft juga membekukan datanya untuk histori.

Transaksi dan row lock digunakan untuk perubahan dokumen, relasi pelaksana, dan finalisasi. Nomor wajib sebelum Final. Identitas pelaksana/pejabat yang belum lengkap ditampilkan sebagai peringatan dan harus dilengkapi sebelum Final. Snapshot bukan tanda tangan elektronik atau pengesahan digital.

## Endpoint

Prefix API existing: `/api/v1`; frontend mengakses proxy `/api/backend`.

| Metode | Endpoint |
| --- | --- |
| GET | `/travel/options` |
| GET, POST | `/travel/assignment-letters` |
| GET, PUT, DELETE | `/travel/assignment-letters/:id` |
| POST | `/travel/assignment-letters/:id/finalize` |
| POST | `/travel/assignment-letters/:id/cancel` |
| POST | `/travel/assignment-letters/:id/duplicate` |
| GET, POST | `/travel/spd` |
| GET, PUT, DELETE | `/travel/spd/:id` |
| POST | `/travel/spd/:id/finalize` |
| POST | `/travel/spd/:id/cancel` |

List menerima `year`, `status`, `search`, `employee_id`, `destination`. Default tahun berjalan menggunakan WIT; `year=all` mengambil semua tahun. Tahun Surat Tugas mengikuti tanggal surat, SPD mengikuti tahun anggaran. Cancel menerima `{ "reason": "..." }`. Error validasi menggunakan 400, dokumen tidak ditemukan 404, konflik lifecycle/nomor/relasi 409, dan akses anonim 401. Detail database tidak dikirim ke pengguna.

## Asumsi dan batas scope

- Nomor dokumen masih diinput administrasi sebagai string; tidak ada pola nomor instansi yang diasumsikan resmi.
- Durasi mengikuti permintaan: tanggal kembali dikurangi tanggal berangkat. Hari yang sama menghasilkan 0. Durasi ini bukan perhitungan tarif atau hak uang harian.
- Tarif, pertanggungjawaban biaya, approval bertingkat, dan tanda tangan elektronik tidak termasuk scope.
- Kewenangan penandatangan dipilih dari PPK/PA/KPA dan master Pegawai; aplikasi tidak menyimpulkan kewenangan keuangan dari jabatan seseorang. Default template SPD adalah PPK sesuai lampiran utama.
- Pengesah di tujuan dapat berasal dari luar master OPD, sehingga nama/NIP/jabatan pada tahapan pengesahan berupa field terstruktur tersendiri.
- Jenis perjalanan disimpan sebagai string; pilihan Luar Negeri hanya metadata, tanpa workflow perjalanan luar negeri khusus.
- Koreksi dokumen Final dilakukan melalui pembatalan dan dokumen baru/duplikasi. Tidak ada pembukaan kembali Final menjadi Draft.

## File implementasi

Baru di backend (`apps/dukcapil-pbd-be`):

- `internal/model/travel.go`
- `internal/repository/travel.go`
- `internal/repository/travel_test.go`
- `internal/repository/travel_integration_test.go`
- `internal/controller/travel.go`
- `internal/router/travel_test.go`
- `migrations/000034_travel_documents.up.sql`
- `migrations/000034_travel_documents.down.sql`

Backend yang diubah: `cmd/api/main.go`, `internal/router/router.go`. Test organisasi existing dipin ke migration 33 agar rollback test tetap memeriksa migrasi organisasi ketika migration baru ditambahkan: `internal/repository/organization_integration_test.go`.

Baru di frontend (`apps/dukcapil-pbd-fe`):

- `app/internal/perjalanan-dinas/surat-tugas/page.tsx`
- `app/internal/perjalanan-dinas/spd/page.tsx`
- `components/travel/travel-page.tsx`
- `components/travel/assignment-form.tsx`
- `components/travel/order-form.tsx`
- `components/travel/form-controls.tsx`
- `types/travel.ts`
- `lib/api/travel.ts`
- `lib/travel.ts`
- `lib/travel-pdf.ts`
- `tests/travel.test.mjs`
- `scripts/verify-travel-pdf.mjs`

Frontend yang diubah: `lib/navigation.ts`, `lib/internal-access.ts`, `components/dashboard/sidebar.tsx`, `components/dashboard/topbar.tsx`. Konfigurasi yang diubah: `docker-compose.yml`, `.env.example`.

## Verifikasi

Lulus: gofmt, Prettier, frontend lint, TypeScript, 7 test frontend, `go test ./...`, build Go, build Next.js, dan build kedua image Docker.

Integration test pada PostgreSQL terpisah memeriksa create/edit multi-pelaksana, filter, tanggal invalid, referensi pegawai invalid, nomor duplikat, pembentukan SPD dari Surat Tugas, data anggaran/pengikut/tahapan, perlindungan relasi, finalisasi berurutan, snapshot tidak berubah setelah master berubah, penolakan edit/hapus Final, audit pembatalan, hapus Draft yang aman, migration down/up, serta master pegawai yang tetap utuh. Guard menolak database uji yang tidak kosong.

```sh
cd apps/dukcapil-pbd-be
TRAVEL_TEST_DATABASE_URL='postgres://postgres@127.0.0.1:55434/postgres?sslmode=disable' \
TRAVEL_FIXTURE_OUTPUT=/tmp/dukcapil-travel-fixture.json \
go test ./... 
```

Smoke test memakai build frontend/backend pada port terpisah dan data sintetis. Terverifikasi: semua empat role, guard halaman, proxy API, multi-pelaksana, generate SPD, data inherited, anggaran, finalisasi, duplicate, pembatalan, penolakan akses publik, dan perlindungan delete.

PDF dari renderer aplikasi diuji menggunakan fixture sintetis integration test:

```sh
cd apps/dukcapil-pbd-fe
node --experimental-strip-types scripts/verify-travel-pdf.mjs /tmp/dukcapil-travel-fixture.json
```

Hasil normal: Surat Tugas 1 halaman dan SPD 3 halaman, termasuk lanjutan anggaran dan lembar pengesahan. Stress test 24 pelaksana/isi panjang menghasilkan 6 halaman; SPD dengan 12 pengikut dan 7 tahapan menghasilkan 5 halaman. PDF dirender ke PNG, diperiksa visual, serta diperiksa ukuran A4 dan batas seluruh teks. Tidak ada teks di luar margin atau blok tanda tangan terpotong. Jumlah halaman mengikuti panjang isi.

Pemeriksaan visual halaman web pada deployment terakhir belum selesai: koneksi alat browser gagal (`cgWindowNotFound`, kemudian timeout). Halaman terautentikasi dan API sudah diuji melalui HTTP; pemeriksaan visual PDF berhasil dilakukan terpisah.

## Aktivasi lokal

Pada 24 Oktober 2026, backend/frontend Docker lokal telah dibangun ulang dan diaktifkan. Database aplikasi berhasil naik dari migration 33 ke 34 dengan `dirty=false`; backend health dan database `ok`. Checksum dan jumlah pegawai sebelum/sesudah sama (0 pegawai); Subkegiatan tetap 0. Tidak ada contoh pegawai, Surat Tugas, SPD, atau subkegiatan yang dimasukkan ke database aplikasi. Master Pegawai/Subkegiatan harus diisi untuk memakai alur penerbitan sebenarnya.

Backup sebelum aktivasi: `/tmp/dukcapil-before-travel-20261024.dump` (0600). Basis data uji terpisah dan berisi data sintetis, bukan data aplikasi.

## Perluasan ke Pelaksanaan Kegiatan

Menu dan routes frontend kini berada pada `/internal/pelaksanaan-kegiatan/surat-tugas` dan `/spd`. Dua routes lama mengalihkan dengan query tetap dipertahankan. Surat Tugas baru terkait record pelaksanaan; SPD mewarisi kegiatan Surat Tugas. Arsip existing dapat ditautkan secara eksplisit tanpa mengubah snapshot Final. Lihat [Pelaksanaan Kegiatan](06_PELAKSANAAN_KEGIATAN.md) untuk migrasi 35, endpoint penautan, dan relasi dokumen lainnya.
