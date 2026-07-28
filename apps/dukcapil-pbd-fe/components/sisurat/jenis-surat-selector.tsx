"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { jenisSuratLabels, mvpJenisSurat } from "@/lib/sisurat/mock-surat";
import type { JenisSurat } from "@/types/surat";

const jenisOptions: JenisSurat[] = mvpJenisSurat;

type JenisSuratSelectorProps = {
  value: JenisSurat;
  onChange: (value: JenisSurat) => void;
};

export function JenisSuratSelector({
  value,
  onChange,
}: JenisSuratSelectorProps) {
  return (
    <div className="max-w-xl space-y-2">
      <Select value={value} onValueChange={(nextValue) => onChange(nextValue as JenisSurat)}>
        <SelectTrigger className="h-11 w-full bg-white">
          <SelectValue placeholder="Pilih jenis surat" />
        </SelectTrigger>
        <SelectContent>
          {jenisOptions.map((jenis) => (
            <SelectItem key={jenis} value={jenis}>
              {jenisSuratLabels[jenis]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-sm font-medium leading-6 text-slate-500">
        Template Radiogram dipilih otomatis untuk MVP ini.
      </p>
    </div>
  );
}
