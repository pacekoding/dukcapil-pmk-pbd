"use client";

import { FileArchive } from "lucide-react";

import { PelaksanaanDocumentsPage } from "@/components/dashboard/pelaksanaan-documents-page";

export default function SidakDataPage() {
  return (
    <PelaksanaanDocumentsPage
      moduleName="SIDAK"
      icon={FileArchive}
      title="Data Dokumen Pelaksanaan Dukcapil"
      description="Kelola dokumen pelaksanaan kegiatan Dukcapil berdasarkan nama, subkegiatan, status DSSD, dan tanggal upload."
      tableTitle="Dokumen Pelaksanaan Dukcapil"
      emptyTitle="Belum ada dokumen pelaksanaan Dukcapil."
      emptyDescription="Tambah dokumen pelaksanaan Dukcapil untuk menampilkan data pada tabel ini."
      sumberAplikasi="sidak"
      bidang="dukcapil"
      subkegiatanPrefix="2.12"
      subkegiatanScopeLabel="Dukcapil 2.12"
    />
  );
}
