// components/dashboard/topbar.tsx

"use client";

import { CalendarDays, KeyRound, LogOut, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type DashboardTopbarProps = {
  setMobileOpen: (value: boolean) => void;
};

type SessionUser = {
  name: string;
  role: string;
};

const menuTitles: Record<
  string,
  {
    title: string;
    description: string;
  }
> = {
  "/dashboard": {
    title: "Dashboard",
    description: "Overview statistik dan administrasi sistem",
  },

  "/dashboard/data-wilayah": {
    title: "Data Wilayah",
    description: "Kelola statistik kabupaten/kota untuk halaman website",
  },

  "/dashboard/ssd": {
    title: "Data SSD",
    description: "Kelola master SSD melalui import XLSX dan pemutakhiran data",
  },

  "/dashboard/subkegiatan": {
    title: "Subkegiatan",
    description: "Kelola master subkegiatan berdasarkan tahun anggaran",
  },

  "/dashboard/realisasi-subkegiatan": {
    title: "Realisasi Subkegiatan",
    description: "Kelola realisasi, foto dokumentasi, dan dokumen pendukung",
  },

  "/dashboard/users": {
    title: "User Admin",
    description: "Kelola akun admin dan akses dashboard",
  },

  "/dashboard/akun": {
    title: "Akun",
    description: "Pengaturan keamanan akun login",
  },
};

function getPageInfo(pathname: string) {
  if (menuTitles[pathname]) {
    return menuTitles[pathname];
  }

  if (pathname.startsWith("/dashboard/data-wilayah")) {
    return menuTitles["/dashboard/data-wilayah"];
  }

  if (pathname.startsWith("/dashboard/subkegiatan")) {
    return menuTitles["/dashboard/subkegiatan"];
  }

  if (pathname.startsWith("/dashboard/ssd")) {
    return menuTitles["/dashboard/ssd"];
  }

  if (pathname.startsWith("/dashboard/realisasi-subkegiatan")) {
    return menuTitles["/dashboard/realisasi-subkegiatan"];
  }

  return {
    title: "Dashboard",
    description: "Dashboard Admin Papua Barat Daya",
  };
}

export default function DashboardTopbar({
  setMobileOpen,
}: DashboardTopbarProps) {
  const pathname = usePathname();

  const pageInfo = getPageInfo(pathname);

  const [tahunAnggaran, setTahunAnggaran] = useState("2026");
  const [user, setUser] = useState<SessionUser>({
    name: "Admin PBD",
    role: "superadmin",
  });

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      try {
        const response = await fetch("/api/auth/session", {
          cache: "no-store",
        });

        const result = await response.json();

        if (mounted && result.tahunAnggaran) {
          setTahunAnggaran(result.tahunAnggaran);
        }

        if (mounted && result.user) {
          setUser({
            name: result.user.name,
            role: result.user.role,
          });
        }
      } catch (error) {
        console.error(error);
      }
    };

    void loadSession();

    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });

      window.location.href = "/login";
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <header
      className="
        sticky top-0 z-30
        border-b border-slate-200
        bg-white/95 backdrop-blur
      "
    >
      <div
        className="
          flex h-14 items-center
          justify-between
          gap-4 px-4
          lg:px-8
        "
      >
        <div className="flex items-center gap-4">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setMobileOpen(true)}
            className="
              h-9 w-9
              rounded-md
              lg:hidden
            "
            aria-label="Buka sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="min-w-0">
            <h1
              className="
                truncate font-heading
                text-lg font-semibold
                text-slate-900
                lg:text-xl
              "
            >
              {pageInfo.title}
            </h1>

            <p
              className="
                mt-0.5 hidden
                truncate text-sm
                text-slate-500 sm:block
              "
            >
              {pageInfo.description}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div
            className="
              flex h-8 items-center
              gap-2 rounded-md
              border border-slate-200
              bg-slate-50 px-3
              text-sm font-semibold
              text-slate-700
            "
          >
            <CalendarDays className="h-4 w-4 text-slate-500" />
            <span className="hidden text-slate-500 sm:inline">TA</span>
            <span>{tahunAnggaran}</span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="
                  flex h-9 items-center
                  gap-2 rounded-md
                  px-1.5 pr-3
                  transition
                  hover:bg-slate-50
                "
                type="button"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback
                    className="
                      bg-[#072B61]
                      text-xs
                      font-bold
                      text-white
                    "
                  >
                    AP
                  </AvatarFallback>
                </Avatar>

                <div className="hidden min-w-0 text-left md:block">
                  <p className="text-sm font-semibold leading-4 text-slate-900">
                    {user.name}
                  </p>

                  <p className="text-xs leading-4 text-slate-500">
                    {user.role.replaceAll("_", " ")}
                  </p>
                </div>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-52 rounded-lg">
              <DropdownMenuItem asChild>
                <Link href="/dashboard/akun" className="cursor-pointer">
                  <KeyRound className="mr-2 h-4 w-4" />
                  Ganti Password
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={handleLogout}
                className="
                  cursor-pointer
                  text-red-600
                  focus:text-red-600
                "
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
