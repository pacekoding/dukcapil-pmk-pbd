import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { buildActivityPdf } from "../lib/activity-pdf.ts";
const fixturePath = process.argv[2],
  output = process.argv[3] ?? "/tmp/dukcapil-activity-pdf";
if (!fixturePath)
  throw new Error("Provide synthetic integration-test fixtures JSON.");
const f = JSON.parse(await readFile(fixturePath, "utf8"));
const logo = `data:image/png;base64,${(await readFile(new URL("../public/logo-pbd.png", import.meta.url))).toString("base64")}`;
await mkdir(output, { recursive: true });
const samples = Object.fromEntries(
  [
    "invitations",
    "attendance",
    "minutes",
    "records",
    "reports",
    "receipts",
  ].map((k) => [k, f[k]]),
);
const attendance = structuredClone(f.attendance);
attendance.snapshot.participants = Array.from({ length: 85 }, (_, i) => ({
  ...f.attendance.participants[i % 2],
  name: `Peserta Pengujian Nomor ${i + 1} dengan Nama Panjang`,
  position:
    "Pengelola Administrasi Kependudukan dan Pemberdayaan Masyarakat Kampung",
  notes: "Keterangan kehadiran dan peserta untuk uji pembungkusan tabel.",
}));
samples["attendance-stress"] = attendance;
const reports = structuredClone(f.reports);
reports.snapshot.content.sections[5].body =
  "Narasi pelaksanaan kegiatan untuk memeriksa pemenggalan halaman dan batas area cetak. ".repeat(
    120,
  );
samples["reports-stress"] = reports;
for (const [name, doc] of Object.entries(samples)) {
  const images = {};
  for (const photo of doc.snapshot?.photos ?? []) images[photo.id] = logo;
  const pdf = buildActivityPdf(doc, logo, images);
  await writeFile(
    resolve(output, `${name}.pdf`),
    new Uint8Array(pdf.output("arraybuffer")),
  );
  console.log(`${name}: ${pdf.getNumberOfPages()} pages`);
}
