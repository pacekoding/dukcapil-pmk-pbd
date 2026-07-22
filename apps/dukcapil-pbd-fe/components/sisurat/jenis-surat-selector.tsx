"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { jenisSuratLabels } from "@/lib/sisurat/mock-surat";
import type { JenisSurat } from "@/types/surat";

const jenisOptions: JenisSurat[] = [
  "radiogram",
  "undangan",
  "nota_dinas",
  "surat_tugas",
  "surat_biasa",
  "berita_acara",
];

type JenisSuratSelectorProps = {
  value: JenisSurat;
  onChange: (value: JenisSurat) => void;
};

export function JenisSuratSelector({
  value,
  onChange,
}: JenisSuratSelectorProps) {
  const selectedEnabled = value === "radiogram";

  return (
    <div className="max-w-xl space-y-2">
      <Select value={value} onValueChange={(nextValue) => onChange(nextValue as JenisSurat)}>
        <SelectTrigger className="h-11 w-full bg-white">
          <SelectValue placeholder="Pilih jenis surat" />
        </SelectTrigger>
        <SelectContent>
          {jenisOptions.map((jenis) => {
            const enabled = jenis === "radiogram";

            return (
              <SelectItem key={jenis} value={jenis} disabled={!enabled}>
                {jenisSuratLabels[jenis]}
                {!enabled ? " - Segera tersedia" : ""}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      <p className="text-sm font-medium leading-6 text-slate-500">
        {selectedEnabled
          ? "Template Radiogram siap digunakan untuk prototype."
          : "Template surat ini akan ditambahkan pada tahap berikutnya."}
      </p>
    </div>
  );
}
