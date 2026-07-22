"use client";

import { Badge } from "@/components/ui/badge";
import { statusSuratLabels } from "@/lib/sisurat/mock-surat";
import { cn } from "@/lib/utils";
import type { StatusSurat } from "@/types/surat";

const statusClasses: Record<StatusSurat, string> = {
  draft: "border-slate-200 bg-slate-100 text-slate-700",
  siap_cetak: "border-blue-200 bg-blue-50 text-blue-700",
  sudah_dicetak: "border-indigo-200 bg-indigo-50 text-indigo-700",
  terkirim: "border-emerald-200 bg-emerald-50 text-emerald-700",
  dibatalkan: "border-red-200 bg-red-50 text-red-700",
};

export function StatusSuratBadge({ status }: { status: StatusSurat }) {
  return (
    <Badge
      variant="outline"
      className={cn("h-6 rounded-full px-2.5 font-bold", statusClasses[status])}
    >
      {statusSuratLabels[status]}
    </Badge>
  );
}
