import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { auth } from "@/auth";
import { ArrowLeft, Edit } from "lucide-react";
import { DeleteIncomingButton } from "@/components/delete-incoming-button";
import { DispositionList } from "@/components/disposition-list";
import { AttachmentList } from "@/components/attachment-list";
import { WhatsAppShareButton } from "@/components/whatsapp-share-button";
import {
  getNotificationRecipients,
  getIncomingLetterNotificationData,
} from "@/lib/actions/whatsapp.actions";
import { getAuditLogsForEntity } from "@/lib/actions/audit.actions";
import { AuditLogList } from "@/components/audit-log-list";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function IncomingLetterDetailPage({ params }: PageProps) {
  const session = await auth();
  const isPimpinan = session?.user?.role === "PIMPINAN";
  const canManageDisposisi = session?.user?.role === "ADMIN" || session?.user?.role === "PIMPINAN";

  const { id: letterId } = await params;
  const letter = await prisma.incomingLetter.findUnique({
    where: { id: letterId },
    include: {
      classification: true,
      status: true,
      creator: true,
      attachments: true,
      dispositions: {
        include: { creator: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!letter) notFound();

  const [recipients, notificationData, auditLogs] = await Promise.all([
    getNotificationRecipients(),
    getIncomingLetterNotificationData(letterId),
    getAuditLogsForEntity("IncomingLetter", letterId),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/surat-masuk">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Detail Surat Masuk</h1>
            <p className="text-muted-foreground">{letter.agendaNumber}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <WhatsAppShareButton
            recipients={recipients}
            template={notificationData.settings.whatsappTemplate}
            data={{
              letterNumber: notificationData.letter.letterNumber,
              agendaNumber: notificationData.letter.agendaNumber,
              subject: notificationData.letter.subject,
              date: notificationData.letter.date,
              sender: notificationData.letter.sender,
              recipient: notificationData.letter.recipient,
              classification: notificationData.letter.classification,
              status: notificationData.letter.status,
              institutionName: notificationData.settings.institutionName,
            }}
          />
          {!isPimpinan && (
            <Button variant="outline" asChild>
              <Link href={`/surat-masuk/${letter.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          )}
          {!isPimpinan && <DeleteIncomingButton id={letter.id} />}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Surat</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Nomor Agenda</p>
            <p className="font-medium">{letter.agendaNumber}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Nomor Surat</p>
            <p className="font-medium">{letter.letterNumber}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Pengirim</p>
            <p className="font-medium">{letter.sender}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Perihal</p>
            <p className="font-medium">{letter.subject}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tanggal Surat</p>
            <p className="font-medium">
              {format(new Date(letter.date), "dd MMMM yyyy", { locale: id })}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tanggal Diterima</p>
            <p className="font-medium">
              {format(new Date(letter.receivedDate), "dd MMMM yyyy", { locale: id })}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Klasifikasi</p>
            <p className="font-medium">{letter.classification?.name ?? "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Sifat Surat</p>
            {letter.status ? (
              <Badge style={{ backgroundColor: letter.status.color }}>
                {letter.status.name}
              </Badge>
            ) : (
              <p className="font-medium">-</p>
            )}
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-muted-foreground">Isi / Keterangan</p>
            <p className="whitespace-pre-wrap font-medium">{letter.content ?? "-"}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-muted-foreground">Dibuat Oleh</p>
            <p className="font-medium">{letter.creator.name} · {format(new Date(letter.createdAt), "dd MMM yyyy HH:mm", { locale: id })}</p>
          </div>
        </CardContent>
      </Card>

      {letter.attachments.length > 0 && (
        <AttachmentList attachments={letter.attachments} />
      )}

      <DispositionList dispositions={letter.dispositions} letterId={letter.id} canAdd={canManageDisposisi} />

      <AuditLogList logs={auditLogs} />
    </div>
  );
}
