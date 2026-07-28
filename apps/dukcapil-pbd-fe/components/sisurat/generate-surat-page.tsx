"use client";

import { useMemo, useState } from "react";
import { FilePlus2 } from "lucide-react";

import { PageHero } from "@/components/dashboard/page-hero";
import { SectionCard } from "@/components/dashboard/section-card";
import { Badge } from "@/components/ui/badge";
import { findRadiogram } from "@/lib/sisurat/mock-surat";
import { createRadiogramDraft } from "@/lib/sisurat/radiogram-template";
import { useSuratKeluarStore } from "@/lib/sisurat/surat-store";
import type { JenisSurat, RadiogramSurat } from "@/types/surat";

import { JenisSuratSelector } from "./jenis-surat-selector";
import { RadiogramForm } from "./radiogram-form";

type GenerateSuratPageProps = {
  editId?: string;
};

export function GenerateSuratPage({ editId }: GenerateSuratPageProps) {
  const [jenisSurat, setJenisSurat] = useState<JenisSurat>("radiogram");
  const surat = useSuratKeluarStore();
  const initialData = useMemo<RadiogramSurat | undefined>(() => {
    if (!editId) {
      return createRadiogramDraft();
    }

    const stored = surat.find((item) => item.id === editId);
    return (stored as RadiogramSurat | undefined) ?? findRadiogram(editId);
  }, [editId, surat]);

  return (
    <main className="space-y-6">
      <PageHero
        icon={FilePlus2}
        eyebrow="Generate Surat Keluar"
        title={editId ? "Edit Radiogram" : "Buat Surat Keluar"}
        description="Pilih jenis surat, isi metadata dan isi berita, lalu lihat preview Radiogram sebelum disimpan atau dicetak."
        meta={
          <Badge className="h-8 rounded-full bg-blue-50 px-4 text-sm font-bold text-pbd-blue">
            Radiogram tersedia
          </Badge>
        }
      />

      <SectionCard
        title="Pilih Jenis Surat"
        description="Untuk MVP ini hanya Radiogram yang aktif."
      >
        <JenisSuratSelector value={jenisSurat} onChange={setJenisSurat} />
      </SectionCard>

      {jenisSurat === "radiogram" ? (
        <RadiogramForm key={initialData?.id} initialData={initialData} />
      ) : null}
    </main>
  );
}
