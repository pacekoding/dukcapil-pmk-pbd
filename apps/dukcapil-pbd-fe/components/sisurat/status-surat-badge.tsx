"use client";

import { Badge } from "@/components/ui/badge";
import { statusSuratLabels } from "@/lib/sisurat/mock-surat";
import { cn } from "@/lib/utils";
import type { StatusSurat } from "@/types/surat";

const statusClasses: Record<StatusSurat, string> = {
  draft: "border-slate-200 bg-slate-100 text-slate-700",
  selesai: "border-emerald-200 bg-emerald-50 text-emerald-700",
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
