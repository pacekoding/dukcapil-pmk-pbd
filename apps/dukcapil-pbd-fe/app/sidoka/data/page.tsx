"use client";

import { FileArchive } from "lucide-react";

import { PelaksanaanDocumentsPage } from "@/components/dashboard/pelaksanaan-documents-page";

export default function SidokaDataPage() {
  return (
    <PelaksanaanDocumentsPage
      moduleName="SIDOKA"
      icon={FileArchive}
      title="Data Dokumen Pelaksanaan PMK"
      description="Kelola dokumen pelaksanaan kegiatan PMK berdasarkan nama, subkegiatan, status DSSD, dan tanggal upload."
      tableTitle="Dokumen Pelaksanaan PMK"
      emptyTitle="Belum ada dokumen pelaksanaan PMK."
      emptyDescription="Tambah dokumen pelaksanaan PMK untuk menampilkan data pada tabel ini."
      subkegiatanPrefix="2.13"
      subkegiatanScopeLabel="PMK 2.13"
    />
  );
}
