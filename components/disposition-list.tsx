"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createDisposition, deleteDisposition } from "@/lib/actions/incoming-letter.actions";

interface Disposition {
  id: string;
  instruction: string;
  dispositionDate: Date;
  target: string;
  notes: string | null;
  creator: { name: string };
}

interface DispositionListProps {
  dispositions: Disposition[];
  letterId: string;
  canAdd?: boolean;
}

export function DispositionList({ dispositions, letterId, canAdd = true }: DispositionListProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    instruction: "",
    dispositionDate: format(new Date(), "yyyy-MM-dd"),
    target: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("incomingLetterId", letterId);
    formData.append("instruction", form.instruction);
    formData.append("dispositionDate", form.dispositionDate);
    formData.append("target", form.target);
    formData.append("notes", form.notes);

    try {
      const result = await createDisposition(formData);
      if (result && "error" in result) {
        const err = result.error as Record<string, string[]>;
        toast.error(Object.values(err).flat().join(", "));
        return;
      }
      setOpen(false);
      setForm({
        instruction: "",
        dispositionDate: format(new Date(), "yyyy-MM-dd"),
        target: "",
        notes: "",
      });
      toast.success("Disposisi berhasil ditambahkan");
    } catch (error) {
      console.error(error);
      toast.error("Gagal menambahkan disposisi");
    } finally {
      setLoading(false);
      router.refresh();
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteDisposition(id, letterId);
      toast.success("Disposisi berhasil dihapus");
    } catch (error) {
      console.error(error);
      toast.error("Gagal menghapus disposisi");
    } finally {
      setDeletingId(null);
      router.refresh();
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle>Disposisi</CardTitle>
        {canAdd && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Tambah Disposisi
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Tambah Disposisi</DialogTitle>
                <DialogDescription>
                  Tambahkan instruksi disposisi untuk surat ini.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="instruction">Instruksi</Label>
                  <Input
                    id="instruction"
                    value={form.instruction}
                    onChange={(e) => setForm({ ...form, instruction: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target">Ditujukan Kepada</Label>
                  <Input
                    id="target"
                    value={form.target}
                    onChange={(e) => setForm({ ...form, target: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dispositionDate">Tanggal Disposisi</Label>
                  <Input
                    id="dispositionDate"
                    type="date"
                    value={form.dispositionDate}
                    onChange={(e) => setForm({ ...form, dispositionDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Catatan</Label>
                  <Textarea
                    id="notes"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {dispositions.length === 0 && (
          <p className="text-sm text-muted-foreground">Belum ada disposisi</p>
        )}
        {dispositions.map((d) => (
          <div
            key={d.id}
            className="flex items-start justify-between rounded-lg border p-3"
          >
            <div>
              <p className="font-medium">{d.instruction}</p>
              <p className="text-sm text-muted-foreground">
                Kepada {d.target} · {format(new Date(d.dispositionDate), "dd MMM yyyy", { locale: id })}
              </p>
              {d.notes && (
                <p className="text-sm text-muted-foreground">Catatan: {d.notes}</p>
              )}
              <p className="text-xs text-muted-foreground">Oleh {d.creator.name}</p>
            </div>
            {canAdd && (
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={() => handleDelete(d.id)}
              disabled={deletingId === d.id}
            >
              {deletingId === d.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
