"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText } from "lucide-react";
import { useParams } from "next/navigation";

import { PageHero } from "@/components/dashboard/page-hero";
import { QuestionnairePrintPreview } from "@/components/dashboard/questionnaire-print-preview";
import { EmptyState, ErrorState, LoadingState } from "@/components/dashboard/state";
import { getSSDDetail } from "@/lib/api/ssd";
import { getSubkegiatan } from "@/lib/api/subkegiatan";
import type { SSDDetail } from "@/types/ssd";
import type { Subkegiatan } from "@/types/subkegiatan";

export default function CetakKuisionerSubkegiatanPage() {
  const params = useParams<{ id: string }>();
  const subkegiatanID = Number(params.id);

  const [subkegiatan, setSubkegiatan] = useState<Subkegiatan | null>(null);
  const [ssdDetails, setSSDDetails] = useState<SSDDetail[]>([]);
  const [tahunAnggaran, setTahunAnggaran] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orderedSSDDetails = useMemo(() => {
    if (!subkegiatan) {
      return ssdDetails;
    }

    const detailMap = new Map(ssdDetails.map((ssd) => [ssd.id, ssd]));
    return subkegiatan.ssdItems
      .map((ssd) => detailMap.get(ssd.id))
      .filter((ssd): ssd is SSDDetail => Boolean(ssd));
  }, [ssdDetails, subkegiatan]);

  useEffect(() => {
    let mounted = true;

    const loadQuestionnaire = async () => {
      if (!Number.isFinite(subkegiatanID) || subkegiatanID <= 0) {
        setError("ID subkegiatan tidak valid.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const subkegiatanResponse = await getSubkegiatan();
        const selectedSubkegiatan = subkegiatanResponse.items.find(
          (item) => item.id === subkegiatanID,
        );

        if (!mounted) {
          return;
        }

        setTahunAnggaran(subkegiatanResponse.tahunAnggaran);

        if (!selectedSubkegiatan) {
          setSubkegiatan(null);
          setSSDDetails([]);
          setError("Subkegiatan tidak ditemukan untuk Tahun Anggaran aktif.");
          return;
        }

        setSubkegiatan(selectedSubkegiatan);

        const details = await Promise.all(
          selectedSubkegiatan.ssdItems.map((ssd) => getSSDDetail(ssd.id)),
        );

        if (!mounted) {
          return;
        }

        setSSDDetails(details);
      } catch (loadError) {
        console.error(loadError);
        if (mounted) {
          setError("Kuisioner gagal dimuat. Periksa koneksi dan data SDD.");
          setSubkegiatan(null);
          setSSDDetails([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadQuestionnaire();

    return () => {
      mounted = false;
    };
  }, [subkegiatanID]);

  const effectiveTahunAnggaran =
    tahunAnggaran || subkegiatan?.tahunAnggaran || "Tahun Anggaran aktif";

  return (
    <div className="space-y-6">
      <PageHero
        icon={FileText}
        eyebrow="Subkegiatan"
        title="Preview Cetak Kuisioner"
        description="Cetak kuisioner pengumpulan data SDD yang ringkas dan siap diisi manual."
        meta={
          <p className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-pbd-blue">
            Tahun Anggaran {effectiveTahunAnggaran}
          </p>
        }
      />

      {loading ? (
        <LoadingState
          rows={6}
          message="Memuat kuisioner subkegiatan..."
          className="rounded-lg border border-slate-200 bg-white p-5"
        />
      ) : error ? (
        <ErrorState message={error} className="rounded-lg" />
      ) : subkegiatan && orderedSSDDetails.length > 0 ? (
        <QuestionnairePrintPreview
          subkegiatan={subkegiatan}
          ssdDetails={orderedSSDDetails}
          tahunAnggaran={effectiveTahunAnggaran}
        />
      ) : (
        <EmptyState
          title="Kuisioner belum tersedia"
          description="Subkegiatan ini belum memiliki SDD terkait, sehingga kuisioner belum bisa dicetak."
          className="bg-white"
        />
      )}
    </div>
  );
}
