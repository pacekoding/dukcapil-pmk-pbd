import { apiEndpoints } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/http";
import type {
  Kegiatan,
  KegiatanBidang,
  KegiatanDokumentasiItem,
  KegiatanDokumentasiPayload,
  KegiatanJenis,
  KegiatanPayload,
  KegiatanSelectOption,
  KegiatanStatus,
  KegiatanStatusFilterOption,
} from "@/types/kegiatan";

export type KegiatanListResponse = {
  items: Kegiatan[];
  options: {
    bidangOptions: KegiatanSelectOption<KegiatanBidang>[];
    jenisOptions: KegiatanSelectOption<KegiatanJenis>[];
    statusFilterOptions: KegiatanStatusFilterOption[];
    statusFormOptions: KegiatanSelectOption<KegiatanStatus>[];
  };
};

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("File dokumentasi tidak dapat dibaca."));
    };

    reader.onerror = () => {
      reject(new Error("File dokumentasi tidak dapat dibaca."));
    };

    reader.readAsDataURL(file);
  });

export function getKegiatanList() {
  return apiRequest<KegiatanListResponse>(apiEndpoints.kegiatan);
}

export function createKegiatan(payload: KegiatanPayload) {
  return apiRequest<Kegiatan>(apiEndpoints.kegiatan, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateKegiatan(id: number, payload: KegiatanPayload) {
  return apiRequest<Kegiatan>(apiEndpoints.kegiatanDetail(id), {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteKegiatan(id: number) {
  return apiRequest<Kegiatan>(apiEndpoints.kegiatanDetail(id), {
    method: "DELETE",
  });
}

export function addKegiatanDokumentasi(
  id: number,
  payload: KegiatanDokumentasiPayload,
) {
  return apiRequest<KegiatanDokumentasiItem>(
    apiEndpoints.kegiatanDokumentasi(id),
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export async function uploadKegiatanDokumentasi(
  id: number,
  file: File,
  caption: string,
) {
  const payload: KegiatanDokumentasiPayload = {
    url: await readFileAsDataUrl(file),
    caption: caption.trim() || file.name,
    fileName: file.name,
  };

  return addKegiatanDokumentasi(id, payload);
}

export function deleteKegiatanDokumentasi(
  id: number,
  documentationId: number,
) {
  return apiRequest<KegiatanDokumentasiItem>(
    apiEndpoints.kegiatanDokumentasiDetail(id, documentationId),
    {
      method: "DELETE",
    },
  );
}
