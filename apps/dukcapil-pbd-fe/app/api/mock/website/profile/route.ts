import { NextResponse } from "next/server";

import { getWebsiteProfileData } from "@/lib/dummy/website-data";

export async function GET() {
  return NextResponse.json({
    data: getWebsiteProfileData(),
  });
}
