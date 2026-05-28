import { NextResponse } from "next/server";

import {
  dokumenJenisDokumenOptions,
  dokumenJenisKegiatanOptions,
} from "@/lib/dummy/dokumen-data";
import { createDokumen, listDokumen } from "@/lib/mock/dokumen-store";
import type { DokumenListResponse, DokumenPayload } from "@/types/dokumen";

export async function GET() {
  const data: DokumenListResponse = {
    documents: listDokumen(),
    jenisKegiatanOptions: dokumenJenisKegiatanOptions,
    jenisDokumenOptions: dokumenJenisDokumenOptions,
  };

  return NextResponse.json({
    data,
  });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as DokumenPayload;
  const item = createDokumen(payload);

  return NextResponse.json(
    {
      data: item,
    },
    {
      status: 201,
    },
  );
}
