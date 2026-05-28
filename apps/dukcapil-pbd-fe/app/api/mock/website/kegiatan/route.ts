import { NextResponse } from "next/server";

import { getWebsiteKegiatanData } from "@/lib/dummy/website-data";

export async function GET() {
  return NextResponse.json({
    data: getWebsiteKegiatanData(),
  });
}
