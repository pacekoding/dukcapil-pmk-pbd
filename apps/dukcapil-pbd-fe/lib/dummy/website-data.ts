import { dokumenData } from "@/lib/dummy/dokumen-data";
import { kegiatanJenisOptions } from "@/lib/dummy/kegiatan-data";
import {
  contactCards,
  misiInstansi,
  strukturOrganisasi,
  tugasInstansi,
  visiInstansi,
  wilayahKerja,
} from "@/lib/dummy/profile-data";
import type {
  PublicKegiatanItem,
  WebsiteHighlight,
  WebsiteHomeResponse,
  WebsiteKegiatanResponse,
  WebsiteProfileResponse,
  WebsiteStat,
} from "@/types/website";
import { listKegiatan } from "@/lib/mock/kegiatan-store";

function getRingkasan(description: string) {
  return description.split("\n\nDetail ")[0]?.trim() ?? description;
}

export function getPublicKegiatanItems(): PublicKegiatanItem[] {
  return listKegiatan().map((item) => {
    const relatedDocuments = dokumenData.filter(
      (document) => document.namaKegiatan === item.nama,
    );

    return {
      ...item,
      ringkasan: getRingkasan(item.deskripsi),
      dokumen: {
        tor: relatedDocuments.filter((document) => document.jenisDokumen === "TOR")
          .length,
        laporan: relatedDocuments.filter(
          (document) => document.jenisDokumen === "Laporan",
        ).length,
        total: relatedDocuments.length,
      },
    };
  });
}

function getCompletedPublicKegiatanItems() {
  return getPublicKegiatanItems().filter((item) => item.status === "Selesai");
}

function getStats(items: PublicKegiatanItem[]): WebsiteStat[] {
  const totalPeserta = items.reduce((total, item) => total + item.peserta, 0);
  const totalDokumen = items.reduce((total, item) => total + item.dokumen.total, 0);
  const totalSelesai = items.filter((item) => item.status === "Selesai").length;

  return [
    {
      label: "Kegiatan",
      value: String(items.length),
      description: "Mock data kegiatan lintas bidang",
    },
    {
      label: "Dokumen",
      value: String(totalDokumen),
      description: "TOR dan laporan yang tersedia",
    },
    {
      label: "Peserta",
      value: totalPeserta.toLocaleString("id-ID"),
      description: "Akumulasi peserta kegiatan",
    },
    {
      label: "Selesai",
      value: String(totalSelesai),
      description: "Kegiatan sudah masuk arsip",
    },
  ];
}

const highlights: WebsiteHighlight[] = [
  {
    title: "Pelayanan Administrasi Kependudukan",
    description:
      "Kegiatan Dukcapil berfokus pada pelayanan dokumen, aktivasi IKD, validasi data, dan peningkatan kualitas layanan masyarakat.",
  },
  {
    title: "Pemberdayaan Masyarakat Kampung",
    description:
      "Kegiatan PMK mendukung pendampingan tata kelola kampung, monitoring program, dan penguatan kapasitas aparatur.",
  },
  {
    title: "Dokumen Kegiatan Terintegrasi",
    description:
      "Setiap kegiatan memiliki dokumen TOR dan laporan yang dapat dipreview melalui alur dashboard internal.",
  },
];

export function getWebsiteHomeData(): WebsiteHomeResponse {
  const items = getPublicKegiatanItems();

  return {
    hero: {
      eyebrow: "Portal Kegiatan Resmi",
      title: "Dukcapil & PMK Papua Barat Daya",
      description:
        "Publikasi kegiatan, dokumen, dan profil Dinas Kependudukan dan Pencatatan Sipil dan Pemberdayaan Masyarakat dan Kampung Provinsi Papua Barat Daya.",
    },
    stats: getStats(items),
    highlights,
    latestKegiatan: items.slice(0, 3),
    profileSummary: {
      title: "Profil Dinas Dukcapil & PMK",
      description:
        "Dinas menyelenggarakan urusan administrasi kependudukan, pencatatan sipil, pemberdayaan masyarakat kampung, dan pengelolaan data layanan publik berbasis kegiatan.",
    },
  };
}

export function getWebsiteKegiatanData(): WebsiteKegiatanResponse {
  const items = getCompletedPublicKegiatanItems();

  return {
    items,
    jenisOptions: kegiatanJenisOptions
      .map((item) => item.value)
      .filter((jenis) => items.some((item) => item.jenis === jenis)),
    stats: getStats(items),
  };
}

export function getWebsiteKegiatanDetailData(id: number) {
  return (
    getCompletedPublicKegiatanItems().find((item) => item.id === id) ?? null
  );
}

export function getWebsiteProfileData(): WebsiteProfileResponse {
  return {
    title:
      "Dinas Kependudukan dan Pencatatan Sipil dan Pemberdayaan Masyarakat dan Kampung",
    description:
      "Pemerintah Provinsi Papua Barat Daya menyelenggarakan pelayanan administrasi kependudukan dan pemberdayaan masyarakat kampung secara tertib, inklusif, dan modern.",
    visi: visiInstansi,
    misi: misiInstansi,
    tugas: tugasInstansi,
    struktur: strukturOrganisasi,
    wilayah: wilayahKerja,
    contacts: contactCards,
  };
}
