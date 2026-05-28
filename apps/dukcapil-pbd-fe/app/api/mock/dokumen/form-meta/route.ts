import { NextResponse } from "next/server";

import { dokumenTypeOptions } from "@/lib/dummy/dokumen-data";
import {
  laporanPelaksanaanData,
  laporanPdfSections,
} from "@/lib/dummy/laporan-data";
import { listKegiatan } from "@/lib/mock/kegiatan-store";
import { torData, torPdfSections } from "@/lib/dummy/tor-data";
import type { DokumenFormMeta } from "@/types/dokumen";

export async function GET() {
  const data: DokumenFormMeta = {
    dokumenTypeOptions,
    kegiatanOptions: listKegiatan().map((item) => ({
      id: item.id,
      nama: item.nama,
    })),
    torData,
    torPdfSections,
    laporanPelaksanaanData,
    laporanPdfSections,
  };

  return NextResponse.json({
    data,
  });
}
