import type { Metadata } from "next";

import { Inter, Plus_Jakarta_Sans } from "next/font/google";

import "./globals.css";

import { cn } from "@/lib/utils";

/* =========================
   FONTS
========================= */

/* =========================
   BODY FONT
   Clean & readable
========================= */

const inter = Inter({
  subsets: ["latin"],

  variable: "--font-sans",

  display: "swap",
});

/* =========================
   HEADING FONT
   Elegant & formal
========================= */

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],

  variable: "--font-heading",

  display: "swap",
});

/* =========================
   METADATA
========================= */

export const metadata: Metadata = {
  metadataBase: new URL("https://dukcapilpmk-pbd.go.id"),

  title: {
    default: "Portal Statistik Dukcapil & PMK Papua Barat Daya",

    template: "%s | Dukcapil & PMK Papua Barat Daya",
  },

  description:
    "Portal statistik, data wilayah, dan informasi layanan resmi Dinas Kependudukan dan Pencatatan Sipil dan Pemberdayaan Masyarakat dan Kampung Provinsi Papua Barat Daya.",

  keywords: [
    "Papua Barat Daya",

    "Dukcapil",

    "PMK",

    "Dashboard OPD",

    "Data Wilayah",

    "Digitalisasi Pelaporan",

    "Statistik Kependudukan",

    "Administrasi Kependudukan",

    "Kampung",

    "OAP",
  ],

  authors: [
    {
      name: "Dinas Dukcapil & PMK Papua Barat Daya",
    },
  ],

  creator: "Dinas Dukcapil & PMK Papua Barat Daya",

  publisher: "Dinas Dukcapil & PMK Papua Barat Daya",

  openGraph: {
    title: "Portal Statistik Dukcapil & PMK Papua Barat Daya",

    description:
      "Platform data wilayah dan monitoring layanan OPD Papua Barat Daya.",

    type: "website",

    locale: "id_ID",

    siteName: "Dukcapil & PMK Papua Barat Daya",
  },

  robots: {
    index: true,

    follow: true,
  },
};

/* =========================
   ROOT LAYOUT
========================= */

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={cn(inter.variable, plusJakarta.variable)}
    >
      <body
        suppressHydrationWarning
        className={cn(
          /* BASE */

          "min-h-screen",

          /* COLORS */

          "bg-background text-foreground",

          /* TYPOGRAPHY */

          "font-sans antialiased",

          /* RENDERING */

          "overflow-x-hidden",
        )}
      >
        {/* APP ROOT */}

        <div
          className="
            relative flex
            min-h-screen
            flex-col
          "
        >
          {children}
        </div>
      </body>
    </html>
  );
}
