"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Archive,
  ArrowRight,
  Edit,
  FileCheck2,
  IdCard,
  Plus,
  Search,
  Trash2,
  UsersRound,
} from "lucide-react";

import { PageHero } from "@/components/dashboard/page-hero";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  PEGAWAI_ARCHIVE_STORAGE_KEY,
  pegawaiArchives,
  type PegawaiArchive,
} from "@/app/arsip-pegawai/_data/pegawai-archive";

type PegawaiForm = {
  nip: string;
  nik: string;
  name: string;
  position: string;
  unit: string;
  rank: string;
  email: string;
  phone: string;
  bankAccount: string;
  address: string;
  status: PegawaiArchive["status"];
};

const photoColors = [
  "bg-blue-100 text-blue-700",
  "bg-cyan-100 text-cyan-700",
  "bg-indigo-100 text-indigo-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
];

export default function ArsipPegawaiPage() {
  const [pegawaiRecords, setPegawaiRecords] =
    useState<PegawaiArchive[]>(pegawaiArchives);
  const [storageReady, setStorageReady] = useState(false);
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PegawaiForm>(() => createEmptyPegawaiForm());

  useEffect(() => {
    const storedRecords = window.localStorage.getItem(
      PEGAWAI_ARCHIVE_STORAGE_KEY,
    );

    if (!storedRecords) {
      setStorageReady(true);
      return;
    }

    try {
      setPegawaiRecords(JSON.parse(storedRecords) as PegawaiArchive[]);
    } catch {
      window.localStorage.removeItem(PEGAWAI_ARCHIVE_STORAGE_KEY);
    }

    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    window.localStorage.setItem(
      PEGAWAI_ARCHIVE_STORAGE_KEY,
      JSON.stringify(pegawaiRecords),
    );
  }, [pegawaiRecords, storageReady]);

  const filteredPegawai = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return pegawaiRecords;
    }

    return pegawaiRecords.filter((pegawai) =>
      [
        pegawai.name,
        pegawai.nip,
        pegawai.nik,
        pegawai.position,
        pegawai.unit,
        pegawai.rank,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [pegawaiRecords, query]);

  const totalDocuments = pegawaiRecords.reduce(
    (total, pegawai) => total + pegawai.documents.length,
    0,
  );
  const needsVerification = pegawaiRecords.reduce(
    (total, pegawai) =>
      total +
      pegawai.documents.filter(
        (document) => document.status === "Perlu Verifikasi",
      ).length,
    0,
  );

  const editingPegawai = editingId
    ? pegawaiRecords.find((pegawai) => pegawai.id === editingId)
    : null;

  const openCreateDialog = () => {
    setEditingId(null);
    setForm(createEmptyPegawaiForm());
    setDialogOpen(true);
  };

  const openEditDialog = (pegawai: PegawaiArchive) => {
    setEditingId(pegawai.id);
    setForm({
      nip: pegawai.nip,
      nik: pegawai.nik,
      name: pegawai.name,
      position: pegawai.position,
      unit: pegawai.unit,
      rank: pegawai.rank,
      email: pegawai.email,
      phone: pegawai.phone,
      bankAccount: pegawai.bankAccount,
      address: pegawai.address,
      status: pegawai.status,
    });
    setDialogOpen(true);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (editingId) {
      setPegawaiRecords((currentRecords) =>
        currentRecords.map((pegawai) =>
          pegawai.id === editingId ? { ...pegawai, ...form } : pegawai,
        ),
      );
    } else {
      setPegawaiRecords((currentRecords) => [
        {
          id: `pegawai-${Date.now()}`,
          ...form,
          photoColor: photoColors[currentRecords.length % photoColors.length],
          documents: [],
        },
        ...currentRecords,
      ]);
    }

    setDialogOpen(false);
    setEditingId(null);
    setForm(createEmptyPegawaiForm());
  };

  const handleDelete = (id: string) => {
    setPegawaiRecords((currentRecords) =>
      currentRecords.filter((pegawai) => pegawai.id !== id),
    );
  };

  return (
    <main className="space-y-6">
      <PageHero
        icon={Archive}
        eyebrow="Sistem Arsipku"
        title="Arsipku"
        description="Kelola daftar pegawai dan arsip dokumen kepegawaian seperti ijazah, SK, SPMT, sertifikat, dan dokumen pendukung lainnya."
        meta={
          <Badge className="h-8 rounded-full bg-blue-50 px-4 text-sm font-bold text-pbd-blue">
            {pegawaiRecords.length} pegawai
          </Badge>
        }
        aside={
          <Button
            type="button"
            className="h-11 rounded-xl bg-pbd-navy text-white hover:bg-pbd-navy/90"
            onClick={openCreateDialog}
          >
            <Plus className="h-4 w-4" />
            Tambah Pegawai
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Pegawai"
          value={String(pegawaiRecords.length)}
          description="Data pegawai terarsip"
          icon={UsersRound}
          tone="blue"
        />
        <StatCard
          label="Dokumen"
          value={String(totalDocuments)}
          description="Total file kepegawaian"
          icon={FileCheck2}
          tone="emerald"
        />
        <StatCard
          label="Perlu Verifikasi"
          value={String(needsVerification)}
          description="File menunggu pemeriksaan"
          icon={IdCard}
          tone="amber"
        />
      </section>

      <SectionCard
        title="Data Pegawai"
        description="Klik nama pegawai untuk membuka foto, biodata singkat, dan daftar file arsip."
        action={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="pl-9"
                placeholder="Cari nama, NIP, jabatan..."
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-lg"
              onClick={openCreateDialog}
            >
              <Plus className="h-4 w-4" />
              Tambah Pegawai
            </Button>
          </div>
        }
        contentClassName="p-0"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Pegawai</TableHead>
              <TableHead>NIP</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Jabatan</TableHead>
              <TableHead>Dokumen</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPegawai.length > 0 ? (
              filteredPegawai.map((pegawai) => (
                <TableRow key={pegawai.id} className="group">
                  <TableCell className="min-w-[260px] whitespace-normal">
                    <Link
                      href={`/arsip-pegawai/${pegawai.id}`}
                      className="flex items-center gap-3"
                    >
                      <div
                        className={cn(
                          "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg font-bold",
                          pegawai.photoColor,
                        )}
                      >
                        {getInitials(pegawai.name)}
                      </div>
                      <div>
                        <p className="font-bold text-pbd-navy group-hover:text-pbd-blue">
                          {pegawai.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          NIK {pegawai.nik}
                        </p>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="font-semibold text-slate-700">
                    {pegawai.nip}
                  </TableCell>
                  <TableCell>{pegawai.unit}</TableCell>
                  <TableCell>{pegawai.position}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-slate-50">
                      {pegawai.documents.length} file
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className="border border-emerald-100 bg-emerald-50 text-emerald-700">
                      {pegawai.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild type="button" variant="outline" size="sm">
                        <Link href={`/arsip-pegawai/${pegawai.id}`}>
                          <ArrowRight className="h-4 w-4" />
                          Buka
                        </Link>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(pegawai)}
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(pegawai.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Hapus
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-sm font-medium text-slate-500"
                >
                  Pegawai tidak ditemukan.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </SectionCard>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <DialogHeader>
              <DialogTitle>
                {editingPegawai ? "Edit Pegawai" : "Tambah Pegawai"}
              </DialogTitle>
              <DialogDescription>
                Lengkapi data pegawai untuk sistem arsip kepegawaian.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 md:grid-cols-2">
              <FormInput
                label="NIP"
                value={form.nip}
                placeholder="Contoh: 198501012010011001"
                onChange={(value) => setForm((current) => ({ ...current, nip: value }))}
              />
              <FormInput
                label="NIK"
                value={form.nik}
                placeholder="Contoh: 9201010101850001"
                onChange={(value) => setForm((current) => ({ ...current, nik: value }))}
              />
              <FormInput
                label="Nama"
                value={form.name}
                placeholder="Nama lengkap pegawai"
                onChange={(value) => setForm((current) => ({ ...current, name: value }))}
              />
              <FormInput
                label="Jabatan"
                value={form.position}
                placeholder="Contoh: Analis Kebijakan"
                onChange={(value) =>
                  setForm((current) => ({ ...current, position: value }))
                }
              />
              <FormInput
                label="Unit"
                value={form.unit}
                placeholder="Contoh: Sekretariat"
                onChange={(value) => setForm((current) => ({ ...current, unit: value }))}
              />
              <FormInput
                label="Pangkat/Golongan"
                value={form.rank}
                placeholder="Contoh: Penata Tk. I / III.d"
                onChange={(value) => setForm((current) => ({ ...current, rank: value }))}
              />
              <FormInput
                label="Email"
                value={form.email}
                placeholder="email@papuabaratdaya.go.id"
                type="email"
                onChange={(value) => setForm((current) => ({ ...current, email: value }))}
              />
              <FormInput
                label="Telepon"
                value={form.phone}
                placeholder="Contoh: 0812-0000-0000"
                onChange={(value) => setForm((current) => ({ ...current, phone: value }))}
              />
              <FormInput
                label="No Rekening"
                value={form.bankAccount}
                placeholder="Contoh: 1234567890"
                onChange={(value) =>
                  setForm((current) => ({ ...current, bankAccount: value }))
                }
              />
              <label className="grid gap-2">
                <span className="text-sm font-bold text-pbd-navy">Status</span>
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status: event.target.value as PegawaiArchive["status"],
                    }))
                  }
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Cuti">Cuti</option>
                  <option value="Mutasi">Mutasi</option>
                </select>
              </label>
              <FormInput
                label="Alamat"
                value={form.address}
                placeholder="Alamat domisili pegawai"
                className="md:col-span-2"
                onChange={(value) =>
                  setForm((current) => ({ ...current, address: value }))
                }
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-pbd-navy text-white hover:bg-pbd-navy/90"
              >
                {editingPegawai ? "Simpan Perubahan" : "Tambah Data"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function FormInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  className?: string;
}) {
  return (
    <label className={cn("grid gap-2", className)}>
      <span className="text-sm font-bold text-pbd-navy">{label}</span>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        required
      />
    </label>
  );
}

function createEmptyPegawaiForm(): PegawaiForm {
  return {
    nip: "",
    nik: "",
    name: "",
    position: "",
    unit: "",
    rank: "",
    email: "",
    phone: "",
    bankAccount: "",
    address: "",
    status: "Aktif",
  };
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}
