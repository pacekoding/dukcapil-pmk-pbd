// app/login/page.tsx

"use client";

import Image from "next/image";

import Link from "next/link";

import { useRouter } from "next/navigation";

import { useState } from "react";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  User,
} from "lucide-react";

import {
  getCurrentTahunAnggaran,
  getTahunAnggaranOptions,
} from "@/lib/tahun-anggaran";

const tahunAnggaranOptions = getTahunAnggaranOptions();

export default function LoginPage() {
  const router = useRouter();

  /* =========================
     STATE
  ========================= */

  const [username, setUsername] = useState("");

  const [password, setPassword] = useState("");

  const [tahunAnggaran, setTahunAnggaran] = useState(getCurrentTahunAnggaran);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  /* =========================
     LOGIN
  ========================= */

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    /* RESET ERROR */

    setError("");

    /* VALIDATION */

    if (!username.trim()) {
      setError("Username wajib diisi");

      return;
    }

    if (!password.trim()) {
      setError("Password wajib diisi");

      return;
    }

    if (!tahunAnggaran) {
      setError("Tahun anggaran wajib dipilih");

      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/auth/login", {
        method: "POST",

        credentials: "include",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          username,
          password,
          tahunAnggaran,
        }),
      });

      const result = await response.json();

      /* ERROR */

      if (!response.ok) {
        setError(result.message || "Login gagal");

        return;
      }

      /* SUCCESS */

      router.push("/dashboard");

      router.refresh();
    } catch (error) {
      console.error(error);

      setError("Terjadi kesalahan server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="
        relative min-h-screen
        overflow-hidden bg-pbd-navy
        px-4 py-6
        text-pbd-navy
        sm:px-6 lg:px-8
      "
    >
      <div
        className="
          absolute inset-0
          opacity-25
        "
      >
        <Image
          src="/hero-pbd.png"
          alt="Papua Barat Daya"
          fill
          priority
          className="object-cover"
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-br from-pbd-navy/95 via-[#082a5b]/90 to-[#041c42]/95" />

      <div className="absolute inset-x-0 top-0 h-40 bg-pbd-gold/10 blur-3xl" />

      <section
        className="
          relative z-10 mx-auto grid
          min-h-[calc(100vh-3rem)]
          w-full max-w-6xl
          items-center gap-8
          lg:grid-cols-[1fr_440px]
        "
      >
        {/* BRAND */}

        <div className="hidden text-white lg:block">
          <Link
            href="/"
            className="
              inline-flex items-center
              gap-2 rounded-full
              border border-white/15
              bg-white/10 px-4 py-2
              text-sm font-medium
              text-white/85
              backdrop-blur
              transition hover:bg-white/15
              hover:text-white
            "
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Portal
          </Link>

          <div className="mt-14 flex items-center gap-5">
            <div
              className="
                flex h-20 w-20
                items-center justify-center
                rounded-lg
                bg-white
                shadow-2xl shadow-black/20
              "
            >
              <Image
                src="/logo-pbd.png"
                alt="Logo Papua Barat Daya"
                width={56}
                height={56}
                priority
              />
            </div>

            <div>
              <p className="text-sm font-semibold uppercase text-pbd-gold">
                Dashboard Admin
              </p>

              <h1
                className="
                  mt-2 max-w-2xl
                  font-heading text-5xl
                  font-extrabold
                  leading-tight
                  text-white
                "
              >
                Dukcapil & PMK Papua Barat Daya
              </h1>
            </div>
          </div>

          <p
            className="
              mt-8 max-w-2xl
              text-lg leading-8
              text-white/75
            "
          >
            Portal internal untuk pengelolaan statistik, data wilayah, dan
            monitoring layanan Pemerintah Provinsi Papua Barat Daya.
          </p>

          <div className="mt-10 grid max-w-2xl gap-4 sm:grid-cols-2">
            <div
              className="
                rounded-lg
                border border-white/10
                bg-white/10 p-5
                backdrop-blur
              "
            >
              <ShieldCheck className="h-6 w-6 text-pbd-gold" />

              <p className="mt-4 font-semibold">Akses Terbatas</p>

              <p className="mt-2 text-sm leading-6 text-white/65">
                Gunakan kredensial operator yang sudah terdaftar.
              </p>
            </div>

            <div
              className="
                rounded-lg
                border border-white/10
                bg-white/10 p-5
                backdrop-blur
              "
            >
              <LockKeyhole className="h-6 w-6 text-pbd-gold" />

              <p className="mt-4 font-semibold">Keamanan Sesi</p>

              <p className="mt-2 text-sm leading-6 text-white/65">
                Sesi masuk dikelola langsung oleh sistem autentikasi.
              </p>
            </div>
          </div>
        </div>

        {/* FORM */}

        <div
          className="
            w-full overflow-hidden
            rounded-lg
            border border-white/20
            bg-white shadow-2xl
            shadow-black/25
          "
        >
          <div
            className="
              border-b border-slate-100
              bg-gradient-to-br
              from-white to-slate-50
              px-6 py-7
              sm:px-8
            "
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className="
                    flex h-14 w-14
                    items-center justify-center
                    rounded-lg
                    bg-pbd-navy/5
                  "
                >
                  <Image
                    src="/logo-pbd.png"
                    alt="Logo Papua Barat Daya"
                    width={40}
                    height={40}
                    priority
                  />
                </div>

                <div>
                  <p className="text-sm font-semibold text-pbd-blue">
                    Dashboard Admin
                  </p>

                  <h2
                    className="
                      mt-1 font-heading
                      text-2xl font-bold
                      text-pbd-navy
                    "
                  >
                    Masuk Akun
                  </h2>
                </div>
              </div>

              <div
                className="
                  hidden rounded-full
                  bg-pbd-gold/20
                  px-3 py-1
                  text-xs font-semibold
                  text-pbd-navy
                  sm:block
                "
              >
                Internal
              </div>
            </div>

            <p className="mt-5 text-sm leading-6 text-slate-500">
              Dukcapil & PMK Provinsi Papua Barat Daya
            </p>
          </div>

          <form onSubmit={handleLogin} className="px-6 py-7 sm:px-8">
            {/* ERROR */}

            {error && (
              <div
                className="
                  mb-6 flex items-start
                  gap-3 rounded-lg
                  border border-red-200
                  bg-red-50
                  px-4 py-4
                  text-sm text-red-700
                "
              >
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />

                <p>{error}</p>
              </div>
            )}

            {/* USERNAME */}

            <div>
              <label
                htmlFor="username"
                className="
                  mb-2 block text-sm
                  font-semibold
                  text-slate-700
                "
              >
                Username
              </label>

              <div className="relative">
                <User
                  className="
                    absolute left-4 top-1/2
                    h-5 w-5
                    -translate-y-1/2
                    text-slate-400
                  "
                />

                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  autoComplete="username"
                  disabled={loading}
                  className="
                    h-14 w-full
                    rounded-lg
                    border border-slate-200
                    bg-slate-50
                    py-4 pl-12 pr-4
                    text-slate-900
                    outline-none
                    transition
                    placeholder:text-slate-400
                    focus:border-pbd-blue
                    focus:bg-white
                    focus:ring-4
                    focus:ring-pbd-blue/10
                    disabled:cursor-not-allowed
                    disabled:opacity-70
                  "
                />
              </div>
            </div>

            {/* PASSWORD */}

            <div className="mt-5">
              <label
                htmlFor="password"
                className="
                  mb-2 block text-sm
                  font-semibold
                  text-slate-700
                "
              >
                Password
              </label>

              <div className="relative">
                <LockKeyhole
                  className="
                    absolute left-4 top-1/2
                    h-5 w-5
                    -translate-y-1/2
                    text-slate-400
                  "
                />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                  disabled={loading}
                  className="
                    h-14 w-full
                    rounded-lg
                    border border-slate-200
                    bg-slate-50
                    py-4 pl-12 pr-14
                    text-slate-900
                    outline-none
                    transition
                    placeholder:text-slate-400
                    focus:border-pbd-blue
                    focus:bg-white
                    focus:ring-4
                    focus:ring-pbd-blue/10
                    disabled:cursor-not-allowed
                    disabled:opacity-70
                  "
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  disabled={loading}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  className="
                    absolute right-3 top-1/2
                    flex h-10 w-10
                    -translate-y-1/2
                    items-center justify-center
                    rounded-xl
                    text-slate-400
                    transition hover:bg-slate-100
                    hover:text-pbd-navy
                    disabled:cursor-not-allowed
                  "
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* TAHUN ANGGARAN */}

            <div className="mt-5">
              <label
                htmlFor="tahunAnggaran"
                className="
                  mb-2 block text-sm
                  font-semibold
                  text-slate-700
                "
              >
                Tahun Anggaran
              </label>

              <div className="relative">
                <CalendarDays
                  className="
                    absolute left-4 top-1/2
                    h-5 w-5
                    -translate-y-1/2
                    text-slate-400
                  "
                />

                <select
                  id="tahunAnggaran"
                  value={tahunAnggaran}
                  onChange={(event) => setTahunAnggaran(event.target.value)}
                  disabled={loading}
                  className="
                    h-14 w-full
                    appearance-none
                    rounded-lg
                    border border-slate-200
                    bg-slate-50
                    py-4 pl-12 pr-12
                    text-slate-900
                    outline-none
                    transition
                    focus:border-pbd-blue
                    focus:bg-white
                    focus:ring-4
                    focus:ring-pbd-blue/10
                    disabled:cursor-not-allowed
                    disabled:opacity-70
                  "
                >
                  {tahunAnggaranOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>

                <span
                  className="
                    pointer-events-none
                    absolute right-4 top-1/2
                    -translate-y-1/2
                    text-sm text-slate-400
                  "
                >
                  TA
                </span>
              </div>
            </div>

            {/* BUTTON */}

            <button
              type="submit"
              disabled={loading}
              className="
                mt-7 flex h-14 w-full
                items-center justify-center
                gap-3 rounded-lg
                bg-pbd-navy
                px-6
                font-semibold text-white
                shadow-lg
                shadow-pbd-blue/10
                transition
                hover:opacity-95
                focus:outline-none
                focus:ring-4
                focus:ring-pbd-blue/20
                disabled:cursor-not-allowed
                disabled:opacity-70
              "
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  Masuk Dashboard
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>

            <Link
              href="/"
              className="
                mt-6 flex items-center
                justify-center gap-2
                text-sm font-semibold
                text-pbd-blue
                transition hover:text-pbd-navy
                lg:hidden
              "
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Portal
            </Link>
          </form>
        </div>
      </section>
    </main>
  );
}
