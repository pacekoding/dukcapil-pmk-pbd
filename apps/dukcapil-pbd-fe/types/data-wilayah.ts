export type IdmData = {
  sangatTertinggal: number;
  tertinggal: number;
  berkembang: number;
  maju: number;
  mandiri: number;
};

export type BumdesData = {
  jumlah: number;
  aktif: number;
  tidakAktif: number;
  bersama: number;
};

export type PopulationRegistrationData = {
  penerbitanKk: number;
  perubahanKk: number;
  kia: number;
  nikWni: number;
  perekamanKtpEl: number;
  pencetakanKtpEl: number;
};

export type OapData = {
  luasWilayah: number;
  jumlahOap: number;
  jumlahNonOap: number;
  jumlahJiwa: number;
};

export type CivilRegistrationData = {
  aktaKelahiran: number;
  aktaKematian: number;
  aktaPerkawinan: number;
  aktaPerceraian: number;
};

export type RegionData = {
  id: string;
  name: string;
  shortName: string;
  type: "Kabupaten" | "Kota";
  mapLabel: string;
  idm: IdmData;
  bumdes: BumdesData;
  registration: PopulationRegistrationData;
  oap: OapData;
  civil: CivilRegistrationData;
};

export type DataWilayahResponse = {
  tahunAnggaran: string;
  regions: RegionData[];
  updatedAt?: string;
};

export type DataWilayahWebsiteSettings = {
  featuredTahunAnggaran: string;
  publishedTahunAnggaran: string[];
};

export type DataWilayahAdminSettings = DataWilayahWebsiteSettings & {
  availableTahunAnggaran: string[];
};

export type DataWilayahSettingsPayload = {
  featuredTahunAnggaran: string;
  publishedTahunAnggaran: string[];
};

export type SiberOapPayload = Pick<
  OapData,
  "luasWilayah" | "jumlahOap" | "jumlahNonOap"
>;

export type SiberDataWilayahPayload = {
  registration: PopulationRegistrationData;
  civil: CivilRegistrationData;
  oap: SiberOapPayload;
};
