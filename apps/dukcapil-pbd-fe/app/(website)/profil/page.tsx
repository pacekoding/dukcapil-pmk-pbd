"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CheckCircle2,
  Landmark,
  MapPin,
  Network,
  Phone,
  ShieldCheck,
  Users2,
  type LucideIcon,
} from "lucide-react";

import { Breadcrumb } from "@/components/website/breadcrumb";
import { PageHeader } from "@/components/website/page-header";
import { ErrorState } from "@/components/website/state";
import { getWebsiteProfile } from "@/lib/api/website";
import type { WebsiteProfileResponse } from "@/types/website";

const provinceRoles = [
  "Pembinaan dan supervisi administrasi kependudukan kabupaten/kota.",
  "Fasilitasi pemberdayaan masyarakat dan pemerintahan kampung/desa.",
  "Monitoring dan evaluasi program lintas kabupaten/kota.",
  "Sinkronisasi kebijakan pusat, provinsi, dan kabupaten/kota.",
];

const focusAreas = [
  {
    title: "Dukcapil",
    description:
      "Administrasi kependudukan, pencatatan sipil, pengelolaan informasi adminduk, dan pemanfaatan data.",
    icon: ShieldCheck,
  },
  {
    title: "PMK",
    description:
      "Pembinaan pemerintahan kampung/desa, kelembagaan, pemberdayaan masyarakat, dan kapasitas aparatur.",
    icon: Users2,
  },
  {
    title: "Koordinasi Wilayah",
    description:
      "Supervisi, monitoring, evaluasi, dan konsolidasi program bersama kabupaten/kota.",
    icon: Network,
  },
];

export default function ProfilePage() {
  const [data, setData] = useState<WebsiteProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const result = await getWebsiteProfile();

        if (mounted) {
          setData(result);
          setError("");
        }
      } catch (err) {
        console.error(err);

        if (mounted) {
          setError("Data profil gagal dimuat.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const contacts = useMemo(
    () =>
      data?.contacts.length
        ? data.contacts
        : [
            {
              title: "Alamat",
              content: "Kantor Gubernur Papua Barat Daya, Kota Sorong",
            },
            {
              title: "Jam Pelayanan",
              content: "Senin-Jumat, 08.00-16.00 WIT",
            },
          ],
    [data],
  );

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-pbd-bg">
        <Breadcrumb items={[{ label: "Profil" }]} />
        <Container className="py-20">
          <ErrorState message={error || "Data profil tidak tersedia."} />
        </Container>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-pbd-bg">
      <Breadcrumb items={[{ label: "Profil" }]} />
      <PageHeader
        icon={Landmark}
        eyebrow="Profil Dinas"
        title={data.title}
        description="Informasi ringkas tentang peran Dinas Dukcapil dan PMK Provinsi Papua Barat Daya."
      />

      <Container className="py-12 md:py-16">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <SectionTitle
              icon={Landmark}
              title="Profil Singkat"
              description="Peran kelembagaan tingkat provinsi."
            />
            <p className="mt-5 leading-8 text-slate-700">{data.description}</p>
          </Card>

          <Card>
            <SectionTitle
              icon={CheckCircle2}
              title="Peran Utama"
              description="Fokus informasi yang relevan untuk publik."
            />
            <ul className="mt-5 space-y-4">
              {provinceRoles.map((item) => (
                <CleanListItem key={item}>{item}</CleanListItem>
              ))}
            </ul>
          </Card>
        </div>
      </Container>

      <section className="bg-white">
        <Container className="py-12 md:py-16">
          <SectionEyebrow>Fokus Urusan</SectionEyebrow>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-pbd-navy sm:text-3xl">
            Layanan dan Koordinasi
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {focusAreas.map((item) => (
              <InfoCard
                key={item.title}
                icon={item.icon}
                title={item.title}
                description={item.description}
              />
            ))}
          </div>
        </Container>
      </section>

      <Container className="py-12 md:py-16">
        <SectionEyebrow>Kontak</SectionEyebrow>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-pbd-navy sm:text-3xl">
          Kanal Resmi Dinas
        </h2>
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {contacts.map((item) => (
            <Card key={item.title}>
              <SectionTitle
                icon={
                  item.title.toLowerCase().includes("alamat") ? MapPin : Phone
                }
                title={item.title}
              />
              <p className="mt-5 leading-7 text-slate-700">{item.content}</p>
            </Card>
          ))}
        </div>
      </Container>
    </main>
  );
}

function ProfileSkeleton() {
  return (
    <main className="min-h-screen bg-pbd-bg">
      <section className="bg-pbd-navy">
        <Container className="py-20">
          <div className="h-48 animate-pulse rounded-lg bg-white/10" />
        </Container>
      </section>

      <Container className="py-12">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-56 animate-pulse rounded-lg bg-white" />
          <div className="h-56 animate-pulse rounded-lg bg-white" />
        </div>
      </Container>
    </main>
  );
}

function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto max-w-7xl px-4 sm:px-6 ${className}`}>{children}</div>
  );
}

function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-[0_14px_34px_rgba(15,35,80,0.06)]">
      {children}
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-pbd-blue/10 text-pbd-blue">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-pbd-navy">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        ) : null}
      </div>
    </div>
  );
}

function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="text-sm font-semibold uppercase tracking-wider text-pbd-blue">
      {children}
    </span>
  );
}

function InfoCard({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="h-full rounded-lg border border-slate-200 bg-pbd-bg p-6">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-pbd-blue shadow-sm ring-1 ring-slate-200">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-5 text-xl font-bold text-pbd-navy">{title}</h3>
      <p className="mt-3 leading-7 text-slate-600">{description}</p>
    </div>
  );
}

function CleanListItem({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-3 leading-7 text-slate-700">
      <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-pbd-gold" />
      <span>{children}</span>
    </li>
  );
}
