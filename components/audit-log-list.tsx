"use client";

import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  performedBy: string;
  payload: string | null;
  createdAt: Date;
  performer: { name: string };
}

interface AuditLogListProps {
  logs: AuditLog[];
  emptyMessage?: string;
}

const actionLabels: Record<string, string> = {
  CREATE: "Dibuat",
  UPDATE: "Diperbarui",
  DELETE: "Dihapus",
  APPROVE: "Disetujui",
  REJECT: "Ditolak",
};

const actionColors: Record<string, string> = {
  CREATE: "bg-green-100 text-green-800",
  UPDATE: "bg-blue-100 text-blue-800",
  DELETE: "bg-red-100 text-red-800",
  APPROVE: "bg-emerald-100 text-emerald-800",
  REJECT: "bg-orange-100 text-orange-800",
};

const entityLabels: Record<string, string> = {
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

export function AuditLogList({ logs, emptyMessage = "Belum ada riwayat" }: AuditLogListProps) {
  if (logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Aktivitas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Riwayat Aktivitas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {logs.map((log) => (
          <div key={log.id} className="border-b pb-3 last:border-0">
            <div className="flex items-center gap-2">
              <Badge className={actionColors[log.action] ?? "bg-muted"}>
                {actionLabels[log.action] ?? log.action}
              </Badge>
              <span className="text-sm font-medium">
                {entityLabels[log.entityType] ?? log.entityType}
              </span>
              <span className="ml-auto text-xs text-muted-foreground">
                {format(new Date(log.createdAt), "dd MMM yyyy HH:mm", { locale: id })}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Oleh: {log.performer.name}
            </p>
            {log.payload && (
              <pre className="mt-2 max-h-32 overflow-auto rounded-md bg-muted p-2 text-xs whitespace-pre-wrap">
                {formatPayload(log.payload)}
              </pre>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
