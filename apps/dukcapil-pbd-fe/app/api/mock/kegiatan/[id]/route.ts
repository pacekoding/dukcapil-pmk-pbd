import { NextResponse } from "next/server";

import {
  deleteKegiatan,
  getKegiatanById,
  updateKegiatan,
} from "@/lib/mock/kegiatan-store";
import type { KegiatanPayload } from "@/types/kegiatan";

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
    data: item,
  });
}

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const payload = (await request.json()) as KegiatanPayload;
  const item = updateKegiatan(Number(id), payload);

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
    data: item,
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const item = deleteKegiatan(Number(id));

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
    data: item,
  });
}
