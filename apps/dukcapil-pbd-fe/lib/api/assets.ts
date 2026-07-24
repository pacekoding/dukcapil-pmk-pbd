export function normalizeBackendAssetUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  if (trimmed.startsWith("/api/backend/op_info/")) {
    return `/api/backend/optima-info/${trimmed.slice("/api/backend/op_info/".length)}`;
  }
  if (trimmed.startsWith("/api/backend/")) {
    return trimmed;
  }
  if (trimmed.startsWith("/api/v1/op_info/")) {
    return `/api/backend/optima-info/${trimmed.slice("/api/v1/op_info/".length)}`;
  }
  if (trimmed.startsWith("/api/v1/")) {
    return `/api/backend/${trimmed.slice("/api/v1/".length)}`;
  }
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export function withInlineBackendAssetDisposition(value: string) {
  const normalized = normalizeBackendAssetUrl(value);
  if (!normalized) {
    return "";
  }
  return withBackendAssetDisposition(normalized, "inline");
}

export function withBackendAssetDisposition(
  value: string,
  disposition: "inline" | "attachment",
) {
  const normalized = normalizeBackendAssetUrl(value);
  if (!normalized || !normalized.startsWith("/api/backend/")) {
    return normalized;
  }
  return `${normalized}${normalized.includes("?") ? "&" : "?"}disposition=${disposition}`;
}
