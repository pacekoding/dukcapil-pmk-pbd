import { laporanPelaksanaanData } from "@/lib/dummy/laporan-data";
import { torData } from "@/lib/dummy/tor-data";
import { formatDateForDisplay } from "@/lib/date/date-format";
import { kegiatanSlugByJenis } from "@/lib/kegiatan/kegiatan-form-config";
import type { Dokumen } from "@/types/dokumen";
import type { Kegiatan } from "@/types/kegiatan";
import type { LaporanPelaksanaanDocument } from "@/types/laporan";
import type { TorDocument } from "@/types/tor";

const defaultPejabat = "Drs. Yohanis Kocu, M.Si";
const defaultNip = "19870909 202001 1 001";

const unitKerjaByBidang: Record<Kegiatan["bidang"], string> = {
  Dukcapil: "Bidang Pelayanan Pendaftaran Penduduk",
  PMK: "Bidang Pemberdayaan Masyarakat Kampung",
  Sekretariat: "Sekretariat Dinas",
};

function cleanSummary(description: string) {
  return description.split("\n\nDetail ")[0]?.trim() || description.trim();
}

function parseDetailRows(description: string) {
  return description
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2))
    .filter(Boolean);
}

function getDetailValue(detailRows: string[], keyword: string) {
  const row = detailRows.find((item) =>
    item.toLowerCase().startsWith(keyword.toLowerCase()),
  );

  if (!row) {
    return "";
  }

  return row.split(":").slice(1).join(":").trim();
}

function compactList(items: Array<string | undefined | null>) {
  return items.filter((item): item is string => Boolean(item?.trim()));
}

function kegiatanOrDocumentTitle(document: Dokumen, kegiatan?: Kegiatan | null) {
  return kegiatan?.nama || document.namaKegiatan;
}

function kegiatanDate(document: Dokumen, kegiatan?: Kegiatan | null) {
  return formatDateForDisplay(kegiatan?.tanggal || document.tanggal);
}

function makeGenericRundown(kegiatan?: Kegiatan | null) {
  const label = kegiatan?.jenis ?? "Kegiatan";
  const slug = kegiatan ? kegiatanSlugByJenis[kegiatan.jenis] : null;

  if (slug === "bimtek") {
    return [
      {
        waktu: "08.30 - 09.00",
        kegiatan: "Registrasi dan Pre-test",
        keterangan: "Panitia",
      },
      {
        waktu: "09.00 - 10.30",
        kegiatan: "Pemaparan Modul Teknis",
        keterangan: "Instruktur",
      },
      {
        waktu: "10.30 - 12.00",
        kegiatan: "Praktik dan Simulasi Aplikasi",
        keterangan: "Fasilitator",
      },
      {
        waktu: "12.00 - 12.30",
        kegiatan: "Post-test dan Evaluasi",
        keterangan: "Panitia",
      },
    ];
  }

  if (slug === "pendampingan") {
    return [
      {
        waktu: "09.00 - 09.30",
        kegiatan: "Identifikasi Kebutuhan Dampingan",
        keterangan: kegiatan?.penanggungJawab ?? "Tim pendamping",
      },
      {
        waktu: "09.30 - 11.00",
        kegiatan: "Review Dokumen dan Klinik Perbaikan",
        keterangan: "Tim pendamping",
      },
      {
        waktu: "11.00 - 12.00",
        kegiatan: "Penyusunan Matriks Tindak Lanjut",
        keterangan: "Aparatur kampung dan pendamping",
      },
    ];
  }

  if (slug === "monev") {
    return [
      {
        waktu: "09.00 - 09.30",
        kegiatan: "Pembukaan dan Penyampaian Instrumen Monev",
        keterangan: "Tim Monev",
      },
      {
        waktu: "09.30 - 11.30",
        kegiatan: "Pemeriksaan Dokumen dan Observasi Lapangan",
        keterangan: "Tim Monev",
      },
      {
        waktu: "11.30 - 12.30",
        kegiatan: "Rekap Temuan dan Rekomendasi",
        keterangan: "Tim Monev dan objek monitoring",
      },
    ];
  }

  if (slug === "rapat") {
    return [
      {
        waktu: "09.00 - 09.15",
        kegiatan: "Pembukaan Rapat",
        keterangan: kegiatan?.penanggungJawab ?? "Pimpinan rapat",
      },
      {
        waktu: "09.15 - 10.30",
        kegiatan: "Pembahasan Agenda dan Bahan Rapat",
        keterangan: "Peserta rapat",
      },
      {
        waktu: "10.30 - 11.30",
        kegiatan: "Perumusan Keputusan dan Tindak Lanjut",
        keterangan: "Pimpinan rapat",
      },
    ];
  }

  return [
    {
      waktu: "08.30 - 09.00",
      kegiatan: "Registrasi Peserta",
      keterangan: "Panitia",
    },
    {
      waktu: "09.00 - 09.30",
      kegiatan: "Pembukaan",
      keterangan: kegiatan?.penanggungJawab ?? "Penanggung jawab kegiatan",
    },
    {
      waktu: "09.30 - 11.30",
      kegiatan: `Pelaksanaan ${label}`,
      keterangan: kegiatan?.lokasi ?? "Lokasi kegiatan",
    },
    {
      waktu: "11.30 - 12.00",
      kegiatan: "Diskusi, Evaluasi, dan Penutup",
      keterangan: "Panitia dan peserta",
    },
  ];
}

function makeGenericBiaya(kegiatan?: Kegiatan | null) {
  const peserta = kegiatan?.peserta ?? 0;
  const volume = peserta > 0 ? `${peserta} Orang` : "Sesuai kebutuhan";
  const slug = kegiatan ? kegiatanSlugByJenis[kegiatan.jenis] : null;

  if (slug === "monev") {
    return [
      {
        no: 1,
        uraian: "Transportasi Tim Monev",
        volume: "1 Tim",
        harga: "Rp2.500.000",
        jumlah: "Rp2.500.000",
      },
      {
        no: 2,
        uraian: "Penggandaan Instrumen dan Dokumen",
        volume,
        harga: "Rp50.000",
        jumlah: peserta > 0 ? `Rp${(peserta * 50000).toLocaleString("id-ID")}` : "-",
      },
    ];
  }

  if (slug === "rapat") {
    return [
      {
        no: 1,
        uraian: "Konsumsi Rapat",
        volume,
        harga: "Rp125.000",
        jumlah: peserta > 0 ? `Rp${(peserta * 125000).toLocaleString("id-ID")}` : "-",
      },
      {
        no: 2,
        uraian: "Penggandaan Bahan Rapat",
        volume,
        harga: "Rp35.000",
        jumlah: peserta > 0 ? `Rp${(peserta * 35000).toLocaleString("id-ID")}` : "-",
      },
    ];
  }

  if (slug === "bimtek") {
    return [
      {
        no: 1,
        uraian: "Honor Instruktur/Fasilitator",
        volume: "2 Orang",
        harga: "Rp1.000.000",
        jumlah: "Rp2.000.000",
      },
      {
        no: 2,
        uraian: "Konsumsi dan Modul Peserta",
        volume,
        harga: "Rp225.000",
        jumlah: peserta > 0 ? `Rp${(peserta * 225000).toLocaleString("id-ID")}` : "-",
      },
    ];
  }

  if (slug === "pendampingan") {
    return [
      {
        no: 1,
        uraian: "Transportasi Tim Pendamping",
        volume: "1 Tim",
        harga: "Rp2.000.000",
        jumlah: "Rp2.000.000",
      },
      {
        no: 2,
        uraian: "Konsumsi dan Klinik Dokumen",
        volume,
        harga: "Rp120.000",
        jumlah: peserta > 0 ? `Rp${(peserta * 120000).toLocaleString("id-ID")}` : "-",
      },
    ];
  }

  return [
    {
      no: 1,
      uraian: "Konsumsi Peserta",
      volume,
      harga: "Rp150.000",
      jumlah: peserta > 0 ? `Rp${(peserta * 150000).toLocaleString("id-ID")}` : "-",
    },
    {
      no: 2,
      uraian: "ATK dan Bahan Kegiatan",
      volume,
      harga: "Rp75.000",
      jumlah: peserta > 0 ? `Rp${(peserta * 75000).toLocaleString("id-ID")}` : "-",
    },
  ];
}

function makeTotalBiaya(kegiatan?: Kegiatan | null) {
  const peserta = kegiatan?.peserta ?? 0;
  const slug = kegiatan ? kegiatanSlugByJenis[kegiatan.jenis] : null;

  if (peserta <= 0) {
    return "-";
  }

  if (slug === "monev") {
    return `Rp${(2500000 + peserta * 50000).toLocaleString("id-ID")}`;
  }

  if (slug === "rapat") {
    return `Rp${(peserta * 160000).toLocaleString("id-ID")}`;
  }

  if (slug === "bimtek") {
    return `Rp${(2000000 + peserta * 225000).toLocaleString("id-ID")}`;
  }

  if (slug === "pendampingan") {
    return `Rp${(2000000 + peserta * 120000).toLocaleString("id-ID")}`;
  }

  return `Rp${(peserta * 225000).toLocaleString("id-ID")}`;
}

function makeTorLists(kegiatan: Kegiatan | null, detailRows: string[]) {
  const jenis = kegiatan?.jenis ?? "Kegiatan";
  const sasaran =
    getDetailValue(detailRows, "Sasaran") ||
    getDetailValue(detailRows, "Peserta/Undangan") ||
    getDetailValue(detailRows, "Objek/Kelompok") ||
    getDetailValue(detailRows, "Objek Monitoring");
  const output =
    getDetailValue(detailRows, "Output") ||
    getDetailValue(detailRows, "Indikator") ||
    getDetailValue(detailRows, "Keputusan") ||
    getDetailValue(detailRows, "Evaluasi");

  return {
    tujuan: compactList([
      `Melaksanakan ${jenis.toLowerCase()} secara tertib, terukur, dan terdokumentasi.`,
      output ? `Mencapai target: ${output}.` : undefined,
      "Menjadi dasar penyusunan dokumen pelaksanaan dan pelaporan kegiatan.",
    ]),
    sasaran: compactList([
      sasaran || (kegiatan ? `${kegiatan.peserta} peserta kegiatan` : undefined),
      kegiatan?.bidang ? `Unit kerja bidang ${kegiatan.bidang}` : undefined,
    ]),
    outputs: compactList([
      output || `Terlaksananya ${jenis.toLowerCase()} sesuai rencana.`,
      "Tersedianya dokumentasi dan laporan pelaksanaan kegiatan.",
      getDetailValue(detailRows, "Tindak Lanjut")
        ? `Tindak lanjut: ${getDetailValue(detailRows, "Tindak Lanjut")}.`
        : undefined,
    ]),
  };
}

export function buildTorPreviewData(document: Dokumen, kegiatan: Kegiatan | null) {
  const detailRows = parseDetailRows(kegiatan?.deskripsi ?? "");
  const lists = makeTorLists(kegiatan, detailRows);
  const title = kegiatanOrDocumentTitle(document, kegiatan);

  const data: TorDocument = {
    ...torData,
    tahun: new Date().getFullYear(),
    unitKerja: kegiatan ? unitKerjaByBidang[kegiatan.bidang] : torData.unitKerja,
    judul: title,
    jenisKegiatan: kegiatan?.jenis ?? document.jenisKegiatan,
    bidang: kegiatan?.bidang,
    status: kegiatan?.status,
    tanggalDokumen: formatDateForDisplay(document.tanggal),
    dibuatOleh: document.dibuatOleh,
    latarBelakang: cleanSummary(kegiatan?.deskripsi ?? torData.latarBelakang),
    lokasi: kegiatan?.lokasi ?? torData.lokasi,
    tanggal: kegiatanDate(document, kegiatan),
    peserta: kegiatan?.peserta ?? torData.peserta,
    penanggungJawab: kegiatan?.penanggungJawab ?? torData.penanggungJawab,
    tujuan: lists.tujuan,
    sasaran: lists.sasaran,
    outputs: lists.outputs,
    rundown: makeGenericRundown(kegiatan),
    biaya: makeGenericBiaya(kegiatan),
    totalBiaya: makeTotalBiaya(kegiatan),
    detailKegiatan: detailRows,
  };

  return data;
}

function makeLaporanResultLists(kegiatan: Kegiatan | null, detailRows: string[]) {
  const jenis = kegiatan?.jenis ?? "kegiatan";
  const tindakLanjut = getDetailValue(detailRows, "Tindak Lanjut");
  const indikator =
    getDetailValue(detailRows, "Indikator") ||
    getDetailValue(detailRows, "Output") ||
    getDetailValue(detailRows, "Keputusan");

  return {
    hasilPelaksanaan: compactList([
      `${jenis} telah dilaksanakan sesuai jadwal dan lokasi yang direncanakan.`,
      indikator ? `Capaian utama: ${indikator}.` : undefined,
      kegiatan?.status ? `Status kegiatan saat laporan dibuat: ${kegiatan.status}.` : undefined,
    ]),
    capaianOutput: compactList([
      indikator || `Terlaksananya ${jenis.toLowerCase()} dan tersedianya dokumentasi kegiatan.`,
      "Data kegiatan tercatat dalam sistem monitoring Dukcapil PMK.",
    ]),
    kendala: [
      "Kendala pelaksanaan dicatat sebagai bahan evaluasi dan perbaikan kegiatan berikutnya.",
    ],
    tindakLanjut: compactList([
      tindakLanjut || "Melakukan koordinasi lanjutan dengan pihak terkait.",
      "Menyusun dokumentasi dan arsip pendukung kegiatan.",
    ]),
  };
}

export function buildLaporanPreviewData(
  document: Dokumen,
  kegiatan: Kegiatan | null,
) {
  const detailRows = parseDetailRows(kegiatan?.deskripsi ?? "");
  const resultLists = makeLaporanResultLists(kegiatan, detailRows);
  const title = kegiatanOrDocumentTitle(document, kegiatan);
  const peserta = kegiatan?.peserta ?? laporanPelaksanaanData.peserta;

  const data: LaporanPelaksanaanDocument = {
    ...laporanPelaksanaanData,
    tahun: new Date().getFullYear(),
    unitKerja: kegiatan
      ? unitKerjaByBidang[kegiatan.bidang]
      : laporanPelaksanaanData.unitKerja,
    nomorDokumen: `470/LPK-${document.id}/DUKCAPIL-PMK/${new Date().getFullYear()}`,
    namaKegiatan: title,
    jenisKegiatan: kegiatan?.jenis ?? document.jenisKegiatan,
    bidang: kegiatan?.bidang,
    status: kegiatan?.status,
    dibuatOleh: document.dibuatOleh,
    tanggalLaporan: formatDateForDisplay(document.tanggal),
    latarBelakang: cleanSummary(
      kegiatan?.deskripsi ?? laporanPelaksanaanData.latarBelakang,
    ),
    tanggal: kegiatanDate(document, kegiatan),
    lokasi: kegiatan?.lokasi ?? laporanPelaksanaanData.lokasi,
    peserta,
    pelaksana: kegiatan?.penanggungJawab ?? laporanPelaksanaanData.pelaksana,
    narasumber: compactList([
      getDetailValue(detailRows, "Narasumber"),
      getDetailValue(detailRows, "Instruktur/Fasilitator"),
      getDetailValue(detailRows, "Pimpinan Rapat"),
      kegiatan?.penanggungJawab,
    ]).slice(0, 3),
    metode:
      getDetailValue(detailRows, "Metode") ||
      getDetailValue(detailRows, "Metode Praktik") ||
      getDetailValue(detailRows, "Metode Pendampingan") ||
      getDetailValue(detailRows, "Metode Pengumpulan Data") ||
      laporanPelaksanaanData.metode,
    uraianPelaksanaan: makeGenericRundown(kegiatan).map(
      (item) => `${item.kegiatan} (${item.waktu}) - ${item.keterangan}`,
    ),
    hasilPelaksanaan: resultLists.hasilPelaksanaan,
    capaianOutput: resultLists.capaianOutput,
    kendala: resultLists.kendala,
    tindakLanjut: resultLists.tindakLanjut,
    pesertaDetail: [
      {
        no: 1,
        nama:
          getDetailValue(detailRows, "Sasaran") ||
          getDetailValue(detailRows, "Peserta/Undangan") ||
          "Peserta kegiatan",
        unsur: kegiatan?.bidang ?? "Unit terkait",
        jumlah: peserta,
      },
    ],
    dokumentasi: makeGenericRundown(kegiatan).slice(1).map((item, index) => ({
      no: index + 1,
      kegiatan: item.kegiatan,
      keterangan: item.keterangan,
    })),
    realisasiBiaya: makeGenericBiaya(kegiatan).map((item) => ({
      no: item.no,
      uraian: item.uraian,
      volume: item.volume,
      satuan: "Paket",
      biaya: item.harga,
      jumlah: item.jumlah,
    })),
    totalRealisasi: makeTotalBiaya(kegiatan),
    jabatanPenandatangan:
      kegiatan?.penanggungJawab ?? laporanPelaksanaanData.jabatanPenandatangan,
    pejabat: defaultPejabat,
    nip: defaultNip,
    detailKegiatan: detailRows,
  };

  const slug = kegiatan ? kegiatanSlugByJenis[kegiatan.jenis] : null;

  if (slug === "monev") {
    data.dasarPelaksanaan = [
      "Dokumen Pelaksanaan Anggaran Dinas Dukcapil dan PMK Provinsi Papua Barat Daya.",
      "Kebutuhan pengendalian, monitoring, dan evaluasi pelaksanaan program.",
      "Data dukung, dokumen, dan hasil observasi pelaksanaan kegiatan.",
    ];
  }

  return data;
}
