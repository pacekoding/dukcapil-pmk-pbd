"use client";

import { Badge } from "@/components/ui/badge";
import { klasifikasiSuratLabels } from "@/lib/sisurat/mock-surat";
import { cn } from "@/lib/utils";
import type { KlasifikasiSurat } from "@/types/surat";

const klasifikasiClasses: Record<KlasifikasiSurat, string> = {
  biasa: "border-slate-200 bg-white text-slate-700",
  penting: "border-amber-200 bg-amber-50 text-amber-800",
  segera: "border-orange-200 bg-orange-50 text-orange-700",
  sangat_segera: "border-red-200 bg-red-50 text-red-700",
};

export function KlasifikasiBadge({
  klasifikasi,
}: {
  klasifikasi: KlasifikasiSurat;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-6 rounded-full px-2.5 font-bold",
        klasifikasiClasses[klasifikasi],
      )}
    >
      {klasifikasiSuratLabels[klasifikasi]}
    </Badge>
  );
}
