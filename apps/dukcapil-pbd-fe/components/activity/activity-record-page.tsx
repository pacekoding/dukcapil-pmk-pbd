"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ActivityForm } from "@/components/activity/activity-form";
import { CrudPage } from "@/components/dashboard/crud-page";
import { ErrorState, LoadingState } from "@/components/dashboard/state";
import { getActivity, saveActivity } from "@/lib/api/activity-execution";
import { getKabKota } from "@/lib/api/kab-kota";
import { getTravelOptions } from "@/lib/api/travel";
import { activityRoot } from "@/lib/activity-execution";
import type { ActivityExecution } from "@/types/activity-execution";
import type { KabKota } from "@/types/kab-kota";
import type { TravelOptions } from "@/types/travel";

export function ActivityRecordPage({ mode, id }: { mode: "add" | "edit"; id?: number }) {
  const router = useRouter();
  const [record, setRecord] = useState<ActivityExecution | null>(null);
  const [options, setOptions] = useState<TravelOptions | null>(null);
  const [cities, setCities] = useState<KabKota[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      getTravelOptions(),
      getKabKota(),
      mode === "edit" && id ? getActivity(id) : Promise.resolve(null),
    ])
      .then(([loadedOptions, loadedCities, detail]) => {
        if (!active) return;
        setOptions(loadedOptions);
        setCities(loadedCities);
        setRecord(detail?.execution ?? null);
        if (mode === "edit" && !detail) setError("Kegiatan tidak ditemukan.");
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : "Data gagal dimuat.");
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [id, mode]);

  return (
    <CrudPage
      title={mode === "add" ? "Buat Kegiatan" : "Edit Kegiatan"}
      description="Kelola informasi utama pelaksanaan kegiatan dan rekomendasi kelengkapannya."
      breadcrumbs={[
        { label: "Internal", href: "/internal/dashboard" },
        { label: "Pelaksanaan Kegiatan", href: activityRoot },
        { label: mode === "add" ? "Tambah" : "Edit" },
      ]}
    >
      {loading ? <LoadingState message="Memuat data kegiatan..." /> : null}
      {!loading && error && !options ? <ErrorState message={error} /> : null}
      {!loading && options && (mode === "add" || record) ? (
        <>
          <ActivityForm
            initial={record ?? undefined}
            options={options}
            cities={cities}
            saving={saving}
            onCancel={() => {
              if (window.confirm("Batalkan dan tinggalkan perubahan pada formulir?")) {
                router.push(id ? `${activityRoot}/${id}/preview` : activityRoot);
              }
            }}
            onSave={async (payload) => {
              setSaving(true);
              setError("");
              try {
                const saved = await saveActivity(mode === "edit" ? id ?? null : null, payload);
                router.replace(`${activityRoot}/${saved.id}/preview`);
              } catch (cause) {
                setError(cause instanceof Error ? cause.message : "Kegiatan gagal disimpan.");
              } finally {
                setSaving(false);
              }
            }}
          />
          {error ? <ErrorState message={error} /> : null}
        </>
      ) : null}
      {!loading && options && mode === "edit" && !record ? (
        <ErrorState message={error || "Kegiatan tidak ditemukan."} />
      ) : null}
    </CrudPage>
  );
}
