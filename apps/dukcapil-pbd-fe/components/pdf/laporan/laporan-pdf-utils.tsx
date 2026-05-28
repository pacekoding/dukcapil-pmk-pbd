import type { ReactNode } from "react";

import type { PdfSettings } from "@/types/pdf";

export function PdfContent({
  settings,
  children,
}: {
  settings: PdfSettings;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        padding: settings.pagePadding,
        fontSize: settings.fontSize,
        lineHeight: String(settings.lineHeight),
        fontFamily: settings.fontFamily,
        color: settings.textColor,
      }}
    >
      {children}
    </div>
  );
}

export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "230px 14px 1fr",
        alignItems: "start",
        columnGap: 8,
      }}
    >
      <div style={{ fontWeight: 600 }}>{label}</div>
      <div>:</div>
      <div style={{ wordBreak: "break-word" }}>{value}</div>
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3
      style={{
        marginTop: 34,
        marginBottom: 16,
        fontSize: 19,
        fontWeight: 700,
      }}
    >
      {children}
    </h3>
  );
}

export function Paragraph({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        margin: 0,
        textAlign: "justify",
      }}
    >
      {children}
    </p>
  );
}

export function BulletList({ items }: { items: string[] }) {
  return (
    <ul
      style={{
        paddingLeft: 24,
        margin: 0,
      }}
    >
      {items.map((item) => (
        <li key={item} style={{ marginBottom: 8 }}>
          {item}
        </li>
      ))}
    </ul>
  );
}

export function TableHeader({ children }: { children: ReactNode }) {
  return (
    <th
      style={{
        border: "1px solid #000",
        padding: 9,
        background: "#f1f5f9",
        textAlign: "left",
        fontWeight: 700,
      }}
    >
      {children}
    </th>
  );
}

export function TableCell({
  children,
  align = "left",
}: {
  children: ReactNode;
  align?: "left" | "center" | "right";
}) {
  return (
    <td
      style={{
        border: "1px solid #000",
        padding: 9,
        textAlign: align,
        verticalAlign: "top",
      }}
    >
      {children}
    </td>
  );
}

export function SignatureBlock({
  date,
  jabatan,
  pejabat,
  nip,
}: {
  date: string;
  jabatan: string;
  pejabat: string;
  nip: string;
}) {
  return (
    <div
      style={{
        marginTop: 90,
        display: "flex",
        justifyContent: "flex-end",
        pageBreakInside: "avoid",
      }}
    >
      <div style={{ width: 320, textAlign: "center" }}>
        <p>Papua Barat Daya, {date}</p>
        <p style={{ marginTop: 8 }}>{jabatan}</p>

        <div style={{ height: 100 }} />

        <p
          style={{
            fontWeight: 700,
            textDecoration: "underline",
            marginBottom: 4,
          }}
        >
          {pejabat}
        </p>
        <p>{nip}</p>
      </div>
    </div>
  );
}
