export type PegawaiDocumentCategory =
  | "Ijazah"
  | "SK"
  | "SPMT"
  | "Sertifikat"
  | "Lainnya";

export type PegawaiDocument = {
  id: string;
  title: string;
  category: PegawaiDocumentCategory;
  number: string;
  year: string;
  fileType: "PDF" | "JPG" | "PNG";
  status: "Lengkap" | "Perlu Verifikasi";
  uploadedAt: string;
};

export type PegawaiArchive = {
  id: string;
  nip: string;
  nik: string;
  name: string;
  position: string;
  unit: string;
  rank: string;
  email: string;
  phone: string;
  bankAccount: string;
  address: string;
  status: "Aktif" | "Cuti" | "Mutasi";
  photoColor: string;
  documents: PegawaiDocument[];
};

export const PEGAWAI_ARCHIVE_STORAGE_KEY = "dukcapil-pbd-pegawai-archives";

export const pegawaiArchives: PegawaiArchive[] = [
  {
    id: "pegawai-001",
    nip: "198501012010011001",
    nik: "9201010101850001",
    name: "James Saputro I. Sraun",
    position: "Analis Kebijakan",
    unit: "Sekretariat",
    rank: "Penata Tk. I / III.d",
    email: "james.sraun@papuabaratdaya.go.id",
    phone: "0812-0000-1122",
    bankAccount: "1234567890",
    address: "Kota Sorong, Papua Barat Daya",
    status: "Aktif",
    photoColor: "bg-blue-100 text-blue-700",
    documents: [
      {
        id: "doc-001",
        title: "Ijazah S1 Administrasi Publik",
        category: "Ijazah",
        number: "IJZ/2010/001",
        year: "2010",
        fileType: "PDF",
        status: "Lengkap",
        uploadedAt: "2026-01-12",
      },
      {
        id: "doc-002",
        title: "SK CPNS",
        category: "SK",
        number: "SK-CPNS/2010/044",
        year: "2010",
        fileType: "PDF",
        status: "Lengkap",
        uploadedAt: "2026-01-12",
      },
      {
        id: "doc-003",
        title: "SPMT Sekretariat",
        category: "SPMT",
        number: "SPMT/2024/016",
        year: "2024",
        fileType: "PDF",
        status: "Lengkap",
        uploadedAt: "2026-02-02",
      },
      {
        id: "doc-004",
        title: "Sertifikat Bimtek Arsip Digital",
        category: "Sertifikat",
        number: "CERT/2025/118",
        year: "2025",
        fileType: "PDF",
        status: "Perlu Verifikasi",
        uploadedAt: "2026-03-18",
      },
    ],
  },
  {
    id: "pegawai-002",
    nip: "199003152014022002",
    nik: "9201011503900002",
    name: "Operator Sekretariat",
    position: "Pengelola Data",
    unit: "Sekretariat",
    rank: "Penata Muda / III.a",
    email: "operator@papuabaratdaya.go.id",
    phone: "0812-0000-2233",
    bankAccount: "9876543210",
    address: "Kabupaten Sorong, Papua Barat Daya",
    status: "Aktif",
    photoColor: "bg-cyan-100 text-cyan-700",
    documents: [
      {
        id: "doc-005",
        title: "Ijazah D3 Manajemen Informatika",
        category: "Ijazah",
        number: "IJZ/2013/024",
        year: "2013",
        fileType: "PDF",
        status: "Lengkap",
        uploadedAt: "2026-01-25",
      },
      {
        id: "doc-006",
        title: "SK Pengangkatan PNS",
        category: "SK",
        number: "SK-PNS/2015/109",
        year: "2015",
        fileType: "PDF",
        status: "Lengkap",
        uploadedAt: "2026-02-12",
      },
      {
        id: "doc-007",
        title: "Surat Pernyataan Melaksanakan Tugas",
        category: "SPMT",
        number: "SPMT/2023/071",
        year: "2023",
        fileType: "PDF",
        status: "Lengkap",
        uploadedAt: "2026-02-12",
      },
    ],
  },
  {
    id: "pegawai-003",
    nip: "197908202006041004",
    nik: "9201022008790004",
    name: "Maria Kambu",
    position: "Analis Kepegawaian",
    unit: "Bidang Dukcapil",
    rank: "Pembina / IV.a",
    email: "maria.kambu@papuabaratdaya.go.id",
    phone: "0812-0000-3344",
    bankAccount: "2244668800",
    address: "Kabupaten Maybrat, Papua Barat Daya",
    status: "Aktif",
    photoColor: "bg-indigo-100 text-indigo-700",
    documents: [
      {
        id: "doc-008",
        title: "Ijazah S2 Manajemen SDM",
        category: "Ijazah",
        number: "IJZ/2018/041",
        year: "2018",
        fileType: "PDF",
        status: "Lengkap",
        uploadedAt: "2026-01-30",
      },
      {
        id: "doc-009",
        title: "SK Jabatan Fungsional",
        category: "SK",
        number: "SK-JF/2022/013",
        year: "2022",
        fileType: "PDF",
        status: "Lengkap",
        uploadedAt: "2026-03-03",
      },
      {
        id: "doc-010",
        title: "Sertifikat Kompetensi Kepegawaian",
        category: "Sertifikat",
        number: "BKN-CERT/2024/090",
        year: "2024",
        fileType: "PDF",
        status: "Lengkap",
        uploadedAt: "2026-04-05",
      },
      {
        id: "doc-011",
        title: "Pakta Integritas",
        category: "Lainnya",
        number: "PI/2026/017",
        year: "2026",
        fileType: "PDF",
        status: "Perlu Verifikasi",
        uploadedAt: "2026-04-10",
      },
    ],
  },
];

export function getPegawaiArchive(id: string) {
  return pegawaiArchives.find((pegawai) => pegawai.id === id) ?? null;
}

export function getDocumentCategoryCount(
  documents: PegawaiDocument[],
  category: PegawaiDocumentCategory,
) {
  return documents.filter((document) => document.category === category).length;
}
