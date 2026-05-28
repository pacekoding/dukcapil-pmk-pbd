export type StrukturOrganisasiItem = {
  id: number;
  name: string;
};

export type ContactItem = {
  title: string;
  content: string;
};

export const wilayahKerja = [
  "Kota Sorong",
  "Kabupaten Sorong",
  "Kabupaten Sorong Selatan",
  "Kabupaten Maybrat",
  "Kabupaten Tambrauw",
  "Kabupaten Raja Ampat",
];

export const strukturOrganisasi: StrukturOrganisasiItem[] = [
  {
    id: 1,
    name: "Kepala Dinas",
  },
  {
    id: 2,
    name: "Sekretariat",
  },
  {
    id: 3,
    name: "Bidang Administrasi Kependudukan",
  },
  {
    id: 4,
    name: "Bidang Pencatatan Sipil",
  },
  {
    id: 5,
    name: "Bidang Pemberdayaan Masyarakat Kampung",
  },
  {
    id: 6,
    name: "Bidang Pengelolaan Informasi Administrasi Kependudukan",
  },
];

export const tugasInstansi = [
  "Pelayanan administrasi kependudukan",
  "Pelayanan pencatatan sipil",
  "Pengelolaan data kependudukan",
  "Pembinaan pemerintahan kampung",
  "Pemberdayaan masyarakat kampung",
  "Penguatan kapasitas kelembagaan masyarakat",
];

export const visiInstansi =
  "Terwujudnya pelayanan administrasi kependudukan dan pemberdayaan masyarakat kampung yang tertib, inklusif, dan berdaya saing.";

export const misiInstansi = [
  "Meningkatkan kualitas pelayanan administrasi kependudukan",
  "Meningkatkan digitalisasi pelayanan publik",
  "Meningkatkan kapasitas pemerintahan kampung",
  "Meningkatkan pemberdayaan masyarakat kampung",
  "Meningkatkan kualitas pengelolaan data kependudukan",
];

export const contactCards: ContactItem[] = [
  {
    title: "Alamat",
    content: "Kantor Gubernur Papua Barat Daya, Kota Sorong, Papua Barat Daya",
  },
  {
    title: "Email",
    content: "dukcapilpmk@papuabaratdaya.go.id",
  },
  {
    title: "Jam Pelayanan",
    content: "Senin - Jumat | 08.00 - 16.00 WIT",
  },
];
