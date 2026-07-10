"use client";

import {
  useEffect,
  useMemo,
  useState,
  type PointerEvent,
  type WheelEvent,
} from "react";
import {
  Database,
  FileJson,
  MousePointer2,
  RefreshCw,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import { Breadcrumb } from "@/components/website/breadcrumb";
import { ContentContainer } from "@/components/website/content-container";
import { PageHeader } from "@/components/website/page-header";
import { ErrorState, LoadingState } from "@/components/website/state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ADM2_GEOJSON_PUBLIC_URL =
  "/administrasi_kab_kota_prov_pbd_2025_pol.geojson";
const ROAD_GEOJSON_PUBLIC_URL = "/Jaringan%20Jalan%20Kota%20Sorong.geojson";
const UTM_ZONE_52S_EPSG = "EPSG::32752";

const MAP_WIDTH = 960;
const MAP_HEIGHT = 620;
const MAP_PADDING = 32;
const MIN_MAP_SCALE = 1;
const MAX_MAP_SCALE = 12;
const DEFAULT_MAP_VIEW = { scale: 1, x: 0, y: 0 };

const PBD_ADM2_NAMES = new Set([
  "sorong",
  "kota sorong",
  "raja ampat",
  "sorong selatan",
  "mayrat",
  "maybrat",
  "tambrauw",
]);

type GeoJsonPosition = number[];

type GeoJsonGeometry = {
  type: string;
  coordinates: unknown;
};

type GeoJsonFeature = {
  type: "Feature";
  properties?: Record<string, unknown>;
  geometry?: GeoJsonGeometry | null;
};

type GeoJsonFeatureCollection = {
  type: "FeatureCollection";
  crs?: {
    properties?: {
      name?: string;
    };
  };
  features: GeoJsonFeature[];
};

type MapGeoJsonData = {
  adm2: GeoJsonFeatureCollection;
  roads: GeoJsonFeatureCollection;
};

type IndexedFeature = {
  feature: GeoJsonFeature;
  index: number;
};

type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

type RenderedFeature = {
  id: string;
  name: string;
  path: string;
  feature: GeoJsonFeature;
  index: number;
};

type MapView = typeof DEFAULT_MAP_VIEW;

type MapDragState = {
  pointerId: number;
  startX: number;
  startY: number;
  viewX: number;
  viewY: number;
};

export default function GeoJsonMapPage() {
  const [data, setData] = useState<MapGeoJsonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mapView, setMapView] = useState<MapView>(DEFAULT_MAP_VIEW);
  const [dragState, setDragState] = useState<MapDragState | null>(null);
  const [mapDragged, setMapDragged] = useState(false);

  const loadGeoJson = async () => {
    await Promise.resolve();
    setLoading(true);
    setError("");

    try {
      const result = await fetchMapGeoJson();
      setData(result);
      setSelectedIndex(null);
      setHoveredIndex(null);
      setMapView(DEFAULT_MAP_VIEW);
      setDragState(null);
      setMapDragged(false);
    } catch (loadError) {
      console.error(loadError);
      setData(null);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "GeoJSON gagal dimuat.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadInitialGeoJson = async () => {
      try {
        const result = await fetchMapGeoJson();

        if (mounted) {
          setData(result);
          setSelectedIndex(null);
          setHoveredIndex(null);
          setMapView(DEFAULT_MAP_VIEW);
          setDragState(null);
          setMapDragged(false);
          setError("");
        }
      } catch (loadError) {
        console.error(loadError);

        if (mounted) {
          setData(null);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "GeoJSON gagal dimuat.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadInitialGeoJson();

    return () => {
      mounted = false;
    };
  }, []);

  const pbdBaseFeatures = useMemo<IndexedFeature[]>(() => {
    if (!data?.adm2.features?.length) {
      return [];
    }

    return data.adm2.features
      .map((feature, index) => ({ feature, index }))
      .filter(
        ({ feature }) =>
          isPolygonGeometry(feature.geometry) && isPapuaBaratDayaFeature(feature),
      );
  }, [data]);

  const kotaSorongFeatures = useMemo(
    () =>
      pbdBaseFeatures.filter(({ feature }) => isKotaSorongFeature(feature)),
    [pbdBaseFeatures],
  );

  const roadFeatures = useMemo<IndexedFeature[]>(() => {
    if (!data?.roads.features?.length) {
      return [];
    }

    return data.roads.features
      .map((feature, index) => ({ feature, index }))
      .filter(
        ({ feature }) =>
          isLineGeometry(feature.geometry) && isRoadFeature(feature),
      );
  }, [data]);

  const mapBounds = useMemo(() => {
    if (pbdBaseFeatures.length > 0) {
      return featureBounds(pbdBaseFeatures);
    }

    if (roadFeatures.length > 0) {
      return featureBounds(roadFeatures);
    }

    return null;
  }, [pbdBaseFeatures, roadFeatures]);

  const renderedPbdBaseFeatures = useMemo<RenderedFeature[]>(() => {
    if (!mapBounds || pbdBaseFeatures.length === 0) {
      return [];
    }

    return renderFeatures(pbdBaseFeatures, mapBounds);
  }, [pbdBaseFeatures, mapBounds]);

  const renderedKotaSorongFeatures = useMemo<RenderedFeature[]>(() => {
    if (!mapBounds || kotaSorongFeatures.length === 0) {
      return [];
    }

    return renderFeatures(kotaSorongFeatures, mapBounds);
  }, [kotaSorongFeatures, mapBounds]);

  const renderedRoadFeatures = useMemo<RenderedFeature[]>(() => {
    if (!mapBounds || roadFeatures.length === 0) {
      return [];
    }

    return renderFeatures(roadFeatures, mapBounds);
  }, [roadFeatures, mapBounds]);

  const selectedFeature =
    renderedRoadFeatures.find((feature) => feature.index === selectedIndex) ??
    renderedRoadFeatures.find((feature) => feature.index === hoveredIndex) ??
    renderedRoadFeatures[0] ??
    null;

  const zoomMap = (scaleDelta: number) => {
    setMapView((currentView) =>
      zoomMapView(currentView, currentView.scale * scaleDelta, {
        x: MAP_WIDTH / 2,
        y: MAP_HEIGHT / 2,
      }),
    );
  };

  const resetMapView = () => {
    setMapView(DEFAULT_MAP_VIEW);
    setDragState(null);
    setMapDragged(false);
  };

  const handleMapWheel = (event: WheelEvent<SVGSVGElement>) => {
    event.preventDefault();

    const center = svgPointFromPointerEvent(event);
    const scaleDelta = event.deltaY > 0 ? 0.86 : 1.16;

    setMapView((currentView) =>
      zoomMapView(currentView, currentView.scale * scaleDelta, center),
    );
  };

  const handleMapPointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if (event.button !== 0) {
      return;
    }

    const startPoint = svgPointFromPointerEvent(event);

    event.currentTarget.setPointerCapture(event.pointerId);
    setDragState({
      pointerId: event.pointerId,
      startX: startPoint.x,
      startY: startPoint.y,
      viewX: mapView.x,
      viewY: mapView.y,
    });
    setMapDragged(false);
  };

  const handleMapPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (!dragState || event.pointerId !== dragState.pointerId) {
      return;
    }

    const point = svgPointFromPointerEvent(event);
    const nextX = dragState.viewX + point.x - dragState.startX;
    const nextY = dragState.viewY + point.y - dragState.startY;

    if (
      Math.abs(point.x - dragState.startX) > 2 ||
      Math.abs(point.y - dragState.startY) > 2
    ) {
      setMapDragged(true);
    }

    setMapView((currentView) => ({
      ...currentView,
      x: nextX,
      y: nextY,
    }));
  };

  const handleMapPointerEnd = (event: PointerEvent<SVGSVGElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setDragState(null);
  };

  return (
    <main className="min-h-screen bg-pbd-bg">
      <Breadcrumb items={[{ label: "Peta GeoJSON" }]} />
      <PageHeader
        icon={FileJson}
        eyebrow="GeoJSON"
        title="Jaringan Jalan Kota Sorong"
        description="Render Papua Barat Daya sebagai base layer paling bawah, batas Kota Sorong sebagai highlight, lalu jaringan jalan Kota Sorong di atasnya."
      />

      <ContentContainer className="py-10 md:py-14">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-bold text-pbd-navy">Renderer GeoJSON</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {loading
                    ? "Memuat data geometri..."
                    : `${renderedRoadFeatures.length} ruas jalan ditampilkan di atas ${renderedPbdBaseFeatures.length} wilayah Papua Barat Daya.`}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  disabled={loading}
                  onClick={() => void loadGeoJson()}
                >
                  <RefreshCw
                    className={cn("h-4 w-4", loading && "animate-spin")}
                  />
                  Muat Ulang
                </Button>
              </div>
            </div>

            <div className="p-4">
              {error ? <ErrorState message={error} /> : null}

              {loading ? (
                <LoadingState rows={5} />
              ) : renderedPbdBaseFeatures.length > 0 ||
                renderedRoadFeatures.length > 0 ? (
                <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-[#e2f4fb]">
                  <div className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-lg border border-slate-200 bg-white/95 p-1 shadow-sm">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Perbesar peta"
                      title="Perbesar peta"
                      onClick={() => zoomMap(1.35)}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Perkecil peta"
                      title="Perkecil peta"
                      onClick={() => zoomMap(1 / 1.35)}
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Reset zoom peta"
                      title="Reset zoom peta"
                      onClick={resetMapView}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <span className="min-w-12 px-2 text-center text-xs font-bold text-slate-600">
                      {Math.round(mapView.scale * 100)}%
                    </span>
                  </div>

                  <svg
                    viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
                    role="img"
                    aria-label="Peta jaringan jalan Kota Sorong"
                    className={cn(
                      "h-auto w-full touch-none select-none",
                      dragState ? "cursor-grabbing" : "cursor-grab",
                    )}
                    onWheel={handleMapWheel}
                    onPointerDown={handleMapPointerDown}
                    onPointerMove={handleMapPointerMove}
                    onPointerUp={handleMapPointerEnd}
                    onPointerCancel={handleMapPointerEnd}
                    onPointerLeave={handleMapPointerEnd}
                  >
                    <rect
                      width={MAP_WIDTH}
                      height={MAP_HEIGHT}
                      fill="#d8f1fb"
                    />

                    <g
                      transform={`translate(${mapView.x.toFixed(2)} ${mapView.y.toFixed(2)}) scale(${mapView.scale.toFixed(4)})`}
                    >
                      <path
                        d="M64 120 H896 M64 260 H896 M64 400 H896 M64 540 H896 M180 54 V566 M360 54 V566 M540 54 V566 M720 54 V566"
                        fill="none"
                        stroke="#7bbdd9"
                        strokeDasharray="8 12"
                        strokeWidth="1"
                        opacity="0.5"
                      />

                      {renderedPbdBaseFeatures.map((feature) => (
                        <path
                          key={`pbd-base-${feature.id}`}
                          d={feature.path}
                          fill="#dcfce7"
                          stroke="#86a88b"
                          strokeWidth="1.2"
                          vectorEffect="non-scaling-stroke"
                        />
                      ))}

                      {renderedKotaSorongFeatures.map((feature) => (
                        <path
                          key={`kota-sorong-${feature.id}`}
                          d={feature.path}
                          fill="#dbeafe"
                          stroke="#0f766e"
                          strokeWidth="2.4"
                          vectorEffect="non-scaling-stroke"
                        />
                      ))}

                      {renderedRoadFeatures.map((feature) => {
                        const selected = selectedIndex === feature.index;
                        const hovered = hoveredIndex === feature.index;

                        return (
                          <path
                            key={feature.id}
                            d={feature.path}
                            fill="none"
                            stroke={
                              selected
                                ? "#f97316"
                                : hovered
                                  ? "#0f172a"
                                  : roadStroke(feature.feature)
                            }
                            strokeWidth={selected ? 4 : hovered ? 3 : 1.4}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            vectorEffect="non-scaling-stroke"
                            className="cursor-pointer transition-colors outline-none focus-visible:stroke-pbd-gold focus-visible:stroke-[3px]"
                            tabIndex={0}
                            role="button"
                            aria-label={`Pilih ${feature.name}`}
                            onMouseEnter={() => setHoveredIndex(feature.index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            onFocus={() => setHoveredIndex(feature.index)}
                            onBlur={() => setHoveredIndex(null)}
                            onClick={() => {
                              if (mapDragged) {
                                setMapDragged(false);
                                return;
                              }

                              setSelectedIndex(feature.index);
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                setSelectedIndex(feature.index);
                              }
                            }}
                          />
                        );
                      })}
                    </g>
                  </svg>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm font-medium text-slate-500">
                  Tidak ada base map Papua Barat Daya atau geometri jalan yang
                  bisa dirender.
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-4">
            <InfoPanel
              title="Sumber Data"
              icon={Database}
              rows={[
                ["Base map", "Papua Barat Daya"],
                ["Fitur ADM2", String(data?.adm2.features.length ?? 0)],
                ["Fitur PBD", String(pbdBaseFeatures.length)],
                ["Fitur Kota Sorong", String(kotaSorongFeatures.length)],
                ["Fitur jalan", String(data?.roads.features.length ?? 0)],
                ["Ruas jalan", String(roadFeatures.length)],
                ["Path ADM2", ADM2_GEOJSON_PUBLIC_URL],
                ["Path jalan", ROAD_GEOJSON_PUBLIC_URL],
              ]}
            />

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-pbd-blue">
                  <MousePointer2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-bold text-pbd-navy">
                    Ruas Jalan Terpilih
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Klik garis jalan untuk melihat properti GeoJSON.
                  </p>
                </div>
              </div>

              {selectedFeature ? (
                <div className="mt-5">
                  <p className="text-lg font-extrabold text-pbd-navy">
                    {selectedFeature.name}
                  </p>
                  <dl className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-200">
                    {propertyEntries(selectedFeature.feature).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="grid gap-1 px-3 py-2 text-sm sm:grid-cols-[120px_minmax(0,1fr)]"
                        >
                          <dt className="font-semibold text-slate-500">
                            {key}
                          </dt>
                          <dd className="break-words text-slate-800">
                            {formatPropertyValue(value)}
                          </dd>
                        </div>
                      ),
                    )}
                  </dl>
                </div>
              ) : (
                <p className="mt-5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  Belum ada ruas jalan yang dipilih.
                </p>
              )}
            </section>
          </aside>
        </div>
      </ContentContainer>
    </main>
  );
}

async function fetchMapGeoJson() {
  const [adm2, roads] = await Promise.all([
    fetchGeoJson(ADM2_GEOJSON_PUBLIC_URL),
    fetchGeoJson(ROAD_GEOJSON_PUBLIC_URL),
  ]);

  return { adm2, roads };
}

async function fetchGeoJson(url: string) {
  try {
    const response = await fetch(url, { cache: "force-cache" });

    if (!response.ok) {
      throw new Error(`GeoJSON gagal dimuat dari ${url}.`);
    }

    const parsed = (await response.json()) as GeoJsonFeatureCollection;

    if (
      parsed.type !== "FeatureCollection" ||
      !Array.isArray(parsed.features)
    ) {
      throw new Error("Format GeoJSON tidak valid.");
    }

    return normalizeGeoJsonCrs(parsed);
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "GeoJSON gagal dimuat.",
    );
  }
}

function normalizeGeoJsonCrs(geoJson: GeoJsonFeatureCollection) {
  const crsName = geoJson.crs?.properties?.name ?? "";

  if (!crsName.includes(UTM_ZONE_52S_EPSG)) {
    return geoJson;
  }

  return {
    ...geoJson,
    crs: {
      properties: {
        name: "urn:ogc:def:crs:OGC:1.3:CRS84",
      },
    },
    features: geoJson.features.map((feature) => ({
      ...feature,
      geometry: feature.geometry
        ? {
            ...feature.geometry,
            coordinates: transformCoordinates(
              feature.geometry.coordinates,
              utmZone52SToLonLat,
            ),
          }
        : feature.geometry,
    })),
  };
}

function transformCoordinates(
  value: unknown,
  transform: (position: GeoJsonPosition) => GeoJsonPosition,
): unknown {
  if (isPosition(value)) {
    return transform(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => transformCoordinates(item, transform));
  }

  return value;
}

function utmZone52SToLonLat(position: GeoJsonPosition): GeoJsonPosition {
  const [easting, northing, ...rest] = position;
  const semiMajorAxis = 6378137;
  const eccentricitySquared = 0.00669438;
  const scaleFactor = 0.9996;
  const longitudeOrigin = 129;
  const x = easting - 500000;
  const y = northing - 10000000;
  const eccentricityPrimeSquared =
    eccentricitySquared / (1 - eccentricitySquared);
  const meridionalArc = y / scaleFactor;
  const mu =
    meridionalArc /
    (semiMajorAxis *
      (1 -
        eccentricitySquared / 4 -
        (3 * eccentricitySquared ** 2) / 64 -
        (5 * eccentricitySquared ** 3) / 256));
  const e1 =
    (1 - Math.sqrt(1 - eccentricitySquared)) /
    (1 + Math.sqrt(1 - eccentricitySquared));
  const phi1Rad =
    mu +
    ((3 * e1) / 2 - (27 * e1 ** 3) / 32) * Math.sin(2 * mu) +
    ((21 * e1 ** 2) / 16 - (55 * e1 ** 4) / 32) * Math.sin(4 * mu) +
    ((151 * e1 ** 3) / 96) * Math.sin(6 * mu) +
    ((1097 * e1 ** 4) / 512) * Math.sin(8 * mu);
  const sinPhi1 = Math.sin(phi1Rad);
  const cosPhi1 = Math.cos(phi1Rad);
  const tanPhi1 = Math.tan(phi1Rad);
  const n1 =
    semiMajorAxis /
    Math.sqrt(1 - eccentricitySquared * sinPhi1 * sinPhi1);
  const t1 = tanPhi1 * tanPhi1;
  const c1 = eccentricityPrimeSquared * cosPhi1 * cosPhi1;
  const r1 =
    (semiMajorAxis * (1 - eccentricitySquared)) /
    (1 - eccentricitySquared * sinPhi1 * sinPhi1) ** 1.5;
  const d = x / (n1 * scaleFactor);
  const latitudeRad =
    phi1Rad -
    ((n1 * tanPhi1) / r1) *
      (d ** 2 / 2 -
        ((5 + 3 * t1 + 10 * c1 - 4 * c1 ** 2 - 9 * eccentricityPrimeSquared) *
          d ** 4) /
          24 +
        ((61 +
          90 * t1 +
          298 * c1 +
          45 * t1 ** 2 -
          252 * eccentricityPrimeSquared -
          3 * c1 ** 2) *
          d ** 6) /
          720);
  const longitude =
    longitudeOrigin +
    ((d -
      ((1 + 2 * t1 + c1) * d ** 3) / 6 +
      ((5 -
        2 * c1 +
        28 * t1 -
        3 * c1 ** 2 +
        8 * eccentricityPrimeSquared +
        24 * t1 ** 2) *
        d ** 5) /
        120) /
      cosPhi1) *
      (180 / Math.PI);
  const latitude = latitudeRad * (180 / Math.PI);

  return [longitude, latitude, ...rest];
}

function renderFeatures(features: IndexedFeature[], bounds: Bounds) {
  return features
    .map(({ feature, index }) => {
      const path = geometryToSvgPath(feature.geometry, bounds);

      if (!path) {
        return null;
      }

      return {
        id: getFeatureId(feature, index),
        name: getFeatureName(feature),
        path,
        feature,
        index,
      };
    })
    .filter((feature): feature is RenderedFeature => Boolean(feature));
}

function svgPointFromPointerEvent(
  event: PointerEvent<SVGSVGElement> | WheelEvent<SVGSVGElement>,
) {
  const rect = event.currentTarget.getBoundingClientRect();

  return {
    x: ((event.clientX - rect.left) / rect.width) * MAP_WIDTH,
    y: ((event.clientY - rect.top) / rect.height) * MAP_HEIGHT,
  };
}

function zoomMapView(
  currentView: MapView,
  nextScaleValue: number,
  center: { x: number; y: number },
) {
  const nextScale = clamp(nextScaleValue, MIN_MAP_SCALE, MAX_MAP_SCALE);

  return {
    scale: nextScale,
    x: center.x - ((center.x - currentView.x) / currentView.scale) * nextScale,
    y: center.y - ((center.y - currentView.y) / currentView.scale) * nextScale,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function isPolygonGeometry(geometry?: GeoJsonGeometry | null) {
  return geometry?.type === "Polygon" || geometry?.type === "MultiPolygon";
}

function isLineGeometry(geometry?: GeoJsonGeometry | null) {
  return geometry?.type === "LineString" || geometry?.type === "MultiLineString";
}

function isKotaSorongFeature(feature: GeoJsonFeature) {
  return normalizedRegionName(feature) === "kota sorong";
}

function isPapuaBaratDayaFeature(feature: GeoJsonFeature) {
  const properties = feature.properties ?? {};
  const province = formatPropertyValue(properties.PROV).toLowerCase();
  const code = formatPropertyValue(properties.KODE_WIL);

  return (
    province === "papua barat daya" ||
    code.startsWith("96.") ||
    PBD_ADM2_NAMES.has(normalizedRegionName(feature))
  );
}

function isRoadFeature(feature: GeoJsonFeature) {
  const properties = feature.properties ?? {};
  const value = `${formatPropertyValue(properties.NAMOBJ)} ${formatPropertyValue(
    properties.REMARK,
  )}`;

  return value.toLowerCase().includes("jalan");
}

function normalizedFeatureName(feature: GeoJsonFeature) {
  return getFeatureName(feature).toLowerCase().replace(/\s+/g, " ").trim();
}

function normalizedRegionName(feature: GeoJsonFeature) {
  return normalizedFeatureName(feature)
    .replace(/^(kab\.?|kabupaten)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getFeatureName(feature: GeoJsonFeature) {
  const properties = feature.properties ?? {};
  const value =
    properties.REMARK ??
    properties.NAMOBJ ??
    properties.KAB_KOTA ??
    properties.shapeName ??
    properties.shapeNameLong ??
    properties.NAME_2 ??
    properties.NAME ??
    properties.name;

  return typeof value === "string" && value.trim()
    ? value.trim()
    : "Ruas jalan";
}

function getFeatureId(feature: GeoJsonFeature, index: number) {
  const properties = feature.properties ?? {};
  const value =
    properties.OBJECTID ??
    properties.shapeID ??
    properties.shapeISO ??
    properties.shapeName;

  if (typeof value === "string" && value.trim()) {
    return `${value}-${index}`;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return `${value}-${index}`;
  }

  return `feature-${index}`;
}

function featureBounds(features: IndexedFeature[]): Bounds {
  const bounds: Bounds = {
    minX: Number.POSITIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY,
  };

  for (const { feature } of features) {
    forEachPosition(feature.geometry?.coordinates, (position) => {
      const [longitude, latitude] = position;

      if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
        return;
      }

      bounds.minX = Math.min(bounds.minX, longitude);
      bounds.minY = Math.min(bounds.minY, latitude);
      bounds.maxX = Math.max(bounds.maxX, longitude);
      bounds.maxY = Math.max(bounds.maxY, latitude);
    });
  }

  if (
    !Number.isFinite(bounds.minX) ||
    !Number.isFinite(bounds.minY) ||
    !Number.isFinite(bounds.maxX) ||
    !Number.isFinite(bounds.maxY)
  ) {
    return { minX: 94, minY: -11, maxX: 142, maxY: 6 };
  }

  if (bounds.maxX - bounds.minX < 0.01) {
    bounds.minX -= 0.01;
    bounds.maxX += 0.01;
  }
  if (bounds.maxY - bounds.minY < 0.01) {
    bounds.minY -= 0.01;
    bounds.maxY += 0.01;
  }

  return bounds;
}

function geometryToSvgPath(
  geometry: GeoJsonGeometry | null | undefined,
  bounds: Bounds,
) {
  if (!geometry) {
    return "";
  }

  if (geometry.type === "LineString") {
    return lineToPath(geometry.coordinates, bounds);
  }

  if (
    geometry.type === "MultiLineString" &&
    Array.isArray(geometry.coordinates)
  ) {
    return geometry.coordinates
      .map((line) => lineToPath(line, bounds))
      .filter(Boolean)
      .join(" ");
  }

  if (geometry.type === "Polygon") {
    return polygonToPath(geometry.coordinates, bounds);
  }

  if (geometry.type === "MultiPolygon" && Array.isArray(geometry.coordinates)) {
    return geometry.coordinates
      .map((polygon) => polygonToPath(polygon, bounds))
      .filter(Boolean)
      .join(" ");
  }

  return "";
}

function lineToPath(coordinates: unknown, bounds: Bounds) {
  if (!Array.isArray(coordinates) || coordinates.length === 0) {
    return "";
  }

  const points = coordinates
    .filter(isPosition)
    .map((position) => projectPosition(position, bounds));

  if (points.length < 2) {
    return "";
  }

  const [firstPoint, ...remainingPoints] = points;

  return [
    `M${firstPoint.x.toFixed(2)} ${firstPoint.y.toFixed(2)}`,
    ...remainingPoints.map(
      (point) => `L${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
    ),
  ].join(" ");
}

function polygonToPath(coordinates: unknown, bounds: Bounds) {
  if (!Array.isArray(coordinates)) {
    return "";
  }

  return coordinates
    .map((ring) => ringToPath(ring, bounds))
    .filter(Boolean)
    .join(" ");
}

function ringToPath(coordinates: unknown, bounds: Bounds) {
  if (!Array.isArray(coordinates) || coordinates.length === 0) {
    return "";
  }

  const points = coordinates
    .filter(isPosition)
    .map((position) => projectPosition(position, bounds));

  if (points.length === 0) {
    return "";
  }

  const [firstPoint, ...remainingPoints] = points;

  return [
    `M${firstPoint.x.toFixed(2)} ${firstPoint.y.toFixed(2)}`,
    ...remainingPoints.map(
      (point) => `L${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
    ),
    "Z",
  ].join(" ");
}

function projectPosition(position: GeoJsonPosition, bounds: Bounds) {
  const mapWidth = MAP_WIDTH - MAP_PADDING * 2;
  const mapHeight = MAP_HEIGHT - MAP_PADDING * 2;
  const sourceWidth = bounds.maxX - bounds.minX;
  const sourceHeight = bounds.maxY - bounds.minY;
  const scale = Math.min(mapWidth / sourceWidth, mapHeight / sourceHeight);
  const drawnWidth = sourceWidth * scale;
  const drawnHeight = sourceHeight * scale;
  const offsetX = MAP_PADDING + (mapWidth - drawnWidth) / 2;
  const offsetY = MAP_PADDING + (mapHeight - drawnHeight) / 2;

  return {
    x: offsetX + (position[0] - bounds.minX) * scale,
    y: offsetY + (bounds.maxY - position[1]) * scale,
  };
}

function forEachPosition(
  value: unknown,
  callback: (position: GeoJsonPosition) => void,
) {
  if (!Array.isArray(value)) {
    return;
  }

  if (isPosition(value)) {
    callback(value);
    return;
  }

  for (const item of value) {
    forEachPosition(item, callback);
  }
}

function isPosition(value: unknown): value is GeoJsonPosition {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number"
  );
}

function propertyEntries(feature: GeoJsonFeature) {
  return Object.entries(feature.properties ?? {}).slice(0, 12);
}

function formatPropertyValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  return JSON.stringify(value);
}

function roadStroke(feature: GeoJsonFeature) {
  const name = formatPropertyValue(feature.properties?.NAMOBJ).toLowerCase();

  if (name.includes("arteri")) {
    return "#dc2626";
  }

  if (name.includes("kolektor")) {
    return "#ea580c";
  }

  if (name.includes("lokal")) {
    return "#2563eb";
  }

  if (name.includes("lingkungan")) {
    return "#16a34a";
  }

  return "#475569";
}

function InfoPanel({
  title,
  icon: Icon,
  rows,
}: {
  title: string;
  icon: typeof Database;
  rows: Array<[string, string]>;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-pbd-blue">
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="pt-2 font-bold text-pbd-navy">{title}</h2>
      </div>

      <dl className="mt-5 space-y-3">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs font-bold uppercase text-slate-400">
              {label}
            </dt>
            <dd className="mt-1 break-words text-sm font-medium text-slate-700">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
