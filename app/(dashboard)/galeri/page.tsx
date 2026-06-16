import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

function isImage(mimeType: string) {
  return mimeType.startsWith("image/");
}

export default async function GalleryPage() {
  const [incomingAttachments, outgoingAttachments] = await Promise.all([
    prisma.attachment.findMany({
      where: { incomingLetterId: { not: null } },
      orderBy: { createdAt: "desc" },
      include: { incomingLetter: true },
    }),
    prisma.attachment.findMany({
      where: { outgoingLetterId: { not: null } },
      orderBy: { createdAt: "desc" },
      include: { outgoingLetter: true },
    }),
  ]);

  const allAttachments = [
    ...incomingAttachments.map((a) => ({
      ...a,
      letterType: "Masuk",
      letterSubject: a.incomingLetter?.subject ?? "-",
      letterId: a.incomingLetterId,
    })),
    ...outgoingAttachments.map((a) => ({
      ...a,
      letterType: "Keluar",
      letterSubject: a.outgoingLetter?.subject ?? "-",
      letterId: a.outgoingLetterId,
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Galeri Surat</h1>
        <p className="text-muted-foreground">Lihat dan unduh lampiran surat masuk & keluar</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Semua Lampiran</CardTitle>
        </CardHeader>
        <CardContent>
          {allAttachments.length === 0 && (
            <p className="text-center text-muted-foreground">Belum ada lampiran</p>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {allAttachments.map((a) => (
              <div
                key={a.id}
                className="group relative overflow-hidden rounded-lg border"
              >
                <div className="aspect-square bg-muted">
                  {isImage(a.mimeType) ? (
                    <img
                      src={a.url}
                      alt={a.originalName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                      <FileText className="h-12 w-12" />
                      <p className="px-2 text-center text-xs">{a.mimeType}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-1 p-3">
                  <p className="truncate text-sm font-medium" title={a.originalName}>
                    {a.originalName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Surat {a.letterType} · {a.letterSubject}
                  </p>
                  <div className="flex gap-1 pt-1">
                    <Button variant="ghost" size="sm" className="h-8 flex-1" asChild>
                      <a href={a.url} target="_blank" rel="noreferrer">
                        <ImageIcon className="mr-1 h-3 w-3" />
                        Lihat
                      </a>
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 flex-1" asChild>
                      <a href={a.url} download={a.originalName}>
                        <Download className="mr-1 h-3 w-3" />
                        Unduh
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
