"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Loader2, Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createClassification,
  updateClassification,
  deleteClassification,
} from "@/lib/actions/reference.actions";

interface Classification {
  id: string;
  code: string;
  name: string;
  description: string | null;
}

const PAGE_SIZE = 10;

export function ClassificationManager({
  classifications,
}: {
  classifications: Classification[];
}) {
  // This page is client to handle dialogs easily
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Classification | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({ code: "", name: "", description: "" });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return classifications;
    return classifications.filter((c) =>
      [c.code, c.name, c.description ?? ""].join(" ").toLowerCase().includes(term),
    );
  }, [classifications, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const reset = () => {
    setEditing(null);
    setForm({ code: "", name: "", description: "" });
    setError("");
  };

  const handleEdit = (item: Classification) => {
    setEditing(item);
    setForm({
      code: item.code,
      name: item.name,
      description: item.description ?? "",
    });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("code", form.code);
    formData.append("name", form.name);
    formData.append("description", form.description);

    try {
      const result = editing
        ? await updateClassification(editing.id, formData)
        : await createClassification(formData);

      if (result && "error" in result) {
        const err = result.error as Record<string, string[]>;
        setError(Object.values(err).flat().join(", "));
        return;
      }

      setOpen(false);
      reset();
      toast.success(editing ? "Klasifikasi berhasil diperbarui" : "Klasifikasi berhasil ditambahkan");
    } catch (error) {
      console.error(error);
      setError((error as Error).message || "Terjadi kesalahan");
      toast.error("Gagal menyimpan klasifikasi");
    } finally {
      setLoading(false);
      router.refresh();
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteClassification(id);
      toast.success("Klasifikasi berhasil dihapus");
    } catch (error) {
      console.error(error);
      toast.error("Gagal menghapus klasifikasi");
    } finally {
      setDeletingId(null);
      router.refresh();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Klasifikasi Surat</h1>
          <p className="text-muted-foreground">Kelola klasifikasi surat</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={reset}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editing ? "Edit Klasifikasi" : "Tambah Klasifikasi"}
                </DialogTitle>
                <DialogDescription>
                  Isi data klasifikasi surat di bawah ini.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
                <div className="space-y-2">
                  <Label htmlFor="code">Kode</Label>
                  <Input
                    id="code"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    placeholder="Contoh: II.3.AU"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Bisa mengandung huruf, angka, titik, slash, dan strip (contoh: II.3.AU)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nama</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Keterangan</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                  Batal
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Klasifikasi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari kode, nama, keterangan..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>

          <div className="overflow-x-auto rounded-md border">
            <Table className="responsive-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.length === 0 && (
                  <TableRow>
                    <TableCell data-label="" colSpan={4} className="text-center text-muted-foreground">
                      Tidak ada data
                    </TableCell>
                  </TableRow>
                )}
                {paged.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell data-label="Kode" className="font-medium">{item.code}</TableCell>
                    <TableCell data-label="Nama">{item.name}</TableCell>
                    <TableCell data-label="Keterangan">{item.description ?? "-"}</TableCell>
                    <TableCell data-label="Aksi">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                        >
                          {deletingId === item.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Halaman {currentPage} dari {totalPages} · Total {filtered.length} data
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setPage(currentPage - 1)}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setPage(currentPage + 1)}
              >
                Selanjutnya
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
