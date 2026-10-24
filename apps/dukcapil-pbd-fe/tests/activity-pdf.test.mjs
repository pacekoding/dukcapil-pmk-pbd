import assert from "node:assert/strict";
import { test } from "node:test";
import { buildActivityPdf } from "../lib/activity-pdf.ts";
function sample(kind) {
  const content = {
    nature: "Biasa",
    attachmentNotice: "",
    subject: "Judul Lama",
    preamble: "Dengan hormat",
    closing: "Terima kasih",
    eventDate: "2026-10-26",
    time: "09.00 WIT",
    location: "Sorong",
    agenda: "Koordinasi",
    recordType: "Serah Terima",
    recipients: [{ name: "Peserta Uji" }],
    signers: [
      {
        name: "Pejabat Lama",
        position: "Kepala Dinas",
        role: "Mengetahui",
        nip: "123",
        rank: "Pembina",
      },
    ],
    copies: [],
    bases: [],
    sections: [{ key: "1", title: "I. PENDAHULUAN", body: "Isi laporan lama" }],
    followUps: [],
    goods: [],
  };
  const details = {
    execution: { title: "Kegiatan Lama", location: "Sorong" },
    office: {
      governmentName: "PEMERINTAH PROVINSI PAPUA BARAT DAYA",
      agencyName: "DINAS UJI",
      address: "Sorong",
      phone: "",
      email: "",
      website: "",
    },
    content,
    participants: [
      {
        name: "Pegawai Lama",
        identification: "123",
        position: "Analis",
        institution: "Dinas Uji",
        phone: "",
        attendanceStatus: "Hadir",
        notes: "",
        address: "",
        village: "",
        kabKota: "",
        assistanceType: "Barang",
        quantity: 2,
        unit: "Unit",
      },
    ],
    relatedDocuments: [],
    photos: [],
  };
  return {
    kind,
    status: "Final",
    documentNumber: "001/UJI/2026",
    documentDate: "2026-10-24",
    snapshot: structuredClone(details),
    details,
  };
}
test("PDF Final memakai snapshot walaupun detail live berbeda", () => {
  for (const kind of [
    "invitations",
    "attendance",
    "minutes",
    "records",
    "reports",
    "receipts",
  ]) {
    const d = sample(kind);
    d.details.execution.title = "KEGIATAN BERUBAH";
    d.details.content.signers[0].name = "PEJABAT BERUBAH";
    const text = buildActivityPdf(d).output();
    assert.ok(text.startsWith("%PDF-"));
    assert.ok(text.includes("Pejabat Lama"));
    assert.ok(!text.includes("PEJABAT BERUBAH"));
    assert.ok(!text.includes("KEGIATAN BERUBAH"));
  }
});
test("daftar hadir panjang berlanjut dengan header tanda tangan berulang", () => {
  const d = sample("attendance");
  d.snapshot.participants = Array.from({ length: 90 }, (_, i) => ({
    ...d.snapshot.participants[0],
    name: `Nama Peserta ${i + 1}`,
  }));
  const pdf = buildActivityPdf(d),
    body = pdf.output();
  assert.ok(pdf.getNumberOfPages() > 2);
  assert.ok(body.includes("Nama Peserta 90"));
  assert.ok(
    (body.match(/Tanda Tangan/g) || []).length >= pdf.getNumberOfPages() - 1,
  );
  assert.ok(body.includes("Halaman 1 dari"));
});
