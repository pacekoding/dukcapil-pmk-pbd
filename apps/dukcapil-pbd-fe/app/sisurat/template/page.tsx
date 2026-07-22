import Link from "next/link";
import { FileText } from "lucide-react";

import { PageHero } from "@/components/dashboard/page-hero";
import { SectionCard } from "@/components/dashboard/section-card";
import { Button } from "@/components/ui/button";

export default function SisuratTemplateRoute() {
  return (
    <main className="space-y-6">
      <PageHero
        icon={FileText}
        eyebrow="Template Surat"
        title="Template Surat Keluar"
        description="Area pengelolaan template surat keluar. Pada prototype ini template Radiogram tersedia melalui halaman generate dan preview."
        aside={
          <Button asChild className="bg-pbd-navy text-white">
            <Link href="/sisurat/generate">Buat Radiogram</Link>
          </Button>
        }
      />
      <SectionCard title="Template Tersedia">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm font-semibold text-blue-800">
          Radiogram aktif sebagai prototype. Template Undangan, Nota Dinas,
          Surat Tugas, Surat Biasa, dan Berita Acara disiapkan untuk tahap
          berikutnya.
        </div>
      </SectionCard>
    </main>
  );
}
