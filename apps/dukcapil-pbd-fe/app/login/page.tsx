"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LockKeyhole,
  ShieldCheck,
  User,
} from "lucide-react";

import { getCurrentTahunAnggaran } from "@/lib/tahun-anggaran";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [tahunAnggaran] = useState(getCurrentTahunAnggaran);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

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

      if (!response.ok) {
        setError(result.message || "Login gagal");
        return;
      }

      router.push("/portal");
      router.refresh();
    } catch (loginError) {
      console.error(loginError);
      setError("Terjadi kesalahan server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative h-svh max-h-svh overflow-hidden bg-[#061A3D] text-white">
      <div className="absolute inset-0">
        <Image
          src="/hero-pbd.png"
          alt="Kantor Pemerintah Papua Barat Daya"
          fill
          priority
          className="object-cover opacity-18"
        />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_88%,rgba(37,99,235,0.18),transparent_28%),radial-gradient(circle_at_96%_5%,rgba(96,165,250,0.14),transparent_24%),linear-gradient(115deg,#061B3E_0%,#0C2C5D_46%,#061A3D_100%)]" />
      <div className="absolute left-0 top-20 hidden h-[560px] w-20 bg-[radial-gradient(circle,rgba(148,163,184,0.34)_1px,transparent_1.5px)] bg-[length:14px_14px] opacity-25 lg:block" />
      <div className="absolute left-[36%] top-[-120px] h-96 w-96 rounded-full bg-white/5 blur-sm" />
      <div className="absolute bottom-[-180px] left-40 h-96 w-96 rounded-full bg-blue-500/10 blur-2xl" />

      <Link
        href="/"
        className="absolute left-4 top-4 z-20 inline-flex h-10 items-center gap-2 rounded-xl border border-white/25 bg-white/5 px-4 text-sm font-bold text-white/90 backdrop-blur transition hover:bg-white/10 sm:left-8 sm:top-8 sm:h-12 sm:px-5 lg:left-12"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Portal
      </Link>

      <section className="relative z-10 mx-auto grid h-svh w-full max-w-[1440px] items-center gap-8 px-4 pt-16 pb-5 sm:px-8 sm:pt-20 sm:pb-7 lg:grid-cols-[minmax(0,1fr)_minmax(420px,560px)] lg:px-12 lg:py-8 xl:gap-14">
        <div className="hidden max-w-2xl lg:block">
          <div className="inline-flex items-center gap-2 rounded-2xl bg-blue-600/35 px-4 py-2.5 text-base font-extrabold shadow-[0_20px_50px_rgba(37,99,235,0.18)] backdrop-blur">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0D3574] text-amber-300 ring-1 ring-white/10">
              <ShieldCheck className="h-4 w-4" />
            </span>
            Dashboard Admin
          </div>

          <h1 className="mt-6 max-w-2xl text-4xl font-extrabold leading-[1.12] tracking-tight text-white drop-shadow-sm xl:text-5xl">
            Dukcapil & PMK Papua Barat Daya
          </h1>

          <div className="mt-7 h-1 w-20 rounded-full bg-[#F5B23D]" />

          <p className="mt-6 max-w-xl text-base leading-8 text-white/76 xl:text-lg">
            Portal internal untuk pengelolaan statistik, data wilayah, dan
            monitoring layanan Pemerintah Provinsi Papua Barat Daya.
          </p>

          <div className="mt-9 flex max-w-[370px] items-center gap-4 rounded-2xl border border-white/12 bg-white/10 p-5 shadow-[0_22px_70px_rgba(0,0,0,0.18)] backdrop-blur">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-500/20 text-sky-300">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">
                Akses aman dan terbatas
              </h2>
              <p className="mt-1.5 text-sm leading-6 text-white/72">
                Gunakan kredensial operator yang sudah terdaftar untuk masuk.
              </p>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[520px]">
          <section className="rounded-[24px] bg-white px-5 py-6 text-[#102B4E] shadow-[0_32px_100px_rgba(0,0,0,0.28)] sm:px-8 sm:py-8 lg:px-12 lg:py-10">
            <div className="flex items-start justify-between gap-5">
              <Image
                src="/logo-pbd.png"
                alt="Logo Papua Barat Daya"
                width={88}
                height={88}
                priority
                className="h-16 w-16 object-contain sm:h-[72px] sm:w-[72px]"
              />
              <span className="mt-4 rounded-full bg-amber-100 px-3.5 py-1.5 text-xs font-extrabold text-[#102B4E] sm:mt-5">
                Internal
              </span>
            </div>

            <div className="mt-4">
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Masuk Akun
              </h2>
              <p className="mt-2 text-base font-medium text-slate-500">
                Dukcapil & PMK Papua Barat Daya
              </p>
            </div>

            <div className="mt-6 h-px bg-slate-200" />

            <form onSubmit={handleLogin} className="mt-6">
              {error ? (
                <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  <p>{error}</p>
                </div>
              ) : null}

              <div>
                <label
                  htmlFor="username"
                  className="mb-2 block text-sm font-extrabold text-[#102B4E]"
                >
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="Masukkan username"
                    autoComplete="username"
                    disabled={loading}
                    className="h-12 w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 disabled:cursor-not-allowed disabled:opacity-70 sm:h-13 sm:text-base"
                  />
                </div>
              </div>

              <div className="mt-5">
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-extrabold text-[#102B4E]"
                >
                  Password
                </label>
                <div className="relative">
                  <LockKeyhole className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Masukkan password"
                    autoComplete="current-password"
                    disabled={loading}
                    className="h-12 w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-12 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 disabled:cursor-not-allowed disabled:opacity-70 sm:h-13 sm:text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    disabled={loading}
                    aria-label={
                      showPassword
                        ? "Sembunyikan password"
                        : "Tampilkan password"
                    }
                    className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-[#102B4E] disabled:cursor-not-allowed"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  className="text-sm font-bold text-blue-700 transition hover:text-[#102B4E]"
                >
                  Lupa kata sandi?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-7 flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-[#0B2E68] px-5 text-base font-extrabold text-white shadow-[0_18px_32px_rgba(11,46,104,0.25)] transition hover:bg-[#082752] focus:outline-none focus:ring-4 focus:ring-blue-600/20 disabled:cursor-not-allowed disabled:opacity-70 sm:h-13"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    Masuk Portal
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>
          </section>

          <div className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-white/62">
            <Lock className="h-4 w-4" />
            Sesi Anda aman dan terenkripsi.
          </div>
        </div>
      </section>
    </main>
  );
}
