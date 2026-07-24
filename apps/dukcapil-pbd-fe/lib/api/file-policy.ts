export const IMAGE_FILE_ACCEPT =
  "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";

export const PDF_FILE_ACCEPT = "application/pdf,.pdf";

export const ARCHIVE_FILE_ACCEPT = `${PDF_FILE_ACCEPT},${IMAGE_FILE_ACCEPT}`;

const configuredMaxUploadSizeMB = Number(
  process.env.NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB ?? "20",
);

export const DEFAULT_MAX_UPLOAD_SIZE_MB =
  Number.isFinite(configuredMaxUploadSizeMB) && configuredMaxUploadSizeMB > 0
    ? configuredMaxUploadSizeMB
    : 20;
export const DEFAULT_MAX_UPLOAD_SIZE_BYTES =
  DEFAULT_MAX_UPLOAD_SIZE_MB * 1024 * 1024;

type UploadKind = "image" | "pdf" | "archive";

const extensionsByKind: Record<UploadKind, Set<string>> = {
  image: new Set([".jpg", ".jpeg", ".png", ".webp"]),
  pdf: new Set([".pdf"]),
  archive: new Set([".pdf", ".jpg", ".jpeg", ".png", ".webp"]),
};

export function validateClientUpload(file: File, kind: UploadKind) {
  if (file.size === 0) {
    throw new Error("File tidak boleh kosong.");
  }
  if (file.size > DEFAULT_MAX_UPLOAD_SIZE_BYTES) {
    throw new Error(
      `Ukuran file maksimal ${DEFAULT_MAX_UPLOAD_SIZE_MB} MB.`,
    );
  }
  const dotIndex = file.name.lastIndexOf(".");
  const extension =
    dotIndex >= 0 ? file.name.slice(dotIndex).toLowerCase() : "";
  if (!extensionsByKind[kind].has(extension)) {
    throw new Error("Format file tidak didukung.");
  }
}
