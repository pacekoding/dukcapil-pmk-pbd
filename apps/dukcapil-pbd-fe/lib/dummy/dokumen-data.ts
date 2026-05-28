import type {
  Dokumen,
  DokumenJenisDokumen,
  DokumenJenisKegiatan,
  DokumenTypeOption,
} from "@/types/dokumen";
import { kegiatanData } from "@/lib/dummy/kegiatan-data";

export type {
  Dokumen,
  DokumenFormMeta,
  DokumenJenisDokumen,
  DokumenJenisKegiatan,
  DokumenListResponse,
  DokumenPreviewData,
  DokumenTypeOption,
} from "@/types/dokumen";

export const dokumenJenisKegiatanOptions: DokumenJenisKegiatan[] = [
  "Sosialisasi",
  "Bimtek",
  "Pendampingan",
  "Monev",
  "Rapat",
];

export const dokumenJenisDokumenOptions: DokumenJenisDokumen[] = [
  "TOR",
  "Laporan",
];

export const dokumenTypeOptions: DokumenTypeOption[] = [
  {
    value: "tor",
    label: "TOR",
  },
  {
    value: "laporan",
    label: "Laporan Pelaksanaan",
  },
];

export const dokumenData: Dokumen[] = kegiatanData.flatMap((kegiatan, index) => {
  const baseId = index * 2 + 1;

  return [
    {
      id: baseId,
      namaKegiatan: kegiatan.nama,
      jenisKegiatan: kegiatan.jenis,
      jenisDokumen: "TOR",
      tanggal: kegiatan.tanggal,
      dibuatOleh: "Admin Perencanaan",
    },
    {
      id: baseId + 1,
      namaKegiatan: kegiatan.nama,
      jenisKegiatan: kegiatan.jenis,
      jenisDokumen: "Laporan",
      tanggal: kegiatan.tanggal,
      dibuatOleh: "Admin Pelaporan",
    },
  ];
});
