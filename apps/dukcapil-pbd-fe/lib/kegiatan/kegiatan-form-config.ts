import type { KegiatanBidang, KegiatanJenis } from "@/types/kegiatan";

export type KegiatanSlug =
  | "sosialisasi"
  | "bimtek"
  | "pendampingan"
  | "monev"
  | "rapat";

export type KegiatanSpecificField = {
  name: string;
  label: string;
  type: "text" | "textarea";
  placeholder: string;
  required?: boolean;
};

export type KegiatanSpecificSection = {
  title: string;
  description: string;
  fields: KegiatanSpecificField[];
};

export type KegiatanFormConfig = {
  slug: KegiatanSlug;
  jenis: KegiatanJenis;
  title: string;
  badge: string;
  description: string;
  bidangDefault: KegiatanBidang;
  pesertaLabel: string;
  pesertaPlaceholder: string;
  requiredData: string[];
  sections: KegiatanSpecificSection[];
};

export const kegiatanFormConfigs: KegiatanFormConfig[] = [
  {
    slug: "sosialisasi",
    jenis: "Sosialisasi",
    title: "Form Sosialisasi",
    badge: "Penyampaian Informasi",
    description:
      "Digunakan untuk kegiatan penyampaian informasi, regulasi, layanan, atau program kepada peserta sasaran.",
    bidangDefault: "Dukcapil",
    pesertaLabel: "Estimasi Peserta",
    pesertaPlaceholder: "Contoh: 80",
    requiredData: [
      "Tema/materi sosialisasi",
      "Sasaran peserta",
      "Narasumber atau pemateri",
      "Media dan bahan publikasi",
      "Indikator keberhasilan",
    ],
    sections: [
      {
        title: "Materi dan Sasaran",
        description:
          "Data utama untuk memastikan sosialisasi punya target audiens dan materi yang jelas.",
        fields: [
          {
            name: "tema",
            label: "Tema Sosialisasi",
            type: "text",
            required: true,
            placeholder: "Contoh: Aktivasi Identitas Kependudukan Digital",
          },
          {
            name: "sasaranPeserta",
            label: "Sasaran Peserta",
            type: "textarea",
            required: true,
            placeholder: "Contoh: Aparatur distrik, aparat kampung, masyarakat",
          },
          {
            name: "narasumber",
            label: "Narasumber",
            type: "textarea",
            required: true,
            placeholder: "Nama jabatan atau instansi narasumber",
          },
          {
            name: "mediaPublikasi",
            label: "Media/Bahan Sosialisasi",
            type: "textarea",
            placeholder: "Contoh: Banner, materi presentasi, leaflet, surat undangan",
          },
          {
            name: "indikatorKeberhasilan",
            label: "Indikator Keberhasilan",
            type: "textarea",
            required: true,
            placeholder: "Contoh: Peserta memahami alur layanan dan target aktivasi tercapai",
          },
        ],
      },
    ],
  },
  {
    slug: "bimtek",
    jenis: "Bimtek",
    title: "Form Bimbingan Teknis",
    badge: "Peningkatan Kapasitas",
    description:
      "Digunakan untuk pelatihan teknis, peningkatan kompetensi, atau penguatan operator/pegawai.",
    bidangDefault: "Dukcapil",
    pesertaLabel: "Jumlah Peserta Pelatihan",
    pesertaPlaceholder: "Contoh: 30",
    requiredData: [
      "Kompetensi yang dilatih",
      "Kurikulum atau modul",
      "Instruktur/fasilitator",
      "Metode praktik",
      "Evaluasi peserta",
    ],
    sections: [
      {
        title: "Desain Pembelajaran",
        description:
          "Bimtek perlu memuat kompetensi, modul, metode praktik, dan evaluasi peserta.",
        fields: [
          {
            name: "kompetensi",
            label: "Kompetensi yang Dilatih",
            type: "textarea",
            required: true,
            placeholder: "Contoh: Pemutakhiran data, pencatatan layanan, pelaporan SIAK",
          },
          {
            name: "kurikulum",
            label: "Kurikulum/Modul",
            type: "textarea",
            required: true,
            placeholder: "Daftar materi atau sesi pembelajaran",
          },
          {
            name: "instruktur",
            label: "Instruktur/Fasilitator",
            type: "textarea",
            required: true,
            placeholder: "Nama atau jabatan instruktur",
          },
          {
            name: "metodePraktik",
            label: "Metode Praktik",
            type: "textarea",
            placeholder: "Contoh: Simulasi aplikasi, studi kasus, praktik mandiri",
          },
          {
            name: "evaluasiPeserta",
            label: "Evaluasi Peserta",
            type: "textarea",
            required: true,
            placeholder: "Contoh: Pre-test, post-test, observasi praktik",
          },
        ],
      },
    ],
  },
  {
    slug: "pendampingan",
    jenis: "Pendampingan",
    title: "Form Pendampingan",
    badge: "Asistensi Lapangan",
    description:
      "Digunakan untuk asistensi langsung, fasilitasi, atau penguatan kapasitas pada objek dampingan.",
    bidangDefault: "PMK",
    pesertaLabel: "Jumlah Peserta Dampingan",
    pesertaPlaceholder: "Contoh: 45",
    requiredData: [
      "Objek/kelompok dampingan",
      "Masalah atau kebutuhan awal",
      "Metode pendampingan",
      "Rencana kunjungan",
      "Output dan tindak lanjut",
    ],
    sections: [
      {
        title: "Rencana Pendampingan",
        description:
          "Pendampingan perlu menjelaskan objek dampingan, kebutuhan awal, metode, dan tindak lanjut.",
        fields: [
          {
            name: "objekDampingan",
            label: "Objek/Kelompok Dampingan",
            type: "textarea",
            required: true,
            placeholder: "Contoh: Aparatur Kampung Warmare",
          },
          {
            name: "kebutuhanAwal",
            label: "Masalah/Kebutuhan Awal",
            type: "textarea",
            required: true,
            placeholder: "Kondisi awal yang perlu dibantu atau diperbaiki",
          },
          {
            name: "metodePendampingan",
            label: "Metode Pendampingan",
            type: "textarea",
            required: true,
            placeholder: "Contoh: Klinik dokumen, asistensi langsung, review berkas",
          },
          {
            name: "rencanaKunjungan",
            label: "Rencana Kunjungan",
            type: "textarea",
            placeholder: "Jadwal atau tahapan kunjungan pendampingan",
          },
          {
            name: "outputPendampingan",
            label: "Output Pendampingan",
            type: "textarea",
            required: true,
            placeholder: "Contoh: Dokumen tervalidasi, daftar isu, rencana perbaikan",
          },
          {
            name: "tindakLanjut",
            label: "Tindak Lanjut",
            type: "textarea",
            placeholder: "Rencana aksi setelah pendampingan",
          },
        ],
      },
    ],
  },
  {
    slug: "monev",
    jenis: "Monev",
    title: "Form Monitoring dan Evaluasi",
    badge: "Pengendalian dan Evaluasi",
    description:
      "Digunakan untuk monitoring, evaluasi capaian, pengumpulan temuan, dan rekomendasi tindak lanjut.",
    bidangDefault: "PMK",
    pesertaLabel: "Jumlah Tim/Peserta",
    pesertaPlaceholder: "Contoh: 18",
    requiredData: [
      "Objek monitoring",
      "Indikator dan target evaluasi",
      "Metode pengumpulan data",
      "Dokumen yang diperiksa",
      "Rencana temuan dan rekomendasi",
    ],
    sections: [
      {
        title: "Rencana Monev",
        description:
          "Monev perlu menekankan indikator, target, bukti, temuan, dan rekomendasi.",
        fields: [
          {
            name: "objekMonitoring",
            label: "Objek Monitoring",
            type: "textarea",
            required: true,
            placeholder: "Contoh: Realisasi Dana Desa Tahap I",
          },
          {
            name: "indikatorEvaluasi",
            label: "Indikator dan Target Evaluasi",
            type: "textarea",
            required: true,
            placeholder: "Indikator keluaran, hasil, realisasi fisik/keuangan",
          },
          {
            name: "metodePengumpulanData",
            label: "Metode Pengumpulan Data",
            type: "textarea",
            required: true,
            placeholder: "Contoh: Wawancara, observasi lapangan, review dokumen",
          },
          {
            name: "dokumenDiperiksa",
            label: "Dokumen yang Diperiksa",
            type: "textarea",
            placeholder: "Contoh: RAB, SPJ, daftar hadir, foto kegiatan",
          },
          {
            name: "rencanaTemuan",
            label: "Rencana Temuan/Rekomendasi",
            type: "textarea",
            required: true,
            placeholder: "Format catatan temuan, rekomendasi, dan penanggung jawab tindak lanjut",
          },
        ],
      },
    ],
  },
  {
    slug: "rapat",
    jenis: "Rapat",
    title: "Form Rapat Koordinasi",
    badge: "Koordinasi Internal/Eksternal",
    description:
      "Digunakan untuk rapat koordinasi, pembahasan program, atau pengambilan keputusan lintas pihak.",
    bidangDefault: "Sekretariat",
    pesertaLabel: "Jumlah Undangan",
    pesertaPlaceholder: "Contoh: 25",
    requiredData: [
      "Agenda rapat",
      "Peserta/undangan",
      "Pimpinan rapat",
      "Bahan pembahasan",
      "Keputusan dan tindak lanjut",
    ],
    sections: [
      {
        title: "Agenda dan Keputusan",
        description:
          "Rapat perlu punya agenda, peserta, bahan pembahasan, keputusan, dan tindak lanjut.",
        fields: [
          {
            name: "agenda",
            label: "Agenda Rapat",
            type: "textarea",
            required: true,
            placeholder: "Daftar agenda atau topik pembahasan",
          },
          {
            name: "pesertaUndangan",
            label: "Peserta/Undangan",
            type: "textarea",
            required: true,
            placeholder: "Unit, bidang, atau instansi yang diundang",
          },
          {
            name: "pimpinanRapat",
            label: "Pimpinan Rapat",
            type: "text",
            required: true,
            placeholder: "Nama atau jabatan pimpinan rapat",
          },
          {
            name: "bahanPembahasan",
            label: "Bahan Pembahasan",
            type: "textarea",
            placeholder: "Dokumen, data, atau paparan yang menjadi bahan rapat",
          },
          {
            name: "keputusanDiharapkan",
            label: "Keputusan yang Diharapkan",
            type: "textarea",
            required: true,
            placeholder: "Output keputusan atau kesepakatan rapat",
          },
          {
            name: "tindakLanjut",
            label: "Tindak Lanjut",
            type: "textarea",
            placeholder: "PIC, tenggat, atau langkah setelah rapat",
          },
        ],
      },
    ],
  },
];

export const kegiatanSlugByJenis = kegiatanFormConfigs.reduce(
  (acc, item) => ({
    ...acc,
    [item.jenis]: item.slug,
  }),
  {} as Record<KegiatanJenis, KegiatanSlug>,
);

export function getKegiatanFormConfig(slug: string | string[] | undefined) {
  const normalizedSlug = Array.isArray(slug) ? slug[0] : slug;

  return kegiatanFormConfigs.find((item) => item.slug === normalizedSlug);
}

export function getKegiatanCreateHref(jenis: KegiatanJenis) {
  return `/dashboard/kegiatan/create/${kegiatanSlugByJenis[jenis]}`;
}
