"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ElementType,
  type KeyboardEvent,
} from "react";
import {
  Baby,
  BadgeCheck,
  Building2,
  ChevronDown,
  Database,
  FileCheck2,
  FileText,
  Fingerprint,
  Home,
  IdCard,
  Info,
  ListRestart,
  MapPin,
  Minus,
  RotateCcw,
  Search,
  ShieldCheck,
  Users,
  ZoomIn,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Breadcrumb } from "@/components/website/breadcrumb";
import {
  getWebsiteDataWilayahByYear,
  getWebsiteDataWilayahSettings,
} from "@/lib/api/data-wilayah";
import {
  formatArea,
  formatNumber,
  getProvinceTotals,
  getTotalBumdes,
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

const LAST_UPDATED_FALLBACK = "Belum tersedia";
const DATA_SOURCE = "Dinas Dukcapil dan PMK Provinsi Papua Barat Daya";

const formatLastUpdated = (updatedAt: string | null) => {
  if (!updatedAt) {
    return LAST_UPDATED_FALLBACK;
  }

  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) {
    return LAST_UPDATED_FALLBACK;
  }

  const formatted = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jayapura",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);

  return `${formatted} WIT`;
};

const mapPalette = {
  ocean: "#E0F2FE",
  grid: "#93C5FD",
  land: "#E5E7EB",
  landStroke: "#94A3B8",
  navy: "#173A63",
  navyDark: "#102B4E",
  blue: "#2563EB",
  muted: "#64748B",
};

const MAP_VIEWBOX_WIDTH = 640;
const MAP_VIEWBOX_HEIGHT = 430;
const MAP_TOOLTIP_WIDTH = 178;
const MAP_TOOLTIP_HEIGHT = 70;
const MAP_TOOLTIP_PADDING = 14;
const MAP_MIN_ZOOM = 0.92;
const MAP_MAX_ZOOM = 1.2;
const MAP_ZOOM_STEP = 0.06;

const regionMapFills: Record<string, string> = {
  "kabupaten-sorong": "#7DD3FC",
  "kota-sorong": "#C4B5FD",
  "raja-ampat": "#93C5FD",
  "sorong-selatan": "#A7D88C",
  maybrat: "#F7C35F",
  tambrauw: "#7DD3B0",
};

const regionOrder = [
  "raja-ampat",
  "kabupaten-sorong",
  "maybrat",
  "tambrauw",
  "sorong-selatan",
  "kota-sorong",
];

const tabIcons: Record<RegionTab, ElementType> = {
  registration: Users,
  civil: FileCheck2,
  oap: ShieldCheck,
  idm: Home,
  bumdes: Building2,
};

const shortTabLabels: Record<RegionTab, string> = {
  registration: "Kependudukan",
  civil: "Pencatatan Sipil",
  oap: "Data OAP",
  idm: "IDM Desa",
  bumdes: "Data BUMDes",
};

const datasetSources: Record<
  RegionTab,
  { source: string; definition: string; availability: "yearly" | "static" }
> = {
  registration: {
    source: "Dinas Dukcapil Provinsi Papua Barat Daya",
    definition: "Pendaftaran penduduk mencakup KK, KIA, NIK WNI, dan KTP-el.",
    availability: "yearly",
  },
  civil: {
    source: "Dinas Dukcapil Provinsi Papua Barat Daya",
    definition: "Pencatatan sipil mencakup dokumen kelahiran, kematian, perkawinan, dan perceraian.",
    availability: "yearly",
  },
  oap: {
    source: DATA_SOURCE,
    definition: "OAP adalah Orang Asli Papua berdasarkan kategori data yang dipublikasikan pemerintah daerah.",
    availability: "yearly",
  },
  idm: {
    source: "Dinas PMK Provinsi Papua Barat Daya",
    definition: "IDM Desa menunjukkan status pembangunan desa/kampung.",
    availability: "yearly",
  },
  bumdes: {
    source: "Dinas PMK Provinsi Papua Barat Daya",
    definition: "BUMDes/BUMKam adalah badan usaha milik desa atau kampung.",
    availability: "yearly",
  },
};

const metricColors = [
  "text-blue-700 bg-blue-50",
  "text-emerald-700 bg-emerald-50",
  "text-violet-700 bg-violet-50",
  "text-orange-700 bg-orange-50",
  "text-cyan-700 bg-cyan-50",
  "text-amber-700 bg-amber-50",
];

const isRegionTab = (value: string | null): value is RegionTab =>
  value === "registration" ||
  value === "civil" ||
  value === "oap" ||
  value === "idm" ||
  value === "bumdes";

const sortRegions = (regions: RegionData[]) =>
  [...regions].sort((first, second) => {
    const firstIndex = regionOrder.indexOf(first.id);
    const secondIndex = regionOrder.indexOf(second.id);
    return (
      (firstIndex === -1 ? Number.MAX_SAFE_INTEGER : firstIndex) -
      (secondIndex === -1 ? Number.MAX_SAFE_INTEGER : secondIndex)
    );
  });

const getBarPercent = (value: number, values: number[]) => {
  const max = Math.max(...values, 1);
  if (value === 0) {
    return 0;
  }
  return Math.max(6, Math.min(100, (value / max) * 100));
};

const getRegionFill = (
  regionId: string,
  selected: boolean,
  hovered: boolean,
) => {
  if (selected) {
    return mapPalette.blue;
  }
  if (hovered) {
    return "#60A5FA";
  }
  return regionMapFills[regionId] ?? mapPalette.land;
};

const updateUrlState = ({
  regionId,
  activeTab,
  tahunAnggaran,
  replace = false,
}: {
  regionId: string | null;
  activeTab: RegionTab;
  tahunAnggaran: string;
  replace?: boolean;
}) => {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);

  if (regionId) {
    url.searchParams.set("region", regionId);
  } else {
    url.searchParams.delete("region");
  }

  url.searchParams.set("dataset", activeTab);

  if (tahunAnggaran) {
    url.searchParams.set("period", tahunAnggaran);
  } else {
    url.searchParams.delete("period");
  }

  const nextUrl = `${url.pathname}?${url.searchParams.toString()}`;
  if (replace) {
    window.history.replaceState(null, "", nextUrl);
    return;
  }
  window.history.pushState(null, "", nextUrl);
};

export default function DataWilayahPage() {
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [tahunAnggaran, setTahunAnggaran] = useState("");
  const [tahunAnggaranOptions, setTahunAnggaranOptions] = useState<string[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [hoveredRegionId, setHoveredRegionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<RegionTab>("registration");
  const [searchQuery, setSearchQuery] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const totals = useMemo(() => getProvinceTotals(regions), [regions]);
  const lastUpdatedLabel = useMemo(() => formatLastUpdated(updatedAt), [updatedAt]);
  const orderedRegions = useMemo(() => sortRegions(regions), [regions]);
  const selectedRegion =
    selectedRegionId !== null
      ? (regions.find((region) => region.id === selectedRegionId) ?? null)
      : null;
  const hoveredRegion = hoveredRegionId
    ? (regions.find((region) => region.id === hoveredRegionId) ?? null)
    : null;
  const selectedRegionExists =
    selectedRegionId === null ||
    regions.some((region) => region.id === selectedRegionId);

  useEffect(() => {
    const applyUrlState = () => {
      const params = new URLSearchParams(window.location.search);
      const regionParam = params.get("region");
      const datasetParam = params.get("dataset");
      const periodParam = params.get("period");

      setSelectedRegionId(regionParam);

      setActiveTab(isRegionTab(datasetParam) ? datasetParam : "registration");

      if (periodParam) {
        setTahunAnggaran(periodParam);
      }
    };

    applyUrlState();
    window.addEventListener("popstate", applyUrlState);

    return () => window.removeEventListener("popstate", applyUrlState);
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadSettings = async () => {
      try {
        const settings = await getWebsiteDataWilayahSettings();
        if (!mounted) {
          return;
        }

        const urlPeriod = new URLSearchParams(window.location.search).get("period");
        const nextYear =
          urlPeriod ||
          settings.featuredTahunAnggaran ||
          settings.publishedTahunAnggaran[0] ||
          "";

        setTahunAnggaranOptions(settings.publishedTahunAnggaran);
        setTahunAnggaran((current) => current || nextYear);
        setDataError(null);
      } catch (error) {
        console.error(error);
        if (mounted) {
          setDataLoading(false);
          setDataError("Pengaturan periode data gagal dimuat.");
        }
      }
    };

    void loadSettings();

    return () => {
      mounted = false;
    };
  }, [reloadKey]);

  useEffect(() => {
    if (!tahunAnggaran) {
      return;
    }

    let mounted = true;

    const loadDataWilayah = async () => {
      setDataLoading(true);
      try {
        const data = await getWebsiteDataWilayahByYear(tahunAnggaran);
        if (!mounted) {
          return;
        }

        setUpdatedAt(data.updatedAt ?? null);
        setRegions(data.regions);
        setSelectedRegionId((currentRegionId) => {
          if (!currentRegionId) {
            return null;
          }
          const currentRegionExists = data.regions.some(
            (region) => region.id === currentRegionId,
          );
          return currentRegionExists ? currentRegionId : null;
        });
        setTahunAnggaran(data.tahunAnggaran);
        setDataError(null);
      } catch (error) {
        console.error(error);
        if (mounted) {
          setUpdatedAt(null);
          setRegions([]);
          setDataError("Data wilayah gagal dimuat.");
        }
      } finally {
        if (mounted) {
          setDataLoading(false);
        }
      }
    };

    void loadDataWilayah();

    return () => {
      mounted = false;
    };
  }, [tahunAnggaran, reloadKey]);

  useEffect(() => {
    if (!tahunAnggaran || typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get("period") && params.get("dataset")) {
      return;
    }

    updateUrlState({
      regionId: selectedRegionId,
      activeTab,
      tahunAnggaran,
      replace: true,
    });
  }, [activeTab, selectedRegionId, tahunAnggaran]);

  const handleRegionSelect = (regionId: string | null) => {
    setSelectedRegionId(regionId);
    updateUrlState({
      regionId,
      activeTab,
      tahunAnggaran,
    });
  };

  const handlePeriodChange = (period: string) => {
    setUpdatedAt(null);
    setTahunAnggaran(period);
    updateUrlState({
      regionId: selectedRegionId,
      activeTab,
      tahunAnggaran: period,
    });
  };

  const handleTabChange = (tab: RegionTab) => {
    setActiveTab(tab);
    updateUrlState({
      regionId: selectedRegionId,
      activeTab: tab,
      tahunAnggaran,
    });
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F8FAFC]">
      <Breadcrumb items={[{ label: "Data Wilayah" }]} />

      <DataWilayahHeader
        tahunAnggaran={tahunAnggaran}
        tahunAnggaranOptions={tahunAnggaranOptions}
        lastUpdatedLabel={lastUpdatedLabel}
        dataError={dataError}
        onPeriodChange={handlePeriodChange}
        onRetry={() => setReloadKey((current) => current + 1)}
      />

      <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:py-6">
        <ProvinceMetrics
          totals={totals}
          bumdesAvailable={regions.some((region) => getTotalBumdes(region.bumdes) > 0)}
          loading={dataLoading}
        />

        {!selectedRegionExists ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Parameter wilayah tidak dikenali. Tampilan dikembalikan ke ringkasan
            provinsi.
          </div>
        ) : null}

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,8fr)_minmax(360px,4fr)] 2xl:grid-cols-[minmax(0,9fr)_minmax(380px,3fr)]">
          <RegionMapWorkspace
            regions={orderedRegions}
            selectedRegion={selectedRegion}
            hoveredRegion={hoveredRegion}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            onHover={setHoveredRegionId}
            onSelect={handleRegionSelect}
          />

          {selectedRegion ? (
            <RegionSummaryPanel
              key={selectedRegion.id}
              region={selectedRegion}
              activeTab={activeTab}
              tahunAnggaran={tahunAnggaran}
              lastUpdatedLabel={lastUpdatedLabel}
              onTabChange={handleTabChange}
            />
          ) : (
            <EmptySelectionPanel
              regions={orderedRegions}
              onSelect={handleRegionSelect}
            />
          )}
        </div>

        <DataSourceMeta
          activeTab={activeTab}
          tahunAnggaran={tahunAnggaran}
          lastUpdatedLabel={lastUpdatedLabel}
          className="mt-5"
        />
      </section>
    </main>
  );
}

function DataWilayahHeader({
  tahunAnggaran,
  tahunAnggaranOptions,
  lastUpdatedLabel,
  dataError,
  onPeriodChange,
  onRetry,
}: {
  tahunAnggaran: string;
  tahunAnggaranOptions: string[];
  lastUpdatedLabel: string;
  dataError: string | null;
  onPeriodChange: (period: string) => void;
  onRetry: () => void;
}) {
  return (
    <section className="border-b border-slate-200 bg-white px-4 py-5 sm:px-6 lg:py-7">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          className="max-w-3xl"
        >
          <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
            Data Wilayah
          </p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#102B4E] sm:text-3xl">
            Peta Data Papua Barat Daya
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Jelajahi statistik kabupaten/kota untuk kependudukan, pencatatan
            sipil, OAP, IDM desa, dan BUMDes.
          </p>
        </motion.div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[290px]">
          <div className="flex items-end gap-3">
            <div className="min-w-0 flex-1">
              <label
                htmlFor="periode-data"
                className="text-xs font-bold uppercase tracking-wide text-slate-500"
              >
                Periode Data
              </label>
              <Select value={tahunAnggaran} onValueChange={onPeriodChange}>
                <SelectTrigger
                  id="periode-data"
                  className="mt-1 h-11 rounded-lg border-slate-200 bg-white text-sm font-semibold text-[#173A63]"
                >
                  <SelectValue placeholder="Pilih periode" />
                </SelectTrigger>
                <SelectContent>
                  {tahunAnggaranOptions.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {dataError ? (
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-lg"
                onClick={onRetry}
              >
                Ulangi
              </Button>
            ) : null}
          </div>
          <p className="text-xs text-slate-500">
            Diperbarui{" "}
            <span className="font-semibold text-slate-700">
              {lastUpdatedLabel}
            </span>
          </p>
          {dataError ? (
            <p className="text-sm font-medium text-red-600">{dataError}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function ProvinceMetrics({
  totals,
  bumdesAvailable,
  loading,
}: {
  totals: ReturnType<typeof getProvinceTotals>;
  bumdesAvailable: boolean;
  loading: boolean;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <MetricCard
        icon={Users}
        label="Total Penduduk"
        value={loading ? "..." : `${formatNumber(totals.totalJiwa)} jiwa`}
        sourceLabel="Dukcapil"
        emphasis
      />
      <MetricCard
        icon={ShieldCheck}
        label="Penduduk OAP"
        value={loading ? "..." : `${formatNumber(totals.totalOap)} jiwa`}
        sourceLabel="Dukcapil"
      />
      <MetricCard
        icon={Fingerprint}
        label="Cetak KTP-el"
        value={loading ? "..." : formatNumber(totals.totalKtpEl)}
        sourceLabel="Dukcapil"
      />
      <MetricCard
        icon={Home}
        label="Desa/Kampung IDM"
        value={loading ? "..." : `${formatNumber(totals.totalDesaIdm)} kampung`}
        sourceLabel="PMK"
      />
      <MetricCard
        icon={Building2}
        label="BUMDes/BUMKam"
        value={loading ? "..." : bumdesAvailable ? formatNumber(totals.totalBumdes) : null}
        sourceLabel="PMK"
      />
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  sourceLabel,
  emphasis = false,
}: {
  icon: ElementType;
  label: string;
  value: string | null;
  sourceLabel: "Dukcapil" | "PMK";
  emphasis?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "min-h-[126px] rounded-lg border border-slate-200 bg-white p-4 shadow-sm",
        emphasis ? "border-blue-200" : null,
      )}
    >
      <div className="flex h-full flex-col justify-between gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              {label}
            </p>
            <Badge
              variant="outline"
              className="mt-2 border-slate-200 bg-slate-50 text-[11px] text-slate-600"
            >
              {sourceLabel}
            </Badge>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <div>
          <p
            className={cn(
              "break-words font-extrabold tracking-tight text-[#102B4E]",
              emphasis ? "text-2xl" : "text-xl",
            )}
          >
            {value ?? "—"}
          </p>
          {value === null ? (
            <p className="mt-1 text-xs font-medium text-slate-500">
              Data belum tersedia
            </p>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}

function RegionMapWorkspace({
  regions,
  selectedRegion,
  hoveredRegion,
  searchQuery,
  onSearchQueryChange,
  onHover,
  onSelect,
}: {
  regions: RegionData[];
  selectedRegion: RegionData | null;
  hoveredRegion: RegionData | null;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onHover: (regionId: string | null) => void;
  onSelect: (regionId: string | null) => void;
}) {
  const [zoom, setZoom] = useState(MAP_MAX_ZOOM);
  const [showLegend, setShowLegend] = useState(false);

  const filteredRegions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return [];
    }
    return regions.filter((region) =>
      region.name.toLowerCase().includes(normalizedQuery),
    );
  }, [regions, searchQuery]);

  const hoveredShape = hoveredRegion
    ? (regionMapShapes.find((shape) => shape.id === hoveredRegion.id) ?? null)
    : null;
  const visibleMapLeft = Math.max(
    0,
    (MAP_VIEWBOX_WIDTH - MAP_VIEWBOX_WIDTH / zoom) / 2,
  );
  const visibleMapTop = Math.max(
    0,
    (MAP_VIEWBOX_HEIGHT - MAP_VIEWBOX_HEIGHT / zoom) / 2,
  );
  const visibleMapRight = MAP_VIEWBOX_WIDTH - visibleMapLeft;
  const visibleMapBottom = MAP_VIEWBOX_HEIGHT - visibleMapTop;
  const tooltipX = hoveredShape
    ? Math.min(
        Math.max(
          hoveredShape.labelX + MAP_TOOLTIP_PADDING,
          visibleMapLeft + MAP_TOOLTIP_PADDING,
        ),
        visibleMapRight - MAP_TOOLTIP_WIDTH - MAP_TOOLTIP_PADDING,
      )
    : 0;
  const tooltipY = hoveredShape
    ? Math.min(
        Math.max(
          hoveredShape.labelY - MAP_TOOLTIP_HEIGHT - 2,
          visibleMapTop + MAP_TOOLTIP_PADDING,
        ),
        visibleMapBottom - MAP_TOOLTIP_HEIGHT - MAP_TOOLTIP_PADDING,
      )
    : 0;
  const isZoomInDisabled = zoom >= MAP_MAX_ZOOM;
  const isZoomOutDisabled = zoom <= MAP_MIN_ZOOM;

  const resetMap = () => {
    setZoom(MAP_MAX_ZOOM);
    onSelect(null);
    onHover(null);
    onSearchQueryChange("");
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34 }}
      className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
      aria-labelledby="map-title"
    >
      <div className="border-b border-slate-200 p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="map-title"
                className="text-lg font-extrabold tracking-tight text-[#102B4E]"
              >
                Peta Wilayah
              </h2>
              <Badge
                variant="outline"
                className="border-blue-100 bg-blue-50 text-blue-700"
              >
                {regions.length} wilayah
              </Badge>
            </div>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Pilih kabupaten/kota untuk melihat data.
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 lg:w-[360px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(event) => onSearchQueryChange(event.target.value)}
                placeholder="Cari kabupaten/kota"
                aria-label="Cari kabupaten/kota"
                className="h-11 rounded-lg pl-9"
              />
              {filteredRegions.length > 0 ? (
                <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                  {filteredRegions.map((region) => (
                    <button
                      key={region.id}
                      type="button"
                      className="flex min-h-11 w-full items-center justify-between gap-3 px-3 text-left text-sm font-semibold text-[#102B4E] hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                      onClick={() => {
                        onSelect(region.id);
                        onSearchQueryChange("");
                      }}
                    >
                      {region.name}
                      <span className="text-xs font-medium text-slate-500">
                        {region.type}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-lg"
                onClick={resetMap}
              >
                <RotateCcw className="h-4 w-4" />
                Reset peta
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-lg"
                onClick={() => setShowLegend((current) => !current)}
                aria-expanded={showLegend}
              >
                <Info className="h-4 w-4" />
                Legenda
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {showLegend ? (
          <div className="mt-3 flex flex-wrap gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm bg-blue-600" />
              Wilayah terpilih
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm bg-slate-300" />
              Area nonaktif
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm border-2 border-amber-400 bg-white" />
              Fokus keyboard
            </span>
          </div>
        ) : null}
      </div>

      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="relative min-h-[360px] overflow-hidden bg-sky-50 sm:min-h-[480px] xl:min-h-[620px]">
          <MapControls
            canZoomIn={!isZoomInDisabled}
            canZoomOut={!isZoomOutDisabled}
            onZoomIn={() =>
              setZoom((current) => Math.min(MAP_MAX_ZOOM, current + MAP_ZOOM_STEP))
            }
            onZoomOut={() =>
              setZoom((current) => Math.max(MAP_MIN_ZOOM, current - MAP_ZOOM_STEP))
            }
            onReset={resetMap}
          />

          <div
            aria-live="polite"
            className="sr-only"
          >
            {selectedRegion
              ? `${selectedRegion.name} dipilih.`
              : "Belum ada wilayah yang dipilih."}
          </div>

          <svg
            viewBox={`0 0 ${MAP_VIEWBOX_WIDTH} ${MAP_VIEWBOX_HEIGHT}`}
            role="img"
            aria-label="Peta interaktif wilayah Papua Barat Daya"
            className="absolute inset-x-0 top-7 h-auto w-full origin-center transition-transform duration-300 motion-reduce:transition-none sm:top-8 lg:top-14"
            style={{ transform: `scale(${zoom})` }}
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
                  dy="8"
                  stdDeviation="7"
                  floodColor="#1E3A8A"
                  floodOpacity="0.28"
                />
              </filter>
              <filter
                id="selectedGlow"
                x="-25%"
                y="-25%"
                width="150%"
                height="150%"
              >
                <feDropShadow
                  dx="0"
                  dy="0"
                  stdDeviation="4"
                  floodColor="#2563EB"
                  floodOpacity="0.42"
                />
              </filter>
            </defs>
            <rect x="0" y="0" width="640" height="430" fill={mapPalette.ocean} />
            <path
              d="M36 154 H610 M36 256 H610 M160 36 V394 M320 36 V394 M480 36 V394"
              fill="none"
              stroke={mapPalette.grid}
              strokeWidth="1"
              strokeDasharray="7 12"
              opacity="0.32"
            />
            <path
              d="M104 348 C172 310 238 366 318 334 C414 296 490 330 584 258"
              fill="none"
              stroke="#60A5FA"
              strokeWidth="2"
              strokeDasharray="8 10"
              opacity="0.4"
            />

            <g aria-hidden="true" pointerEvents="none">
              {regionMapBackgroundShapes.map((shape) => (
                <path
                  key={shape.id}
                  d={shape.d}
                  fill={mapPalette.land}
                  fillRule="evenodd"
                  clipRule="evenodd"
                  stroke={mapPalette.landStroke}
                  strokeWidth="1.1"
                  opacity="0.86"
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
              const dimmed = selectedRegion !== null && !selected && !hovered;

              return (
                <g key={shape.id}>
                  <motion.path
                    d={shape.d}
                    fillRule="evenodd"
                    clipRule="evenodd"
                    tabIndex={0}
                    role="button"
                    aria-label={`Pilih ${region.name}, ${region.type}`}
                    aria-pressed={selected}
                    onMouseEnter={() => onHover(region.id)}
                    onMouseLeave={() => onHover(null)}
                    onFocus={() => onHover(region.id)}
                    onBlur={() => onHover(null)}
                    onClick={() => onSelect(region.id)}
                    onKeyDown={(event: KeyboardEvent<SVGElement>) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onSelect(region.id);
                      }
                    }}
                    className="cursor-pointer outline-none transition-colors duration-150 focus-visible:stroke-amber-400 focus-visible:stroke-[4px]"
                    fill={getRegionFill(region.id, selected, hovered)}
                    stroke={selected ? "#1D4ED8" : hovered ? "#F8FAFC" : "#4B7359"}
                    strokeWidth={selected ? 3 : hovered ? 2.4 : 1.2}
                    filter={selected ? "url(#selectedGlow)" : undefined}
                    animate={{
                      opacity: selected ? 1 : dimmed ? 0.42 : hovered ? 0.98 : 0.78,
                      scale: selected ? 1.008 : 1,
                    }}
                    transition={{ duration: 0.2 }}
                  />
                </g>
              );
            })}

            <AnimatePresence>
              {hoveredRegion && hoveredShape ? (
                <motion.g
                  key={`${hoveredShape.id}-tooltip`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.14 }}
                  pointerEvents="none"
                  aria-hidden="true"
                >
                  <rect
                    x={tooltipX}
                    y={tooltipY}
                    width={MAP_TOOLTIP_WIDTH}
                    height={MAP_TOOLTIP_HEIGHT}
                    rx="8"
                    fill="#FFFFFF"
                    stroke="#D8E0EA"
                  />
                  <text
                    x={tooltipX + 12}
                    y={tooltipY + 24}
                    className="fill-slate-900 text-[12px] font-bold"
                  >
                    {hoveredRegion.shortName}
                  </text>
                  <text
                    x={tooltipX + 12}
                    y={tooltipY + 41}
                    className="fill-slate-500 text-[11px]"
                  >
                    {hoveredRegion.type} ·{" "}
                    {formatNumber(hoveredRegion.oap.jumlahJiwa)} jiwa
                  </text>
                  <text
                    x={tooltipX + 12}
                    y={tooltipY + 58}
                    className="fill-blue-700 text-[11px] font-semibold"
                  >
                    Klik untuk melihat detail.
                  </text>
                </motion.g>
              ) : null}
            </AnimatePresence>
          </svg>
        </div>

        <RegionListFallback
          regions={regions}
          selectedRegion={selectedRegion}
          onSelect={onSelect}
        />
      </div>
    </motion.section>
  );
}

function MapControls({
  canZoomIn,
  canZoomOut,
  onZoomIn,
  onZoomOut,
  onReset,
}: {
  canZoomIn: boolean;
  canZoomOut: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}) {
  return (
    <div className="absolute left-4 top-4 z-20 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <IconButton
        icon={ZoomIn}
        label="Perbesar peta"
        onClick={onZoomIn}
        disabled={!canZoomIn}
      />
      <div className="h-px bg-slate-200" />
      <IconButton
        icon={Minus}
        label="Perkecil peta"
        onClick={onZoomOut}
        disabled={!canZoomOut}
      />
      <div className="h-px bg-slate-200" />
      <IconButton icon={ListRestart} label="Reset tampilan peta" onClick={onReset} />
    </div>
  );
}

function RegionListFallback({
  regions,
  selectedRegion,
  onSelect,
}: {
  regions: RegionData[];
  selectedRegion: RegionData | null;
  onSelect: (regionId: string) => void;
}) {
  return (
    <div className="border-t border-slate-200 bg-white p-4 lg:border-l lg:border-t-0">
      <h3 className="text-sm font-extrabold text-[#102B4E]">
        Daftar wilayah
      </h3>
      <p className="mt-1 text-xs leading-5 text-slate-500">
        Alternatif navigasi selain peta.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
        {regions.map((region) => {
          const selected = selectedRegion?.id === region.id;
          return (
            <button
              key={region.id}
              type="button"
              onClick={() => onSelect(region.id)}
              aria-pressed={selected}
              className={cn(
                "min-h-11 rounded-lg border px-3 py-2 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600",
                selected
                  ? "border-blue-600 bg-blue-50 text-blue-800"
                  : "border-slate-200 text-slate-700 hover:bg-slate-50",
              )}
            >
              <span className="block font-bold">{region.shortName}</span>
              <span className="text-xs text-slate-500">{region.type}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RegionSummaryPanel({
  region,
  activeTab,
  tahunAnggaran,
  lastUpdatedLabel,
  onTabChange,
}: {
  region: RegionData;
  activeTab: RegionTab;
  tahunAnggaran: string;
  lastUpdatedLabel: string;
  onTabChange: (tab: RegionTab) => void;
}) {
  return (
    <motion.aside
      initial={{ opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm xl:sticky xl:top-24 xl:self-start"
    >
      <div className="bg-[#173A63] p-5 text-white">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Badge className="bg-white/12 text-white ring-1 ring-white/20">
              {region.type}
            </Badge>
            <h2 className="mt-3 break-words text-2xl font-extrabold tracking-tight">
              {region.shortName}
            </h2>
            <p className="mt-1 text-sm text-white/75">{region.name}</p>
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/10 text-amber-300">
            <MapPin className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-3 gap-2">
          <HeaderMetric
            label="Penduduk"
            value={formatNumber(region.oap.jumlahJiwa)}
            description="jiwa"
          />
          <HeaderMetric
            label="OAP"
            value={formatNumber(region.oap.jumlahOap)}
            description="jiwa"
          />
          <HeaderMetric
            label="Luas"
            value={formatArea(region.oap.luasWilayah)}
            description="wilayah"
          />
        </div>

        <DatasetTabs activeTab={activeTab} onTabChange={onTabChange} />

        <AnimatePresence mode="wait">
          <motion.div
            key={`${region.id}-${activeTab}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="mt-4"
          >
            <DatasetContent
              region={region}
              activeTab={activeTab}
              tahunAnggaran={tahunAnggaran}
            />
          </motion.div>
        </AnimatePresence>

        <DataSourceMeta
          activeTab={activeTab}
          tahunAnggaran={tahunAnggaran}
          lastUpdatedLabel={lastUpdatedLabel}
          compact
          className="mt-4"
        />
      </div>
    </motion.aside>
  );
}

function HeaderMetric({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-extrabold text-[#102B4E] sm:text-base">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </div>
  );
}

function DatasetTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: RegionTab;
  onTabChange: (tab: RegionTab) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Pilih dataset wilayah"
      className="mt-4 flex snap-x gap-2 overflow-x-auto rounded-lg bg-slate-100 p-1.5"
    >
      {(Object.keys(tabLabels) as RegionTab[]).map((tab) => {
        const Icon = tabIcons[tab];
        const selected = activeTab === tab;
        return (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-label={tabLabels[tab]}
            onClick={() => onTabChange(tab)}
            className={cn(
              "flex min-h-11 shrink-0 snap-start items-center gap-2 rounded-md px-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600",
              selected
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-600 hover:bg-white/70 hover:text-[#102B4E]",
            )}
          >
            <Icon className="h-4 w-4" />
            {shortTabLabels[tab]}
          </button>
        );
      })}
    </div>
  );
}

function DatasetContent({
  region,
  activeTab,
  tahunAnggaran,
}: {
  region: RegionData;
  activeTab: RegionTab;
  tahunAnggaran: string;
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
      return (
        <DatasetEmptyState
          title="Data IDM Desa belum tersedia"
          description={`Data IDM Desa untuk ${region.name} pada periode ${tahunAnggaran || "-"} belum dipublikasikan.`}
          region={region}
          tahunAnggaran={tahunAnggaran}
        />
      );
    }

    return (
      <DataGroup
        values={values}
        unit="kampung"
        items={[
          { icon: Home, label: "Sangat Tertinggal", description: "Status IDM desa", value: region.idm.sangatTertinggal },
          { icon: Home, label: "Tertinggal", description: "Status IDM desa", value: region.idm.tertinggal },
          { icon: Home, label: "Berkembang", description: "Status IDM desa", value: region.idm.berkembang },
          { icon: Home, label: "Maju", description: "Status IDM desa", value: region.idm.maju },
          { icon: Home, label: "Mandiri", description: "Status IDM desa", value: region.idm.mandiri },
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
          { icon: IdCard, label: "Penerbitan KK", description: "Kepala keluarga", value: region.registration.penerbitanKk },
          { icon: FileText, label: "Perubahan KK", description: "Perubahan data", value: region.registration.perubahanKk },
          { icon: Baby, label: "Kartu Identitas Anak", description: "Penduduk 0-17 tahun", value: region.registration.kia },
          { icon: Fingerprint, label: "Penerbitan NIK WNI", description: "Nomor induk kependudukan", value: region.registration.nikWni },
          { icon: Fingerprint, label: "Perekaman KTP-el", description: "KTP elektronik", value: region.registration.perekamanKtpEl },
          { icon: IdCard, label: "Pencetakan KTP-el", description: "KTP elektronik", value: region.registration.pencetakanKtpEl },
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
          { icon: MapPin, label: "Luas Wilayah", description: "Total area administrasi", value: region.oap.luasWilayah, formatted: formatArea(region.oap.luasWilayah), hidePercent: true },
          { icon: ShieldCheck, label: "Jumlah OAP", description: "Penduduk Orang Asli Papua", value: region.oap.jumlahOap },
          { icon: Users, label: "Jumlah Non-OAP", description: "Penduduk non OAP", value: region.oap.jumlahNonOap },
          { icon: Users, label: "Jumlah Jiwa", description: "Total penduduk", value: region.oap.jumlahJiwa },
        ]}
      />
    );
  }

  if (activeTab === "bumdes") {
    const values = [
      region.bumdes.jumlah,
      region.bumdes.aktif,
      region.bumdes.tidakAktif,
      region.bumdes.bersama,
    ];
    const total = getTotalBumdes(region.bumdes);

    if (total === 0 && values.every((value) => value === 0)) {
      return (
        <DatasetEmptyState
          title="Data BUMDes/BUMKam belum tersedia"
          description={`Data BUMDes/BUMKam dari SIBUM Kampung untuk ${region.name} pada periode ${tahunAnggaran || "-"} belum dipublikasikan.`}
          region={region}
          tahunAnggaran={tahunAnggaran}
        />
      );
    }

    return (
      <DataGroup
        values={values}
        items={[
          { icon: Building2, label: "Jumlah BUMDes/BUMKam", description: "Total terdata di SIBUM", value: region.bumdes.jumlah },
          { icon: BadgeCheck, label: "Terverifikasi", description: "Nama/dokumen terverifikasi", value: region.bumdes.aktif },
          { icon: Building2, label: "Perlu Perbaikan", description: "Dokumen atau nama perlu perbaikan", value: region.bumdes.tidakAktif },
          { icon: Building2, label: "BUMKam Bersama", description: "Lintas kampung", value: region.bumdes.bersama },
        ]}
      />
    );
  }

  if (activeTab === "civil") {
    const values = Object.values(region.civil);
    return (
      <DataGroup
        values={values}
        items={[
          { icon: FileCheck2, label: "Akta Kelahiran", description: "Dokumen kelahiran", value: region.civil.aktaKelahiran },
          { icon: FileCheck2, label: "Akta Kematian", description: "Dokumen kematian", value: region.civil.aktaKematian },
          { icon: FileCheck2, label: "Akta Perkawinan", description: "Dokumen perkawinan", value: region.civil.aktaPerkawinan },
          { icon: FileCheck2, label: "Akta Perceraian", description: "Dokumen perceraian", value: region.civil.aktaPerceraian },
        ]}
      />
    );
  }

  return (
    <DatasetEmptyState
      title="Data belum tersedia"
      description="Dataset yang dipilih belum tersedia."
      region={region}
      tahunAnggaran={tahunAnggaran}
    />
  );
}

function DataGroup({
  items,
  values,
  unit,
}: {
  items: Array<{
    icon: ElementType;
    label: string;
    description: string;
    value: number;
    formatted?: string;
    hidePercent?: boolean;
  }>;
  values: number[];
  unit?: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      {items.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.025, duration: 0.18 }}
          className="border-b border-slate-200 last:border-b-0"
        >
          <DataMetricRow
            {...item}
            unit={unit}
            colorClass={metricColors[index % metricColors.length]}
            percent={getBarPercent(item.value, values)}
          />
        </motion.div>
      ))}
    </div>
  );
}

function DataMetricRow({
  icon: Icon,
  label,
  description,
  value,
  formatted,
  percent,
  colorClass,
  unit,
  hidePercent,
}: {
  icon: ElementType;
  label: string;
  description: string;
  value: number;
  formatted?: string;
  percent: number;
  colorClass: string;
  unit?: string;
  hidePercent?: boolean;
}) {
  const valueLabel = formatted ?? `${formatNumber(value)}${unit ? ` ${unit}` : ""}`;

  return (
    <div className="grid gap-3 bg-white p-4 sm:grid-cols-[44px_minmax(0,1fr)_minmax(96px,auto)] sm:items-center">
      <div
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-lg",
          colorClass,
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-4 sm:hidden">
          <div>
            <h3 className="font-extrabold text-[#102B4E]">{label}</h3>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </div>
          <div className="text-right">
            <p className="font-extrabold text-[#102B4E]">{valueLabel}</p>
            {!hidePercent ? (
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {Math.round(percent)}%
              </p>
            ) : null}
          </div>
        </div>
        <div className="hidden sm:block">
          <h3 className="font-extrabold text-[#102B4E]">{label}</h3>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        {!hidePercent ? (
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.42, ease: "easeOut" }}
              className="h-full rounded-full bg-blue-600"
            />
          </div>
        ) : null}
      </div>
      <div className="hidden text-right sm:block">
        <p className="break-words text-base font-extrabold text-[#102B4E]">
          {valueLabel}
        </p>
        {!hidePercent ? (
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {Math.round(percent)}%
          </p>
        ) : null}
      </div>
    </div>
  );
}

function DatasetEmptyState({
  title,
  description,
  region,
  tahunAnggaran,
}: {
  title: string;
  description: string;
  region: RegionData;
  tahunAnggaran: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5">
      <div className="flex gap-3">
        <Database className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
        <div>
          <h3 className="font-extrabold text-[#102B4E]">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          <dl className="mt-3 grid gap-2 text-xs text-slate-500">
            <div className="flex justify-between gap-3">
              <dt>Wilayah</dt>
              <dd className="font-semibold text-slate-700">{region.name}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Periode</dt>
              <dd className="font-semibold text-slate-700">
                {tahunAnggaran || "Belum dipilih"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Status</dt>
              <dd className="font-semibold text-slate-700">
                Data belum tersedia
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

function DataSourceMeta({
  activeTab,
  tahunAnggaran,
  lastUpdatedLabel,
  compact = false,
  className,
}: {
  activeTab: RegionTab;
  tahunAnggaran: string;
  lastUpdatedLabel: string;
  compact?: boolean;
  className?: string;
}) {
  const meta = datasetSources[activeTab];

  return (
    <div
      className={cn(
        "rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs leading-5 text-slate-600",
        compact ? "bg-slate-50" : null,
        className,
      )}
    >
      <p>
        <span className="font-bold text-slate-700">Sumber:</span> {meta.source}
      </p>
      <p>
        <span className="font-bold text-slate-700">Periode data:</span>{" "}
        {tahunAnggaran || "Belum dipilih"} ·{" "}
        <span className="font-bold text-slate-700">Diperbarui:</span>{" "}
        {lastUpdatedLabel}
      </p>
      <p className="mt-1 text-slate-500">{meta.definition}</p>
    </div>
  );
}

function EmptySelectionPanel({
  regions,
  onSelect,
}: {
  regions: RegionData[];
  onSelect: (regionId: string) => void;
}) {
  return (
    <motion.aside
      initial={{ opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className="rounded-lg border border-dashed border-slate-300 bg-white p-5 shadow-sm xl:sticky xl:top-24 xl:self-start"
    >
      <div className="flex gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50">
          <MapPin className="h-5 w-5 text-blue-700" />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-[#102B4E]">
            Pilih Wilayah
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Klik wilayah pada peta atau pilih dari daftar untuk membuka detail
            statistik kabupaten/kota.
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-2">
        {regions.map((region) => (
          <button
            key={region.id}
            type="button"
            onClick={() => onSelect(region.id)}
            className="min-h-11 rounded-lg border border-slate-200 px-3 py-2 text-left text-sm font-semibold text-[#102B4E] hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            {region.name}
          </button>
        ))}
      </div>
    </motion.aside>
  );
}

function IconButton({
  icon: Icon,
  label,
  className,
  disabled = false,
  onClick,
}: {
  icon: ElementType;
  label: string;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      disabled={disabled}
      className={cn(
        "h-11 w-11 rounded-none text-[#173A63] disabled:pointer-events-none disabled:text-slate-300",
        className,
      )}
      onClick={onClick}
    >
      <Icon className="h-5 w-5" />
    </Button>
  );
}
