"use client";

import { ConfirmDeleteDialog } from "@/components/dashboard/confirm-delete-dialog";
import type { SuratKeluar } from "@/types/surat";

type DeleteSuratDialogProps = {
  surat?: SuratKeluar;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function DeleteSuratDialog({
  surat,
  open,
  onOpenChange,
  onConfirm,
}: DeleteSuratDialogProps) {
  return (
    <ConfirmDeleteDialog
      open={open}
      title="Hapus Surat Keluar"
      description={`Surat ${surat?.nomorSurat ?? "ini"} akan dihapus dari daftar prototype. Tindakan ini hanya berlaku pada data mock di tampilan saat ini.`}
      confirmLabel="Hapus Surat"
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
    />
  );
}
