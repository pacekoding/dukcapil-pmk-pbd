import { Settings } from "lucide-react";

import { PageHero } from "@/components/dashboard/page-hero";
import { SectionCard } from "@/components/dashboard/section-card";

export default function SisuratSettingsRoute() {
  return (
    <main className="space-y-6">
      <PageHero
        icon={Settings}
        eyebrow="Pengaturan"
        title="Pengaturan SISURAT DUKCAPIL"
        description="Konfigurasi nomor surat, pejabat penandatangan, dan template default akan ditempatkan di halaman ini pada integrasi berikutnya."
      />
      <SectionCard title="Pengaturan Prototype">
        <div className="grid gap-3 text-sm leading-6 text-slate-600 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            Format nomor surat masih menggunakan mock data.
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            Data pejabat penandatangan dapat diganti saat backend tersedia.
          </div>
        </div>
      </SectionCard>
    </main>
  );
}
