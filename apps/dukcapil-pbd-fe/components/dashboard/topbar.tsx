// components/dashboard/topbar.tsx

"use client";

import { CalendarDays, ChevronDown, Loader2, LogOut, Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getCurrentTahunAnggaran,
  getTahunAnggaranOptions,
} from "@/lib/tahun-anggaran";

type DashboardTopbarProps = {
  setMobileOpen: (value: boolean) => void;
};

type SessionUser = {
  name: string;
  role: string;
};

const tahunAnggaranOptions = getTahunAnggaranOptions();

const menuTitles: Record<
  string,
  {
    title: string;
    description: string;
  }
> = {
  "/portal": {
    title: "Portal Aplikasi",
    description: "Pilih sistem internal yang ingin digunakan",
  },

  "/dashboard": {
    title: "Dashboard",
    description: "Ringkasan data agregat prioritas Dukcapil dan PMK",
  },

  "/settings": {
    title: "Dashboard",
    description: "Pusat pengaturan super admin",
  },

  "/sibum/dashboard": {
    title: "SIBUM Kampung",
    description: "Sistem Informasi BUM Kampung",
  },

  "/maceku-pkk/dashboard": {
    title: "MACEKU PKK",
    description: "Manajemen profil organisasi dan arsip PKK",
  },

  "/maceku-pkk/data": {
    title: "Profil PKK",
    description: "Kelola profil organisasi PKK beserta wilayah dan arsipnya",
  },

  "/sibum/data": {
    title: "Data BUMKam",
    description:
      "Kelola data BUM Kampung berdasarkan kabupaten/kota, distrik, kampung, kategori, dan status verifikasi.",
  },

  "/sikampung/dashboard": {
    title: "SIKAMPUNG",
    description: "Sistem Informasi Kampung IDM",
  },

  "/sikampung/data": {
    title: "Data Kampung IDM",
    description: "Kelola IKS, IKE, IKL, nilai IDM, dan status IDM",
  },

  "/sitekad/dashboard": {
    title: "SiTEKAD",
    description: "Sistem Informasi Tekad",
  },

  "/sitekad/data": {
    title: "Data Potensi Kampung",
    description: "Kelola data evaluasi dan potensi kampung",
  },

  "/aspirasiku/dashboard": {
    title: "ASPIRASIKU",
    description: "Sistem aspirasi anonim",
  },

  "/aspirasiku/data": {
    title: "Data Aspirasi",
    description: "Kelola pesan aspirasi anonim dari website",
  },

  "/dashboard/SDD": {
    title: "SSD",
    description: "Kelola master SSD melalui import XLSX dan pemutakhiran data",
  },

  "/dashboard/subkegiatan": {
    title: "Subkegiatan",
    description: "Kelola master subkegiatan berdasarkan tahun anggaran",
  },

  "/sidoka/data": {
    title: "Data Pelaksanaan",
    description: "Kelola dokumen pelaksanaan kegiatan dan relasi DSSD",
  },

  "/sidoka/dashboard": {
    title: "SIDOKA",
    description: "Sistem Informasi Dokumen Kegiatan",
  },

  "/sidak/dashboard": {
    title: "SIDAK",
    description: "Sistem Informasi Data Kegiatan Dukcapil",
  },

  "/sidak/data": {
    title: "Data Pelaksanaan",
    description: "Kelola dokumen pelaksanaan kegiatan Dukcapil dan relasi DSSD",
  },

  "/siber/dashboard": {
    title: "SIRBE",
    description: "Dashboard Data Dukcapil",
  },

  "/siber/data": {
    title: "Data Dukcapil",
    description:
      "Kelola data kependudukan, pencatatan sipil, dan OAP per kabupaten/kota",
  },

  "/simonev/dashboard": {
    title: "SIMONEV DUKCAPIL",
    description: "Sistem informasi monitoring dan evaluasi data SSD",
  },

  "/simonev/data": {
    title: "Form Monev SSD",
    description: "Buat dan cetak formulir monitoring evaluasi data SSD",
  },

  "/optima-info/dashboard": {
    title: "OPTIMA-INFO",
    description: "Kelola informasi aktif yang tampil di website publik",
  },

  "/optima-info/create": {
    title: "Tambah Informasi",
    description: "Buat draft informasi baru untuk website publik",
  },

  "/arsipku/dashboard": {
    title: "Dashboard ARSIPKU",
    description: "Ringkasan data pegawai dan dokumen kepegawaian",
  },

  "/arsipku/data-pegawai": {
    title: "Data Pegawai",
    description: "Kelola biodata dan status pegawai",
  },

  "/arsipku/data-arsip": {
    title: "Data Arsip",
    description: "Cari dan filter seluruh dokumen kepegawaian",
  },

  "/dashboard/users": {
    title: "User",
    description: "Kelola pengguna internal dan role akses",
  },

  "/dashboard/kab-kota": {
    title: "Data Kab/Kota",
    description: "Kelola master data kabupaten/kota",
  },
};

function getPageInfo(pathname: string) {
  if (menuTitles[pathname]) {
    return menuTitles[pathname];
  }

  if (pathname.startsWith("/portal")) {
    return menuTitles["/portal"];
  }

  if (pathname === "/dashboard") {
    return menuTitles["/dashboard"];
  }

  if (pathname === "/settings") {
    return menuTitles["/settings"];
  }

  if (pathname.startsWith("/sibum/dashboard")) {
    return menuTitles["/sibum/dashboard"];
  }

  if (pathname.startsWith("/maceku-pkk/dashboard")) {
    return menuTitles["/maceku-pkk/dashboard"];
  }

  if (
    pathname.startsWith("/maceku-pkk/data") ||
    pathname.startsWith("/maceku-pkk/")
  ) {
    return menuTitles["/maceku-pkk/data"];
  }

  if (pathname.startsWith("/sibum/data")) {
    return menuTitles["/sibum/data"];
  }

  if (pathname.startsWith("/sikampung/dashboard")) {
    return menuTitles["/sikampung/dashboard"];
  }

  if (pathname.startsWith("/sikampung/data")) {
    return menuTitles["/sikampung/data"];
  }

  if (pathname.startsWith("/sitekad/dashboard")) {
    return menuTitles["/sitekad/dashboard"];
  }

  if (pathname.startsWith("/sitekad/data")) {
    return menuTitles["/sitekad/data"];
  }

  if (pathname.startsWith("/aspirasiku/dashboard")) {
    return menuTitles["/aspirasiku/dashboard"];
  }

  if (pathname.startsWith("/aspirasiku/data")) {
    return menuTitles["/aspirasiku/data"];
  }

  if (pathname.startsWith("/dashboard/users")) {
    return menuTitles["/dashboard/users"];
  }

  if (pathname.startsWith("/dashboard/kab-kota")) {
    return menuTitles["/dashboard/kab-kota"];
  }

  if (pathname.startsWith("/sidoka/data")) {
    return menuTitles["/sidoka/data"];
  }

  if (pathname.startsWith("/sidoka/dashboard")) {
    return menuTitles["/sidoka/dashboard"];
  }

  if (pathname.startsWith("/sidak/dashboard")) {
    return menuTitles["/sidak/dashboard"];
  }

  if (pathname.startsWith("/sidak/data")) {
    return menuTitles["/sidak/data"];
  }

  if (pathname.startsWith("/siber/dashboard")) {
    return menuTitles["/siber/dashboard"];
  }

  if (pathname.startsWith("/siber/data")) {
    return menuTitles["/siber/data"];
  }

  if (pathname.startsWith("/simonev/dashboard")) {
    return menuTitles["/simonev/dashboard"];
  }

  if (pathname.startsWith("/simonev/data")) {
    return menuTitles["/simonev/data"];
  }

  if (pathname.startsWith("/optima-info/dashboard")) {
    return menuTitles["/optima-info/dashboard"];
  }

  if (pathname.startsWith("/optima-info/create")) {
    return menuTitles["/optima-info/create"];
  }

  if (pathname.startsWith("/optima-info/preview")) {
    return {
      title: "Preview Informasi",
      description: "Pratinjau informasi dengan viewer publik",
    };
  }

  if (pathname.startsWith("/optima-info/") && pathname.endsWith("/edit")) {
    return {
      title: "Edit Informasi",
      description: "Perbarui draft atau informasi yang sudah diterbitkan",
    };
  }

  if (pathname.startsWith("/arsipku/data-pegawai")) {
    return menuTitles["/arsipku/data-pegawai"];
  }

  if (pathname.startsWith("/arsipku/data-arsip")) {
    return menuTitles["/arsipku/data-arsip"];
  }

  if (pathname.startsWith("/arsipku")) {
    return menuTitles["/arsipku/dashboard"];
  }

  if (pathname.startsWith("/dashboard/subkegiatan")) {
    return menuTitles["/dashboard/subkegiatan"];
  }

  if (pathname.startsWith("/dashboard/SDD")) {
    return menuTitles["/dashboard/SDD"];
  }

  return {
    title: "Dashboard Internal",
    description: "Dashboard administrasi Dinas Dukcapil & PMK",
  };
}

export default function DashboardTopbar({
  setMobileOpen,
}: DashboardTopbarProps) {
  const pathname = usePathname();

  const pageInfo = getPageInfo(pathname);

  const [tahunAnggaran, setTahunAnggaran] = useState(getCurrentTahunAnggaran);
  const [pendingTahunAnggaran, setPendingTahunAnggaran] = useState<
    string | null
  >(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [switchingYear, setSwitchingYear] = useState(false);
  const [switchYearError, setSwitchYearError] = useState<string | null>(null);
  const [user, setUser] = useState<SessionUser>({
    name: "Admin PBD",
    role: "superadmin",
  });

  const yearOptions = useMemo(
    () =>
      Array.from(new Set([tahunAnggaran, ...tahunAnggaranOptions])).filter(
        Boolean,
      ),
    [tahunAnggaran],
  );

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

  const openSwitchYearConfirmation = (value: string) => {
    if (value === tahunAnggaran || switchingYear) {
      return;
    }

    setPendingTahunAnggaran(value);
    setSwitchYearError(null);
    setConfirmOpen(true);
  };

  const cancelSwitchYear = () => {
    if (switchingYear) {
      return;
    }

    setConfirmOpen(false);
    setPendingTahunAnggaran(null);
    setSwitchYearError(null);
  };

  const confirmSwitchYear = async () => {
    if (!pendingTahunAnggaran) {
      return;
    }

    try {
      setSwitchingYear(true);
      setSwitchYearError(null);

      const response = await fetch("/api/auth/switch-year", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tahunAnggaran: pendingTahunAnggaran,
        }),
      });

      const result = (await response.json().catch(() => null)) as {
        message?: string;
        tahunAnggaran?: string;
      } | null;

      if (!response.ok) {
        throw new Error(result?.message ?? "Tahun anggaran gagal diganti.");
      }

      setTahunAnggaran(result?.tahunAnggaran ?? pendingTahunAnggaran);
      window.location.href = "/portal";
    } catch (error) {
      console.error(error);
      setSwitchYearError(
        error instanceof Error
          ? error.message
          : "Tahun anggaran gagal diganti.",
      );
    } finally {
      setSwitchingYear(false);
    }
  };

  return (
    <header
      className="
        sticky top-0 z-30
        border-b border-slate-200
        bg-white/95 shadow-[0_1px_0_rgba(15,35,80,0.03)] backdrop-blur
      "
    >
      <div
        className="
          flex min-h-16 items-center
          justify-between
          gap-3 px-4 py-2
          lg:px-8
        "
      >
        <div className="flex min-w-0 items-center gap-3">
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

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="relative h-10 w-[118px] shrink-0 sm:w-[132px]">
            <div
              aria-hidden="true"
              className="
                pointer-events-none flex h-10 items-center
                gap-2 rounded-md border border-slate-200
                bg-slate-50 px-3 pr-8 text-sm
                font-semibold text-slate-800
              "
            >
              <CalendarDays className="h-4 w-4 shrink-0 text-slate-500" />
              <span className="text-slate-500">TA</span>
              <span className="tabular-nums">{tahunAnggaran}</span>
            </div>
            <select
              value={tahunAnggaran}
              onChange={(event) =>
                openSwitchYearConfirmation(event.target.value)
              }
              disabled={switchingYear}
              aria-label="Pilih tahun anggaran"
              className="
                absolute inset-0 h-10 w-full cursor-pointer
                appearance-none rounded-md border border-transparent
                bg-transparent px-3 text-transparent outline-none
                focus:border-pbd-blue focus:ring-2 focus:ring-pbd-blue/15
                disabled:cursor-not-allowed disabled:opacity-60
              "
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  Tahun Anggaran {year}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="
                  flex h-10 items-center
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

      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => !open && cancelSwitchYear()}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ganti Tahun Anggaran?</DialogTitle>
            <DialogDescription>
              Anda akan mengganti Tahun Anggaran dari {tahunAnggaran} ke{" "}
              {pendingTahunAnggaran}. Setelah dikonfirmasi, dashboard akan
              kembali ke halaman utama dan seluruh data dimuat berdasarkan tahun
              anggaran baru.
            </DialogDescription>
          </DialogHeader>

          {switchYearError ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {switchYearError}
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={cancelSwitchYear}
              disabled={switchingYear}
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={() => void confirmSwitchYear()}
              disabled={switchingYear}
            >
              {switchingYear ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Ya, Ganti
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
