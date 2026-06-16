"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Trash2, Loader2, Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteAttachment } from "@/lib/actions/incoming-letter.actions";

interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
}

interface AttachmentListProps {
  attachments: Attachment[];
  deleteAction?: (id: string) => Promise<{ success?: boolean }>;
}

function formatSize(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function AttachmentList({ attachments, deleteAction }: AttachmentListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const action = deleteAction ?? deleteAttachment;
    try {
      await action(id);
      toast.success("Lampiran berhasil dihapus");
    } catch (error) {
      console.error(error);
      toast.error("Gagal menghapus lampiran");
    } finally {
      setDeletingId(null);
      router.refresh();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lampiran Tersimpan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {attachments.map((a) => (
          <div
            key={a.id}
            className="flex items-center justify-between rounded-lg border p-3"
          >
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{a.originalName}</p>
                <p className="text-xs text-muted-foreground">{formatSize(a.size)}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" asChild>
                <a href={a.url} target="_blank" rel="noreferrer">
                  <Download className="h-4 w-4" />
                </a>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => handleDelete(a.id)}
                disabled={deletingId === a.id}
              >
                {deletingId === a.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
