"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// https://bkpsdm.cirebonkota.go.id/lainnya/pangkat
const rankOptions = [
  "Juru Muda / I.a",
  "Juru Muda Tk. I / I.b",
  "Juru / I.c",
  "Juru Tk. I / I.d",
  "Pengatur Muda / II.a",
  "Pengatur Muda Tk. I / II.b",
  "Pengatur / II.c",
  "Pengatur Tk. I / II.d",
  "Penata Muda / III.a",
  "Penata Muda Tk. I / III.b",
  "Penata / III.c",
  "Penata Tk. I / III.d",
  "Pembina / IV.a",
  "Pembina Tk. I / IV.b",
  "Pembina Utama Muda / IV.c",
  "Pembina Utama Madya / IV.d",
  "Pembina Utama / IV.e",
];

export function RankSelect({
  value,
  onValueChange,
  disabled,
}: {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}) {
  const hasLegacyValue = value !== "" && !rankOptions.includes(value);

  return (
    <div className="grid gap-2">
      <label htmlFor="pegawai-rank" className="text-sm font-bold text-pbd-navy">
        Pangkat/Golongan *
      </label>
      <Select
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        required
      >
        <SelectTrigger id="pegawai-rank" className="h-10 w-full">
          <SelectValue placeholder="Pilih Pangkat/Golongan" />
        </SelectTrigger>
        <SelectContent position="popper">
          {hasLegacyValue ? (
            <SelectItem value={value}>{value} (Data lama)</SelectItem>
          ) : null}
          {rankOptions.map((rank) => (
            <SelectItem key={rank} value={rank}>
              {rank}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
