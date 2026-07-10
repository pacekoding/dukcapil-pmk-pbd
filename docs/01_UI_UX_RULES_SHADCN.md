# UI/UX Rules for shadcn-style Dashboard

## Purpose

Dokumen ini menetapkan aturan UI/UX untuk dashboard internal pemerintah agar tampilan konsisten, mudah dipakai, dan tidak membingungkan operator, verifikator, pimpinan, dan viewer.

## Scope

Berlaku untuk semua page dashboard, terutama:

- Arsip dokumen realisasi.
- Form upload dokumen.
- Data table dan filter.
- Dialog konfirmasi.
- Empty/loading/error/success states.
- Mobile layout.

## Rules

### Dashboard Layout

- Page utama harus menampilkan konteks, ringkasan, dan aksi utama.
- Primary action harus terlihat di area hero/header kanan.
- Konten utama untuk arsip adalah tabel/list dokumen; form upload tidak boleh memenuhi halaman utama.
- Gunakan `PageHero`, `SectionCard`, `Button`, `Dialog`, `Input`, `Textarea`, `Switch`, `Badge`, dan `Table` yang sudah ada.
- Hindari layout marketing. Ini dashboard kerja internal.

### Data Table

- Minimal kolom arsip dokumen:
  - Nama dokumen
  - Subkegiatan
  - SSD terkait
  - Jenis file
  - Dokumen DSSD
  - Tanggal upload
  - Aksi download/preview
- Kolom aksi harus rata kanan.
- Aksi preview hanya tampil untuk PDF/image.
- Tabel harus tetap rapi saat teks panjang: gunakan wrapping pada nama/subkegiatan dan width tetap pada aksi/status.

### Upload Form UX

- Upload form dibuka dari tombol **Upload Dokumen** dalam modal/dialog.
- Urutan field wajib:
  1. File dokumen
  2. Subkegiatan
  3. Dokumen DSSD
  4. Nama dokumen
  5. Keterangan
- Helper file wajib: `Format: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, JPEG.`
- Setelah file dipilih tampilkan:
  - Nama file
  - Ukuran file
  - Tombol `Ganti`
  - Tombol `Hapus`
- Submit label: `Upload Dokumen`.
- Loading submit label: `Mengupload...`.
- Tombol `Batal` harus tersedia di modal.

### Filter UX

- Filter berada dekat search table.
- Search placeholder harus menjelaskan cakupan, contoh: `Cari nama dokumen, subkegiatan, atau SSD...`
- Filter tahun anggaran harus konsisten dengan session; jangan membuat user melihat data lintas tahun tanpa izin eksplisit.
- Select filter harus memiliki opsi `Semua`.

### Empty States

- Empty state harus menyebut kondisi dan next action.
- Arsip kosong:
  - Title: `Belum ada dokumen realisasi yang diupload.`
  - Action: `Upload Dokumen Pertama`

### Loading States

- Table loading memakai baris tunggal: `Memuat arsip dokumen...`
- Form select subkegiatan loading: `Memuat subkegiatan...`
- Jangan disable seluruh page saat hanya tabel yang sedang loading.

### Error States

- Error harus spesifik:
  - `File dokumen wajib diupload.`
  - `Subkegiatan wajib dipilih.`
  - `Format file tidak didukung.`
  - `Dokumen gagal diupload.`
- Jangan tampilkan raw SQL, stack trace, atau response internal.

### Confirmation Dialogs

- Delete harus memakai dialog.
- Copy dialog harus menyebut objek yang dihapus.
- Tombol destruktif memakai `variant="destructive"`.
- Modal bisa ditutup dengan close button/escape jika tidak sedang proses upload/delete.

### Toast Notifications

- Jika project belum punya toast provider, gunakan state success/error konsisten (`SuccessState`, `ErrorState`).
- Saat toast provider tersedia, pesan sukses harus singkat:
  - `Dokumen berhasil diupload.`
  - `Dokumen berhasil dihapus.`

### Accessibility

- Semua input wajib punya `Label`.
- Error field wajib memakai `aria-invalid` dan `aria-describedby`.
- Semua button icon-only wajib punya accessible label.
- Fokus keyboard harus terlihat.
- Jangan hanya mengandalkan warna; gunakan teks dan icon.

### Mobile Responsiveness

- Dialog width: `w-[calc(100%-2rem)]`, max height viewport, content scroll.
- Button footer modal stack di mobile.
- Table boleh horizontal scroll, jangan mengecilkan teks sampai tidak terbaca.
- Form fields full width di mobile.

### Indonesian Government Tone

- Gunakan bahasa formal dan operasional.
- Hindari slang dan pesan ambigu.
- Contoh baik: `Dokumen wajib dipilih sebelum upload.`
- Contoh buruk: `Oops, gagal nih.`

## Implementation Examples

Dialog upload:

```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="max-h-[calc(100vh-2rem)] max-w-2xl overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Upload Dokumen Realisasi</DialogTitle>
      <DialogDescription>
        Upload dokumen pendukung dan hubungkan dengan subkegiatan terkait.
      </DialogDescription>
    </DialogHeader>
    {/* vertical form */}
  </DialogContent>
</Dialog>
```

Status badge:

```tsx
<Badge variant="outline" className={isDssd ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-slate-50 text-slate-600"}>
  {isDssd ? "DSSD" : "Non-DSSD"}
</Badge>
```

## Checklist

- [ ] Primary action terlihat jelas.
- [ ] Tabel tetap fokus utama.
- [ ] Form upload berada di modal/card ringkas.
- [ ] Semua field punya label.
- [ ] Error validasi spesifik.
- [ ] Empty state memiliki action.
- [ ] Loading state tidak memblokir seluruh page.
- [ ] Modal nyaman di mobile.
- [ ] Bahasa UI formal Indonesia.

## Anti-patterns

- Form upload langsung memenuhi halaman arsip.
- Tombol `Submit` generik.
- Menampilkan dropdown subkegiatan panjang tanpa search.
- Preview Word/Excel dalam iframe.
- Empty state hanya menampilkan `No data`.
- Menggunakan warna saja untuk status.

## Acceptance Criteria

- Operator dapat upload dokumen dalam modal tanpa kehilangan konteks tabel.
- Viewer dapat memahami status dokumen dari badge dan teks.
- Form dapat dipakai dengan keyboard.
- Tampilan mobile tetap bisa upload dan memilih subkegiatan.
