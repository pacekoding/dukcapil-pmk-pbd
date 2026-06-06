"use client";

import Image from "next/image";
import Link from "next/link";

import { ExternalLink, Menu, Search, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { publicMenus } from "@/lib/navigation";

/* =========================
   COMPONENT
========================= */

export default function Navbar() {
  const pathname = usePathname();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 text-slate-900 backdrop-blur-md">
      <div
        className="
          mx-auto flex h-16 max-w-7xl
          items-center justify-between
          px-4 sm:px-6 lg:px-8
        "
      >
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100">
            <Image
              src="/logo-pbd.png"
              alt="Logo Papua Barat Daya"
              width={30}
              height={30}
              priority
            />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold leading-tight text-pbd-navy">
              Dukcapil & PMK
            </p>
            <p className="hidden text-xs font-medium text-slate-500 sm:block">
              Provinsi Papua Barat Daya
            </p>
          </div>
        </Link>

        <nav aria-label="Navigasi utama" className="hidden items-center gap-1 lg:flex">
          {publicMenus.map((menu) => {
            const active = isActive(menu.href);

            return (
              <Link
                key={menu.href}
                href={menu.href}
                className={`
                  rounded-md px-3 py-2 text-sm font-semibold transition
                  ${active ? "bg-blue-50 text-pbd-blue" : "text-slate-600 hover:bg-slate-100 hover:text-pbd-navy"}
                `}
              >
                {menu.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-10 rounded-md"
          >
            <Link href="/#search">
              <Search className="h-4 w-4" />
              Cari
            </Link>
          </Button>
          <Button asChild size="sm" className="h-10 rounded-md">
            <Link href="/login">
              Dashboard
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Tutup menu" : "Buka menu"}
          aria-expanded={mobileMenuOpen}
          className="
            flex h-10 w-10 items-center
            justify-center rounded-lg
            border border-slate-200
            bg-white transition
            hover:bg-slate-100
            lg:hidden
          "
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-slate-200 bg-white shadow-lg lg:hidden">
          <nav className="flex flex-col px-6 py-6">
            {publicMenus.map((menu) => {
              const active = isActive(menu.href);

              return (
                <Link
                  key={menu.href}
                  href={menu.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    rounded-lg px-4 py-3
                    text-sm font-medium transition
                    ${
                      active
                        ? "bg-blue-50 text-pbd-blue"
                        : "text-slate-700 hover:bg-slate-100 hover:text-pbd-navy"
                    }
                  `}
                >
                  {menu.label}
                </Link>
              );
            })}
            <div className="mt-4 grid gap-2 border-t border-slate-200 pt-4">
              <Button asChild variant="outline" className="justify-start">
                <Link href="/#search" onClick={() => setMobileMenuOpen(false)}>
                  <Search className="h-4 w-4" />
                  Cari Informasi
                </Link>
              </Button>
              <Button asChild className="justify-start">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <ExternalLink className="h-4 w-4" />
                  Masuk Dashboard
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
