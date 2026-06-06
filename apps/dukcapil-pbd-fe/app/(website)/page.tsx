"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  ClipboardList,
  Database,
  FileText,
  Fingerprint,
  GalleryHorizontal,
  Landmark,
  Mail,
  MapPin,
  Megaphone,
  Newspaper,
  Phone,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  ContactCard,
  DataStatCard,
  DocumentCard,
  QuickAccessCard,
  ServiceCard,
} from "@/components/website/cards";
import { ContentContainer } from "@/components/website/content-container";
import { SectionHeader } from "@/components/website/section-header";
import { EmptyState } from "@/components/website/state";
import { SearchInput } from "@/components/website/search-input";
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

type SearchItem = {
  title: string;
  description: string;
  href: string;
  category: string;
};

const quickAccess = [
  {
    title: "Data Wilayah",
    description:
      "Lihat data kependudukan, OAP, pencatatan sipil, dan IDM kabupaten/kota.",
    href: "/data-wilayah",
    icon: Database,
  },
  {
    title: "Profil Dinas",
    description:
      "Baca kedudukan, tugas, fungsi, visi misi, dan wilayah kerja dinas.",
    href: "/profil",
    icon: Landmark,
  },
  {
    title: "Layanan Dukcapil",
    description:
      "Informasi urusan administrasi kependudukan dan pencatatan sipil tingkat provinsi.",
    href: "/#layanan",
    icon: Fingerprint,
  },
  {
    title: "Layanan PMK",
    description:
      "Informasi pembinaan pemerintahan kampung dan pemberdayaan masyarakat.",
    href: "/#layanan",
    icon: Users,
  },
];

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

const searchItems: SearchItem[] = [
  {
    title: "Data Wilayah Papua Barat Daya",
    description: "Peta dan statistik kabupaten/kota.",
    href: "/data-wilayah",
    category: "Data",
  },
  {
    title: "Profil Dinas",
    description: "Kedudukan instansi, visi misi, struktur, dan kontak.",
    href: "/profil",
    category: "Profil",
  },
  {
    title: "Layanan Administrasi Kependudukan",
    description: "Informasi fokus layanan Dukcapil tingkat provinsi.",
    href: "/#layanan",
    category: "Layanan",
  },
  {
    title: "Layanan Pemberdayaan Masyarakat Kampung",
    description: "Informasi fokus layanan PMK tingkat provinsi.",
    href: "/#layanan",
    category: "Layanan",
  },
  {
    title: "Kontak Dinas",
    description: "Alamat, email, dan jam layanan.",
    href: "/#kontak",
    category: "Kontak",
  },
];

export default function HomePage() {
  const [home, setHome] = useState<WebsiteHomeResponse | null>(null);
  const [profile, setProfile] = useState<WebsiteProfileResponse | null>(null);
  const [regions, setRegions] = useState<RegionData[]>(defaultRegionData);
  const [query, setQuery] = useState("");

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
  const filteredSearchItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return searchItems;
    }
    return searchItems.filter(
      (item) =>
        item.title.toLowerCase().includes(normalized) ||
        item.description.toLowerCase().includes(normalized) ||
        item.category.toLowerCase().includes(normalized),
    );
  }, [query]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <HeroSection home={home} />
      <QuickAccessSection />
      <DataSection totals={totals} />
      <SearchSection
        query={query}
        onQueryChange={setQuery}
        items={filteredSearchItems}
      />
      <NewsAnnouncementSection />
      <ServicesSection highlights={home?.highlights ?? []} />
      <DocumentGallerySection />
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
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(26,54,93,0.88),rgba(26,54,93,0.64),rgba(26,54,93,0.25))]" />
        <div className="absolute inset-0 bg-black/10" />
      </div>

      <ContentContainer className="relative py-16 sm:py-20 lg:py-24">
        <div className="max-w-4xl">
          <p className="inline-flex rounded-md bg-white/10 px-3 py-1.5 text-sm font-bold uppercase tracking-wider text-pbd-gold ring-1 ring-white/15">
            {home?.hero.eyebrow ?? "Website Resmi"}
          </p>
          <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            {home?.hero.title ?? "Dinas Dukcapil & PMK Provinsi Papua Barat Daya"}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-white/82 sm:text-lg">
            {home?.hero.description ??
              "Kanal informasi resmi untuk profil dinas, data wilayah, layanan publik, pengumuman, dan informasi pemerintahan kepada masyarakat."}
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

function QuickAccessSection() {
  return (
    <section className="-mt-8 relative z-10">
      <ContentContainer>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickAccess.map((item) => (
            <QuickAccessCard key={item.title} {...item} label="Akses" />
          ))}
        </div>
      </ContentContainer>
    </section>
  );
}

function DataSection({
  totals,
}: {
  totals: ReturnType<typeof getProvinceTotals>;
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
    <section id="data" className="py-16 sm:py-20">
      <ContentContainer>
        <SectionHeader
          eyebrow="Data dan Statistik"
          title="Ringkasan data wilayah Papua Barat Daya"
          description="Informasi publik ditampilkan ringkas agar masyarakat dapat memahami kondisi wilayah secara cepat."
          action={
            <Button asChild variant="outline">
              <Link href="/data-wilayah">
                Buka Peta Data
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

function SearchSection({
  query,
  onQueryChange,
  items,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  items: SearchItem[];
}) {
  return (
    <section id="search" className="border-y border-slate-200 bg-white py-12">
      <ContentContainer>
        <SectionHeader
          eyebrow="Pencarian"
          title="Temukan informasi utama"
          description="Gunakan pencarian cepat untuk membuka kanal informasi yang paling sering dibutuhkan masyarakat."
        />
        <div className="mt-6 max-w-2xl">
          <SearchInput
            value={query}
            onChange={onQueryChange}
            placeholder="Cari profil, layanan, data, atau kontak..."
          />
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {items.length > 0 ? (
            items.map((item) => (
              <Link
                key={`${item.category}-${item.title}`}
                href={item.href}
                className="rounded-lg border border-slate-200 bg-slate-50 p-4 transition hover:border-pbd-blue/40 hover:bg-blue-50/50"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-pbd-blue">
                  {item.category}
                </p>
                <h3 className="mt-2 font-bold text-pbd-navy">{item.title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {item.description}
                </p>
              </Link>
            ))
          ) : (
            <EmptyState
              title="Informasi tidak ditemukan"
              description="Coba gunakan kata kunci lain yang lebih umum."
              icon={Search}
              className="md:col-span-2"
            />
          )}
        </div>
      </ContentContainer>
    </section>
  );
}

function NewsAnnouncementSection() {
  return (
    <section id="pengumuman" className="py-16 sm:py-20">
      <ContentContainer>
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeader
              eyebrow="Berita"
              title="Berita dan artikel terbaru"
              description="Ruang publikasi kegiatan dan informasi resmi dinas."
            />
            <div className="mt-6">
              <EmptyState
                title="Berita belum tersedia"
                description="Publikasi berita akan ditampilkan setelah tersedia dari kanal resmi dinas."
                icon={Newspaper}
              />
            </div>
          </div>

          <div>
            <SectionHeader
              eyebrow="Pengumuman"
              title="Pengumuman penting"
              description="Informasi resmi yang perlu diketahui masyarakat, ASN, OPD, dan stakeholder."
            />
            <div className="mt-6">
              <EmptyState
                title="Belum ada pengumuman aktif"
                description="Pengumuman resmi akan ditampilkan pada bagian ini."
                icon={Megaphone}
              />
            </div>
          </div>
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
        icon: [Fingerprint, Building2, ClipboardList][index] ?? ClipboardList,
      }))
    : services;

  return (
    <section id="layanan" className="border-y border-slate-200 bg-white py-16 sm:py-20">
      <ContentContainer>
        <SectionHeader
          eyebrow="Layanan Publik"
          title="Fokus layanan dan koordinasi tingkat provinsi"
          description="Dinas provinsi berperan dalam fasilitasi, pembinaan, supervisi, monitoring, evaluasi, dan koordinasi bersama kabupaten/kota."
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

function DocumentGallerySection() {
  return (
    <section className="py-16 sm:py-20">
      <ContentContainer>
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeader
              eyebrow="Dokumen"
              title="Dokumen dan unduhan"
              description="Dokumen resmi, publikasi, dan berkas unduhan akan ditampilkan saat tersedia."
            />
            <div className="mt-6">
              <DocumentCard
                title="Belum ada dokumen publik"
                description="Dokumen resmi untuk publik belum tersedia pada kanal website."
              />
            </div>
          </div>
          <div>
            <SectionHeader
              eyebrow="Galeri"
              title="Galeri kegiatan dinas"
              description="Dokumentasi kegiatan akan ditampilkan dari sumber resmi dinas."
            />
            <div className="mt-6">
              <EmptyState
                title="Galeri belum tersedia"
                description="Foto kegiatan resmi akan ditampilkan setelah tersedia."
                icon={GalleryHorizontal}
              />
            </div>
          </div>
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
    <section id="kontak" className="border-t border-slate-200 bg-white py-16 sm:py-20">
      <ContentContainer>
        <SectionHeader
          eyebrow="Kontak"
          title="Hubungi Dinas Dukcapil dan PMK"
          description="Gunakan kanal resmi untuk kebutuhan informasi, koordinasi, dan komunikasi kelembagaan."
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
        <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-pbd-navy">Akses internal OPD</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Dashboard hanya untuk admin/operator yang memiliki akun resmi.
              </p>
            </div>
            <Button asChild>
              <Link href="/login">
                Masuk Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </ContentContainer>
    </section>
  );
}
