import { jsPDF } from "jspdf";
import type {
  ActivityDocument,
  ActivityParty,
} from "../types/activity-execution";
const val = (v: string | undefined | null) =>
  v?.trim() || "................................";
const date = (v: string) =>
  v
    ? new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${v.slice(0, 10)}T00:00:00Z`))
    : val("");
// Permendagri 1/2023 annex: invitation, minutes, official record and report.
// Preview and download intentionally share this renderer and immutable snapshot.
export function buildActivityPdf(
  record: ActivityDocument,
  logo?: string,
  photos: Record<number, string> = {},
) {
  const tableDocument =
    record.kind === "attendance" || record.kind === "receipts";
  const pdf = new jsPDF({
    orientation: tableDocument ? "landscape" : "portrait",
    unit: "mm",
    format: "a4",
  });
  const d = record.snapshot ?? record.details,
    c = d.content,
    a = d.execution,
    office = d.office;
  const left = tableDocument ? 15 : 28,
    right = pdf.internal.pageSize.getWidth() - (tableDocument ? 15 : 20),
    width = right - left,
    bottom = pdf.internal.pageSize.getHeight() - 22;
  let y = 18;
  const font = (size = 11, bold = false) => {
    pdf.setFont("helvetica", bold ? "bold" : "normal");
    pdf.setFontSize(size);
    pdf.setTextColor(0);
  };
  const page = () => {
    pdf.addPage();
    y = 18;
  };
  const ensure = (h: number) => {
    if (y + h > bottom) page();
  };
  const wrap = (s: string, w = width, size = 11): string[] => {
    font(size);
    return pdf.splitTextToSize(s || " ", w) as string[];
  };
  function text(
    s: string,
    {
      size = 11,
      bold = false,
      indent = 0,
      after = 3,
    }: { size?: number; bold?: boolean; indent?: number; after?: number } = {},
  ) {
    const lines = wrap(s, width - indent, size),
      step = size * 0.3528 * 1.28;
    for (const l of lines) {
      ensure(step);
      font(size, bold);
      pdf.text(l, left + indent, y + step * 0.8);
      y += step;
    }
    y += after;
  }
  function center(s: string, size = 12, bold = true) {
    for (const l of wrap(s, width, size)) {
      ensure(6);
      font(size, bold);
      pdf.text(l, (left + right) / 2, y + 4, { align: "center" });
      y += 6;
    }
    y += 2;
  }
  function label(k: string, v: string) {
    const lines = wrap(val(v), width - 37);
    ensure(Math.min(lines.length * 5 + 2, 25));
    font();
    pdf.text(k, left, y + 4);
    pdf.text(":", left + 33, y + 4);
    for (const l of lines) {
      ensure(5);
      font();
      pdf.text(l, left + 37, y + 4);
      y += 5;
    }
    y += 2;
  }
  function header() {
    let cx = (left + right) / 2,
      hw = width;
    if (logo) {
      pdf.addImage(logo, left, 18, 17, 21);
      cx += 11;
      hw -= 24;
    }
    for (const [s, size] of [
      [office.governmentName, 11],
      [office.agencyName, 12],
      [office.address, 9],
      [
        [office.phone, office.email, office.website]
          .filter(Boolean)
          .join(" | "),
        8,
      ],
    ] as [string, number][]) {
      if (!s) continue;
      for (const l of wrap(s, hw, size)) {
        font(size, size >= 11);
        pdf.text(l, cx, y + 4, { align: "center" });
        y += size >= 11 ? 5.5 : 4;
      }
    }
    y += 4;
    pdf.setLineWidth(0.6);
    pdf.line(left, y, right, y);
    y += 7;
  }
  function signatures(parties: ActivityParty[]) {
    const cols = parties.length > 1 ? 2 : 1,
      gap = 8,
      cellWidth = cols === 1 ? Math.min(85, width) : (width - gap) / 2;
    for (let offset = 0; offset < parties.length; offset += cols) {
      const group = parties.slice(offset, offset + cols).map((p) => ({
        p,
        heading: [p.role, p.position]
          .filter(Boolean)
          .flatMap((v) => wrap(v, cellWidth)),
        name: wrap(val(p.name), cellWidth),
        rank: p.rank ? wrap(p.rank, cellWidth, 10) : [],
        nip: p.nip ? wrap(`NIP ${p.nip}`, cellWidth, 10) : [],
      }));
      const height = Math.max(
        ...group.map(
          (v) =>
            (v.heading.length + v.name.length + v.rank.length + v.nip.length) *
              5 +
            24,
        ),
      );
      ensure(height + (offset === 0 ? 15 : 0));
      if (offset === 0) text(`${a.location}, ${date(record.documentDate)}`);
      const top = y;
      for (let i = 0; i < group.length; i++) {
        const v = group[i],
          x = cols === 1 ? right - cellWidth : left + i * (cellWidth + gap);
        let cursor = top;
        const lines = (ls: string[], size: number, bold = false) => {
          font(size, bold);
          for (const l of ls) {
            pdf.text(l, x, cursor + 4);
            cursor += 5;
          }
        };
        lines(v.heading, 11);
        cursor += 20;
        lines(v.name, 11, true);
        lines(v.rank, 10);
        lines(v.nip, 10);
      }
      y = top + height + 7;
    }
  }
  function table(
    headers: string[],
    rows: string[][],
    weights: number[],
    minRow = 10,
  ) {
    const total = weights.reduce((s, n) => s + n, 0),
      widths = weights.map((w) => (w / total) * width);
    const size = 9,
      step = 4.1,
      pad = 2;
    const draw = (
      cells: string[][],
      count: number,
      height: number,
      bold = false,
    ) => {
      let x = left;
      for (let i = 0; i < widths.length; i++) {
        pdf.setDrawColor(70);
        pdf.setLineWidth(0.2);
        if (bold) {
          pdf.setFillColor(240, 242, 245);
          pdf.rect(x, y, widths[i], height, "FD");
        } else pdf.rect(x, y, widths[i], height);
        font(size, bold);
        for (let n = 0; n < count; n++)
          if (cells[i]?.[n])
            pdf.text(cells[i][n], x + pad, y + pad + 3 + n * step);
        x += widths[i];
      }
      y += height;
    };
    const hs = headers.map((s, i) => wrap(s, widths[i] - pad * 2, size)),
      hCount = Math.max(...hs.map((l) => l.length)),
      hh = hCount * step + pad * 2;
    const heading = () => {
      ensure(hh + minRow);
      draw(hs, hCount, hh, true);
    };
    heading();
    for (const row of rows) {
      let cells = headers.map((_, i) =>
        wrap(row[i] || " ", widths[i] - pad * 2, size),
      );
      let count = Math.max(...cells.map((l) => l.length));
      const fullHeight = Math.max(minRow, count * step + pad * 2);
      if (fullHeight <= bottom - 18 - hh && y + fullHeight > bottom) {
        page();
        heading();
      }
      while (count > 0) {
        if (bottom - y < Math.max(minRow, step + pad * 2)) {
          page();
          heading();
        }
        const fit = Math.max(1, Math.floor((bottom - y - pad * 2) / step));
        const take = Math.min(count, fit);
        const rh = Math.max(minRow, take * step + pad * 2);
        draw(
          cells.map((ls) => ls.slice(0, take)),
          take,
          rh,
        );
        cells = cells.map((ls) => ls.slice(take));
        count -= take;
        if (count > 0) {
          page();
          heading();
        }
      }
    }
    y += 6;
  }
  header();
  if (record.kind === "invitations") {
    text(`${a.location}, ${date(record.documentDate)}`);
    label("Nomor", record.documentNumber);
    label("Sifat", c.nature);
    label("Lampiran", c.attachmentNotice || "—");
    label("Hal", c.subject);
    y += 4;
    text("Yth.", { bold: true });
    for (const [i, p] of c.recipients.entries())
      text(
        `${i + 1}. ${[p.name, p.position, p.institution, p.address].filter(Boolean).join("\n")}`,
        { indent: 5 },
      );
    text(val(c.preamble));
    label("Hari/Tanggal", date(c.eventDate));
    label("Waktu", c.time);
    label("Tempat", c.location);
    label("Acara", c.agenda);
    text(val(c.closing));
  } else {
    const title =
      record.kind === "attendance"
        ? "DAFTAR HADIR"
        : record.kind === "receipts"
          ? "TANDA TERIMA / DAFTAR PENERIMA"
          : record.kind === "minutes"
            ? "NOTULA"
            : record.kind === "records"
              ? `BERITA ACARA ${c.recordType.toUpperCase()}`
              : "LAPORAN PELAKSANAAN KEGIATAN";
    center(title);
    if (record.documentNumber)
      center(`Nomor: ${record.documentNumber}`, 11, false);
    label("Kegiatan", a.title);
    label("Hari/Tanggal", date(c.eventDate));
    if (c.time) label("Waktu", c.time);
    label("Tempat", c.location);
    if (record.kind === "attendance")
      table(
        [
          "No",
          "Nama / NIP atau NIK",
          "Jabatan / Instansi",
          "Nomor HP",
          "Tanda Tangan",
          "Keterangan",
        ],
        d.participants.map((p, i) => [
          String(i + 1),
          [p.name, p.identification].filter(Boolean).join("\n"),
          [p.position, p.institution].filter(Boolean).join("\n"),
          p.phone,
          "",
          [p.attendanceStatus, p.notes].filter(Boolean).join("\n"),
        ]),
        [5, 25, 23, 13, 17, 17],
        17,
      );
    else if (record.kind === "receipts")
      table(
        [
          "No",
          "Nama / NIK",
          "Alamat / Kampung / Kabupaten",
          "Jenis Bantuan",
          "Jumlah / Satuan",
          "Tanda Tangan",
          "Keterangan",
        ],
        d.participants.map((p, i) => [
          String(i + 1),
          [p.name, p.identification].filter(Boolean).join("\n"),
          [p.address, p.village, p.kabKota].filter(Boolean).join("\n"),
          p.assistanceType,
          `${p.quantity} ${p.unit}`,
          "",
          p.notes,
        ]),
        [4, 19, 22, 18, 10, 15, 12],
        18,
      );
    else {
      if (record.kind === "minutes") {
        label("Pimpinan", d.chair?.name || "");
        label("Notulis", d.notetaker?.name || "");
        if (c.invitationReference) label("Undangan", c.invitationReference);
        label("Agenda", c.agenda);
      }
      if (record.kind === "records")
        text(
          `Pada ${date(c.eventDate)}, bertempat di ${c.location}, para pihak telah melaksanakan ${c.subject || a.title} sebagaimana diuraikan di bawah ini.`,
        );
      for (const s of c.sections) {
        ensure(15);
        text(s.title, { bold: true });
        text(s.body || "—", { indent: 3 });
      }
      if (c.goods.length)
        table(
          ["No", "Barang / Bantuan", "Jumlah / Satuan", "Kondisi"],
          c.goods.map((g, i) => [
            String(i + 1),
            g.name,
            `${g.quantity} ${g.unit}`,
            g.condition,
          ]),
          [6, 50, 22, 22],
        );
      if (c.followUps.length) {
        text("Tindak Lanjut", { bold: true });
        table(
          ["No", "Uraian", "Penanggung Jawab", "Target Waktu / Status"],
          c.followUps.map((f, i) => [
            String(i + 1),
            f.description,
            f.responsible.name,
            `${f.dueDate ? date(f.dueDate) : "—"}\n${f.status}`,
          ]),
          [6, 40, 25, 29],
        );
      }
      if (d.participants.length) {
        text("Peserta / Pelaksana", { bold: true });
        table(
          ["No", "Nama / NIP atau NIK", "Jabatan / Instansi", "Keterangan"],
          d.participants.map((p, i) => [
            String(i + 1),
            [p.name, p.identification].filter(Boolean).join("\n"),
            [p.position, p.institution].filter(Boolean).join("\n"),
            p.notes,
          ]),
          [6, 35, 39, 20],
        );
      }
    }
  }
  y += 5;
  signatures(c.signers);
  if (c.copies.filter(Boolean).length) {
    text("Tembusan:", { bold: true });
    c.copies.filter(Boolean).forEach((s, i) => text(`${i + 1}. ${s}`));
  }
  if (record.kind === "reports") {
    if (d.relatedDocuments.length) {
      ensure(15);
      text("Dokumen Pendukung Terkait", { bold: true });
      const name: Record<string, string> = {
        "assignment-letters": "Surat Tugas",
        spd: "Surat Perjalanan Dinas",
        invitations: "Surat Undangan",
        attendance: "Daftar Hadir",
        minutes: "Notula",
        records: "Berita Acara",
        reports: "Laporan Kegiatan",
        receipts: "Tanda Terima / Daftar Penerima",
      };
      for (const r of d.relatedDocuments)
        text(
          `${name[r.kind] || "Dokumen"} · ${r.number || `#${r.id}`} · ${r.status}`,
          {
            size: 10,
          },
        );
    }
    if (d.photos.length) {
      page();
      center("LAMPIRAN DOKUMENTASI");
      for (const f of d.photos) {
        const data = photos[f.id];
        if (data) {
          const prop = pdf.getImageProperties(data);
          const imageWidth = Math.min(width, 160),
            imageHeight = Math.min(
              105,
              (imageWidth * prop.height) / prop.width,
            ),
            drawWidth = (imageHeight * prop.width) / prop.height;
          ensure(imageHeight + 25);
          pdf.addImage(
            data,
            left + (width - drawWidth) / 2,
            y,
            drawWidth,
            imageHeight,
          );
          y += imageHeight + 3;
        } else ensure(20);
        text(
          `${f.caption || f.file.originalFilename}${f.locationDescription ? ` · ${f.locationDescription}` : ""}`,
          { size: 10 },
        );
        if (!data) text(`Lampiran: ${f.file.originalFilename}`, { size: 9 });
        y += 5;
      }
    }
  }
  const pages = pdf.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    pdf.setPage(i);
    font(8);
    pdf.setTextColor(90);
    pdf.text(
      `Halaman ${i} dari ${pages}`,
      right,
      pdf.internal.pageSize.getHeight() - 12,
      { align: "right" },
    );
    if (record.status !== "Final") {
      pdf.setTextColor(170, 30, 30);
      pdf.text(
        record.status === "Draft" ? "DRAFT - BELUM FINAL" : "DIBATALKAN",
        left,
        pdf.internal.pageSize.getHeight() - 12,
      );
    }
  }
  return pdf;
}
