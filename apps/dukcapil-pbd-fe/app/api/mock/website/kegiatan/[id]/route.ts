import { NextResponse } from "next/server";

import { getWebsiteKegiatanDetailData } from "@/lib/dummy/website-data";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const item = getWebsiteKegiatanDetailData(Number(id));

  if (!item) {
    return NextResponse.json(
      {
        message: "Kegiatan selesai tidak ditemukan",
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
