"use client";

import Image from "next/image";

import {
  formatDate,
  minimumPreviewRows,
  type ChecklistItem,
  type FollowUpItem,
  type MonitoringRecord,
} from "@/components/simonev/monitoring-data";

export function PrintableMonitoring({ record }: { record: MonitoringRecord }) {
  return (
    <article className="font-[Arial]">
      <header className="relative border-b-[3px] border-black pb-3 text-center">
        <div className="absolute left-2 top-0 h-16 w-16">
          <Image
            src="/logo-pbd.png"
            alt="Logo Papua Barat Daya"
            fill
            className="object-contain"
          />
        </div>
        <p className="font-serif text-[16px] font-bold uppercase">
          Provinsi Papua Barat Daya
        </p>
        <p className="mx-auto max-w-[560px] font-serif text-[14px] font-bold uppercase leading-tight">
          Dinas Kependudukan dan Pencatatan Sipil dan Pemberdayaan Masyarakat
          dan Kampung
        </p>
        <p className="mt-1 text-[10px]">
          Jl. Basuki Rahmat Km. 12, Kota Sorong, Papua Barat Daya
        </p>
      </header>

      <section className="py-4 text-center font-serif font-bold uppercase">
        <p className="text-[15px]">Paket Instrumen Monitoring dan Evaluasi</p>
        <p className="mx-auto max-w-[620px] text-[13px] leading-tight">
          Penyelenggaraan Administrasi Kependudukan dan Pencatatan Sipil
          Kabupaten/Kota
        </p>
      </section>

      <section className="mb-4 grid grid-cols-[120px_10px_1fr] gap-y-1 text-[11px]">
        <PrintInfoRow label="Nama Monev" value={record.namaMonev} />
        <PrintInfoRow label="Subkegiatan" value={record.subkegiatan} />
        <PrintInfoRow label="Lokus" value={record.lokus} />
        <PrintInfoRow label="Waktu" value={formatDate(record.waktu)} />
      </section>

      <section className="space-y-2 text-[10.5px] leading-relaxed">
        <h2 className="text-[12px] font-bold">Dasar Hukum</h2>
        <p>
          Regulasi utama mengenai format monitoring dan evaluasi administrasi
          kependudukan dan pencatatan sipil di tingkat provinsi diatur secara
          berjenjang melalui peraturan perundang-undangan dan Peraturan Gubernur
          Papua Barat Daya Nomor 19 Tahun 2022 tentang Organisasi dan Tata Kerja
          Dinas Kependudukan dan Pencatatan Sipil dan Pemberdayaan Masyarakat
          dan Kampung.
        </p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            Undang-Undang Nomor 24 Tahun 2013 tentang Perubahan atas
            Undang-Undang Nomor 23 Tahun 2006 tentang Administrasi Kependudukan.
          </li>
          <li>
            Peraturan Pemerintah Nomor 40 Tahun 2019 tentang Pelaksanaan
            Undang-Undang Administrasi Kependudukan.
          </li>
          <li>
            Dokumen Perjanjian Kinerja, Renstra, Renja Dinas, serta SPPD/SPT
            pelaksanaan monitoring dan evaluasi.
          </li>
        </ol>
      </section>

      <section className="mt-3 space-y-2 text-[10.5px] leading-relaxed">
        <h2 className="text-[12px] font-bold">Tujuan</h2>
        <p>
          Instrumen ini disusun sebagai pedoman bagi Tim Monitoring dan Evaluasi
          dalam melaksanakan monitoring dan evaluasi penyelenggaraan
          administrasi kependudukan dan pencatatan sipil pada Dinas Kependudukan
          dan Pencatatan Sipil Kabupaten/Kota di Provinsi Papua Barat Daya.
        </p>
      </section>

      <section className="mt-4">
        <h2 className="mb-2 text-center text-[13px] font-bold uppercase">
          Checklist Monitoring
        </h2>
        <table className="w-full border-collapse text-[10px]">
          <thead>
            <tr>
              {["No", "Indikator", "Ya", "Tidak", "Keterangan"].map(
                (heading) => (
                  <th
                    key={heading}
                    className="border border-black px-2 py-1 text-center"
                  >
                    {heading}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {padChecklist(record.checklist).map((item, index) => (
              <tr key={item.id}>
                <td className="w-8 border border-black px-2 py-1 text-center">
                  {index + 1}
                </td>
                <td className="border border-black px-2 py-1">
                  {item.indikator}
                </td>
                <td className="w-12 border border-black px-2 py-1 text-center">
                  {item.status === "Ya" ? "✓" : ""}
                </td>
                <td className="w-12 border border-black px-2 py-1 text-center">
                  {item.status === "Tidak" ? "✓" : ""}
                </td>
                <td className="w-[180px] border border-black px-2 py-1">
                  {item.keterangan}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-5">
        <h2 className="mb-2 text-center text-[13px] font-bold uppercase">
          Daftar Tindak Lanjut
        </h2>
        <table className="w-full border-collapse text-[9.5px]">
          <thead>
            <tr>
              {[
                "No",
                "Permasalahan",
                "Rekomendasi",
                "Penanggung Jawab",
                "Target Waktu",
                "Status",
              ].map((heading) => (
                <th
                  key={heading}
                  className="border border-black px-2 py-1 text-center"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {padFollowUps(record.tindakLanjut).map((item, index) => (
              <tr key={item?.id ?? `empty-follow-${index}`}>
                <td className="w-8 border border-black px-2 py-3 text-center">
                  {index + 1}
                </td>
                <td className="border border-black px-2 py-3">
                  {item?.permasalahan ?? ""}
                </td>
                <td className="border border-black px-2 py-3">
                  {item?.rekomendasi ?? ""}
                </td>
                <td className="w-[110px] border border-black px-2 py-3">
                  {item?.penanggungJawab ?? ""}
                </td>
                <td className="w-[82px] border border-black px-2 py-3 text-center">
                  {item?.targetWaktu ? formatDate(item.targetWaktu) : ""}
                </td>
                <td className="w-[86px] border border-black px-2 py-3 text-center">
                  {item?.status ?? ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-[10px]">
          Status : ✓ Selesai ✓ Dalam Proses ✓ Belum Dilaksanakan
        </p>
      </section>
    </article>
  );
}

function PrintInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <span>{label}</span>
      <span>:</span>
      <span className="font-bold">{value || "-"}</span>
    </>
  );
}

function padChecklist(items: ChecklistItem[]): ChecklistItem[] {
  const rows = [...items];

  while (rows.length < minimumPreviewRows) {
    rows.push({
      id: `empty-checklist-${rows.length}`,
      indikator: "",
      status: "",
      keterangan: "",
    });
  }

  return rows;
}

function padFollowUps(items: FollowUpItem[]): Array<FollowUpItem | null> {
  const rows: Array<FollowUpItem | null> = items.filter((item) =>
    [
      item.permasalahan,
      item.rekomendasi,
      item.penanggungJawab,
      item.targetWaktu,
    ].some((value) => value.trim()),
  );

  while (rows.length < minimumPreviewRows) {
    rows.push(null);
  }

  return rows;
}
