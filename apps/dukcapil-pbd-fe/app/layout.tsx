import type { Metadata } from "next";

import "./globals.css";

import { cn } from "@/lib/utils";

/* =========================
   METADATA
========================= */

export const metadata: Metadata = {
  metadataBase: new URL("https://dukcapilpmk-pbd.go.id"),

  title: {
    default: "Dinas Dukcapil & PMK Provinsi Papua Barat Daya",

    template: "%s | Dukcapil & PMK Papua Barat Daya",
  },

  description:
    "Website resmi Dinas Kependudukan dan Pencatatan Sipil dan Pemberdayaan Masyarakat dan Kampung Provinsi Papua Barat Daya untuk profil dinas, data wilayah, layanan publik, pengumuman, dan informasi resmi.",

  keywords: [
    "Papua Barat Daya",

    "Dukcapil",

    "PMK",

    "Website Resmi",

    "Data Wilayah",

    "Layanan Publik",

    "Statistik Kependudukan",

    "Administrasi Kependudukan",

    "Pemberdayaan Masyarakat Kampung",

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
    title: "Dinas Dukcapil & PMK Provinsi Papua Barat Daya",

    description:
      "Website resmi untuk profil dinas, data wilayah, layanan publik, dan informasi resmi Dukcapil dan PMK Papua Barat Daya.",

    type: "website",

    locale: "id_ID",

    siteName: "Dukcapil & PMK Papua Barat Daya",

    images: [
      {
        url: "/hero-pbd.png",
        width: 1200,
        height: 630,
        alt: "Papua Barat Daya",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Dinas Dukcapil & PMK Provinsi Papua Barat Daya",
    description:
      "Website resmi Dinas Dukcapil dan PMK Provinsi Papua Barat Daya.",
    images: ["/hero-pbd.png"],
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
      translate="yes"
      suppressHydrationWarning
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
