import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  getAllAuditLogs,
  type AuditAction,
  type AuditEntityType,
} from "@/lib/actions/audit.actions";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    entityType?: AuditEntityType;
    action?: AuditAction;
  }>;
}

const actionLabels: Record<AuditAction, string> = {
  CREATE: "Dibuat",
  UPDATE: "Diperbarui",
  DELETE: "Dihapus",
  APPROVE: "Disetujui",
  REJECT: "Ditolak",
};

const actionColors: Record<AuditAction, string> = {
  CREATE: "bg-green-100 text-green-800",
  UPDATE: "bg-blue-100 text-blue-800",
  DELETE: "bg-red-100 text-red-800",
  APPROVE: "bg-emerald-100 text-emerald-800",
  REJECT: "bg-orange-100 text-orange-800",
};

const entityLabels: Record<AuditEntityType, string> = {
  IncomingLetter: "Surat Masuk",
  OutgoingLetter: "Surat Keluar",
  IncomingDisposition: "Disposisi",
  Attachment: "Lampiran",
};

function formatPayload(payload: string | null): string {
  if (!payload) return "-";
  try {
    const data = JSON.parse(payload);
    return Object.entries(data)
      .map(([key, value]) => `${key}: ${String(value)}`)
      .join("\n");
  } catch {
    return payload;
  }
}

export default async function AuditLogPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "PIMPINAN")) {
    redirect("/dashboard");
  }

  const { page, entityType, action } = await searchParams;
  const currentPage = Number(page) || 1;
  const pageSize = 20;

  const { logs, total, totalPages } = await getAllAuditLogs({
    entityType,
    action,
    page: currentPage,
    pageSize,
  });

  const buildPageLink = (targetPage: number) => {
    const params = new URLSearchParams();
    if (entityType) params.set("entityType", entityType);
    if (action) params.set("action", action);
    params.set("page", String(targetPage));
    return `/audit-log?${params.toString()}`;
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Audit Log</h1>
        <p className="text-muted-foreground">Riwayat aktivitas seluruh sistem</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-wrap items-end gap-3" method="GET">
            <div className="w-[200px] space-y-1">
              <label className="text-xs">Jenis Entitas</label>
              <select
                name="entityType"
                defaultValue={entityType ?? ""}
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="">Semua</option>
                {Object.entries(entityLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-[160px] space-y-1">
              <label className="text-xs">Aksi</label>
              <select
                name="action"
                defaultValue={action ?? ""}
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="">Semua</option>
                {Object.entries(actionLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" variant="secondary">Tampilkan</Button>
            <Button variant="outline" asChild>
              <Link href="/audit-log">Reset</Link>
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Daftar Log</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Aksi</TableHead>
                  <TableHead>Entitas</TableHead>
                  <TableHead>Oleh</TableHead>
                  <TableHead>Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Tidak ada data
                    </TableCell>
                  </TableRow>
                )}
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(log.createdAt), "dd MMM yyyy HH:mm", { locale: id })}
                    </TableCell>
                    <TableCell>
                      <Badge className={actionColors[log.action as AuditAction] ?? "bg-muted"}>
                        {actionLabels[log.action as AuditAction] ?? log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {entityLabels[log.entityType as AuditEntityType] ?? log.entityType}
                    </TableCell>
                    <TableCell>{log.performer.name}</TableCell>
                    <TableCell>
                      <pre className="max-w-md overflow-auto rounded-md bg-muted p-2 text-xs whitespace-pre-wrap">
                        {formatPayload(log.payload)}
                      </pre>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Halaman {currentPage} dari {totalPages} · Total {total} data
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                asChild
              >
                <Link href={buildPageLink(currentPage - 1)}>Sebelumnya</Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                asChild
              >
                <Link href={buildPageLink(currentPage + 1)}>Selanjutnya</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
