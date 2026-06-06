const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export const API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX ?? "/api/backend";

type ApiEnvelope<T> = {
  data?: T;
  message?: string;
};

function isObjectPayload(payload: unknown): payload is Record<string, unknown> {
  return typeof payload === "object" && payload !== null;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);

  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
    credentials: "include",
    ...init,
    headers,
  });

  const payload = (await response.json().catch(() => null)) as
    | ApiEnvelope<T>
    | T
    | null;

  if (!response.ok) {
    const messageValue = isObjectPayload(payload) ? payload.message : null;
    const message =
      typeof messageValue === "string" ? messageValue : "Request gagal";

    throw new ApiError(message, response.status);
  }

  if (isObjectPayload(payload) && "data" in payload) {
    return payload.data as T;
  }

  return payload as T;
}
