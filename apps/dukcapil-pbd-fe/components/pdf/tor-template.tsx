// components/pdf/tor-template.tsx

import { PdfSettings } from "@/types/pdf";
import { TorDocument } from "@/types/tor";

/* =========================
   TYPES
========================= */

type Props = {
  data: TorDocument;

  settings: PdfSettings;
};

/* =========================
   COMPONENT
========================= */

export function TorTemplate({ data, settings }: Props) {
  return (
    <div
      id="pdf-preview"
      style={{
        width: "210mm",
        minHeight: "297mm",
        margin: "0 auto",
        background: settings.paperBg,
        padding: `${settings.pagePadding}px`,
        fontSize: `${settings.fontSize}px`,
        lineHeight: String(settings.lineHeight),
        fontFamily: settings.fontFamily,
        color: settings.textColor,
        boxSizing: "border-box",
      }}
    >
      {/* =========================
          HEADER
      ========================= */}

      <div
        style={{
          textAlign: "center",
          marginBottom: 70,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 32,
            fontWeight: 700,
            textTransform: "uppercase",
          }}
        >
          TERM OF REFERENCE (TOR)
        </h1>

        <h2
          style={{
            marginTop: 18,
            fontSize: 24,
            fontWeight: 700,
          }}
        >
          Tahun Anggaran {data.tahun}
        </h2>
      </div>

      {/* =========================
          INFORMASI
      ========================= */}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <InfoRow label="Pemerintah Daerah" value={data.kementerian} />

        <InfoRow label="Dinas" value={data.dinas} />

        <InfoRow label="Unit Kerja" value={data.unitKerja} />

        <InfoRow label="Judul Kegiatan" value={data.judul} />

        <InfoRow label="IKU" value={data.iku} />

        <InfoRow label="Target IKU" value={data.targetIku} />

        <InfoRow label="IKK" value={data.ikk} />

        <InfoRow label="Target IKK" value={data.targetIkk} />
      </div>

      {/* =========================
          LATAR BELAKANG
      ========================= */}

      <SectionTitle>A. LATAR BELAKANG</SectionTitle>

      <p
        style={{
          textAlign: "justify",
        }}
      >
        {data.latarBelakang}
      </p>

      {/* =========================
          TUJUAN
      ========================= */}

      <SectionTitle>B. TUJUAN KEGIATAN</SectionTitle>

      <BulletList items={data.tujuan} />

      {/* =========================
          SASARAN
      ========================= */}

      <SectionTitle>C. SASARAN KEGIATAN</SectionTitle>

      <BulletList items={data.sasaran} />

      {/* =========================
          OUTPUT
      ========================= */}

      <SectionTitle>D. OUTPUT KEGIATAN</SectionTitle>

      <BulletList items={data.outputs} />

      {/* =========================
          WAKTU
      ========================= */}

      <SectionTitle>E. WAKTU DAN TEMPAT</SectionTitle>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <InfoRow label="Tanggal" value={data.tanggal} />

        <InfoRow label="Waktu" value={data.waktu} />

        <InfoRow label="Tempat" value={data.lokasi} />

        <InfoRow label="Peserta" value={`${data.peserta} Peserta`} />
      </div>

      {/* =========================
          RUNDOWN
      ========================= */}

      <SectionTitle>F. RUNDOWN KEGIATAN</SectionTitle>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: 20,
        }}
      >
        <thead>
          <tr>
            <TableHeader>Waktu</TableHeader>

            <TableHeader>Kegiatan</TableHeader>

            <TableHeader>Keterangan</TableHeader>
          </tr>
        </thead>

        <tbody>
          {data.rundown.map((item) => (
            <tr key={item.waktu}>
              <TableCell>{item.waktu}</TableCell>

              <TableCell>{item.kegiatan}</TableCell>

              <TableCell>{item.keterangan}</TableCell>
            </tr>
          ))}
        </tbody>
      </table>

      {/* =========================
          RINCIAN BIAYA
      ========================= */}

      <SectionTitle>G. RINCIAN BIAYA</SectionTitle>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: 20,
        }}
      >
        <thead>
          <tr>
            <TableHeader>No</TableHeader>

            <TableHeader>Uraian</TableHeader>

            <TableHeader>Volume</TableHeader>

            <TableHeader>Harga</TableHeader>

            <TableHeader>Jumlah</TableHeader>
          </tr>
        </thead>

        <tbody>
          {data.biaya.map((item) => (
            <tr key={item.no}>
              <TableCell>{item.no}</TableCell>

              <TableCell>{item.uraian}</TableCell>

              <TableCell>{item.volume}</TableCell>

              <TableCell>{item.harga}</TableCell>

              <TableCell>{item.jumlah}</TableCell>
            </tr>
          ))}

          <tr>
            <td
              colSpan={4}
              style={{
                border: "1px solid #000",
                padding: 10,
                textAlign: "right",
                fontWeight: 700,
              }}
            >
              Total
            </td>

            <td
              style={{
                border: "1px solid #000",
                padding: 10,
                fontWeight: 700,
              }}
            >
              {data.totalBiaya}
            </td>
          </tr>
        </tbody>
      </table>

      {/* =========================
          PENUTUP
      ========================= */}

      <SectionTitle>H. PENUTUP</SectionTitle>

      <p
        style={{
          textAlign: "justify",
        }}
      >
        Demikian Term Of Reference (TOR) ini disusun sebagai acuan pelaksanaan
        kegiatan dan dasar pengajuan dukungan anggaran kegiatan pada Dinas
        Kependudukan dan Pencatatan Sipil dan Pemberdayaan Masyarakat dan
        Kampung Provinsi Papua Barat Daya.
      </p>

      {/* =========================
          SIGNATURE
      ========================= */}

      <div
        style={{
          marginTop: 120,

          display: "flex",

          justifyContent: "flex-end",

          pageBreakInside: "avoid",
        }}
      >
        <div
          style={{
            width: 320,

            textAlign: "center",
          }}
        >
          <p>Papua Barat Daya, {data.tanggal}</p>

          <p
            style={{
              marginTop: 8,
            }}
          >
            Penanggung Jawab Kegiatan
          </p>

          {/* SIGNATURE SPACE */}

          <div
            style={{
              height: 100,
            }}
          />

          <p
            style={{
              fontWeight: 700,

              textDecoration: "underline",
            }}
          >
            {data.pejabat}
          </p>

          <p>{data.nip}</p>
        </div>
      </div>
    </div>
  );
}

/* =========================
   SECTION TITLE
========================= */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        marginTop: 42,
        marginBottom: 18,
        fontSize: 20,
        fontWeight: 700,
      }}
    >
      {children}
    </h3>
  );
}

/* =========================
   INFO ROW
========================= */

type InfoRowProps = {
  label: string;

  value: string;
};

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div
      style={{
        display: "grid",

        gridTemplateColumns: "240px 16px 1fr",

        alignItems: "start",

        columnGap: 8,
      }}
    >
      {/* LABEL */}

      <div
        style={{
          fontWeight: 500,
        }}
      >
        {label}
      </div>

      {/* COLON */}

      <div>:</div>

      {/* VALUE */}

      <div
        style={{
          wordBreak: "break-word",

          lineHeight: 1.7,
        }}
      >
        {value}
      </div>
    </div>
  );
}

/* =========================
   BULLET LIST
========================= */

type BulletListProps = {
  items: string[];
};

function BulletList({ items }: BulletListProps) {
  return (
    <ul
      style={{
        paddingLeft: 24,
        margin: 0,
      }}
    >
      {items.map((item) => (
        <li
          key={item}
          style={{
            marginBottom: 8,
          }}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

/* =========================
   TABLE HEADER
========================= */

function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        border: "1px solid #000",

        padding: 10,

        textAlign: "left",

        background: "#f1f5f9",

        fontWeight: 700,
      }}
    >
      {children}
    </th>
  );
}

/* =========================
   TABLE CELL
========================= */

function TableCell({ children }: { children: React.ReactNode }) {
  return (
    <td
      style={{
        border: "1px solid #000",

        padding: 10,

        verticalAlign: "top",
      }}
    >
      {children}
    </td>
  );
}
