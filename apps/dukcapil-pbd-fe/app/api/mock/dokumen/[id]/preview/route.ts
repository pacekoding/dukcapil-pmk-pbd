import { NextResponse } from "next/server";

import { getDokumenById, listDokumen } from "@/lib/mock/dokumen-store";
import { listKegiatan } from "@/lib/mock/kegiatan-store";
import {
  buildLaporanPreviewData,
  buildTorPreviewData,
} from "@/lib/pdf/document-preview-builder";
import type { DokumenPreviewData } from "@/types/dokumen";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const document = getDokumenById(Number(id)) ?? listDokumen()[0];

  if (!document) {
    return NextResponse.json(
      {
        message: "Dokumen tidak ditemukan",
      },
      {
        status: 404,
      },
    );
  }

  const kegiatan =
    listKegiatan().find((item) => item.nama === document.namaKegiatan) ??
    listKegiatan().find((item) => item.jenis === document.jenisKegiatan) ??
    null;

  const data: DokumenPreviewData = {
    document,
    torData: buildTorPreviewData(document, kegiatan),
    laporanPelaksanaanData: buildLaporanPreviewData(document, kegiatan),
  };

  return NextResponse.json({
    data,
  });
}
