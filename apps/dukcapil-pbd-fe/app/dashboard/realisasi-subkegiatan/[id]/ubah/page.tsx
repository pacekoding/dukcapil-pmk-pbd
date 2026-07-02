"use client";

import { useParams } from "next/navigation";

import { RealisasiSubkegiatanFormPage } from "@/components/dashboard/realisasi-subkegiatan-form-page";
import { ErrorState } from "@/components/dashboard/state";

export default function UbahRealisasiSubkegiatanPage() {
  const params = useParams<{ id: string }>();
  const realisasiId = Number(params.id);

  if (!Number.isFinite(realisasiId) || realisasiId <= 0) {
    return <ErrorState message="ID realisasi tidak valid." />;
  }

  return <RealisasiSubkegiatanFormPage mode="edit" realisasiId={realisasiId} />;
}
