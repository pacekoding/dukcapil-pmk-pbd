"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Fingerprint,
  Home,
  MapPin,
  PieChart,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/website/breadcrumb";
import { getWebsiteDataWilayah } from "@/lib/api/data-wilayah";
import {
  defaultRegionData,
  formatArea,
  formatNumber,
  getDominantIdmStatus,
  getProvinceTotals,
  getTotalIdmVillages,
  tabLabels,
  type RegionTab,
} from "@/lib/data-wilayah";
import {
  regionMapBackgroundShapes,
  regionMapShapes,
} from "@/lib/region-map-paths";
import { cn } from "@/lib/utils";
import type { RegionData } from "@/types/data-wilayah";

const getHighestRegion = (
  regions: RegionData[],
  selector: (region: RegionData) => number,
) =>
  regions.reduce((highest, region) =>
    selector(region) > selector(highest) ? region : highest,
  );

const getRegionInsight = (region: RegionData, regions: RegionData[]) => {
  const highestPopulation = getHighestRegion(
    regions,
    (item) => item.oap.jumlahJiwa,
  );
  const highestKtp = getHighestRegion(
    regions,
    (item) => item.registration.pencetakanKtpEl,
  );
  const highestVeryLow = getHighestRegion(
    regions,
    (item) => item.idm.sangatTertinggal,
  );

  if (region.id === highestPopulation.id) {
    return `${region.shortName} memiliki jumlah jiwa tertinggi di Papua Barat Daya.`;
  }
  if (region.id === highestKtp.id) {
    return `${region.shortName} memiliki pencetakan KTP-EL tertinggi.`;
  }
  if (region.id === highestVeryLow.id) {
    return `${region.shortName} memiliki desa sangat tertinggal tertinggi pada data IDM 2025.`;
  }
  return `${region.shortName} didominasi status IDM ${getDominantIdmStatus(region.idm).toLowerCase()}.`;
};

const getBarPercent = (value: number, values: number[]) => {
  const max = Math.max(...values, 1);
  return Math.max(4, (value / max) * 100);
};

const regionMapFills: Record<string, string> = {
  "kabupaten-sorong": "#2dd4bf",
  "kota-sorong": "#f97316",
  "raja-ampat": "#60a5fa",
  "sorong-selatan": "#a3e635",
  maybrat: "#f59e0b",
  tambrauw: "#38bdf8",
};

const getRegionFill = (
  regionId: string,
  selected: boolean,
  hovered: boolean,
) => {
  if (selected) {
    return "#ffb800";
  }
  if (hovered) {
    return "#fde047";
  }
  return regionMapFills[regionId] ?? "#64748b";
};

export default function DataWilayahPage() {
  const [regions, setRegions] = useState<RegionData[]>(defaultRegionData);
  const totals = useMemo(() => getProvinceTotals(regions), [regions]);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [hoveredRegionId, setHoveredRegionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<RegionTab>("idm");

  useEffect(() => {
    let mounted = true;

    const loadDataWilayah = async () => {
      try {
        const data = await getWebsiteDataWilayah();
        if (mounted && data.regions.length > 0) {
          setRegions(data.regions);
        }
      } catch (error) {
        console.error(error);
      }
    };

    void loadDataWilayah();

    return () => {
      mounted = false;
    };
  }, []);

  const selectedRegion = selectedRegionId
    ? (regions.find((region) => region.id === selectedRegionId) ?? null)
    : null;
  const hoveredRegion = hoveredRegionId
    ? (regions.find((region) => region.id === hoveredRegionId) ?? null)
    : null;

  return (
    <main className="min-h-screen bg-[#f6f8fb]">
      <Breadcrumb items={[{ label: "Data Wilayah" }]} />
      <section className="bg-pbd-navy px-4 py-16 text-white sm:px-6 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="max-w-4xl"
          >
            <p className="text-sm font-bold uppercase tracking-wider text-pbd-gold">
              Peta Data Papua Barat Daya
            </p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
              Eksplorasi Data Kabupaten/Kota
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-white/75">
              Peta interaktif untuk melihat data IDM desa, pendaftaran penduduk,
              komposisi OAP, dan pencatatan sipil tahun 2025 pada 5 kabupaten
              dan 1 kota di Provinsi Papua Barat Daya.
            </p>
          </motion.div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <OverviewCard
              icon={Users}
              label="Total Jiwa"
              value={totals.totalJiwa}
            />
            <OverviewCard
              icon={ShieldCheck}
              label="Total OAP"
              value={totals.totalOap}
            />
            <OverviewCard
              icon={PieChart}
              label="Total Non-OAP"
              value={totals.totalNonOap}
            />
            <OverviewCard
              icon={Fingerprint}
              label="Pencetakan KTP-EL"
              value={totals.totalKtpEl}
            />
            <OverviewCard
              icon={Home}
              label="Total Desa IDM"
              value={totals.totalDesaIdm}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)] lg:py-14">
        <InteractiveRegionMap
          regions={regions}
          selectedRegion={selectedRegion}
          hoveredRegion={hoveredRegion}
          onHover={setHoveredRegionId}
          onSelect={(regionId) => {
            setSelectedRegionId(regionId);
            setActiveTab("idm");
          }}
        />
        {selectedRegion ? (
          <RegionDetailPanel
            key={selectedRegion.id}
            regions={regions}
            region={selectedRegion}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        ) : (
          <EmptySelectionPanel />
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:flex sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-pbd-navy">
              Kembali ke portal utama
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Lanjutkan eksplorasi data wilayah dan profil dinas melalui halaman
              utama portal.
            </p>
          </div>
          <Button asChild className="mt-5 h-11 rounded-lg sm:mt-0">
            <Link href="/">
              Beranda
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}

function OverviewCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-white/10 bg-white/10 p-5 backdrop-blur"
    >
      <Icon className="h-5 w-5 text-pbd-gold" />
      <p className="mt-4 text-xs font-bold uppercase tracking-wide text-white/60">
        {label}
      </p>
      <p className="mt-1 text-2xl font-extrabold text-white">
        {formatNumber(value)}
      </p>
    </motion.div>
  );
}

function InteractiveRegionMap({
  regions,
  selectedRegion,
  hoveredRegion,
  onHover,
  onSelect,
}: {
  regions: RegionData[];
  selectedRegion: RegionData | null;
  hoveredRegion: RegionData | null;
  onHover: (regionId: string | null) => void;
  onSelect: (regionId: string) => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/70 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-pbd-navy">
            Peta Data Papua Barat Daya
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Hover atau pilih area pada peta berbasis batas administrasi ADM2.
          </p>
        </div>
        <div className="rounded-lg bg-pbd-navy px-3 py-2 text-xs font-semibold text-white">
          GeoJSON SVG
        </div>
      </div>

      <div className="relative">
        <svg
          viewBox="0 0 640 430"
          role="img"
          aria-label="Peta interaktif wilayah Papua Barat Daya"
          className="h-auto w-full"
        >
          <defs>
            <filter
              id="regionShadow"
              x="-20%"
              y="-20%"
              width="140%"
              height="140%"
            >
              <feDropShadow
                dx="0"
                dy="10"
                stdDeviation="12"
                floodColor="#0f172a"
                floodOpacity="0.14"
              />
            </filter>
          </defs>
          <rect x="16" y="20" width="608" height="386" rx="18" fill="#1f2933" />
          <path
            d="M36 154 H610 M36 256 H610 M160 36 V394 M320 36 V394 M480 36 V394"
            fill="none"
            stroke="#334155"
            strokeWidth="1"
            strokeDasharray="7 12"
            opacity="0.55"
          />
          <path
            d="M48 356 C145 330 214 365 318 338 C416 312 488 329 596 284"
            fill="none"
            stroke="#475569"
            strokeWidth="2"
            strokeDasharray="8 10"
            opacity="0.65"
          />

          <g aria-hidden="true">
            {regionMapBackgroundShapes.map((shape) => (
              <path
                key={shape.id}
                d={shape.d}
                fill="#2f3a4c"
                fillRule="evenodd"
                clipRule="evenodd"
                stroke="#111827"
                strokeWidth="1.2"
                opacity="0.52"
              />
            ))}
          </g>

          {regionMapShapes.map((shape) => {
            const region = regions.find((item) => item.id === shape.id);
            if (!region) {
              return null;
            }

            const selected = selectedRegion?.id === region.id;
            const hovered = hoveredRegion?.id === region.id;
            const commonProps = {
              tabIndex: 0,
              role: "button",
              "aria-label": `Pilih ${region.name}`,
              onMouseEnter: () => onHover(region.id),
              onMouseLeave: () => onHover(null),
              onFocus: () => onHover(region.id),
              onBlur: () => onHover(null),
              onClick: () => onSelect(region.id),
              onKeyDown: (event: React.KeyboardEvent<SVGElement>) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(region.id);
                }
              },
              className:
                "cursor-pointer outline-none transition-colors duration-300 focus-visible:stroke-pbd-gold focus-visible:stroke-[4px]",
              fill: getRegionFill(region.id, selected, hovered),
              stroke: selected ? "#ffffff" : hovered ? "#fffbeb" : "#0f172a",
              strokeWidth: selected ? 3 : hovered ? 2.4 : 1.5,
              filter: selected ? "url(#regionShadow)" : undefined,
            };

            return (
              <g key={shape.id}>
                <motion.path
                  {...commonProps}
                  d={shape.d}
                  fillRule="evenodd"
                  clipRule="evenodd"
                  animate={{ opacity: selected ? 1 : hovered ? 0.98 : 0.9 }}
                  transition={{ duration: 0.22 }}
                />
                <AnimatePresence>
                  {selected ? (
                    <motion.text
                      key={`${shape.id}-label`}
                      x={shape.labelX}
                      y={shape.labelY}
                      textAnchor="middle"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      transition={{ duration: 0.18 }}
                      className="pointer-events-none fill-white text-[13px] font-bold drop-shadow"
                    >
                      {region.mapLabel}
                    </motion.text>
                  ) : null}
                </AnimatePresence>
              </g>
            );
          })}
        </svg>
        <MapActionHint region={hoveredRegion ?? selectedRegion} />
      </div>
    </div>
  );
}

function MapActionHint({ region }: { region: RegionData | null }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="absolute bottom-5 left-5 rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 text-xs font-semibold text-white shadow-sm backdrop-blur"
    >
      {region
        ? `Pilih untuk melihat detail ${region.name}`
        : "Pilih wilayah berwarna untuk melihat detail"}
    </motion.div>
  );
}

function EmptySelectionPanel() {
  return (
    <motion.aside
      initial={{ opacity: 0, x: 24, scale: 0.98 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.32, ease: "easeOut" }}
      className="flex min-h-[420px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center shadow-xl shadow-slate-200/70"
    >
      <div className="max-w-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-blue-50">
          <MapPin className="h-6 w-6 text-pbd-blue" />
        </div>
        <h2 className="mt-5 text-xl font-bold text-pbd-navy">
          Pilih Wilayah pada Peta
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Klik salah satu wilayah Papua Barat Daya untuk menampilkan label pada
          peta dan membuka detail statistik kabupaten/kota.
        </p>
      </div>
    </motion.aside>
  );
}

function RegionDetailPanel({
  regions,
  region,
  activeTab,
  onTabChange,
}: {
  regions: RegionData[];
  region: RegionData;
  activeTab: RegionTab;
  onTabChange: (tab: RegionTab) => void;
}) {
  return (
    <motion.aside
      initial={{ opacity: 0, x: 24, scale: 0.98 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.38, ease: "easeOut" }}
      className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl shadow-slate-200/70"
    >
      <div className="bg-pbd-navy p-6 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-pbd-gold">{region.type}</p>
            <h2 className="mt-1 text-2xl font-bold">{region.name}</h2>
          </div>
          <div className="rounded-lg bg-white/10 p-3">
            <MapPin className="h-5 w-5 text-pbd-gold" />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <MiniMetric
            label="Jiwa"
            value={formatNumber(region.oap.jumlahJiwa)}
          />
          <MiniMetric label="OAP" value={formatNumber(region.oap.jumlahOap)} />
          <MiniMetric label="Luas" value={formatArea(region.oap.luasWilayah)} />
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1 xl:grid-cols-4">
          {(Object.keys(tabLabels) as RegionTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              className={cn(
                "rounded-md px-3 py-2 text-xs font-semibold transition sm:text-sm",
                activeTab === tab
                  ? "bg-white text-pbd-navy shadow-sm"
                  : "text-slate-500 hover:text-pbd-navy",
              )}
            >
              {tabLabels[tab]}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${region.id}-${activeTab}`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="mt-6"
          >
            <RegionTabContent region={region} activeTab={activeTab} />
          </motion.div>
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.3 }}
          className="mt-6 rounded-lg border border-pbd-blue/15 bg-blue-50 p-4"
        >
          <div className="flex gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-pbd-blue" />
            <p className="text-sm leading-6 text-slate-700">
              <span className="font-bold text-pbd-navy">Insight: </span>
              {getRegionInsight(region, regions)}
            </p>
          </div>
        </motion.div>
      </div>
    </motion.aside>
  );
}

function RegionTabContent({
  region,
  activeTab,
}: {
  region: RegionData;
  activeTab: RegionTab;
}) {
  if (activeTab === "idm") {
    const total = getTotalIdmVillages(region.idm);
    const values = [
      region.idm.sangatTertinggal,
      region.idm.tertinggal,
      region.idm.berkembang,
      region.idm.maju,
      region.idm.mandiri,
    ];
    if (total === 0) {
      return <EmptyDataNote message="Tidak tersedia data desa IDM." />;
    }
    return (
      <DataGroup
        values={values}
        items={[
          ["Sangat Tertinggal", region.idm.sangatTertinggal],
          ["Tertinggal", region.idm.tertinggal],
          ["Berkembang", region.idm.berkembang],
          ["Maju", region.idm.maju],
          ["Mandiri", region.idm.mandiri],
        ]}
      />
    );
  }

  if (activeTab === "registration") {
    const values = Object.values(region.registration);
    return (
      <DataGroup
        values={values}
        items={[
          ["Penerbitan KK", region.registration.penerbitanKk],
          ["Perubahan KK", region.registration.perubahanKk],
          ["Kartu Identitas Anak", region.registration.kia],
          ["Penerbitan NIK WNI", region.registration.nikWni],
          ["Perekaman KTP-EL", region.registration.perekamanKtpEl],
          ["Pencetakan KTP-EL", region.registration.pencetakanKtpEl],
        ]}
      />
    );
  }

  if (activeTab === "oap") {
    const values = [
      region.oap.jumlahOap,
      region.oap.jumlahNonOap,
      region.oap.jumlahJiwa,
    ];
    return (
      <DataGroup
        values={values}
        items={[
          [
            "Luas Wilayah",
            region.oap.luasWilayah,
            formatArea(region.oap.luasWilayah),
          ],
          ["Jumlah OAP", region.oap.jumlahOap],
          ["Jumlah Non-OAP", region.oap.jumlahNonOap],
          ["Jumlah Jiwa", region.oap.jumlahJiwa],
        ]}
      />
    );
  }

  const values = Object.values(region.civil);
  return (
    <DataGroup
      values={values}
      items={[
        ["Akta Kelahiran", region.civil.aktaKelahiran],
        ["Akta Kematian", region.civil.aktaKematian],
        ["Akta Perkawinan", region.civil.aktaPerkawinan],
        ["Akta Perceraian", region.civil.aktaPerceraian],
      ]}
    />
  );
}

function DataGroup({
  items,
  values,
}: {
  items: Array<[string, number, string?]>;
  values: number[];
}) {
  return (
    <div className="grid gap-3">
      {items.map(([label, value, formatted], index) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.04, duration: 0.25 }}
        >
          <DataBar
            label={label}
            value={formatted ?? formatNumber(value)}
            percent={getBarPercent(value, values)}
          />
        </motion.div>
      ))}
    </div>
  );
}

function DataBar({
  label,
  value,
  percent,
}: {
  label: string;
  value: string;
  percent: number;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        <span className="text-sm font-bold text-pbd-navy">{value}</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="h-full rounded-full bg-pbd-blue"
        />
      </div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/10 p-3">
      <p className="text-[11px] font-semibold uppercase text-white/60">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-bold text-white">{value}</p>
    </div>
  );
}

function EmptyDataNote({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm font-medium text-slate-500">
      {message}
    </div>
  );
}
