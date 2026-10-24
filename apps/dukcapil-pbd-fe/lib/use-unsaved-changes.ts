"use client";

import { useEffect } from "react";

export function useUnsavedChanges(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);
}

export function confirmDiscard(dirty: boolean) {
  return !dirty || window.confirm("Perubahan belum disimpan. Tetap tinggalkan halaman ini?");
}
