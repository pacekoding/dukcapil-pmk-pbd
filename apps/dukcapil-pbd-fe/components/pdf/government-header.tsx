// components/pdf/government-header.tsx

import Image from "next/image";

/* =========================
   TYPES
========================= */

type Props = {
  province: string;

  agency: string;

  address: string;

  logoSrc?: string;
};

/* =========================
   COMPONENT
========================= */

export function GovernmentHeader({
  province,

  agency,

  address,

  logoSrc = "/logo-pbd.png",
}: Props) {
  return (
    <header
      style={{
        display: "flex",

        alignItems: "center",

        gap: 20,

        borderBottom: "3px solid black",

        paddingBottom: 20,

        marginBottom: 50,
      }}
    >
      {/* =========================
          LOGO
      ========================= */}

      <div
        style={{
          flexShrink: 0,
        }}
      >
        <Image
          src={logoSrc}
          alt="Logo Pemerintah"
          width={90}
          height={90}
          style={{
            objectFit: "contain",
          }}
        />
      </div>

      {/* =========================
          TEXT
      ========================= */}

      <div
        style={{
          flex: 1,

          textAlign: "center",
        }}
      >
        {/* PROVINCE */}

        <div
          style={{
            fontSize: 18,

            fontWeight: 700,

            textTransform: "uppercase",

            lineHeight: 1.4,
          }}
        >
          PEMERINTAH {province}
        </div>

        {/* AGENCY */}

        <div
          style={{
            marginTop: 6,

            fontSize: 24,

            fontWeight: 700,

            textTransform: "uppercase",

            lineHeight: 1.4,
          }}
        >
          {agency}
        </div>

        {/* ADDRESS */}

        <div
          style={{
            marginTop: 8,

            fontSize: 13,

            lineHeight: 1.5,
          }}
        >
          {address}
        </div>
      </div>
    </header>
  );
}
