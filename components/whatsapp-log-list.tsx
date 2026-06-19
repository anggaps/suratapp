import { format } from "date-fns";
import { id } from "date-fns/locale";
import { MessageCircle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WhatsappLog {
  id: string;
  recipientName: string | null;
  recipientPhone: string;
  createdAt: Date;
  sentByName: string;
}

interface WhatsappLogListProps {
  logs: WhatsappLog[];
}

export function WhatsappLogList({ logs }: WhatsappLogListProps) {
  if (logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Riwayat Notifikasi WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Belum ada notifikasi WhatsApp yang dikirim untuk surat ini.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Riwayat Notifikasi WhatsApp
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {logs.map((log) => (
          <div
            key={log.id}
            className="flex flex-col gap-1 rounded-md border p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex flex-col">
              <span className="font-medium">
                {log.recipientName
                  ? `${log.recipientName} (${log.recipientPhone})`
                  : log.recipientPhone}
              </span>
              <span className="text-xs text-muted-foreground">
                Dikirim oleh {log.sentByName}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {format(new Date(log.createdAt), "dd MMM yyyy HH:mm", {
                locale: id,
              })}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}