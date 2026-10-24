import type {
  CivilRegistrationData,
  PopulationRegistrationData,
} from "@/types/data-wilayah";

export type DukcapilAggregateRegion<Data> = {
  id: string;
  name: string;
  shortName: string;
  type: "Kabupaten" | "Kota";
  data: Data;
};

export type DukcapilAggregateResponse<Data> = {
  tahunAnggaran: string;
  regions: DukcapilAggregateRegion<Data>[];
  updatedAt?: string;
};

export type PopulationRegistrationAggregate = PopulationRegistrationData;
export type CivilRegistrationAggregate = CivilRegistrationData;
