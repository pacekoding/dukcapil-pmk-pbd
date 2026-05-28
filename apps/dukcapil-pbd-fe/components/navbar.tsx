"use client";

import Image from "next/image";
import Link from "next/link";

import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { publicMenus } from "@/lib/dummy/navigation-data";

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
    <header
      className="
        sticky top-0 z-50
        border-b border-white/10
        bg-pbd-navy/95 text-white
        backdrop-blur-md
      "
    >
      <div
        className="
          mx-auto flex h-20 max-w-7xl
          items-center justify-between
          px-6
        "
      >
        {/* LEFT */}
        <Link href="/" className="flex min-w-0 items-center gap-4">
          {/* LOGO */}
          <div
            className="
              flex h-14 w-14 shrink-0
              items-center justify-center
              rounded-full bg-white/10
            "
          >
            <Image
              src="/logo-pbd.png"
              alt="Logo Papua Barat Daya"
              width={36}
              height={36}
              priority
            />
          </div>

          {/* TITLE */}
          <div className="hidden min-w-0 xl:block">
            <h1
              className="
                max-w-md truncate
                text-sm font-bold
                uppercase leading-tight
              "
            >
              Dinas Kependudukan dan Pencatatan Sipil
              <br />
              dan Pemberdayaan Masyarakat dan Kampung
            </h1>

            <p className="text-sm text-white/70">Provinsi Papua Barat Daya</p>
          </div>
        </Link>

        {/* DESKTOP MENU */}
        <nav className="hidden items-center gap-6 lg:flex">
          {publicMenus.map((menu) => {
            const active = isActive(menu.href);

            return (
              <Link
                key={menu.href}
                href={menu.href}
                className={`
                  relative whitespace-nowrap
                  text-sm font-medium transition
                  ${active ? "text-pbd-gold" : "text-white/80 hover:text-white"}
                `}
              >
                {menu.label}

                {/* ACTIVE INDICATOR */}
                {active && (
                  <span
                    className="
                      absolute -bottom-2 left-0
                      h-0.5 w-full rounded-full
                      bg-pbd-gold
                    "
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* MOBILE BUTTON */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle mobile menu"
          className="
            flex h-10 w-10 items-center
            justify-center rounded-lg
            border border-white/10
            bg-white/5 transition
            hover:bg-white/10
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

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
        <div className="border-t border-white/10 bg-pbd-navy lg:hidden">
          <nav className="flex flex-col px-6 py-6">
            {publicMenus.map((menu) => {
              const active = isActive(menu.href);

              return (
                <Link
                  key={menu.href}
                  href={menu.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    rounded-xl px-4 py-3
                    text-sm font-medium transition
                    ${
                      active
                        ? "bg-white/10 text-pbd-gold"
                        : "text-white/80 hover:bg-white/5 hover:text-white"
                    }
                  `}
                >
                  {menu.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
