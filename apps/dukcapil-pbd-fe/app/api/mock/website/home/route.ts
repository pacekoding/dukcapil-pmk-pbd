import { NextResponse } from "next/server";

import { getWebsiteHomeData } from "@/lib/dummy/website-data";

export async function GET() {
  return NextResponse.json({
    data: getWebsiteHomeData(),
  });
}
