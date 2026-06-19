"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Loader2, Plus, KeyRound, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Badge } from "@/components/ui/badge";
import { createUser, updateUser, resetPassword, deleteUser } from "@/lib/actions/user.actions";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  isActive: boolean;
}

const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  PIMPINAN: "Pimpinan",
  STAFF: "Staff",
};

export default function UserManager({
  users,
  currentUserId,
  pageSize = 10,
}: {
  users: User[];
  currentUserId: string;
  pageSize?: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "STAFF",
    phone: "",
    isActive: "true",
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter((u) =>
      [u.name, u.email, u.phone ?? "", roleLabels[u.role] ?? u.role]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [users, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const reset = () => {
    setEditing(null);
    setForm({ name: "", email: "", role: "STAFF", phone: "", isActive: "true" });
    setError("");
  };

  const handleEdit = (user: User) => {
    setEditing(user);
    setForm({
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone ?? "",
      isActive: user.isActive ? "true" : "false",
    });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("email", form.email);
    formData.append("role", form.role);
    formData.append("phone", form.phone);
    formData.append("isActive", form.isActive);

    try {
      const result = editing
        ? await updateUser(editing.id, formData)
        : await createUser(formData);

      if (result && "error" in result) {
        const err = result.error as Record<string, string[]>;
        setError(Object.values(err).flat().join(", "));
        return;
      }

      setOpen(false);
      reset();
      toast.success(editing ? "Pengguna berhasil diperbarui" : "Pengguna berhasil ditambahkan");
    } catch (error) {
      console.error(error);
      setError((error as Error).message || "Terjadi kesalahan");
      toast.error("Gagal menyimpan pengguna");
    } finally {
      setLoading(false);
      router.refresh();
    }
  };

  const handleResetPassword = async (id: string) => {
    setResettingId(id);
    try {
      await resetPassword(id);
      toast.success("Password berhasil direset");
    } catch (error) {
      console.error(error);
      toast.error("Gagal mereset password");
    } finally {
      setResettingId(null);
      router.refresh();
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteUser(id);
      toast.success("Pengguna berhasil dihapus");
    } catch (error) {
      console.error(error);
      toast.error("Gagal menghapus pengguna");
    } finally {
      setDeletingId(null);
      router.refresh();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Manajemen Pengguna</h1>
          <p className="text-muted-foreground">Tambah, edit, dan kelola pengguna sistem</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={reset}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Pengguna
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Pengguna" : "Tambah Pengguna"}</DialogTitle>
                <DialogDescription>
                  {editing
                    ? "Perbarui data pengguna."
                    : "Pengguna baru akan menggunakan kata sandi bawaan dari pengaturan sistem."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {error && <p className="text-sm text-destructive">{error}</p>}
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
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Peran</Label>
                  <Select
                    value={form.role}
                    onValueChange={(value) => setForm({ ...form, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih peran" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="PIMPINAN">Pimpinan</SelectItem>
                      <SelectItem value="STAFF">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Nomor Telepon</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="isActive">Status</Label>
                  <Select
                    value={form.isActive}
                    onValueChange={(value) => setForm({ ...form, isActive: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Aktif</SelectItem>
                      <SelectItem value="false">Nonaktif</SelectItem>
                    </SelectContent>
                  </Select>
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
          <CardTitle>Daftar Pengguna</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari nama, email, telepon, peran..."
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
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Peran</TableHead>
                  <TableHead>Telepon</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.length === 0 && (
                  <TableRow>
                    <TableCell data-label="" colSpan={6} className="text-center text-muted-foreground">
                      Tidak ada data
                    </TableCell>
                  </TableRow>
                )}
                {paged.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell data-label="Nama" className="font-medium">{user.name}</TableCell>
                    <TableCell data-label="Email">{user.email}</TableCell>
                    <TableCell data-label="Peran">
                      <Badge
                        variant={user.role === "ADMIN" ? "default" : user.role === "PIMPINAN" ? "default" : "secondary"}
                        className={user.role === "PIMPINAN" ? "bg-purple-600 hover:bg-purple-700" : ""}
                      >
                        {roleLabels[user.role] ?? user.role}
                      </Badge>
                    </TableCell>
                    <TableCell data-label="Telepon">{user.phone ?? "-"}</TableCell>
                    <TableCell data-label="Status">
                      <Badge variant={user.isActive ? "default" : "destructive"}>
                        {user.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>
                    <TableCell data-label="Aksi">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleResetPassword(user.id)}
                          disabled={resettingId === user.id}
                          title="Reset password"
                        >
                          {resettingId === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <KeyRound className="h-4 w-4" />
                          )}
                        </Button>
                        {user.id !== currentUserId && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(user.id)}
                            disabled={deletingId === user.id}
                          >
                            {deletingId === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        )}
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
