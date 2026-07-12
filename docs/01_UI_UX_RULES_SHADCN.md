# UI/UX Rules for shadcn-style Dashboard

## Purpose

Dokumen ini menetapkan aturan UI/UX umum untuk dashboard internal pemerintah agar tampilan konsisten, mudah digunakan, mudah dipelihara, dan tidak membingungkan operator, verifikator, pimpinan, maupun viewer.

Dashboard harus berfungsi sebagai **alat kerja**, bukan halaman promosi. Prioritas utama adalah kejelasan data, kemudahan input, validasi, pencarian, pengelolaan status, dan pengambilan keputusan.

---

## Scope

Aturan ini berlaku untuk seluruh halaman dashboard yang berhubungan dengan pengelolaan data, termasuk:

* Halaman daftar data.
* Tabel dan filter.
* Form tambah data.
* Form edit data.
* Detail data.
* Aksi lihat, ubah, hapus, arsip, verifikasi, validasi, dan ekspor.
* Dialog konfirmasi.
* Empty, loading, error, dan success states.
* Tampilan desktop, laptop, tablet, dan mobile.

---

## General Principles

* Dashboard harus mengutamakan fungsi kerja, bukan tampilan dekoratif.
* Setiap halaman harus memiliki konteks yang jelas: judul, deskripsi singkat, ringkasan, dan aksi utama.
* Data utama harus mudah dicari, difilter, dibaca, dan ditindaklanjuti.
* Form input/edit harus jelas, terstruktur, dan tidak membuat pengguna kehilangan konteks.
* Hindari terlalu banyak aksi dalam satu tampilan.
* Gunakan komponen UI yang konsisten dari project existing.
* Gunakan bahasa Indonesia formal, singkat, dan operasional.
* Jangan menampilkan informasi teknis internal seperti raw SQL, stack trace, atau response API mentah.

---

## Dashboard Layout

### Page Structure

Setiap halaman utama dashboard minimal memiliki:

1. **Page Header / Page Hero**

   * Judul halaman.
   * Deskripsi singkat fungsi halaman.
   * Primary action jika tersedia.

2. **Summary Area**

   * Ringkasan jumlah data, status, atau metrik penting.
   * Gunakan card ringkas, bukan visual berlebihan.

3. **Main Content**

   * Tabel, daftar data, detail data, atau form kerja.
   * Konten utama harus menjadi fokus visual.

4. **Supporting Actions**

   * Filter, pencarian, ekspor, refresh, atau pengaturan tampilan.

### Layout Rules

* Primary action harus mudah ditemukan, biasanya di kanan atas area header.
* Jangan memenuhi halaman utama dengan form input panjang.
* Halaman daftar harus fokus pada tabel/list.
* Halaman tambah/edit data pada desktop/laptop harus menggunakan **dedicated page** atau **content card**, bukan modal.
* Gunakan layout dengan spacing yang cukup agar data mudah dibaca.
* Hindari layout marketing seperti hero besar, ilustrasi berlebihan, animasi tidak perlu, atau copywriting promosi.

---

## Component Usage

Gunakan komponen shadcn-style secara konsisten:

* `Button`
* `Input`
* `Textarea`
* `Select`
* `Combobox`
* `Checkbox`
* `Switch`
* `Badge`
* `Card`
* `Table`
* `Tabs`
* `Dialog`
* `AlertDialog`
* `Sheet`
* `DropdownMenu`
* `Pagination`
* `Skeleton`
* `Alert`

Gunakan komponen custom project jika sudah tersedia, misalnya:

* `PageHero`
* `SectionCard`
* `DataTable`
* `SearchInput`
* `FilterBar`
* `EmptyState`
* `LoadingState`
* `ErrorState`
* `SuccessState`

---

## Data Table UX

### Table Purpose

Tabel digunakan untuk membaca, mencari, membandingkan, dan menindaklanjuti data. Tabel tidak boleh terlalu padat sampai sulit dipahami.

### Table Rules

* Kolom harus disusun berdasarkan prioritas kerja pengguna.
* Kolom utama diletakkan di kiri.
* Kolom status, tanggal, dan aksi diletakkan di kanan.
* Kolom aksi harus rata kanan.
* Gunakan lebar kolom yang stabil untuk status dan aksi.
* Teks panjang harus menggunakan wrapping atau truncate dengan tooltip.
* Hindari tabel yang terlalu banyak kolom dalam satu tampilan.
* Jika data terlalu kompleks, pindahkan sebagian informasi ke halaman detail.
* Table header harus jelas dan konsisten.
* Data kosong tidak boleh hanya menampilkan teks `No data`.

### Recommended Table Columns

Untuk halaman pengelolaan data secara umum, kolom dapat mengikuti pola berikut:

* Nama / Judul data.
* Kategori / Jenis.
* Unit / Bidang / Pemilik data.
* Status.
* Tanggal dibuat / diperbarui.
* Dibuat oleh / diperbarui oleh.
* Aksi.

### Row Actions

Gunakan aksi sesuai kebutuhan:

* Lihat detail.
* Edit.
* Hapus.
* Verifikasi.
* Validasi.
* Arsipkan.
* Unduh.
* Preview.
* Duplikasi.

Aturan aksi:

* Aksi utama boleh tampil langsung.
* Aksi tambahan sebaiknya masuk ke `DropdownMenu`.
* Aksi destruktif seperti hapus harus memakai konfirmasi.
* Jangan menampilkan terlalu banyak tombol dalam satu baris tabel.
* Icon-only button wajib memiliki accessible label.

---

## Search and Filter UX

### Search

* Search harus berada dekat dengan tabel/list.
* Placeholder harus menjelaskan cakupan pencarian.
* Contoh:

  * `Cari nama, kategori, atau unit kerja...`
  * `Cari data berdasarkan nama atau status...`
  * `Cari dokumen, kegiatan, atau bidang...`

### Filter

* Filter harus dekat dengan search.
* Filter utama diletakkan di baris filter.
* Filter tambahan dapat dimasukkan ke menu `Filter Lanjutan`.
* Select filter harus memiliki opsi `Semua`.
* Filter aktif harus terlihat jelas.
* Pengguna harus bisa menghapus filter dengan mudah.
* Jika ada filter tahun, periode, atau unit kerja, tampilkan konteks data yang sedang aktif.

### Filter Behavior

* Jangan mengubah data secara tiba-tiba tanpa indikator.
* Saat filter diterapkan, tampilkan loading hanya pada area tabel/list.
* Jangan disable seluruh halaman saat hanya tabel yang sedang memuat ulang.
* Jika filter menghasilkan data kosong, tampilkan empty state yang menjelaskan kondisi filter.

---

## Form Input and Edit UX

### Desktop and Laptop

Pada desktop dan laptop, **jangan menggunakan modal/dialog untuk form input atau edit data utama**.

Gunakan salah satu pola berikut:

1. **Dedicated Create Page**

   * Contoh: `/data/create`
   * Cocok untuk form tambah data baru.

2. **Dedicated Edit Page**

   * Contoh: `/data/[id]/edit`
   * Cocok untuk form edit data.

3. **Form Card dalam Halaman**

   * Cocok untuk form pendek yang masih berhubungan langsung dengan konteks halaman.

4. **Split Layout**

   * Kiri: daftar atau konteks data.
   * Kanan: form detail atau edit.
   * Cocok untuk dashboard kerja dengan proses verifikasi atau review.

Modal pada desktop/laptop hanya boleh digunakan untuk:

* Konfirmasi hapus.
* Konfirmasi perubahan status.
* Preview ringkas.
* Informasi bantuan.
* Aksi kecil yang tidak membutuhkan banyak field.

### Mobile

Pada mobile, form boleh menggunakan:

* `Sheet`
* `Drawer`
* Full-screen dialog
* Dedicated page

Aturan mobile:

* Form harus full width.
* Footer action dapat sticky di bawah.
* Konten form harus bisa discroll.
* Tombol utama dan batal harus mudah dijangkau.
* Hindari modal kecil di tengah layar mobile.

---

## Form Structure

### Field Order

Urutan field harus mengikuti alur berpikir pengguna:

1. Informasi utama.
2. Kategori atau klasifikasi.
3. Detail tambahan.
4. Upload atau lampiran jika ada.
5. Catatan atau keterangan.
6. Status atau pengaturan lanjutan.

### Field Rules

* Semua input wajib memiliki `Label`.
* Field wajib harus diberi penanda yang jelas.
* Helper text digunakan untuk menjelaskan format, batasan, atau contoh input.
* Placeholder tidak boleh menggantikan label.
* Field error harus muncul dekat dengan field terkait.
* Gunakan `Combobox` untuk pilihan yang panjang.
* Gunakan `Textarea` hanya untuk input teks panjang.
* Jangan membuat user mengetik data yang seharusnya bisa dipilih.

### Submit Rules

* Label tombol submit harus spesifik.
* Hindari label generik seperti `Submit`.
* Contoh:

  * `Simpan Data`
  * `Tambah Data`
  * `Perbarui Data`
  * `Kirim Verifikasi`
  * `Simpan Perubahan`

Loading submit:

* `Menyimpan...`
* `Memperbarui...`
* `Mengirim...`
* `Memproses...`

Tombol batal/kembali harus tersedia pada form tambah dan edit.

---

## Detail Page UX

Halaman detail digunakan untuk membaca data secara lengkap sebelum melakukan tindakan.

### Detail Page Rules

* Tampilkan informasi utama di bagian atas.
* Gunakan badge untuk status.
* Kelompokkan informasi dalam section/card.
* Tampilkan riwayat perubahan jika tersedia.
* Aksi utama seperti edit, validasi, atau unduh harus terlihat jelas.
* Jangan mencampur terlalu banyak form edit dalam halaman detail.
* Jika data perlu diubah, arahkan ke halaman edit.

---

## Create and Edit Page UX

### Create Page

Halaman tambah data harus memiliki:

* Judul jelas, contoh: `Tambah Data`
* Deskripsi singkat.
* Form terstruktur.
* Tombol `Simpan` atau `Tambah Data`.
* Tombol `Batal` atau `Kembali`.
* Validasi field wajib.
* State loading saat submit.

### Edit Page

Halaman edit data harus memiliki:

* Judul jelas, contoh: `Edit Data`
* Informasi konteks data yang diedit.
* Form dengan data existing.
* Tombol `Simpan Perubahan`.
* Tombol `Batal` atau `Kembali`.
* Indikator jika ada perubahan belum disimpan.
* Konfirmasi jika pengguna keluar saat form sudah berubah tetapi belum disimpan.

---

## Empty States

Empty state harus menjelaskan:

1. Kondisi yang terjadi.
2. Kemungkinan penyebab.
3. Aksi berikutnya.

Contoh umum:

```text
Belum ada data.
Tambahkan data pertama untuk mulai mengelola informasi pada halaman ini.
```

Contoh untuk filter kosong:

```text
Tidak ada data yang sesuai dengan filter.
Ubah kata kunci pencarian atau hapus beberapa filter.
```

Aturan:

* Jangan hanya menampilkan `No data`.
* Empty state boleh memiliki primary action jika relevan.
* Empty state tidak boleh terlalu panjang.
* Gunakan icon sederhana jika membantu, tetapi jangan bergantung pada icon saja.

---

## Loading States

Gunakan loading state yang sesuai konteks:

### Table Loading

* Gunakan skeleton row atau pesan loading dalam tabel.
* Contoh:

  * `Memuat data...`
  * `Memuat daftar...`

### Form Loading

* Gunakan disabled state hanya pada field yang sedang diproses.
* Submit button boleh disabled saat proses submit.
* Jangan disable seluruh halaman jika hanya satu komponen yang loading.

### Page Loading

* Gunakan skeleton layout jika seluruh halaman belum siap.
* Hindari spinner besar tanpa konteks.

---

## Error States

Error harus spesifik, sopan, dan memberi arah tindakan.

Contoh:

* `Nama wajib diisi.`
* `Kategori wajib dipilih.`
* `Format file tidak didukung.`
* `Data gagal disimpan. Silakan coba lagi.`
* `Data tidak ditemukan.`
* `Anda tidak memiliki akses untuk membuka halaman ini.`

Aturan:

* Jangan tampilkan raw SQL.
* Jangan tampilkan stack trace.
* Jangan tampilkan response internal API.
* Jangan gunakan pesan ambigu seperti `Terjadi kesalahan`.
* Jika error berasal dari validasi field, tampilkan di bawah field terkait.
* Jika error berasal dari proses halaman, tampilkan sebagai alert atau error state.

---

## Success States

Success state harus singkat dan langsung.

Contoh:

* `Data berhasil disimpan.`
* `Perubahan berhasil diperbarui.`
* `Data berhasil dihapus.`
* `Status berhasil diperbarui.`

Aturan:

* Jika tersedia toast provider, gunakan toast untuk feedback singkat.
* Jika belum tersedia toast provider, gunakan `SuccessState` atau alert sukses yang konsisten.
* Jangan menampilkan pesan sukses terlalu panjang.
* Setelah create berhasil, arahkan pengguna ke halaman detail atau daftar sesuai alur kerja.
* Setelah edit berhasil, tetap di halaman edit/detail atau kembali ke daftar sesuai kebutuhan.

---

## Confirmation Dialogs

Gunakan dialog konfirmasi untuk aksi berisiko, seperti:

* Hapus data.
* Arsipkan data.
* Batalkan perubahan.
* Ubah status penting.
* Kirim data untuk verifikasi.
* Reset data.

Aturan:

* Dialog harus menyebut objek yang terdampak.
* Copy dialog harus jelas dan tidak ambigu.
* Tombol destruktif memakai `variant="destructive"`.
* Tombol batal harus tersedia.
* Dialog dapat ditutup dengan escape/close button jika tidak sedang memproses.
* Saat proses berjalan, cegah double submit.

Contoh copy:

```text
Apakah Anda yakin ingin menghapus data ini?
Data yang sudah dihapus tidak dapat dikembalikan.
```

---

## Toast Notifications

Gunakan toast untuk feedback ringan:

* Data berhasil disimpan.
* Data gagal diperbarui.
* Status berhasil diubah.
* Filter berhasil diterapkan jika diperlukan.

Aturan:

* Toast sukses harus singkat.
* Toast error harus menjelaskan masalah.
* Jangan menggunakan toast untuk informasi penting yang harus dibaca lama.
* Jangan menumpuk terlalu banyak toast.
* Untuk error besar, gunakan `Alert` atau `ErrorState`.

---

## Badge and Status UX

Gunakan badge untuk membantu user memahami status data secara cepat.

Contoh status umum:

* `Draft`
* `Aktif`
* `Nonaktif`
* `Menunggu Verifikasi`
* `Terverifikasi`
* `Ditolak`
* `Selesai`
* `Diarsipkan`

Aturan:

* Badge harus memiliki teks yang jelas.
* Jangan hanya mengandalkan warna.
* Warna harus konsisten di seluruh aplikasi.
* Status penting boleh dilengkapi icon.
* Hindari terlalu banyak variasi warna.

---

## Pagination and Data Density

### Pagination

* Gunakan pagination untuk data panjang.
* Tampilkan jumlah data jika tersedia.
* Contoh:

  * `Menampilkan 1–10 dari 125 data`

### Data Density

* Default tampilan harus nyaman dibaca.
* Jangan terlalu rapat.
* Jika perlu, sediakan opsi density:

  * Nyaman
  * Ringkas

### Page Size

Gunakan pilihan umum:

* 10
* 25
* 50
* 100

---

## File Upload UX

Jika halaman memiliki upload file, gunakan aturan berikut:

* Upload file harus memiliki label dan helper text.
* Jelaskan format file yang didukung.
* Jelaskan batas ukuran file jika ada.
* Setelah file dipilih, tampilkan:

  * Nama file.
  * Ukuran file.
  * Tombol `Ganti`.
  * Tombol `Hapus`.

Contoh helper:

```text
Format: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, JPEG. Maksimal 10 MB.
```

Aturan:

* Jangan mengizinkan submit jika file wajib belum dipilih.
* Preview hanya untuk format yang didukung.
* Jangan preview Word/Excel dalam iframe.
* Gunakan download untuk format yang tidak bisa dipreview dengan baik.

---

## Accessibility

Aturan aksesibilitas wajib:

* Semua input wajib memiliki `Label`.
* Error field wajib memakai `aria-invalid` dan `aria-describedby`.
* Icon-only button wajib memiliki accessible label.
* Fokus keyboard harus terlihat.
* Semua aksi penting harus bisa digunakan dengan keyboard.
* Jangan hanya mengandalkan warna untuk membedakan status.
* Gunakan teks, icon, atau badge untuk memperjelas status.
* Pastikan kontras teks cukup terbaca.
* Dialog harus mengelola fokus dengan benar.
* Table harus tetap terbaca oleh screen reader.

---

## Mobile Responsiveness

### General Mobile Rules

* Layout harus single column.
* Form field full width.
* Tombol utama mudah dijangkau.
* Hindari teks terlalu kecil.
* Hindari tabel yang dipaksa mengecil sampai tidak terbaca.

### Table on Mobile

Gunakan salah satu pendekatan:

1. Horizontal scroll untuk tabel sederhana.
2. Card list untuk data yang lebih kompleks.
3. Summary row dengan detail expandable.

Aturan:

* Jangan menampilkan terlalu banyak kolom di mobile.
* Prioritaskan informasi utama.
* Aksi dapat masuk ke menu dropdown.
* Filter dapat masuk ke `Sheet`.

### Form on Mobile

* Form boleh menggunakan full-screen dialog, drawer, atau sheet.
* Footer action boleh sticky di bawah.
* Konten form harus scrollable.
* Tombol `Batal` dan submit harus jelas.
* Jangan menggunakan modal kecil yang sempit.

---

## Indonesian Government Tone

Gunakan bahasa formal, jelas, dan operasional.

### Good Examples

* `Data wajib diisi.`
* `Perubahan berhasil disimpan.`
* `Data gagal dimuat. Silakan coba lagi.`
* `Pilih kategori sebelum menyimpan data.`
* `Tidak ada data yang sesuai dengan filter.`

### Bad Examples

* `Oops, gagal nih.`
* `Submit error.`
* `No data.`
* `Something went wrong.`
* `Invalid request.`

---

## Implementation Examples

### Desktop Create/Edit Page

```tsx
export default function CreateDataPage() {
  return (
    <div className="space-y-6">
      <PageHero
        title="Tambah Data"
        description="Lengkapi form berikut untuk menambahkan data baru."
      />

      <SectionCard>
        <form className="space-y-6">
          {/* Form fields */}

          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline">
              Batal
            </Button>
            <Button type="submit">
              Simpan Data
            </Button>
          </div>
        </form>
      </SectionCard>
    </div>
  )
}
```

### Mobile Form with Sheet

```tsx
<Sheet open={open} onOpenChange={setOpen}>
  <SheetContent side="bottom" className="max-h-[calc(100vh-2rem)] overflow-y-auto">
    <SheetHeader>
      <SheetTitle>Tambah Data</SheetTitle>
      <SheetDescription>
        Lengkapi form berikut untuk menambahkan data baru.
      </SheetDescription>
    </SheetHeader>

    <form className="mt-6 space-y-4">
      {/* Form fields */}

      <div className="flex flex-col gap-2 pt-4">
        <Button type="submit">Simpan Data</Button>
        <Button type="button" variant="outline">
          Batal
        </Button>
      </div>
    </form>
  </SheetContent>
</Sheet>
```

### Status Badge

```tsx
<Badge variant="outline">
  {status}
</Badge>
```

### Confirmation Dialog

```tsx
<AlertDialog open={open} onOpenChange={setOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Hapus Data?</AlertDialogTitle>
      <AlertDialogDescription>
        Data yang sudah dihapus tidak dapat dikembalikan.
      </AlertDialogDescription>
    </AlertDialogHeader>

    <AlertDialogFooter>
      <AlertDialogCancel>Batal</AlertDialogCancel>
      <AlertDialogAction className="bg-destructive text-destructive-foreground">
        Hapus
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## Checklist

* [ ] Halaman memiliki judul dan deskripsi yang jelas.
* [ ] Primary action mudah ditemukan.
* [ ] Tabel/list menjadi fokus utama pada halaman daftar.
* [ ] Search dan filter berada dekat dengan data.
* [ ] Kolom tabel disusun berdasarkan prioritas kerja.
* [ ] Kolom aksi rata kanan.
* [ ] Aksi destruktif memakai konfirmasi.
* [ ] Form tambah/edit di desktop menggunakan dedicated page atau card, bukan modal.
* [ ] Form modal/sheet hanya digunakan untuk mobile atau aksi kecil.
* [ ] Semua field memiliki label.
* [ ] Error validasi spesifik dan dekat dengan field.
* [ ] Empty state memiliki penjelasan dan next action.
* [ ] Loading state tidak memblokir seluruh halaman.
* [ ] Toast atau success state konsisten.
* [ ] Tampilan mobile tetap nyaman digunakan.
* [ ] Bahasa UI formal dan operasional.
* [ ] Semua aksi penting dapat digunakan dengan keyboard.

---

## Anti-patterns

* Form input/edit utama dibuka dalam modal pada desktop/laptop.
* Halaman daftar dipenuhi form panjang.
* Tombol submit menggunakan label generik seperti `Submit`.
* Empty state hanya menampilkan `No data`.
* Menampilkan raw SQL, stack trace, atau error teknis internal.
* Terlalu banyak tombol aksi dalam satu baris tabel.
* Dropdown panjang tanpa search.
* Mengandalkan warna saja untuk status.
* Preview Word/Excel langsung dalam iframe.
* Spinner besar tanpa konteks.
* Layout terlalu dekoratif seperti landing page marketing.
* Tabel dipaksa mengecil di mobile sampai teks tidak terbaca.

---

## Acceptance Criteria

* Operator dapat mencari, memfilter, menambah, mengedit, dan menghapus data dengan alur yang jelas.
* Viewer dapat memahami data, status, dan aksi yang tersedia tanpa penjelasan tambahan.
* Form tambah/edit pada desktop/laptop tidak menggunakan modal utama.
* Form pada mobile tetap nyaman melalui sheet, drawer, full-screen dialog, atau halaman khusus.
* Error, loading, empty, dan success state tampil konsisten.
* Tabel tetap rapi pada data panjang.
* Semua input memiliki label dan validasi yang jelas.
* Aksi destruktif selalu membutuhkan konfirmasi.
* Bahasa UI sesuai konteks dashboard internal pemerintah.
