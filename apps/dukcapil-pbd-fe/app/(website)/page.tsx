"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  Database,
  FileText,
  Fingerprint,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  ContactCard,
  DataStatCard,
  ServiceCard,
} from "@/components/website/cards";
import { ContentContainer } from "@/components/website/content-container";
import { SectionHeader } from "@/components/website/section-header";
import { getWebsiteDataWilayah } from "@/lib/api/data-wilayah";
import { getWebsiteHome, getWebsiteProfile } from "@/lib/api/website";
import {
  defaultRegionData,
  formatNumber,
  getProvinceTotals,
} from "@/lib/data-wilayah";
import type { RegionData } from "@/types/data-wilayah";
import type {
  ContactItem,
  WebsiteHomeResponse,
  WebsiteProfileResponse,
} from "@/types/website";

const services = [
  {
    title: "Administrasi Kependudukan",
    description:
      "Fasilitasi, pembinaan, supervisi, dan koordinasi penyelenggaraan administrasi kependudukan kabupaten/kota.",
    icon: Fingerprint,
  },
  {
    title: "Pencatatan Sipil",
    description:
      "Pemantauan dan penguatan tata kelola pencatatan peristiwa penting penduduk sesuai kewenangan provinsi.",
    icon: FileText,
  },
  {
    title: "Pemberdayaan Masyarakat Kampung",
    description:
      "Pembinaan kelembagaan kampung, aparatur kampung, dan penguatan kapasitas masyarakat kampung.",
    icon: Building2,
  },
];

export default function HomePage() {
  const [home, setHome] = useState<WebsiteHomeResponse | null>(null);
  const [profile, setProfile] = useState<WebsiteProfileResponse | null>(null);
  const [regions, setRegions] = useState<RegionData[]>(defaultRegionData);
  const [wilayahSummaryYear, setWilayahSummaryYear] = useState("2026");

  useEffect(() => {
    let mounted = true;

    const loadPublicData = async () => {
      try {
        const [homeResponse, profileResponse, wilayahResponse] =
          await Promise.allSettled([
            getWebsiteHome(),
            getWebsiteProfile(),
            getWebsiteDataWilayah(),
          ]);

        if (!mounted) {
          return;
        }

        if (homeResponse.status === "fulfilled") {
          setHome(homeResponse.value);
        }
        if (profileResponse.status === "fulfilled") {
          setProfile(profileResponse.value);
        }
        if (
          wilayahResponse.status === "fulfilled" &&
          wilayahResponse.value.regions.length > 0
        ) {
          setRegions(wilayahResponse.value.regions);
          setWilayahSummaryYear(wilayahResponse.value.tahunAnggaran);
        }
      } catch (error) {
        console.error(error);
      }
    };

    void loadPublicData();

    return () => {
      mounted = false;
    };
  }, []);

  const totals = useMemo(() => getProvinceTotals(regions), [regions]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <HeroSection home={home} />
      <DataSection totals={totals} tahunAnggaran={wilayahSummaryYear} />
      <ServicesSection highlights={home?.highlights ?? []} />
      <ContactSection contacts={profile?.contacts ?? []} />
    </div>
  );
}

function HeroSection({ home }: { home: WebsiteHomeResponse | null }) {
  return (
    <section className="relative isolate overflow-hidden bg-pbd-navy">
      <div className="absolute inset-0">
        <Image
          src="/hero-pbd.png"
          alt="Lanskap Papua Barat Daya"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(26,54,93,0.9),rgba(26,54,93,0.68),rgba(26,54,93,0.32))]" />
      </div>

      <ContentContainer className="relative py-14 sm:py-16 lg:py-20">
        <div className="max-w-4xl">
          <p className="inline-flex rounded-md bg-white/10 px-3 py-1.5 text-sm font-bold uppercase tracking-wider text-pbd-gold ring-1 ring-white/15">
            {home?.hero.eyebrow ?? "Website Resmi"}
          </p>
          <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-[56px]">
            {home?.hero.title ?? "Dinas Dukcapil & PMK Provinsi Papua Barat Daya"}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-white/82 sm:text-lg">
            {home?.hero.description ??
              "Kanal resmi untuk profil dinas, ringkasan data wilayah, fokus layanan, dan kontak Dinas Dukcapil dan PMK Provinsi Papua Barat Daya."}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              className="h-12 rounded-md bg-pbd-gold px-6 font-bold text-pbd-navy hover:bg-pbd-gold/90"
            >
              <Link href="/data-wilayah">
                Lihat Data Wilayah
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-12 rounded-md border-white/25 bg-white/10 px-6 font-semibold text-white hover:bg-white/15 hover:text-white"
            >
              <Link href="/profil">Profil Dinas</Link>
            </Button>
          </div>
        </div>
      </ContentContainer>
    </section>
  );
}

function DataSection({
  totals,
  tahunAnggaran,
}: {
  totals: ReturnType<typeof getProvinceTotals>;
  tahunAnggaran: string;
}) {
  const stats = [
    {
      label: "Total Penduduk",
      value: `${formatNumber(totals.totalJiwa)} Orang`,
      description: "Akumulasi data kabupaten/kota.",
      icon: Users,
    },
    {
      label: "Total OAP",
      value: `${formatNumber(totals.totalOap)} Orang`,
      description: "Orang Asli Papua dalam data wilayah.",
      icon: ShieldCheck,
    },
    {
      label: "KTP-EL",
      value: formatNumber(totals.totalKtpEl),
      description: "Pencetakan KTP elektronik tercatat.",
      icon: Fingerprint,
    },
    {
      label: "Desa IDM",
      value: formatNumber(totals.totalDesaIdm),
      description: "Desa/kampung pada data IDM.",
      icon: Database,
    },
  ];

  return (
    <section id="data" className="py-12 sm:py-14">
      <ContentContainer>
        <SectionHeader
          eyebrow="Data Wilayah"
          title="Ringkasan data Papua Barat Daya"
          description={`Data utama tahun ${tahunAnggaran} ditampilkan sebagai gambaran awal. Detail per kabupaten/kota tersedia pada halaman Data Wilayah.`}
          action={
            <Button asChild variant="outline">
              <Link href="/data-wilayah">
                Buka Detail Data
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          }
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => (
            <DataStatCard key={item.label} {...item} />
          ))}
        </div>
      </ContentContainer>
    </section>
  );
}

function ServicesSection({
  highlights,
}: {
  highlights: WebsiteHomeResponse["highlights"];
}) {
  const highlightItems = highlights.length
    ? highlights.map((item, index) => ({
        ...item,
        icon: [Fingerprint, Building2, FileText][index] ?? FileText,
      }))
    : services;

  return (
    <section id="layanan" className="border-y border-slate-200 bg-white py-12 sm:py-14">
      <ContentContainer>
        <SectionHeader
          eyebrow="Layanan"
          title="Fokus layanan dinas"
          description="Informasi publik dibatasi pada fokus urusan provinsi: pembinaan, fasilitasi, supervisi, monitoring, evaluasi, dan koordinasi."
        />
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {highlightItems.map((item) => (
            <ServiceCard key={item.title} {...item} />
          ))}
        </div>
      </ContentContainer>
    </section>
  );
}

function ContactSection({ contacts }: { contacts: ContactItem[] }) {
  const contactItems =
    contacts.length > 0
      ? contacts
      : [
          {
            title: "Alamat",
            content: "Kantor Gubernur Papua Barat Daya, Kota Sorong",
          },
          {
            title: "Email",
            content: "dukcapilpmk@papuabaratdaya.go.id",
          },
          {
            title: "Jam Pelayanan",
            content: "Senin-Jumat, 08.00-16.00 WIT",
          },
        ];

  const iconFor = (title: string) => {
    const normalized = title.toLowerCase();
    if (normalized.includes("alamat")) {
      return MapPin;
    }
    if (normalized.includes("email")) {
      return Mail;
    }
    return Phone;
  };

  return (
    <section id="kontak" className="bg-slate-50 py-12 sm:py-14">
      <ContentContainer>
        <SectionHeader
          eyebrow="Kontak"
          title="Hubungi Dinas Dukcapil dan PMK"
          description="Kanal resmi untuk kebutuhan informasi dan koordinasi kelembagaan."
        />
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {contactItems.map((item) => (
            <ContactCard
              key={item.title}
              title={item.title}
              content={item.content}
              icon={iconFor(item.title)}
            />
          ))}
        </div>
      </ContentContainer>
    </section>
  );
}
