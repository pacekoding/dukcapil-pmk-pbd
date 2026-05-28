import { NextResponse } from "next/server";

import {
  deleteKegiatanDokumentasi,
  getKegiatanById,
} from "@/lib/mock/kegiatan-store";

type RouteContext = {
  params: Promise<{
    id: string;
    documentationId: string;
  }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const { id, documentationId } = await context.params;
  const current = getKegiatanById(Number(id));

  if (!current) {
    return NextResponse.json(
      {
        message: "Kegiatan tidak ditemukan",
      },
      {
        status: 404,
      },
    );
  }

  const item = deleteKegiatanDokumentasi(
    Number(id),
    Number(documentationId),
  );

  if (!item) {
    return NextResponse.json(
      {
        message: "Foto dokumentasi tidak ditemukan",
      },
      {
        status: 404,
      },
    );
  }

  return NextResponse.json({
    data: item,
  });
}
