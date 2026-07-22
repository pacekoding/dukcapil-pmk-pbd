"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, Printer, Save } from "lucide-react";

import { SectionCard } from "@/components/dashboard/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  klasifikasiSuratLabels,
  mockRadiogramSorong,
} from "@/lib/sisurat/mock-surat";
import type {
  KlasifikasiSurat,
  RadiogramBlock,
  RadiogramSurat,
} from "@/types/surat";

type RadiogramFormProps = {
  initialData?: RadiogramSurat;
};

const staticRadiogram = {
  dari: "GUBERNUR PROVINSI PAPUA BARAT DAYA",
  untuk:
    "1. BUPATI / WALIKOTA SE-PAPUA BARAT DAYA\n2. KETUA DPRD PROVINSI PAPUA BARAT DAYA\n3. KETUA DPRD KAB / KOTA SE-PAPUA BARAT DAYA\n4. KETUA MRP PROVINSI PAPUA BARAT DAYA",
  tembusan: "PJ SEKRETARIS DAERAH PROVINSI PAPUA BARAT DAYA",
  pengirim: "An. GUBERNUR PAPUA BARAT DAYA",
  nama: "Drs. YAKOB KARET, M.Si",
  jabatan: "PJ. SEKRETARIS DAERAH",
  nip: "196708041988101001",
};

const defaultAmanat =
  "AMANAT UNDANG UNDANG NOMER 2 TAHUN 2021 TENTANG OTONOMI KHUSUS PAPUA SEBAGAI DASAR PEMBAGIAN DAN PENERIMAAN KHUSUS DALAM RANGKA PELAKSAAN OTSUS ANTAR PROVINSI DAN KABUPATEN GARING KOTA DI WILAYAH PAPUA MEMPERHATIKAN JUMLAH ORANG ASLI PAPUA SERTA PERATURAN MENTERI KEUANGAN NO.33 TAHUN 2024 TENTANG PENGELOLAAN TRANSFER KE DAERAH DALAM RANGKA OTONOMI KHUSUS UNTUK MENGISYARATKAN SISTEM INFORMASI KHUSUS YANG TERINTEGRITAS MENDUKUNG KEBUTUHAN PENYEDIAN DATA DAN INFORMASI DALAM RUMUSAN KEBIJAKAN PENGELOLAAN APBN DAN TRANSFER KE DAERAH TKD UTK PENERIMAAN DALAM RANGKA OTSUS KMA DISAMPAIKAN HAL SBB :";

const defaultBlocks: RadiogramBlock[] = [
  {
    id: "oap-aaa",
    kode: "AAA",
    isi: "PELAKSAAN LAUNCING DATA ORANG ASLI PAPUA TINGKAT PROVINSI PAPUA BARAT DAYA HARI/TANGGAL : SELASA, 13 JANUARI 2026 WAKTU : 09.00 WIT SAMPAI SELESAI TEMPAT : RHYLICH PANORAMA HOTEL KAMPUNG BARU KOTA SORONG",
  },
  {
    id: "oap-bbb",
    kode: "BBB",
    isi: "MENGINGAT PENTINGNYA ACARA TSB DIHARAPKAN KPD KEPALA DINAS DUKCAPIL KABUPATEN KOTA UTK MENGIKUTI KEGIATAN LAUNCING DI MSD KOMA MENGINGAT DIHADIRI LANGSUNG OLEH DIRJEN KEPENDUDUKAN KEMENTERIAN DALAM NEGERI",
  },
  {
    id: "oap-ccc",
    kode: "CCC",
    isi: "BIAYA PERJALANAN DINAS KAB GARING KOTA KE KOTA SORONG DITANGGUNG APBD MASINGS KAB GARING KOTA",
  },
  {
    id: "oap-ddd",
    kode: "DDD",
    isi: "DUM KMA GUB PAPUA BARAT DAYA KRM TTK HBS",
  },
];

export function RadiogramForm({
  initialData = mockRadiogramSorong,
}: RadiogramFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [klasifikasi, setKlasifikasi] = useState<KlasifikasiSurat>(
    initialData.klasifikasi || "segera",
  );
  const [amanat, setAmanat] = useState(initialData.amanat || defaultAmanat);
  const [blocks, setBlocks] = useState<RadiogramBlock[]>(
    initialData.isiBerita.length ? initialData.isiBerita : defaultBlocks,
  );

  const draft = useMemo(
    () =>
      buildRadiogramDraft({
        initialData,
        klasifikasi,
        amanat,
        blocks,
      }),
    [amanat, blocks, initialData, klasifikasi],
  );

  const canSubmit =
    klasifikasi &&
    amanat.trim() &&
    blocks.every((block) => block.kode.trim() && block.isi.trim());

  const updateBlock = (id: string, isi: string) => {
    setMessage("");
    setBlocks((current) =>
      current.map((block) =>
        block.id === id ? { ...block, isi: isi.toUpperCase() } : block,
      ),
    );
  };

  const goToPreview = () => {
    if (!canSubmit) {
      setMessage("Lengkapi klasifikasi, amanat, dan seluruh blok berita.");
      return;
    }

    window.sessionStorage.setItem(
      "sisurat:radiogram-draft",
      JSON.stringify(draft),
    );
    router.push(`/sisurat/preview/${draft.id}`);
  };

  return (
    <form className="space-y-6">
      {message ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">
          {message}
        </div>
      ) : null}

      <SectionCard
        title="Data Statis Radiogram"
        description="Data ini mengikuti format Radiogram Launching Data OAP dan tidak perlu diisi ulang oleh operator."
      >
        <div className="grid gap-3 lg:grid-cols-2">
          <ReadOnlyInfo label="Dari" value={staticRadiogram.dari} />
          <ReadOnlyInfo label="Untuk" value={staticRadiogram.untuk} />
          <ReadOnlyInfo label="Tembusan" value={staticRadiogram.tembusan} />
          <ReadOnlyInfo label="Pengirim" value={staticRadiogram.pengirim} />
          <ReadOnlyInfo label="Nama" value={staticRadiogram.nama} />
          <ReadOnlyInfo label="Jabatan" value={staticRadiogram.jabatan} />
          <ReadOnlyInfo label="NIP" value={staticRadiogram.nip} />
          <ReadOnlyInfo label="Nomor" value="Kosong sesuai format" />
        </div>
      </SectionCard>

      <SectionCard title="Data Dinamis">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Klasifikasi">
            <Select
              value={klasifikasi}
              onValueChange={(value) => {
                setMessage("");
                setKlasifikasi(value as KlasifikasiSurat);
              }}
            >
              <SelectTrigger className="h-10 w-full bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(klasifikasiSuratLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Nomor">
            <Input value="" readOnly placeholder="Dikosongkan" />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title="Amanat / Pembuka"
        description="Teks pembuka sebelum blok AAA, BBB, CCC, dan DDD."
      >
        <Textarea
          value={amanat}
          onChange={(event) => {
            setMessage("");
            setAmanat(event.target.value.toUpperCase());
          }}
          className="min-h-40 rounded-lg bg-white uppercase leading-6"
        />
      </SectionCard>

      <SectionCard
        title="Isi Berita Radiogram"
        description="Kode paragraf mengikuti format referensi. Akhiran TTK akan ditampilkan pada preview."
      >
        <div className="space-y-4">
          {blocks.map((block) => (
            <div
              key={block.id}
              className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 lg:grid-cols-[90px_1fr]"
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Kode
                </p>
                <p className="mt-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-pbd-navy">
                  {block.kode} TTK
                </p>
              </div>
              <Field label="Isi berita">
                <Textarea
                  value={block.isi}
                  onChange={(event) => updateBlock(block.id, event.target.value)}
                  className="min-h-28 rounded-lg bg-white uppercase leading-6"
                />
              </Field>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="sticky bottom-0 z-20 -mx-4 border-t border-slate-200 bg-white/95 px-4 py-4 shadow-[0_-10px_30px_rgba(15,35,80,0.08)] backdrop-blur sm:-mx-5 sm:px-5 lg:-mx-6 lg:px-6">
        <div className="mx-auto flex max-w-[1440px] flex-wrap justify-end gap-3">
          <Button asChild type="button" variant="outline">
            <Link href="/sisurat/data">
              <ArrowLeft className="h-4 w-4" />
              Batal
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setMessage("Draft tersimpan pada sesi prototype.")}
          >
            <Save className="h-4 w-4" />
            Simpan Draft
          </Button>
          <Button type="button" variant="outline" onClick={goToPreview}>
            <Eye className="h-4 w-4" />
            Generate Preview
          </Button>
          <Button
            type="button"
            className="bg-pbd-navy text-white hover:bg-pbd-navy/90"
            onClick={goToPreview}
          >
            <Printer className="h-4 w-4" />
            Simpan & Cetak
          </Button>
        </div>
      </div>
    </form>
  );
}

function buildRadiogramDraft({
  initialData,
  klasifikasi,
  amanat,
  blocks,
}: {
  initialData: RadiogramSurat;
  klasifikasi: KlasifikasiSurat;
  amanat: string;
  blocks: RadiogramBlock[];
}): RadiogramSurat {
  return {
    ...initialData,
    nomorSurat: initialData.nomorSurat || "RADIOGRAM/OAP/2026",
    nomorRadiogram: "",
    nomor: "",
    tanggalPembuatan: initialData.tanggalPembuatan,
    tujuan: staticRadiogram.untuk,
    perihal: "Launching Data Orang Asli Papua",
    klasifikasi,
    dari: staticRadiogram.dari,
    untuk: staticRadiogram.untuk,
    tembusan: [staticRadiogram.tembusan],
    amanat: amanat.toUpperCase(),
    isiBerita: blocks.map((block) => ({
      ...block,
      isi: block.isi.toUpperCase(),
    })),
    pengirimAtasNama: staticRadiogram.pengirim,
    jabatanPengirim: staticRadiogram.jabatan,
    namaPenandatangan: staticRadiogram.nama,
    nipPenandatangan: staticRadiogram.nip,
    updatedAt: new Date().toISOString(),
  };
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-pbd-navy">
        {label}
      </span>
      {children}
    </label>
  );
}

function ReadOnlyInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 whitespace-pre-line text-sm font-semibold leading-6 text-pbd-navy">
        {value}
      </p>
    </div>
  );
}
