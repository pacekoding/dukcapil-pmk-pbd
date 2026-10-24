import { jsPDF } from "jspdf";
import type {
  TravelAssignment,
  TravelDocument,
  TravelOffice,
  TravelOrder,
  TravelPerson,
} from "../types/travel";

const value = (v: string | undefined | null) =>
  v?.trim() || "................................";
const date = (v: string) =>
  v
    ? new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${v.slice(0, 10)}T00:00:00Z`))
    : "................................";

// Dedicated A4 document renderer, shared by preview and PDF export.
// Reference: Permendagri 1/2023, annex pages 21-23 (OPD letterhead adaptation).
export function buildTravelPdf(record: TravelDocument, logoDataUrl?: string) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const left = 30,
    right = 190,
    width = right - left,
    bottom = 272;
  let y = 20;
  const font = (size = 12, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(0);
  };
  const page = () => {
    doc.addPage();
    y = 20;
  };
  const ensure = (height: number) => {
    if (y + height > bottom) page();
  };
  const wrap = (text: string, w = width, size = 12): string[] => {
    font(size);
    return doc.splitTextToSize(text || " ", w) as string[];
  };
  function text(
    content: string,
    {
      bold = false,
      size = 12,
      indent = 0,
      after = 2,
    }: { bold?: boolean; size?: number; indent?: number; after?: number } = {},
  ) {
    const lines = wrap(content, width - indent, size);
    font(size, bold);
    const step = size * 0.3528 * 1.2;
    for (const line of lines) {
      ensure(step);
      font(size, bold);
      doc.text(line, left + indent, y + step * 0.8);
      y += step;
    }
    y += after;
  }
  function center(content: string, size = 12, bold = false) {
    const lines = wrap(content, width, size);
    font(size, bold);
    for (const line of lines) {
      ensure(5);
      font(size, bold);
      doc.text(line, (left + right) / 2, y + 4, { align: "center" });
      y += 5;
    }
    y += 2;
  }
  function labeled(label: string, content: string) {
    const lines = wrap(content, width - 29, 12);
    ensure(Math.min(lines.length * 5.1 + 3, 30));
    font(12);
    if (label) {
      doc.text(label, left, y + 4);
      doc.text(":", left + 25, y + 4);
    }
    for (const line of lines) {
      ensure(5.1);
      font(12);
      doc.text(line, left + 29, y + 4);
      y += 5.1;
    }
    y += 3;
  }
  function letterhead(office: TravelOffice) {
    if (logoDataUrl) doc.addImage(logoDataUrl, "PNG", left, 20, 18, 22);
    const headerLeft = left + 22,
      headerWidth = width - 22,
      centerX = headerLeft + headerWidth / 2;
    for (const [line, size, bold] of [
      [office.governmentName, 11, true],
      [office.agencyName, 12, true],
      [office.address, 9, false],
      [
        [office.phone, office.email, office.website]
          .filter(Boolean)
          .join(" | "),
        8,
        false,
      ],
    ] as [string, number, boolean][]) {
      if (!line) continue;
      const lines = wrap(line, headerWidth, size);
      font(size, bold);
      const h = size * 0.3528 * 1.15;
      for (const part of lines) {
        doc.text(part, centerX, y + h, { align: "center" });
        y += h;
      }
      y += 1;
    }
    y = Math.max(y, 45) + 2;
    doc.setLineWidth(0.6);
    doc.line(left, y, right, y);
    y += 1;
    doc.setLineWidth(0.2);
    doc.line(left, y, right, y);
    y += 7;
  }
  function signature(
    person: TravelPerson,
    place: string,
    onDate: string,
    role?: string,
  ) {
    const x = left + width * 0.53,
      w = width * 0.47;
    const head = [
      `Dikeluarkan di ${value(place)}`,
      `Pada tanggal ${date(onDate)}`,
      ...wrap(value(role || person.position), w, 11),
    ];
    const tail = [
      ...wrap(value(person.name), w, 11),
      ...wrap(value(person.rank), w, 10),
      `NIP ${value(person.nip)}`,
    ];
    const h = head.length * 5 + 18 + tail.length * 5;
    ensure(h);
    font(11);
    for (const line of head) {
      doc.text(line, x, y + 4);
      y += 5;
    }
    y += 18;
    font(11, true);
    for (const [i, line] of tail.entries()) {
      font(i === 0 ? 11 : 10, i === 0);
      doc.text(line, x, y + 4);
      y += 5;
    }
    y += 3;
  }
  function tableRow(
    number: string,
    label: string,
    content: string,
    minHeight = 10,
    reserve = 0,
  ) {
    const labelLines = wrap(label, 62, 10.5),
      dataLines = wrap(content || " ", 82, 10.5);
    const rows = Math.max(labelLines.length, dataLines.length);
    const lineH = 4.4;
    const wholeHeight = Math.max(minHeight, rows * lineH + 4);
    if (wholeHeight + reserve <= bottom - 20) ensure(wholeHeight + reserve);
    let offset = 0;
    while (offset < rows) {
      ensure(minHeight + reserve);
      const capacity = Math.max(
        1,
        Math.floor((bottom - y - 4 - reserve) / lineH),
      );
      const count = Math.min(rows - offset, capacity);
      const h = Math.max(minHeight, count * lineH + 4);
      if (y + h + reserve > bottom) {
        page();
        continue;
      }
      doc.setLineWidth(0.2);
      doc.rect(left, y, 8, h);
      doc.rect(left + 8, y, 66, h);
      doc.rect(left + 74, y, width - 74, h);
      font(10.5);
      doc.text(number, left + 2, y + 5);
      labelLines
        .slice(offset, offset + count)
        .forEach((line, i) => doc.text(line, left + 10, y + 5 + i * lineH));
      dataLines
        .slice(offset, offset + count)
        .forEach((line, i) => doc.text(line, left + 76, y + 5 + i * lineH));
      y += h;
      offset += count;
      if (offset < rows) page();
    }
  }
  function assignment(a: TravelAssignment) {
    letterhead(a.office);
    center("SURAT TUGAS", 14, true);
    center(`NOMOR: ${a.number || "................................"}`, 12);
    y += 5;
    labeled("Dasar", a.bases.map((s, i) => `${i + 1}. ${s}`).join("\n"));
    center("MEMERINTAHKAN:", 12, true);
    y += 2;
    a.employees.forEach((person, index) => {
      ensure(32);
      labeled(
        index === 0 ? "Kepada" : "",
        `${index + 1}. Nama: ${value(person.name)}\n    Pangkat/Golongan: ${value(person.rank)}\n    NIP: ${value(person.nip)}\n    Jabatan: ${value(person.position)}`,
      );
    });
    labeled("Untuk", a.instructions.map((s, i) => `${i + 1}. ${s}`).join("\n"));
    ensure(105);
    labeled(
      "Perjalanan",
      `${a.origin} ke ${a.destination}\n${date(a.departureDate)} s.d. ${date(a.returnDate)}\nLama: ${a.durationDays} hari (selisih tanggal)\n${a.tripType}${a.transport ? ` - ${a.transport}` : ""}`,
    );
    y += 4;
    signature(a.signer, a.issuePlace, a.documentDate);
  }
  function approvalPair(leftText: string, rightText: string, minHeight = 30) {
    const w = width / 2,
      step = 3.4;
    const l = wrap(leftText, w - 7, 9.5),
      r = wrap(rightText, w - 7, 9.5);
    const h = Math.max(minHeight, Math.max(l.length, r.length) * step + 6);
    ensure(h);
    doc.setLineWidth(0.2);
    doc.rect(left, y, w, h);
    doc.rect(left + w, y, w, h);
    font(9.5);
    l.forEach((line, i) => doc.text(line, left + 3, y + 5 + i * step));
    r.forEach((line, i) => doc.text(line, left + w + 3, y + 5 + i * step));
    y += h;
  }
  function approvals(o: TravelOrder) {
    page();
    center("LEMBAR PENGESAHAN PERJALANAN DINAS", 11, true);
    center(`SPD Nomor: ${o.number || "................................"}`, 10);
    y += 2;
    const d = o.details;
    approvalPair(
      "",
      `I. Berangkat dari: ${d.origin}\nKe: ${d.destination}\nPada tanggal: ${date(d.departureDate)}\nKepala: ................................\n\n(................................)\nNIP ................................`,
      30,
    );
    const count = Math.max(4, o.approvals.length);
    const roman = ["II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
    for (let i = 0; i < count; i++) {
      const a = o.approvals[i];
      const label = roman[i] || String(i + 2);
      approvalPair(
        `${label}. Tiba di: ${value(a?.arrivalPlace)}\nPada tanggal: ${a?.arrivalDate ? date(a.arrivalDate) : "................................"}\n${value(a?.arrivalOfficerPosition)}\n\n${value(a?.arrivalOfficerName)}\nNIP ${value(a?.arrivalOfficerNip)}`,
        `Berangkat dari: ${value(a?.departurePlace)}\nKe: ${value(a?.destination)}\nPada tanggal: ${a?.departureDate ? date(a.departureDate) : "................................"}\n${value(a?.departureOfficerPosition)}\n\n${value(a?.departureOfficerName)}\nNIP ${value(a?.departureOfficerNip)}`,
        28,
      );
    }
    approvalPair(
      `Tiba kembali di: ${value(o.returnedPlace)}\nPada tanggal: ${o.returnedDate ? date(o.returnedDate) : "................................"}\n${value(o.returnOfficerPosition)}\n\n${value(o.returnOfficerName)}\nNIP ${value(o.returnOfficerNip)}`,
      "Telah diperiksa, dengan keterangan bahwa perjalanan dilaksanakan atas perintah dan untuk kepentingan jabatan dalam waktu yang ditetapkan.",
      30,
    );
    tableRow("", "Catatan Lain-lain", o.notes || " ", 8);
    text(
      "PERHATIAN: Pejabat penerbit, pelaksana, pejabat pengesah, serta bendahara bertanggung jawab menurut ketentuan yang berlaku apabila timbul kerugian akibat kesalahan, kelalaian, atau kealpaan.",
      { size: 9, after: 3 },
    );
    ensure(26);
    font(10);
    doc.text(o.signerRole, (left + right) / 2, y + 4, { align: "center" });
    y += 17;
    center(value(d.signer.name), 10, true);
    center(`NIP ${value(d.signer.nip)}`, 9);
  }
  function order(o: TravelOrder) {
    const d = o.details;
    letterhead(d.office);
    font(10);
    for (const line of [
      `Lembar ke: ${o.sheetNumber}`,
      `Kode No.: ${o.code || "................................"}`,
      `Nomor: ${o.number || "................................"}`,
    ]) {
      doc.text(line, right, y + 3, { align: "right" });
      y += 4.5;
    }
    y += 3;
    center("SURAT PERJALANAN DINAS (SPD)", 12, true);
    tableRow(
      "1",
      o.signerRole,
      `${value(d.signer.name)}\n${value(d.signer.position)}`,
    );
    tableRow(
      "2",
      "Nama/NIP Pegawai yang melaksanakan perjalanan dinas",
      `${d.employee.name}\nNIP ${d.employee.nip}`,
    );
    tableRow(
      "3",
      "a. Pangkat dan Golongan\nb. Jabatan/Instansi\nc. Tingkat Biaya Perjalanan Dinas",
      `a. ${d.employee.rank}\nb. ${d.employee.position} / ${d.office.agencyName}\nc. ${o.expenseLevel}`,
    );
    tableRow("4", "Maksud Perjalanan Dinas", d.purpose);
    tableRow("5", "Alat angkut yang dipergunakan", d.transport);
    tableRow(
      "6",
      "a. Tempat berangkat\nb. Tempat tujuan",
      `a. ${d.origin}\nb. ${d.destination}`,
    );
    tableRow(
      "7",
      "a. Lamanya Perjalanan Dinas\nb. Tanggal berangkat\nc. Tanggal harus kembali",
      `a. ${o.durationDays} hari (selisih tanggal)\nb. ${date(d.departureDate)}\nc. ${date(d.returnDate)}`,
    );
    function followerRow(
      name: string,
      birth: string,
      description: string,
      header = false,
    ) {
      const cells = [header ? "8" : "", name, birth, description];
      const widths = [8, 66, 30, 56];
      const lines = cells.map((cell, index) =>
        wrap(cell || " ", widths[index] - 4, 10),
      );
      const height = Math.max(
        7,
        Math.max(...lines.map((parts) => parts.length)) * 4.2 + 4,
      );
      ensure(height);
      let x = left;
      font(10, header);
      lines.forEach((parts, index) => {
        doc.rect(x, y, widths[index], height);
        parts.forEach((line, lineIndex) =>
          doc.text(line, x + 2, y + 4.5 + lineIndex * 4.2),
        );
        x += widths[index];
      });
      y += height;
    }
    followerRow("Pengikut: Nama", "Tanggal Lahir", "Keterangan", true);
    for (let i = 0; i < Math.max(5, o.followers.length); i++) {
      const f = o.followers[i];
      followerRow(
        `${i + 1}. ${f?.name || "................................"}`,
        f?.birthDate ? date(f.birthDate) : " ",
        f?.description || " ",
      );
    }
    tableRow(
      "9",
      "Pembebanan Anggaran\na. Instansi\nb. Akun\nProgram / Kegiatan / Subkegiatan",
      `a. ${o.skpd}\nb. ${o.accountCode}\n${d.program}\n${d.kegiatan}\n${d.subkegiatan}\nSumber dana: ${o.fundingSource}\nTahun Anggaran: ${o.fiscalYear}`,
    );
    tableRow(
      "10",
      "Keterangan lain-lain",
      `${o.notes || "-"}\nSurat Tugas: ${d.assignmentNumber || "Draft"}`,
      10,
      50,
    );
    y += 4;
    signature(d.signer, o.issuePlace, o.documentDate, o.signerRole);
    approvals(o);
  }
  if ("employeeIds" in record) assignment(record);
  else order(record);
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    font(8);
    doc.setTextColor(95);
    doc.text(`Halaman ${i} dari ${pages}`, right, 286, { align: "right" });
    if (record.status !== "Final") {
      doc.setTextColor(160, 30, 30);
      doc.text(
        record.status === "Draft" ? "DRAFT - BELUM FINAL" : "DIBATALKAN",
        left,
        286,
      );
    }
  }
  return doc;
}

export async function travelLogoDataUrl(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Logo kop surat gagal dimuat.");
  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Logo kop surat gagal dibaca."));
    reader.readAsDataURL(blob);
  });
}
