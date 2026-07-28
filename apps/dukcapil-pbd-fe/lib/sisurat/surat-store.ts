"use client";

import { useSyncExternalStore } from "react";

import type { RadiogramSurat, SuratKeluar } from "@/types/surat";

import { mockRadiogramById, mockSuratKeluar } from "./mock-surat";

const storageKey = "sisurat:outgoing-letters";
const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedItems: SuratKeluar[] = mockSuratKeluar;

function isRadiogramSurat(item: SuratKeluar): item is RadiogramSurat {
  return item.jenisSurat === "radiogram";
}

export function readSuratKeluarStore() {
  if (typeof window === "undefined") {
    return mockSuratKeluar;
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (raw === cachedRaw) {
      return cachedItems;
    }

    cachedRaw = raw;
    if (!raw) {
      cachedItems = mockSuratKeluar;
      return cachedItems;
    }

    const parsed = JSON.parse(raw) as SuratKeluar[];
    cachedItems = Array.isArray(parsed) ? parsed : mockSuratKeluar;
    return cachedItems;
  } catch (error) {
    console.error(error);
    cachedRaw = undefined;
    cachedItems = mockSuratKeluar;
    return cachedItems;
  }
}

export function writeSuratKeluarStore(items: SuratKeluar[]) {
  if (typeof window === "undefined") {
    return;
  }

  cachedItems = items;
  cachedRaw = JSON.stringify(items);
  window.localStorage.setItem(storageKey, cachedRaw);
  listeners.forEach((listener) => listener());
}

export function findStoredSurat(id: string) {
  return readSuratKeluarStore().find((item) => item.id === id);
}

export function findStoredRadiogram(id: string) {
  const stored = findStoredSurat(id);
  if (stored && isRadiogramSurat(stored)) {
    return stored;
  }

  return mockRadiogramById.get(id);
}

export function upsertSuratKeluar(item: SuratKeluar) {
  const current = readSuratKeluarStore();
  const exists = current.some((record) => record.id === item.id);
  const next = exists
    ? current.map((record) => (record.id === item.id ? item : record))
    : [item, ...current];

  writeSuratKeluarStore(next);
  return next;
}

export function deleteSuratKeluar(id: string) {
  const next = readSuratKeluarStore().filter((item) => item.id !== id);
  writeSuratKeluarStore(next);
  return next;
}

export function isNomorSuratDuplicate(nomorSurat: string, currentId: string) {
  const normalized = nomorSurat.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  return readSuratKeluarStore().some(
    (item) =>
      item.id !== currentId && item.nomorSurat.trim().toLowerCase() === normalized,
  );
}

export function useSuratKeluarStore() {
  return useSyncExternalStore(
    subscribeSuratKeluarStore,
    readSuratKeluarStore,
    () => mockSuratKeluar,
  );
}

function subscribeSuratKeluarStore(listener: () => void) {
  listeners.add(listener);

  const handleStorage = (event: StorageEvent) => {
    if (event.key === storageKey) {
      listener();
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage);
  }

  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorage);
    }
  };
}
