"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  ArrowRight,
  Building2,
  ChevronRight,
  ClipboardList,
  FileBadge,
  Fingerprint,
  Home,
  Landmark,
  PieChart,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getWebsiteHome } from "@/lib/api/website";
import type { WebsiteHomeResponse } from "@/types/website";

type IdmData = {
  sangatTertinggal: number;
  tertinggal: number;
  berkembang: number;
  maju: number;
  mandiri: number;
};

type PopulationRegistrationData = {
  penerbitanKk: number;
  perubahanKk: number;
  kia: number;
  nikWni: number;
  perekamanKtpEl: number;
  pencetakanKtpEl: number;
};

type OapData = {
  luasWilayah: number;
  jumlahOap: number;
  jumlahNonOap: number;
  jumlahJiwa: number;
};

type CivilRegistrationData = {
  aktaKelahiran: number;
  aktaKematian: number;
  aktaPerkawinan: number;
  aktaPerceraian: number;
};

type RegionData = {
  id: string;
  name: string;
  shortName: string;
  type: "Kabupaten" | "Kota";
  mapLabel: string;
  idm: IdmData;
  registration: PopulationRegistrationData;
  oap: OapData;
  civil: CivilRegistrationData;
};

const formatNumber = (value: number) =>
  new Intl.NumberFormat("id-ID").format(value);

const getTotalIdmVillages = (idm: IdmData) =>
  idm.sangatTertinggal +
  idm.tertinggal +
  idm.berkembang +
  idm.maju +
  idm.mandiri;

const regionData: RegionData[] = [
  {
    id: "kabupaten-sorong",
    name: "Kabupaten Sorong",
    shortName: "Sorong",
    type: "Kabupaten",
    mapLabel: "Kab. Sorong",
    idm: {
      sangatTertinggal: 60,
      tertinggal: 80,
      berkembang: 66,
      maju: 3,
      mandiri: 0,
    },
    registration: {
      penerbitanKk: 4311,
      perubahanKk: 8945,
      kia: 3861,
      nikWni: 2756,
      perekamanKtpEl: 2511,
      pencetakanKtpEl: 21637,
    },
    oap: {
      luasWilayah: 6544.23,
      jumlahOap: 54379,
      jumlahNonOap: 76322,
      jumlahJiwa: 130701,
    },
    civil: {
      aktaKelahiran: 4213,
      aktaKematian: 947,
      aktaPerkawinan: 390,
      aktaPerceraian: 21,
    },
  },
  {
    id: "kota-sorong",
    name: "Kota Sorong",
    shortName: "Kota Sorong",
    type: "Kota",
    mapLabel: "Kota Sorong",
    idm: {
      sangatTertinggal: 0,
      tertinggal: 0,
      berkembang: 0,
      maju: 0,
      mandiri: 0,
    },
    registration: {
      penerbitanKk: 9376,
      perubahanKk: 14612,
      kia: 1490,
      nikWni: 4627,
      perekamanKtpEl: 4418,
      pencetakanKtpEl: 27136,
    },
    oap: {
      luasWilayah: 656.64,
      jumlahOap: 77487,
      jumlahNonOap: 209765,
      jumlahJiwa: 287252,
    },
    civil: {
      aktaKelahiran: 7208,
      aktaKematian: 1941,
      aktaPerkawinan: 1118,
      aktaPerceraian: 47,
    },
  },
  {
    id: "raja-ampat",
    name: "Kabupaten Raja Ampat",
    shortName: "Raja Ampat",
    type: "Kabupaten",
    mapLabel: "Raja Ampat",
    idm: {
      sangatTertinggal: 16,
      tertinggal: 33,
      berkembang: 75,
      maju: 6,
      mandiri: 0,
    },
    registration: {
      penerbitanKk: 2688,
      perubahanKk: 4543,
      kia: 1997,
      nikWni: 1713,
      perekamanKtpEl: 1466,
      pencetakanKtpEl: 10624,
    },
    oap: {
      luasWilayah: 8034.44,
      jumlahOap: 53035,
      jumlahNonOap: 20713,
      jumlahJiwa: 73748,
    },
    civil: {
      aktaKelahiran: 3998,
      aktaKematian: 545,
      aktaPerkawinan: 741,
      aktaPerceraian: 2,
    },
  },
  {
    id: "sorong-selatan",
    name: "Kabupaten Sorong Selatan",
    shortName: "Sorong Selatan",
    type: "Kabupaten",
    mapLabel: "Sorong Selatan",
    idm: {
      sangatTertinggal: 28,
      tertinggal: 40,
      berkembang: 73,
      maju: 4,
      mandiri: 0,
    },
    registration: {
      penerbitanKk: 1342,
      perubahanKk: 2568,
      kia: 680,
      nikWni: 1570,
      perekamanKtpEl: 880,
      pencetakanKtpEl: 6031,
    },
    oap: {
      luasWilayah: 6594.31,
      jumlahOap: 46829,
      jumlahNonOap: 10684,
      jumlahJiwa: 57513,
    },
    civil: {
      aktaKelahiran: 2571,
      aktaKematian: 323,
      aktaPerkawinan: 359,
      aktaPerceraian: 5,
    },
  },
  {
    id: "maybrat",
    name: "Kabupaten Maybrat",
    shortName: "Maybrat",
    type: "Kabupaten",
    mapLabel: "Maybrat",
    idm: {
      sangatTertinggal: 107,
      tertinggal: 128,
      berkembang: 59,
      maju: 1,
      mandiri: 0,
    },
    registration: {
      penerbitanKk: 1230,
      perubahanKk: 3222,
      kia: 190,
      nikWni: 696,
      perekamanKtpEl: 505,
      pencetakanKtpEl: 5220,
    },
    oap: {
      luasWilayah: 5461.69,
      jumlahOap: 43178,
      jumlahNonOap: 3626,
      jumlahJiwa: 46804,
    },
    civil: {
      aktaKelahiran: 1775,
      aktaKematian: 300,
      aktaPerkawinan: 203,
      aktaPerceraian: 4,
    },
  },
  {
    id: "tambrauw",
    name: "Kabupaten Tambrauw",
    shortName: "Tambrauw",
    type: "Kabupaten",
    mapLabel: "Tambrauw",
    idm: {
      sangatTertinggal: 202,
      tertinggal: 64,
      berkembang: 19,
      maju: 0,
      mandiri: 0,
    },
    registration: {
      penerbitanKk: 631,
      perubahanKk: 1253,
      kia: 1025,
      nikWni: 596,
      perekamanKtpEl: 330,
      pencetakanKtpEl: 2861,
    },
    oap: {
      luasWilayah: 11529.18,
      jumlahOap: 21302,
      jumlahNonOap: 10086,
      jumlahJiwa: 31388,
    },
    civil: {
      aktaKelahiran: 830,
      aktaKematian: 120,
      aktaPerkawinan: 101,
      aktaPerceraian: 1,
    },
  },
];

const getProvinceTotals = (regions: RegionData[]) => ({
  totalJiwa: regions.reduce(
    (total, region) => total + region.oap.jumlahJiwa,
    0,
  ),
  totalOap: regions.reduce((total, region) => total + region.oap.jumlahOap, 0),
  totalNonOap: regions.reduce(
    (total, region) => total + region.oap.jumlahNonOap,
    0,
  ),
  totalPencetakanKtpEl: regions.reduce(
    (total, region) => total + region.registration.pencetakanKtpEl,
    0,
  ),
  totalAktaKelahiran: regions.reduce(
    (total, region) => total + region.civil.aktaKelahiran,
    0,
  ),
  totalDesaIdm: regions.reduce(
    (total, region) => total + getTotalIdmVillages(region.idm),
    0,
  ),
});

export default function HomePage() {
  const [data, setData] = useState<WebsiteHomeResponse | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const result = await getWebsiteHome();

        if (mounted) {
          setData(result);
        }
      } catch (err) {
        console.error(err);
      }
    };

    void loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const provinceTotals = useMemo(() => getProvinceTotals(regionData), []);

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-slate-900">
      <HeroSection />
      <ProvinceOverview totals={provinceTotals} />
      <FocusServiceSection highlights={data?.highlights ?? []} />
      <ProfileCtaSection description={data?.profileSummary.description} />
    </main>
  );
}

function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden bg-pbd-navy">
      <div className="absolute inset-0">
        <Image
          src="/hero-pbd.png"
          alt="Papua Barat Daya"
          fill
          priority
          className="object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(26,54,93,0.98),rgba(15,45,84,0.90),rgba(0,123,255,0.45))]" />
      </div>

      <div className="relative mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:py-20">
        <div className="max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-pbd-gold backdrop-blur"
          >
            <Sparkles className="h-4 w-4" />
            Portal Data Resmi Provinsi Papua Barat Daya
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.65, ease: "easeOut" }}
            className="mt-7 max-w-4xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-7xl"
          >
            Dukcapil & PMK Papua Barat Daya
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.6, ease: "easeOut" }}
            className="mt-6 max-w-3xl text-base leading-8 text-white/78 sm:text-lg"
          >
            Portal data wilayah, layanan kependudukan, dan pemberdayaan
            masyarakat kampung.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.34, duration: 0.55, ease: "easeOut" }}
            className="mt-10 flex flex-col gap-3 sm:flex-row"
          >
            <Button
              asChild
              className="h-12 rounded-lg bg-pbd-gold px-6 font-bold text-pbd-navy hover:bg-pbd-gold/90"
            >
              <Link href="/data-wilayah">
                Lihat Data Wilayah
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-12 rounded-lg border-white/20 bg-white/10 px-6 font-semibold text-white backdrop-blur hover:bg-white/15 hover:text-white"
            >
              <Link href="/profil">
                Lihat Profil Dinas
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.7, ease: "easeOut" }}
          className="rounded-lg border border-white/15 bg-white/10 p-5 shadow-2xl shadow-black/20 backdrop-blur-md"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <p className="text-sm font-semibold text-pbd-gold">
                Ringkasan Wilayah
              </p>
              <h2 className="mt-1 text-xl font-bold text-white">
                5 Kabupaten dan 1 Kota
              </h2>
            </div>
            <Landmark className="h-8 w-8 text-pbd-gold" />
          </div>
          <div className="mt-5 grid gap-3">
            {regionData.map((region, index) => (
              <motion.div
                key={region.id}
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.42 + index * 0.06, duration: 0.35 }}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/8 px-4 py-3 text-sm text-white/80"
              >
                <span>{region.name}</span>
                <span className="font-semibold text-white">
                  {formatNumber(region.oap.jumlahJiwa)} Orang
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function ProvinceOverview({
  totals,
}: {
  totals: ReturnType<typeof getProvinceTotals>;
}) {
  const cards = [
    {
      label: "Total Jiwa",
      value: totals.totalJiwa,
      description: "Akumulasi penduduk 6 wilayah",
      icon: Users,
    },
    {
      label: "Total OAP",
      value: totals.totalOap,
      description: "Orang Asli Papua terdata",
      icon: ShieldCheck,
    },
    {
      label: "Total Non-OAP",
      value: totals.totalNonOap,
      description: "Penduduk non-OAP terdata",
      icon: PieChart,
    },
    {
      label: "Pencetakan KTP-EL",
      value: totals.totalPencetakanKtpEl,
      description: "Layanan KTP elektronik 2025",
      icon: Fingerprint,
    },
    {
      label: "Akta Kelahiran",
      value: totals.totalAktaKelahiran,
      description: "Catatan sipil 2025",
      icon: FileBadge,
    },
    {
      label: "Total Desa IDM",
      value: totals.totalDesaIdm,
      description: "Desa/kampung dalam data IDM",
      icon: Home,
    },
  ];

  return (
    <section className="relative z-10 -mt-14 px-4 sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((card, index) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: index * 0.06, duration: 0.45 }}
          >
            <StatCard {...card} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function FocusServiceSection({
  highlights,
}: {
  highlights: WebsiteHomeResponse["highlights"];
}) {
  const fallback = [
    {
      title: "Administrasi Kependudukan",
      description:
        "Pelayanan kependudukan, perekaman KTP-EL, penerbitan NIK, dan penguatan data layanan publik.",
    },
    {
      title: "Pemberdayaan Masyarakat Kampung",
      description:
        "Monitoring IDM, pendampingan kampung, penguatan aparatur, dan pembinaan tata kelola pembangunan kampung.",
    },
    {
      title: "Data Layanan Publik",
      description:
        "Pengelolaan data wilayah, statistik layanan, dan informasi publik secara terstruktur.",
    },
  ];

  const items = highlights.length ? highlights : fallback;
  const icons = [Landmark, Building2, ClipboardList];

  return (
    <section className="bg-[#f6f8fb] py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionLabel>Fokus Layanan</SectionLabel>
        <h2 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-pbd-navy sm:text-4xl">
          Layanan provinsi yang ditopang data dan informasi.
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {items.map((item, index) => {
            const Icon = icons[index] ?? ClipboardList;
            return (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: index * 0.07, duration: 0.4 }}
                className="rounded-lg border border-slate-200 bg-white/80 p-7 shadow-sm backdrop-blur"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-pbd-blue/10 text-pbd-blue">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-xl font-bold text-pbd-navy">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {item.description}
                </p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ProfileCtaSection({ description }: { description?: string }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="grid gap-8 overflow-hidden rounded-lg bg-pbd-navy p-8 text-white shadow-2xl shadow-slate-300/70 lg:grid-cols-[1fr_auto] lg:items-center lg:p-12">
        <div>
          <SectionLabel className="text-pbd-gold">Profil Dinas</SectionLabel>
          <h2 className="mt-3 text-3xl font-bold">
            Pemerintahan berbasis data untuk layanan kependudukan dan kampung.
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/72 sm:text-base">
            {description ??
              "Dinas menyelenggarakan urusan administrasi kependudukan, pencatatan sipil, pemberdayaan masyarakat kampung, dan pengelolaan data layanan publik berbasis data wilayah."}
          </p>
        </div>
        <Button
          asChild
          className="h-12 rounded-lg bg-pbd-gold px-6 font-bold text-pbd-navy hover:bg-pbd-gold/90"
        >
          <Link href="/profil">
            Baca Profil Dinas
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;
  value: number;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <div className="h-full rounded-lg border border-slate-200 bg-white/95 p-5 shadow-lg shadow-slate-200/60 backdrop-blur">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-pbd-blue/10 text-pbd-blue">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <CounterValue value={value} />
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

function CounterValue({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let frame = 0;
    const duration = 850;
    const start = performance.now();

    const tick = (time: number) => {
      const progress = Math.min((time - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(value * eased));

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-pbd-navy">
      {formatNumber(displayValue)}
    </h3>
  );
}

function SectionLabel({
  children,
  className = "text-pbd-blue",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn("text-sm font-bold uppercase tracking-wider", className)}
    >
      {children}
    </span>
  );
}
