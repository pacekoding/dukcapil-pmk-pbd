import { kegiatanData } from "@/lib/dummy/kegiatan-data";
import type {
  Kegiatan,
  KegiatanDokumentasiPayload,
  KegiatanPayload,
} from "@/types/kegiatan";

let kegiatanStore: Kegiatan[] = kegiatanData.map((item) => ({
  ...item,
  dokumentasi: item.dokumentasi ? [...item.dokumentasi] : [],
}));

export function listKegiatan() {
  return kegiatanStore;
}

export function getKegiatanById(id: number) {
  return kegiatanStore.find((item) => item.id === id) ?? null;
}

export function createKegiatan(payload: KegiatanPayload) {
  const nextId = Math.max(0, ...kegiatanStore.map((item) => item.id)) + 1;

  const item: Kegiatan = {
    ...payload,
    id: nextId,
    dokumentasi: payload.dokumentasi ?? [],
  };

  kegiatanStore = [item, ...kegiatanStore];

  return item;
}

export function updateKegiatan(id: number, payload: KegiatanPayload) {
  const current = getKegiatanById(id);

  if (!current) {
    return null;
  }

  const updated: Kegiatan = {
    ...payload,
    id,
    dokumentasi: payload.dokumentasi ?? current.dokumentasi ?? [],
  };

  kegiatanStore = kegiatanStore.map((item) =>
    item.id === id ? updated : item,
  );

  return updated;
}

export function deleteKegiatan(id: number) {
  const current = getKegiatanById(id);

  if (!current) {
    return null;
  }

  kegiatanStore = kegiatanStore.filter((item) => item.id !== id);

  return current;
}

export function addKegiatanDokumentasi(
  id: number,
  payload: KegiatanDokumentasiPayload,
) {
  const current = getKegiatanById(id);

  if (!current) {
    return null;
  }

  const currentDocumentation = current.dokumentasi ?? [];
  const nextId =
    Math.max(0, ...currentDocumentation.map((item) => item.id)) + 1;

  const item = {
    ...payload,
    id: nextId,
    uploadedAt: new Date().toISOString(),
  };

  kegiatanStore = kegiatanStore.map((kegiatan) =>
    kegiatan.id === id
      ? {
          ...kegiatan,
          dokumentasi: [item, ...(kegiatan.dokumentasi ?? [])],
        }
      : kegiatan,
  );

  return item;
}

export function deleteKegiatanDokumentasi(id: number, documentationId: number) {
  const current = getKegiatanById(id);

  if (!current) {
    return null;
  }

  const documentationItem = (current.dokumentasi ?? []).find(
    (item) => item.id === documentationId,
  );

  if (!documentationItem) {
    return null;
  }

  kegiatanStore = kegiatanStore.map((kegiatan) =>
    kegiatan.id === id
      ? {
          ...kegiatan,
          dokumentasi: (kegiatan.dokumentasi ?? []).filter(
            (item) => item.id !== documentationId,
          ),
        }
      : kegiatan,
  );

  return documentationItem;
}
