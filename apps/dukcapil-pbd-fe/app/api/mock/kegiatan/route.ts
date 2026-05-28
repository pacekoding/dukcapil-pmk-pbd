import { NextResponse } from "next/server";

import {
  bidangOptions,
  kegiatanJenisOptions,
  kegiatanStatusFilterOptions,
  kegiatanStatusFormOptions,
} from "@/lib/dummy/kegiatan-data";
import { createKegiatan, listKegiatan } from "@/lib/mock/kegiatan-store";
import type { KegiatanPayload } from "@/types/kegiatan";

export async function GET() {
  return NextResponse.json({
    data: {
      items: listKegiatan(),
      options: {
        bidangOptions,
        jenisOptions: kegiatanJenisOptions,
        statusFilterOptions: kegiatanStatusFilterOptions,
        statusFormOptions: kegiatanStatusFormOptions,
      },
    },
  });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as KegiatanPayload;
  const item = createKegiatan(payload);

  return NextResponse.json(
    {
      data: item,
    },
    {
      status: 201,
    },
  );
}
