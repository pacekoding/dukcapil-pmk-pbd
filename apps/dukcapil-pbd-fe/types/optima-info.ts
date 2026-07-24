import type { StoredFileMetadata } from "@/types/stored-file";

export type OptimaInfoStatus = "Draft" | "Published" | "Archived";

export type OptimaInfoSummary = {
  id: number;
  title: string;
  slug: string;
  category: string;
  summary: string;
  status: OptimaInfoStatus;
  displayOrder: number;
  isFeatured: boolean;
  authorName: string;
  publishedByName: string;
  publishedAt: string;
  startDate: string;
  endDate: string;
  updatedAt: string;
  createdAt: string;
  thumbnailUrl: string;
  thumbnailFileId?: number;
  attachmentDownloadUrl?: string;
  attachmentFileId?: number;
};

export type OptimaInfoRelatedItem = {
  id: number;
  title: string;
  slug: string;
  category: string;
  summary: string;
  publishedAt: string;
  thumbnailUrl: string;
  thumbnailFileId?: number;
  updatedAt: string;
};

export type OptimaInfoDetail = {
  id: number;
  title: string;
  slug: string;
  category: string;
  summary: string;
  content: string;
  status: OptimaInfoStatus;
  externalUrl: string;
  displayOrder: number;
  isFeatured: boolean;
  authorName: string;
  publishedByName: string;
  publishedAt: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  thumbnailUrl: string;
  thumbnailFileId?: number;
  thumbnailOriginalName: string;
  thumbnailMimeType: string;
  thumbnailSize: number;
  thumbnailChecksumSha256?: string;
  attachmentDownloadUrl: string;
  attachmentFileId?: number;
  attachmentOriginalName: string;
  attachmentMimeType: string;
  attachmentSize: number;
  attachmentChecksumSha256?: string;
  contentImages: StoredFileMetadata[];
  related: OptimaInfoRelatedItem[];
};

export type OptimaInfoMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type OptimaInfoStats = {
  total: number;
  draft: number;
  published: number;
  archived: number;
};

export type OptimaInfoAdminListResponse = {
  items: OptimaInfoSummary[];
  meta: OptimaInfoMeta;
  stats: OptimaInfoStats;
  categories: string[];
};

export type OptimaInfoPublicListResponse = {
  items: OptimaInfoSummary[];
  featured: OptimaInfoSummary[];
  meta: OptimaInfoMeta;
  categories: string[];
};

export type OptimaInfoFilters = {
  search?: string;
  category?: string;
  status?: string;
  year?: string;
  page?: number;
  limit?: number;
};

export type OptimaInfoPublicFilters = {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
};

export type SaveOptimaInfoPayload = {
  title: string;
  slug: string;
  category: string;
  summary: string;
  content: string;
  externalUrl: string;
  displayOrder: number;
  isFeatured: boolean;
  startDate: string;
  endDate: string;
  removeThumbnail: boolean;
  removeAttachment: boolean;
  thumbnail?: File | null;
  attachment?: File | null;
  intent?: "save" | "preview" | "publish";
};
