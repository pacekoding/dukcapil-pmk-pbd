"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  CheckCircle2,
  Edit3,
  Lightbulb,
  MessageSquare,
  MoreHorizontal,
  RefreshCw,
  Send,
  ShieldCheck,
  SquarePen,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { submitWebsiteAspirasi } from "@/lib/api/aspirasiku";
import { cn } from "@/lib/utils";
import type { AspirasiJenis, AspirasiPayload } from "@/types/aspirasiku";
import { aspirasiJenisOptions } from "@/types/aspirasiku";

const maxIsiLength = 1000;

const jenisTones: Record<
  AspirasiJenis,
  {
    icon: typeof Lightbulb;
    className: string;
  }
> = {
  Saran: {
    icon: Lightbulb,
    className: "border-green-100 bg-green-50 text-green-700",
  },
  Masukan: {
    icon: SquarePen,
    className: "border-blue-100 bg-blue-50 text-blue-700",
  },
  Keluhan: {
    icon: AlertCircle,
    className: "border-orange-100 bg-orange-50 text-orange-700",
  },
  Pendapat: {
    icon: MessageSquare,
    className: "border-violet-100 bg-violet-50 text-violet-700",
  },
  Lainnya: {
    icon: MoreHorizontal,
    className: "border-slate-200 bg-slate-50 text-slate-600",
  },
};

const initialForm: AspirasiPayload = {
  jenis: "Saran",
  judul: "",
  isi: "",
};

export default function AspirasiPage() {
  const [form, setForm] = useState<AspirasiPayload>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const remainingCharacters = maxIsiLength - form.isi.length;
  const selectedTone = jenisTones[form.jenis];

  const canSubmit = useMemo(
    () => form.jenis.trim() !== "" && form.isi.trim() !== "" && form.isi.length <= maxIsiLength,
    [form.isi, form.jenis],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload: AspirasiPayload = {
      jenis: form.jenis,
      judul: form.judul.trim(),
      isi: form.isi.trim(),
    };

    if (!payload.isi) {
      setError("Isi aspirasi wajib diisi.");
      setMessage(null);
      return;
    }
    if (payload.isi.length > maxIsiLength) {
      setError("Isi aspirasi maksimal 1000 karakter.");
      setMessage(null);
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      await submitWebsiteAspirasi(payload);
      setForm(initialForm);
      setMessage("Aspirasi Anda berhasil dikirim. Terima kasih atas masukan Anda.");
    } catch (submitError) {
      console.error(submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Aspirasi gagal dikirim.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    if (submitting) {
      return;
    }
    setForm(initialForm);
    setError(null);
    setMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#f6f9ff] text-slate-900">
      <section className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 lg:py-14">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
            Sampaikan Aspirasi Anda
          </h1>
          <div className="mt-6 h-1.5 w-16 rounded-full bg-blue-600" />
          <p className="mt-7 max-w-2xl text-lg font-medium leading-8 text-slate-600">
            Berikan saran, masukan, keluhan, atau pendapat Anda untuk membantu
            kami memberikan pelayanan yang lebih baik. Aspirasi Anda bersifat
            anonim dan aman.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-10 rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,35,80,0.08)] sm:p-7"
        >
          <div className="flex items-start gap-4">
            <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-100">
              <Edit3 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-950">
                Tulis Aspirasi Anda
              </h2>
              <p className="mt-2 text-base font-medium text-slate-500">
                Sampaikan apa yang ingin Anda sampaikan kepada kami.
              </p>
            </div>
          </div>

          <div className="mt-7 space-y-6">
            <label className="grid gap-2">
              <span className="text-sm font-extrabold text-slate-700">
                Jenis Aspirasi
              </span>
              <select
                value={form.jenis}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    jenis: event.target.value as AspirasiJenis,
                  }))
                }
                className="h-14 w-full rounded-lg border border-slate-300 bg-white px-4 text-base font-semibold text-slate-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                {aspirasiJenisOptions.map((jenis) => (
                  <option key={jenis} value={jenis}>
                    {jenis}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-3 sm:grid-cols-5">
              {aspirasiJenisOptions.map((jenis) => {
                const tone = jenisTones[jenis];
                const Icon = tone.icon;
                const selected = form.jenis === jenis;

                return (
                  <button
                    key={jenis}
                    type="button"
                    className={cn(
                      "flex h-13 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-extrabold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100",
                      tone.className,
                      selected ? "ring-2 ring-current/20" : "opacity-85",
                    )}
                    onClick={() =>
                      setForm((current) => ({ ...current, jenis }))
                    }
                  >
                    <Icon className="h-5 w-5" />
                    {jenis}
                  </button>
                );
              })}
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-extrabold text-slate-700">
                Judul (Opsional)
              </span>
              <input
                value={form.judul}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    judul: event.target.value.slice(0, 160),
                  }))
                }
                placeholder="Tuliskan ringkasan singkat aspirasi Anda"
                className="h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-base font-medium text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-extrabold text-slate-700">
                Isi Aspirasi
              </span>
              <textarea
                value={form.isi}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    isi: event.target.value.slice(0, maxIsiLength),
                  }))
                }
                placeholder="Tuliskan aspirasi Anda secara detail di sini..."
                className="min-h-40 w-full resize-y rounded-lg border border-slate-300 bg-white px-4 py-4 text-base font-medium leading-7 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                required
              />
              <span
                className={cn(
                  "text-right text-sm font-semibold",
                  remainingCharacters < 100 ? "text-orange-600" : "text-slate-500",
                )}
              >
                {form.isi.length} / {maxIsiLength}
              </span>
            </label>
          </div>

          <div className="mt-7 rounded-lg border border-blue-100 bg-blue-50 px-4 py-4 text-blue-900">
            <div className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600 ring-1 ring-blue-100">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-blue-950">
                  Aspirasi Anda Bersifat Anonim
                </h3>
                <p className="mt-1 text-sm font-semibold leading-6 text-blue-800">
                  Kami tidak akan meminta atau menyimpan informasi identitas
                  apapun. Aspirasi Anda aman dan tidak dapat dilacak.
                </p>
              </div>
            </div>
          </div>

          {message ? (
            <div className="mt-5 flex items-center gap-3 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
              {message}
            </div>
          ) : null}
          {error ? (
            <div className="mt-5 flex items-center gap-3 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              <AlertCircle className="h-5 w-5" />
              {error}
            </div>
          ) : null}

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-lg px-6 text-base font-bold"
              disabled={submitting}
              onClick={resetForm}
            >
              <RefreshCw className="h-5 w-5" />
              Bersihkan Form
            </Button>
            <Button
              type="submit"
              className={cn(
                "h-12 rounded-lg px-8 text-base font-extrabold text-white shadow-[0_14px_28px_rgba(37,99,235,0.22)]",
                selectedTone.className.includes("orange")
                  ? "bg-orange-600 hover:bg-orange-700"
                  : "bg-blue-600 hover:bg-blue-700",
              )}
              disabled={submitting || !canSubmit}
            >
              <Send className="h-5 w-5" />
              {submitting ? "Mengirim..." : "Kirim Aspirasi"}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
