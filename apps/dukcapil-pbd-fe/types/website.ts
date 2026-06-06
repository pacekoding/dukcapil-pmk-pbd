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

export type WebsiteHomeResponse = {
  hero: {
    eyebrow: string;
    title: string;
    description: string;
  };
  stats: WebsiteStat[];
  highlights: WebsiteHighlight[];
  profileSummary: {
    title: string;
    description: string;
  };
};

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
