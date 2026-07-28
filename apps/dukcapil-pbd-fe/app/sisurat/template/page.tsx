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
        description="Template Radiogram tersedia melalui halaman pembuatan dan preview surat keluar."
        aside={
          <Button asChild className="bg-pbd-navy text-white">
            <Link href="/sisurat/surat-keluar/create">Buat Radiogram</Link>
          </Button>
        }
      />
      <SectionCard title="Template Tersedia">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm font-semibold text-blue-800">
          Radiogram aktif untuk MVP. Template Undangan, Nota Dinas, Surat Tugas,
          Surat Biasa, dan Berita Acara disiapkan untuk tahap berikutnya.
        </div>
      </SectionCard>
    </main>
  );
}
