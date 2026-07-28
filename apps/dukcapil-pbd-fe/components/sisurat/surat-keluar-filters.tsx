"use client";

import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  jenisSuratLabels,
  klasifikasiSuratLabels,
  mvpJenisSurat,
  statusSuratLabels,
} from "@/lib/sisurat/mock-surat";
import type { JenisSurat, KlasifikasiSurat, StatusSurat } from "@/types/surat";

export type SuratKeluarFilterState = {
  year: string;
  jenis: "all" | JenisSurat;
  status: "all" | StatusSurat;
  klasifikasi: "all" | KlasifikasiSurat;
  query: string;
};

type SuratKeluarFiltersProps = {
  value: SuratKeluarFilterState;
  years: string[];
  onChange: (value: SuratKeluarFilterState) => void;
};

export function SuratKeluarFilters({
  value,
  years,
  onChange,
}: SuratKeluarFiltersProps) {
  return (
    <div className="grid gap-3 lg:grid-cols-[120px_180px_170px_180px_1fr]">
      <Select
        value={value.year}
        onValueChange={(year) => onChange({ ...value, year })}
      >
        <SelectTrigger className="h-10 w-full bg-white">
          <SelectValue placeholder="Tahun" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Tahun</SelectItem>
          {years.map((year) => (
            <SelectItem key={year} value={year}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.jenis}
        onValueChange={(jenis) =>
          onChange({ ...value, jenis: jenis as SuratKeluarFilterState["jenis"] })
        }
      >
        <SelectTrigger className="h-10 w-full bg-white">
          <SelectValue placeholder="Jenis surat" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Jenis</SelectItem>
          {mvpJenisSurat.map((jenis) => (
            <SelectItem key={jenis} value={jenis}>
              {jenisSuratLabels[jenis]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.status}
        onValueChange={(status) =>
          onChange({
            ...value,
            status: status as SuratKeluarFilterState["status"],
          })
        }
      >
        <SelectTrigger className="h-10 w-full bg-white">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Status</SelectItem>
          {Object.entries(statusSuratLabels).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.klasifikasi}
        onValueChange={(klasifikasi) =>
          onChange({
            ...value,
            klasifikasi:
              klasifikasi as SuratKeluarFilterState["klasifikasi"],
          })
        }
      >
        <SelectTrigger className="h-10 w-full bg-white">
          <SelectValue placeholder="Klasifikasi" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Klasifikasi</SelectItem>
          {Object.entries(klasifikasiSuratLabels).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={value.query}
          onChange={(event) =>
            onChange({ ...value, query: event.target.value })
          }
          className="h-10 pl-9"
          placeholder="Cari nomor, perihal, atau tujuan"
        />
      </div>
    </div>
  );
}
