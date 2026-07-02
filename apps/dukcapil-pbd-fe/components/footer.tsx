import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-pbd-navy text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.2fr_0.8fr_0.8fr] lg:px-8">
        <div className="max-w-md">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white ring-1 ring-white/20">
              <Image
                src="/logo-pbd.png"
                alt="Logo Papua Barat Daya"
                width={34}
                height={34}
              />
            </div>
            <div>
              <h2 className="font-extrabold">Dukcapil & PMK</h2>
              <p className="text-sm text-white/70">Provinsi Papua Barat Daya</p>
            </div>
          </div>
          <p className="mt-5 text-sm leading-7 text-white/70">
            Kanal resmi berisi profil, data wilayah, fokus layanan, dan kontak
            Dinas Dukcapil dan PMK Provinsi Papua Barat Daya.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-pbd-gold">
            Navigasi
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-white/75">
            <li><Link href="/" className="hover:text-white">Beranda</Link></li>
            <li><Link href="/profil" className="hover:text-white">Profil Dinas</Link></li>
            <li><Link href="/data-wilayah" className="hover:text-white">Data Wilayah</Link></li>
            <li><Link href="/#layanan" className="hover:text-white">Layanan</Link></li>
            <li><Link href="/#kontak" className="hover:text-white">Kontak</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-pbd-gold">
            Kontak
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-white/75">
            <li className="flex gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-pbd-gold" />
              Kantor Gubernur Papua Barat Daya, Kota Sorong
            </li>
            <li className="flex gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-pbd-gold" />
              dukcapilpmk@papuabaratdaya.go.id
            </li>
            <li className="flex gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-pbd-gold" />
              Senin-Jumat, 08.00-16.00 WIT
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-sm text-white/60 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>© {year} Pemerintah Provinsi Papua Barat Daya.</p>
          <p>Website resmi Dinas Dukcapil dan PMK.</p>
        </div>
      </div>
    </footer>
  );
}
