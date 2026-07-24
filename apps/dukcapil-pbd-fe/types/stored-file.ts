export type FileVisibility = "public" | "private";

export type StoredFileMetadata = {
  id: number;
  module: string;
  relatedEntityType: string;
  relatedEntityId: number;
  category: string;
  originalFilename: string;
  storedFilename: string;
  mimeType: string;
  fileSize: number;
  checksumSha256: string;
  visibility: FileVisibility;
  previewUrl: string;
  downloadUrl: string;
  publicPreviewUrl?: string;
  publicDownloadUrl?: string;
  createdAt: string;
  updatedAt: string;
};
