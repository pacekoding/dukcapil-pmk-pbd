import { dokumenData } from "@/lib/dummy/dokumen-data";
import type { Dokumen, DokumenPayload } from "@/types/dokumen";

let dokumenStore: Dokumen[] = dokumenData.map((item) => ({ ...item }));

export function listDokumen() {
  return dokumenStore;
}

export function getDokumenById(id: number) {
  return dokumenStore.find((item) => item.id === id) ?? null;
}

export function createDokumen(payload: DokumenPayload) {
  const nextId = Math.max(0, ...dokumenStore.map((item) => item.id)) + 1;

  const item: Dokumen = {
    ...payload,
    id: nextId,
  };

  dokumenStore = [item, ...dokumenStore];

  return item;
}

export function updateDokumen(id: number, payload: DokumenPayload) {
  const current = getDokumenById(id);

  if (!current) {
    return null;
  }

  const updated: Dokumen = {
    ...payload,
    id,
  };

  dokumenStore = dokumenStore.map((item) => (item.id === id ? updated : item));

  return updated;
}

export function deleteDokumen(id: number) {
  const current = getDokumenById(id);

  if (!current) {
    return null;
  }

  dokumenStore = dokumenStore.filter((item) => item.id !== id);

  return current;
}
