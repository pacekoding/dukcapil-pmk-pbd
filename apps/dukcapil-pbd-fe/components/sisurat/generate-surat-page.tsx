"use client";

import { useState } from "react";
import { FilePlus2 } from "lucide-react";

import { PageHero } from "@/components/dashboard/page-hero";
import { SectionCard } from "@/components/dashboard/section-card";
import { Badge } from "@/components/ui/badge";
import { findRadiogram, mockRadiogramSorong } from "@/lib/sisurat/mock-surat";
import type { JenisSurat } from "@/types/surat";

import { JenisSuratSelector } from "./jenis-surat-selector";
import { RadiogramForm } from "./radiogram-form";

type GenerateSuratPageProps = {
  editId?: string;
};

export function GenerateSuratPage({ editId }: GenerateSuratPageProps) {
  const [jenisSurat, setJenisSurat] = useState<JenisSurat>("radiogram");
  const initialData = editId ? findRadiogram(editId) : undefined;

  return (
    <main className="space-y-6">
      <PageHero
        icon={FilePlus2}
        eyebrow="Generate Surat Keluar"
        title={editId ? "Edit Radiogram" : "Buat Surat Keluar"}
        description="Pilih jenis surat, isi metadata dan isi berita, lalu hasilkan preview Radiogram yang siap dicetak."
        meta={
          <Badge className="h-8 rounded-full bg-blue-50 px-4 text-sm font-bold text-pbd-blue">
            Radiogram tersedia
          </Badge>
        }
      />

      <SectionCard
        title="Pilih Jenis Surat"
        description="Untuk prototype ini hanya Radiogram yang aktif."
      >
        <JenisSuratSelector value={jenisSurat} onChange={setJenisSurat} />
      </SectionCard>

      {jenisSurat === "radiogram" ? (
        <RadiogramForm initialData={initialData ?? mockRadiogramSorong} />
      ) : null}
    </main>
  );
}
