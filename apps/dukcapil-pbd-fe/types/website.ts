import type { Kegiatan, KegiatanJenis } from "@/types/kegiatan";

export type StrukturOrganisasiItem = {
  id: number;
  name: string;
};

export type ContactItem = {
  title: string;
  content: string;
};

export type WebsiteStat = {
  label: string;
  value: string;
  description: string;
};

export type WebsiteHighlight = {
  title: string;
  description: string;
};

export type PublicKegiatanItem = Kegiatan & {
  ringkasan: string;
  dokumen: {
    tor: number;
    laporan: number;
    total: number;
  };
};

export type WebsiteHomeResponse = {
  hero: {
    eyebrow: string;
    title: string;
    description: string;
  };
  stats: WebsiteStat[];
  highlights: WebsiteHighlight[];
  latestKegiatan: PublicKegiatanItem[];
  profileSummary: {
    title: string;
    description: string;
  };
};

export type WebsiteKegiatanResponse = {
  items: PublicKegiatanItem[];
  jenisOptions: KegiatanJenis[];
  stats: WebsiteStat[];
};

export type WebsiteKegiatanDetailResponse = PublicKegiatanItem;

export type WebsiteProfileResponse = {
  title: string;
  description: string;
  visi: string;
  misi: string[];
  tugas: string[];
  struktur: StrukturOrganisasiItem[];
  wilayah: string[];
  contacts: ContactItem[];
};
