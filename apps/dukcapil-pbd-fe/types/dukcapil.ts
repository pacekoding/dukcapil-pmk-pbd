export type KpiStatistic = {
  id: number;
  title: string;
  value: string;
};

export type Indicator = {
  id: number;
  title: string;
  indicators: string[];
};

export type StatistikRecord = {
  id: number;
  indikator: string;
  target: string;
  capaian: string;
  status: "Tercapai" | "Proses";
};
