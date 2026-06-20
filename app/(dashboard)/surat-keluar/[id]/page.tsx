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
import { DeleteOutgoingButton } from "@/components/delete-outgoing-button";
import { AttachmentList } from "@/components/attachment-list";
import { deleteOutgoingAttachment } from "@/lib/actions/outgoing-letter.actions";
import { OutgoingApprovalActions } from "@/components/outgoing-approval-actions";
import { WhatsAppShareButton } from "@/components/whatsapp-share-button";
import {
  getNotificationRecipients,
  getOutgoingLetterNotificationData,
  getWhatsappLogsForLetter,
} from "@/lib/actions/whatsapp.actions";
import { getAuditLogsForEntity } from "@/lib/actions/audit.actions";
import { AuditLogList } from "@/components/audit-log-list";
import { WhatsappLogList } from "@/components/whatsapp-log-list";

interface PageProps {
  params: Promise<{ id: string }>;
}

function getApprovalStatus(letter: {
  approvedById: string | null;
  approvedAt: Date | null;
  rejectionReason: string | null;
}) {
  if (letter.approvedById) return { label: "Disetujui", color: "bg-green-100 text-green-800" };
  if (letter.rejectionReason) return { label: "Ditolak", color: "bg-red-100 text-red-800" };
  return { label: "Menunggu Persetujuan", color: "bg-yellow-100 text-yellow-800" };
}

export default async function OutgoingLetterDetailPage({ params }: PageProps) {
  const session = await auth();
  const role = session?.user?.role;
  const isPimpinan = role === "PIMPINAN";
  const isAdmin = role === "ADMIN";
  const isStaff = role === "STAFF";

  const { id: letterId } = await params;
  const letter = await prisma.outgoingLetter.findUnique({
    where: { id: letterId },
    include: {
      classification: true,
      status: true,
      creator: true,
      approvedBy: { select: { name: true } },
      attachments: true,
    },
  });

  if (!letter) notFound();

  const approvalStatus = getApprovalStatus(letter);
  const canEdit = !isPimpinan && !(isStaff && letter.approvedById);
  const canDelete = isAdmin;
  const canApproveReject = isAdmin || isPimpinan;

  const [recipients, notificationData, auditLogs, whatsappLogs] = await Promise.all([
    getNotificationRecipients(),
    getOutgoingLetterNotificationData(letterId),
    getAuditLogsForEntity("OutgoingLetter", letterId),
    getWhatsappLogsForLetter("OUTGOING", letterId),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/surat-keluar">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Detail Surat Keluar</h1>
            <p className="text-muted-foreground">{letter.agendaNumber}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <WhatsAppShareButton
            recipients={recipients}
            template={notificationData.settings.whatsappTemplate}
            letterType="OUTGOING"
            letterId={letter.id}
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
          {canEdit && (
            <Button variant="outline" asChild>
              <Link href={`/surat-keluar/${letter.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          )}
          {canDelete && <DeleteOutgoingButton id={letter.id} />}
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
            <p className="text-sm text-muted-foreground">Penerima</p>
            <p className="font-medium">{letter.recipient}</p>
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
          <div>
            <p className="text-sm text-muted-foreground">Status Persetujuan</p>
            <Badge className={approvalStatus.color}>{approvalStatus.label}</Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Disetujui Oleh</p>
            <p className="font-medium">
              {letter.approvedBy?.name
                ? `${letter.approvedBy.name} · ${format(new Date(letter.approvedAt!), "dd MMM yyyy HH:mm", { locale: id })}`
                : "-"}
            </p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-muted-foreground">Isi / Keterangan</p>
            <p className="whitespace-pre-wrap font-medium">{letter.content ?? "-"}</p>
          </div>
          {letter.rejectionReason && (
            <div className="md:col-span-2">
              <p className="text-sm text-muted-foreground">Alasan Penolakan</p>
              <p className="whitespace-pre-wrap font-medium text-destructive">{letter.rejectionReason}</p>
            </div>
          )}
          <div className="md:col-span-2">
            <p className="text-sm text-muted-foreground">Dibuat Oleh</p>
            <p className="font-medium">{letter.creator.name} · {format(new Date(letter.createdAt), "dd MMM yyyy HH:mm", { locale: id })}</p>
          </div>
        </CardContent>
      </Card>

      {letter.attachments.length > 0 && (
        <AttachmentList attachments={letter.attachments} deleteAction={deleteOutgoingAttachment} />
      )}

      {canApproveReject && !letter.approvedById && (
        <OutgoingApprovalActions
          letterId={letter.id}
          isApproved={!!letter.approvedById}
          rejectionReason={letter.rejectionReason}
        />
      )}

      <WhatsappLogList logs={whatsappLogs} />

      <AuditLogList logs={auditLogs} />
    </div>
  );
}
