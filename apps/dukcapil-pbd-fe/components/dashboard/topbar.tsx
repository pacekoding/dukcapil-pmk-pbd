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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getCurrentTahunAnggaran,
  getTahunAnggaranOptions,
} from "@/lib/tahun-anggaran";
import { formatAdminRole } from "@/types/admin-user";

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
  "/internal/dashboard": {
    title: "Dashboard",
    description: "Ringkasan data agregat prioritas Dukcapil dan PMK",
  },
  "/internal/otsus": {
    title: "Labelisasi Otsus",
    description: "Kelola data subkegiatan yang menggunakan Dana Otonomi Khusus.",
  },

  "/internal/pmk/bum-kampung": {
    title: "Data BUM Kampung",
    description:
      "Kelola data BUM Kampung berdasarkan kabupaten/kota, distrik, kampung, kategori, dan status verifikasi.",
  },
  "/internal/pmk/data-kampung": {
    title: "Data Kampung IDM",
    description: "Kelola IKS, IKE, IKL, nilai IDM, dan status IDM",
  },

  "/internal/pmk/kelompok-binaan": {
    title: "Data Kelompok Binaan",
    description: "Kelola data kelompok binaan pada lokus Program TEKAD",
  },

  "/internal/pmk/kelompok-binaan/capaian-kendala": {
    title: "Capaian & Kendala",
    description:
      "Kelola riwayat capaian dan kendala kelompok binaan Program TEKAD",
  },

  "/internal/dukcapil/kependudukan": {
    title: "Data Kependudukan",
    description: "Kelola data kependudukan dan OAP per kabupaten/kota",
  },

  "/internal/dukcapil/pendaftaran-penduduk": {
    title: "Pendaftaran Penduduk",
    description:
      "Kelola data agregat layanan pendaftaran penduduk per kabupaten/kota",
  },

  "/internal/dukcapil/pencatatan-sipil": {
    title: "Pencatatan Sipil",
    description: "Kelola data agregat pencatatan sipil per kabupaten/kota",
  },

  "/internal/pegawai": {
    title: "Data Pegawai",
    description: "Kelola biodata dan status pegawai",
  },

  "/internal/arsip": {
    title: "Data Arsip",
    description: "Cari dan filter seluruh dokumen kepegawaian",
  },

  "/internal/pengaturan/pengguna": {
    title: "Pengguna Portal",
    description: "Kelola pengguna internal dan role akses",
  },

  "/internal/pengaturan/struktur-organisasi": {
    title: "Struktur Organisasi",
    description: "Kelola master bidang, seksi, dan jabatan pegawai",
  },

  "/internal/pengaturan/subkegiatan": {
    title: "Subkegiatan",
    description: "Kelola data subkegiatan",
  },

  "/internal/pengaturan/kab-kota": {
    title: "Data Kab/Kota",
    description: "Kelola master data kabupaten/kota",
  },

  "/internal/pengaturan/data-wilayah-release": {
    title: "Publikasi Website",
    description: "Atur tahun data wilayah yang ditampilkan ke publik",
  },
};

function getPageInfo(pathname: string) {
  if (pathname.startsWith("/internal/otsus")) {
    return menuTitles["/internal/otsus"];
  }
  if (menuTitles[pathname]) {
    return menuTitles[pathname];
  }

  if (pathname.startsWith("/internal/pmk/bum-kampung")) {
    return menuTitles["/internal/pmk/bum-kampung"];
  }

  if (pathname.startsWith("/internal/pmk/data-kampung")) {
    return menuTitles["/internal/pmk/data-kampung"];
  }

  if (pathname.startsWith("/internal/pmk/kelompok-binaan/capaian-kendala")) {
    return menuTitles["/internal/pmk/kelompok-binaan/capaian-kendala"];
  }

  if (pathname.startsWith("/internal/pmk/kelompok-binaan")) {
    return menuTitles["/internal/pmk/kelompok-binaan"];
  }

  if (pathname.startsWith("/internal/pengaturan/pengguna")) {
    return menuTitles["/internal/pengaturan/pengguna"];
  }

  if (pathname.startsWith("/internal/pengaturan/subkegiatan")) {
    return menuTitles["/internal/pengaturan/subkegiatan"];
  }

  if (pathname.startsWith("/internal/pengaturan/kab-kota")) {
    return menuTitles["/internal/pengaturan/kab-kota"];
  }

  if (pathname.startsWith("/internal/dukcapil/kependudukan")) {
    return menuTitles["/internal/dukcapil/kependudukan"];
  }

  if (pathname.startsWith("/internal/dukcapil/pendaftaran-penduduk")) {
    return menuTitles["/internal/dukcapil/pendaftaran-penduduk"];
  }

  if (pathname.startsWith("/internal/dukcapil/pencatatan-sipil")) {
    return menuTitles["/internal/dukcapil/pencatatan-sipil"];
  }

  if (pathname.startsWith("/internal/pegawai")) {
    return menuTitles["/internal/pegawai"];
  }

  if (pathname.startsWith("/internal/arsip")) {
    return menuTitles["/internal/arsip"];
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
      window.location.href = "/internal/dashboard";
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
                aria-label={`Buka menu akun ${user.name}`}
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
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>

                <div className="hidden min-w-0 text-left md:block">
                  <p className="text-sm font-semibold leading-4 text-slate-900">
                    {user.name}
                  </p>

                  <p className="text-xs leading-4 text-slate-500">
                    {formatAdminRole(user.role)}
                  </p>
                </div>
                <ChevronDown className="hidden h-4 w-4 text-slate-400 md:block" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56 rounded-lg">
              <DropdownMenuLabel className="px-3 py-2">
                <span className="block truncate text-sm font-semibold text-slate-800">
                  {user.name}
                </span>
                <span className="mt-0.5 block text-xs font-normal text-slate-500">
                  {formatAdminRole(user.role)}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
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

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "AP";

  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}
