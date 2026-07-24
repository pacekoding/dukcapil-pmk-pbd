"use client";

import { useEffect, useMemo, useState } from "react";
import { LayoutDashboard, RefreshCw, Save, ToggleLeft } from "lucide-react";

import { PageHero } from "@/components/dashboard/page-hero";
import { SectionCard } from "@/components/dashboard/section-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getAdminPortalAppStatuses,
  updateAdminPortalAppStatuses,
} from "@/lib/api/portal-apps";
import type { PortalAppStatus, PortalAppStatusItem } from "@/types/portal-app";

const portalApps = [
  {
    accessKey: "maceku_pkk",
    title: "MACEKU PKK",
    subtitle: "Manajemen Cakupan Keluarga PKK",
  },
  {
    accessKey: "sibum",
    title: "SIBUM Kampung",
    subtitle: "Sistem Informasi BUM Kampung",
  },
  {
    accessKey: "sikampung",
    title: "SIKAMPUNG",
    subtitle: "Sistem Informasi Kampung/Desa",
  },
  {
    accessKey: "sitekad",
    title: "SiTEKAD",
    subtitle: "Sistem Informasi Tekad",
  },
  {
    accessKey: "aspirasiku",
    title: "ASPIRASIKU",
    subtitle: "Sistem Aspirasi Anonim",
  },
  {
    accessKey: "sidoka",
    title: "SIDOKA",
    subtitle: "Sistem Informasi Dokumen Kegiatan",
  },
  {
    accessKey: "sidak",
    title: "SIDAK",
    subtitle: "Sistem Informasi Data Kegiatan Dukcapil",
  },
  {
    accessKey: "siber",
    title: "SIBER",
    subtitle: "Dashboard Data Dukcapil",
  },
  {
    accessKey: "sisurat",
    title: "SISURAT DUKCAPIL",
    subtitle: "Surat Keluar Bidang Dukcapil",
  },
  {
    accessKey: "simonev",
    title: "SIMONEV DUKCAPIL",
    subtitle: "Monitoring Evaluasi SSD",
  },
  {
    accessKey: "optima_info",
    title: "OPTIMA-INFO",
    subtitle: "Dashboard Informasi Website",
  },
  {
    accessKey: "arsip_pegawai",
    title: "ARSIPKU",
    subtitle: "Sistem ARSIPKU",
  },
];

const statusOptions: PortalAppStatus[] = ["Aktif", "Pemeliharaan", "Nonaktif"];

const defaultStatuses: Record<string, PortalAppStatus> = {
  maceku_pkk: "Aktif",
  sibum: "Aktif",
  sikampung: "Pemeliharaan",
  sitekad: "Aktif",
  aspirasiku: "Aktif",
  sidoka: "Pemeliharaan",
  sidak: "Pemeliharaan",
  siber: "Aktif",
  sisurat: "Aktif",
  simonev: "Aktif",
  optima_info: "Aktif",
  arsip_pegawai: "Pemeliharaan",
};

export default function PortalAppsSettingsPage() {
  const [items, setItems] = useState<PortalAppStatusItem[]>([]);
  const [statuses, setStatuses] =
    useState<Record<string, PortalAppStatus>>(defaultStatuses);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const summary = useMemo(
    () =>
      statusOptions.map((status) => ({
        status,
        total: Object.values(statuses).filter((value) => value === status)
          .length,
      })),
    [statuses],
  );

  const loadStatuses = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const data = await getAdminPortalAppStatuses();
      setItems(data);
      setStatuses(mapStatuses(data));
    } catch (loadError) {
      console.error(loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Status portal aplikasi gagal dimuat.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadInitialStatuses = async () => {
      try {
        const data = await getAdminPortalAppStatuses();
        if (!mounted) {
          return;
        }
        setItems(data);
        setStatuses(mapStatuses(data));
      } catch (loadError) {
        console.error(loadError);
        if (mounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Status portal aplikasi gagal dimuat.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadInitialStatuses();

    return () => {
      mounted = false;
    };
  }, []);

  const updateStatus = (accessKey: string, status: PortalAppStatus) => {
    setMessage(null);
    setError(null);
    setStatuses((current) => ({
      ...current,
      [accessKey]: status,
    }));
  };

  const saveStatuses = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const data = await updateAdminPortalAppStatuses({
        apps: portalApps.map((app) => ({
          accessKey: app.accessKey,
          status: statuses[app.accessKey] ?? defaultStatuses[app.accessKey],
        })),
      });
      setItems(data);
      setStatuses(mapStatuses(data));
      setMessage("Status portal aplikasi berhasil disimpan.");
    } catch (saveError) {
      console.error(saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Status portal aplikasi gagal disimpan.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="space-y-6">
      <PageHero
        icon={ToggleLeft}
        eyebrow="Pengaturan Portal"
        title="Status Sistem Informasi"
        description="Atur status card aplikasi internal yang tampil di portal. Card hanya dapat dibuka saat statusnya Aktif."
        meta={
          <div className="flex flex-wrap gap-2">
            {summary.map((item) => (
              <Badge
                key={item.status}
                variant="outline"
                className="h-8 rounded-full bg-white px-4 text-sm font-bold text-slate-600"
              >
                {item.total} {item.status}
              </Badge>
            ))}
          </div>
        }
        aside={
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-lg"
            disabled={loading || saving}
            onClick={loadStatuses}
          >
            <RefreshCw className="h-4 w-4" />
            Muat Ulang
          </Button>
        }
      />

      <SectionCard
        title="Daftar Sistem Informasi"
        description="Pilih Aktif, Pemeliharaan, atau Nonaktif untuk setiap card portal."
        action={
          <Button
            type="button"
            className="h-10 rounded-lg bg-pbd-navy text-white hover:bg-pbd-navy/90"
            disabled={loading || saving}
            onClick={saveStatuses}
          >
            <Save className="h-4 w-4" />
            {saving ? "Menyimpan..." : "Simpan Status"}
          </Button>
        }
        contentClassName="p-0"
      >
        {message ? (
          <div className="border-b border-emerald-100 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700">
            {message}
          </div>
        ) : null}
        {error ? (
          <div className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sistem</TableHead>
              <TableHead>Status Saat Ini</TableHead>
              <TableHead className="w-[260px]">Ubah Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="py-10 text-center text-sm font-medium text-slate-500"
                >
                  Memuat status portal aplikasi...
                </TableCell>
              </TableRow>
            ) : (
              portalApps.map((app) => {
                const status = statuses[app.accessKey] ?? "Nonaktif";
                const updatedAt = items.find(
                  (item) => item.accessKey === app.accessKey,
                )?.updatedAt;

                return (
                  <TableRow key={app.accessKey}>
                    <TableCell>
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-pbd-blue">
                          <LayoutDashboard className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-pbd-navy">{app.title}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            {app.subtitle}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={status} />
                      {updatedAt ? (
                        <p className="mt-2 text-xs text-slate-500">
                          Update terakhir:{" "}
                          {new Intl.DateTimeFormat("id-ID", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }).format(new Date(updatedAt))}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={status}
                        onValueChange={(value) =>
                          updateStatus(app.accessKey, value as PortalAppStatus)
                        }
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Pilih status" />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </SectionCard>
    </main>
  );
}

function StatusBadge({ status }: { status: PortalAppStatus }) {
  const className =
    status === "Aktif"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "Pemeliharaan"
        ? "border-yellow-200 bg-yellow-50 text-yellow-700"
        : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <Badge variant="outline" className={className}>
      {status}
    </Badge>
  );
}

function mapStatuses(items: PortalAppStatusItem[]) {
  return items.reduce<Record<string, PortalAppStatus>>(
    (result, item) => ({
      ...result,
      [item.accessKey]: item.status,
    }),
    { ...defaultStatuses },
  );
}
