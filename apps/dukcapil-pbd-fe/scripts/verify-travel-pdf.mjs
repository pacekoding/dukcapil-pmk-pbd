import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { buildTravelPdf } from "../lib/travel-pdf.ts";

const fixturePath = process.argv[2];
const outputDir = process.argv[3] ?? "/tmp/dukcapil-travel-pdf";
if (!fixturePath)
  throw new Error("Provide the synthetic integration-test fixture JSON path.");
const fixture = JSON.parse(await readFile(fixturePath, "utf8"));
const logo = `data:image/png;base64,${(await readFile(new URL("../public/logo-pbd.png", import.meta.url))).toString("base64")}`;
await mkdir(outputDir, { recursive: true });
const stressAssignment = structuredClone(fixture.assignment);
stressAssignment.employees = Array.from({ length: 24 }, (_, i) => ({
  ...fixture.assignment.employees[i % 2],
  id: i + 100,
  name: `Pegawai Pengujian Nomor ${i + 1} dengan Nama yang Cukup Panjang`,
  position:
    "Pengelola Sistem dan Teknologi Informasi Administrasi Kependudukan dan Pemberdayaan Masyarakat Kampung",
}));
stressAssignment.instructions.push(
  "Keterangan penugasan tambahan untuk menguji pembungkusan teks dan batas halaman. ".repeat(
    35,
  ),
);
const stressOrder = structuredClone(fixture.order);
stressOrder.followers = Array.from({ length: 12 }, (_, i) => ({
  name: `Pengikut Pengujian ${i + 1} dengan Nama Panjang`,
  birthDate: "2010-01-01",
  description:
    "Keterangan pengikut untuk verifikasi pembungkusan teks pada tabel",
}));
stressOrder.approvals = Array.from({ length: 7 }, () => ({
  ...fixture.order.approvals[0],
  arrivalOfficerName: "Nama Pejabat Pengesahan yang Panjang",
  departureOfficerName: "Nama Pejabat Keberangkatan yang Panjang",
}));
for (const [name, document] of Object.entries({
  "surat-tugas": fixture.assignment,
  spd: fixture.order,
  "surat-tugas-stress": stressAssignment,
  "spd-stress": stressOrder,
})) {
  const pdf = buildTravelPdf(document, logo);
  const path = resolve(outputDir, `${name}.pdf`);
  await writeFile(path, new Uint8Array(pdf.output("arraybuffer")));
  console.log(`${name}: ${pdf.getNumberOfPages()} A4 pages -> ${path}`);
}
