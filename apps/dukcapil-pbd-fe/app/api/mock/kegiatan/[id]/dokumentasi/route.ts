import { NextResponse } from "next/server";

import {
  addKegiatanDokumentasi,
  getKegiatanById,
} from "@/lib/mock/kegiatan-store";
import type { KegiatanDokumentasiPayload } from "@/types/kegiatan";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const item = getKegiatanById(Number(id));

  if (!item) {
    return NextResponse.json(
      {
        message: "Kegiatan tidak ditemukan",
      },
      {
        status: 404,
      },
    );
  }

  return NextResponse.json({
    data: item.dokumentasi ?? [],
  });
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
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

  if (current.status !== "Selesai") {
    return NextResponse.json(
      {
        message: "Dokumentasi hanya dapat ditambahkan untuk kegiatan selesai",
      },
      {
        status: 400,
      },
    );
  }

  const payload = (await request.json()) as KegiatanDokumentasiPayload;

  if (!payload.url || !payload.caption) {
    return NextResponse.json(
      {
        message: "Foto dan keterangan dokumentasi wajib diisi",
      },
      {
        status: 400,
      },
    );
  }

  const item = addKegiatanDokumentasi(Number(id), payload);

  if (!item) {
    return NextResponse.json(
      {
        message: "Kegiatan tidak ditemukan",
      },
      {
        status: 404,
      },
    );
  }

  return NextResponse.json(
    {
      data: item,
    },
    {
      status: 201,
    },
  );
}
