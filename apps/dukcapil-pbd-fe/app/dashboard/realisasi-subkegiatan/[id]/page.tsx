"use client";

import { useParams } from "next/navigation";

import { RealisasiSubkegiatanDetailPage } from "@/components/dashboard/realisasi-subkegiatan-detail-page";
import { ErrorState } from "@/components/dashboard/state";

export default function DetailRealisasiSubkegiatanPage() {
  const params = useParams<{ id: string }>();
  const realisasiId = Number(params.id);

  if (!Number.isFinite(realisasiId) || realisasiId <= 0) {
    return <ErrorState message="ID realisasi tidak valid." />;
  }

  return <RealisasiSubkegiatanDetailPage realisasiId={realisasiId} />;
}
