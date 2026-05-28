"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Building2,
  CheckCircle2,
  Landmark,
  MapPin,
  Network,
  Phone,
  ShieldCheck,
  Users2,
  type LucideIcon,
} from "lucide-react";

import { getWebsiteProfile } from "@/lib/api/website";
import type { WebsiteProfileResponse } from "@/types/website";

const provinceRoles = [
  "Pembinaan dan supervisi administrasi kependudukan kabupaten/kota.",
  "Fasilitasi pemberdayaan masyarakat, pemerintahan kampung/desa, dan kelembagaan kampung.",
  "Monitoring intervensi program, perangkat kampung, serta hibah daerah.",
  "Sinkronisasi kebijakan pusat, provinsi, dan kabupaten/kota.",
];

const focusAreas = [
  {
    title: "Dukcapil",
    description:
      "Fasilitasi pendaftaran penduduk, pencatatan sipil, pengelolaan informasi adminduk, dan pemanfaatan data.",
    icon: ShieldCheck,
  },
  {
    title: "PMK",
    description:
      "Pembinaan pemerintahan kampung/desa, pemberdayaan masyarakat, kelembagaan, dan kapasitas aparatur kampung.",
    icon: Users2,
  },
  {
    title: "Koordinasi Wilayah",
    description:
      "Supervisi, monitoring, evaluasi, dan konsolidasi program pada kabupaten/kota serta kampung/desa.",
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

  const contacts = useMemo(() => data?.contacts ?? [], [data?.contacts]);
  const wilayah = useMemo(() => data?.wilayah ?? [], [data?.wilayah]);
  const struktur = useMemo(() => data?.struktur ?? [], [data?.struktur]);

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-pbd-bg">
        <Container className="py-20">
          <div className="rounded-lg border border-red-100 bg-red-50 p-6 text-sm font-medium text-red-700">
            {error || "Data profil tidak tersedia."}
          </div>
        </Container>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-pbd-bg">
      <section className="bg-pbd-navy">
        <Container className="py-16 md:py-20">
          <div className="max-w-4xl">
            <span className="rounded-full bg-pbd-gold/20 px-4 py-2 text-sm font-semibold text-pbd-gold">
              Profil Dinas
            </span>

            <h1 className="mt-6 text-3xl font-extrabold leading-tight text-white sm:text-4xl md:text-5xl">
              {data.title}
            </h1>

            <p className="mt-5 text-base leading-8 text-white/80 md:text-lg">
              Dinas Dukcapil dan PMK Provinsi berperan dalam pembinaan,
              fasilitasi, supervisi, koordinasi, monitoring, dan evaluasi urusan
              administrasi kependudukan serta pemberdayaan masyarakat
              kampung/desa pada kabupaten/kota.
            </p>
          </div>
        </Container>
      </section>

      <Container className="py-12 md:py-16">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <SectionTitle
              icon={Landmark}
              title="Kedudukan Instansi"
              description="Peran kelembagaan di tingkat pemerintah provinsi."
            />

            <p className="mt-5 leading-8 text-gray-700">{data.description}</p>

            <div className="mt-6 rounded-lg bg-pbd-blue/5 p-5 text-sm leading-7 text-gray-700">
              Fokus provinsi bukan pelayanan langsung harian kepada masyarakat,
              tetapi penguatan kapasitas, fasilitasi, supervisi, dan evaluasi
              penyelenggaraan urusan oleh kabupaten/kota dan kampung/desa.
            </div>
          </Card>

          <Card>
            <SectionTitle
              icon={CheckCircle2}
              title="Fokus Utama"
              description="Ruang kerja prioritas level provinsi."
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
          <SectionEyebrow>Bidang Urusan</SectionEyebrow>

          <h2 className="mt-2 text-3xl font-bold text-pbd-navy">
            Tugas dan Fungsi
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
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <SectionTitle
              icon={Building2}
              title="Visi"
              description="Arah pembangunan dan tata kelola layanan daerah."
            />

            <p className="mt-5 text-lg font-semibold leading-8 text-pbd-navy">
              {data.visi}
            </p>
          </Card>

          <Card>
            <SectionTitle
              icon={Users2}
              title="Misi"
              description="Prioritas kerja organisasi perangkat daerah."
            />

            <ul className="mt-5 space-y-4">
              {data.misi.map((item) => (
                <CleanListItem key={item}>{item}</CleanListItem>
              ))}
            </ul>
          </Card>
        </div>
      </Container>

      <section className="bg-white">
        <Container className="py-12 md:py-16">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <SectionEyebrow>Organisasi</SectionEyebrow>

              <h2 className="mt-2 text-3xl font-bold text-pbd-navy">
                Struktur dan Wilayah Kerja
              </h2>

              <p className="mt-4 leading-7 text-gray-600">
                Ringkasan unit kerja dan cakupan kabupaten/kota yang menjadi
                objek fasilitasi, supervisi, pembinaan, dan monitoring.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <SimplePanel title="Struktur Organisasi">
                {struktur.slice(0, 6).map((item) => (
                  <CleanListItem key={item.id}>{item.name}</CleanListItem>
                ))}
              </SimplePanel>

              <SimplePanel title="Wilayah Kerja">
                {wilayah.slice(0, 8).map((item) => (
                  <CleanListItem key={item}>{item}</CleanListItem>
                ))}
              </SimplePanel>
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-12 md:py-16">
        <div className="grid gap-6 lg:grid-cols-3">
          {contacts.map((item) => (
            <Card key={item.title}>
              <SectionTitle
                icon={
                  item.title.toLowerCase().includes("alamat") ? MapPin : Phone
                }
                title={item.title}
              />

              <p className="mt-5 leading-7 text-gray-700">{item.content}</p>
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
          <div className="h-56 animate-pulse rounded-lg bg-white/10" />
        </Container>
      </section>

      <Container className="py-12">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-64 animate-pulse rounded-lg bg-white" />
          <div className="h-64 animate-pulse rounded-lg bg-white" />
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
    <div className="rounded-lg border border-gray-100 bg-white p-7 shadow-sm">
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
          <p className="mt-1 text-sm leading-6 text-gray-500">{description}</p>
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
    <div className="rounded-lg border border-gray-100 bg-pbd-bg p-6">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-pbd-blue shadow-sm">
        <Icon className="h-5 w-5" />
      </div>

      <h3 className="mt-5 text-xl font-bold text-pbd-navy">{title}</h3>

      <p className="mt-3 leading-7 text-gray-600">{description}</p>
    </div>
  );
}

function SimplePanel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gray-100 bg-pbd-bg p-6">
      <h3 className="text-lg font-bold text-pbd-navy">{title}</h3>

      <ul className="mt-5 space-y-4">{children}</ul>
    </div>
  );
}

function CleanListItem({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-3 leading-7 text-gray-700">
      <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-pbd-gold" />
      <span>{children}</span>
    </li>
  );
}
