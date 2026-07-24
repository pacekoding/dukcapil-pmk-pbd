import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_BASE_URL =
  process.env.SERVER_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8080";

const API_PREFIX = process.env.SERVER_API_PREFIX ?? "/api/v1";

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

const methodsWithoutBody = new Set(["GET", "HEAD"]);

async function proxyRequest(request: Request, context: RouteContext) {
  const { path } = await context.params;
  const upstreamPath = normalizeBackendPath(path);
  const requestUrl = new URL(request.url);
  const upstreamUrl = new URL(
    `${API_BASE_URL}${API_PREFIX}/${upstreamPath.join("/")}`,
  );
  upstreamUrl.search = requestUrl.search;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("cookie");

  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const upstreamResponse = await fetch(upstreamUrl, {
    method: request.method,
    headers,
    body: methodsWithoutBody.has(request.method)
      ? undefined
      : await request.arrayBuffer(),
    cache: "no-store",
  });

  const responseHeaders = new Headers(upstreamResponse.headers);
  if (responseHeaders.has("content-encoding")) {
    responseHeaders.delete("content-encoding");
    responseHeaders.delete("content-length");
  }
  responseHeaders.delete("transfer-encoding");
  responseHeaders.delete("connection");

  const responseBody =
    request.method === "HEAD" ||
    upstreamResponse.status === 204 ||
    upstreamResponse.status === 304
      ? null
      : upstreamResponse.body;

  return new NextResponse(
    responseBody,
    {
      status: upstreamResponse.status,
      headers: responseHeaders,
    },
  );
}

export const GET = proxyRequest;
export const HEAD = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;

function normalizeBackendPath(path: string[]) {
  if (path[0] === "op_info") {
    return ["optima-info", ...path.slice(1)];
  }
  return path;
}
