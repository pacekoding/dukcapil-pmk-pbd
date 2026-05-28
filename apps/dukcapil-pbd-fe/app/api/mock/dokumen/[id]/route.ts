import { NextResponse } from "next/server";

import {
  deleteDokumen,
  getDokumenById,
  updateDokumen,
} from "@/lib/mock/dokumen-store";
import type { DokumenPayload } from "@/types/dokumen";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const document = getDokumenById(Number(id));

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

  return NextResponse.json({
    data: document,
  });
}

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const payload = (await request.json()) as DokumenPayload;
  const document = updateDokumen(Number(id), payload);

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

  return NextResponse.json({
    data: document,
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const document = deleteDokumen(Number(id));

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

  return NextResponse.json({
    data: document,
  });
}
