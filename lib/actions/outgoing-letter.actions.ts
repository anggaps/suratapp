"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminOrStaff, requireAdminOrPimpinan } from "@/lib/auth-utils";
import { UserRole } from "@prisma/client";
import { uploadFile, deleteFile } from "@/lib/storage";
import { createAuditLog } from "@/lib/actions/audit.actions";
import { serializePayload } from "@/lib/utils/audit";

const outgoingLetterSchema = z.object({
  agendaNumber: z.string().min(1, "Nomor agenda wajib diisi"),
  letterNumber: z.string().min(1, "Nomor surat wajib diisi"),
  recipient: z.string().min(1, "Penerima wajib diisi"),
  date: z.string().min(1, "Tanggal surat wajib diisi"),
  subject: z.string().min(1, "Perihal wajib diisi"),
  content: z.string().optional(),
  classificationId: z.string().optional(),
  statusId: z.string().optional(),
});

const rejectionSchema = z.object({
  reason: z.string().min(1, "Alasan penolakan wajib diisi"),
});

export async function createOutgoingLetter(formData: FormData) {
  const user = await requireAdminOrStaff();

  const raw = Object.fromEntries(formData.entries());
  const parsed = outgoingLetterSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;

  try {
    const letter = await prisma.outgoingLetter.create({
      data: {
        agendaNumber: data.agendaNumber,
        letterNumber: data.letterNumber,
        recipient: data.recipient,
        date: new Date(data.date),
        subject: data.subject,
        content: data.content,
        classificationId: data.classificationId || null,
        statusId: data.statusId || null,
        createdBy: user.id,
      },
    });

    await createAuditLog({
      entityType: "OutgoingLetter",
      entityId: letter.id,
      action: "CREATE",
      payload: serializePayload({
        agendaNumber: letter.agendaNumber,
        letterNumber: letter.letterNumber,
        recipient: letter.recipient,
        subject: letter.subject,
      }),
    });

    const files = formData.getAll("attachments") as File[];
    for (const file of files) {
      if (file.size === 0) continue;
      const uploaded = await uploadFile(file);
      const attachment = await prisma.attachment.create({
        data: {
          ...uploaded,
          outgoingLetterId: letter.id,
          uploadedBy: user.id,
        },
      });

      await createAuditLog({
        entityType: "Attachment",
        entityId: attachment.id,
        action: "CREATE",
        payload: serializePayload({
          originalName: attachment.originalName,
          outgoingLetterId: letter.id,
        }),
      });
    }

    revalidatePath("/surat-keluar");
    redirect("/surat-keluar");
  } catch (error) {
    console.error("outgoing letter action error:", error);
    if ((error as Error).message?.includes("Unique constraint")) {
      return { error: { agendaNumber: ["Nomor agenda sudah digunakan"] } };
    }
    throw error;
  }
}

export async function updateOutgoingLetter(id: string, formData: FormData) {
  const user = await requireAdminOrStaff();

  const raw = Object.fromEntries(formData.entries());
  const parsed = outgoingLetterSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;

  try {
    const existing = await prisma.outgoingLetter.findUnique({
      where: { id },
      include: { classification: true, status: true },
    });

    if (!existing) throw new Error("Surat tidak ditemukan");
    if (existing.approvedById && user.role === UserRole.STAFF) {
      throw new Error("Surat sudah disetujui, tidak dapat diubah");
    }

    const updated = await prisma.outgoingLetter.update({
      where: { id },
      data: {
        agendaNumber: data.agendaNumber,
        letterNumber: data.letterNumber,
        recipient: data.recipient,
        date: new Date(data.date),
        subject: data.subject,
        content: data.content,
        classificationId: data.classificationId || null,
        statusId: data.statusId || null,
      },
    });

    await createAuditLog({
      entityType: "OutgoingLetter",
      entityId: id,
      action: "UPDATE",
      payload: serializePayload({
        old: {
          agendaNumber: existing?.agendaNumber,
          letterNumber: existing?.letterNumber,
          recipient: existing?.recipient,
          subject: existing?.subject,
          classification: existing?.classification?.name,
          status: existing?.status?.name,
        },
        new: {
          agendaNumber: updated.agendaNumber,
          letterNumber: updated.letterNumber,
          recipient: updated.recipient,
          subject: updated.subject,
          classification: data.classificationId
            ? await prisma.classification
                .findUnique({ where: { id: data.classificationId } })
                .then((c) => c?.name)
            : existing?.classification?.name,
          status: data.statusId
            ? await prisma.letterStatus
                .findUnique({ where: { id: data.statusId } })
                .then((s) => s?.name)
            : existing?.status?.name,
        },
      }),
    });

    const files = formData.getAll("attachments") as File[];
    for (const file of files) {
      if (file.size === 0) continue;
      const uploaded = await uploadFile(file);
      const attachment = await prisma.attachment.create({
        data: {
          ...uploaded,
          outgoingLetterId: id,
          uploadedBy: user.id,
        },
      });

      await createAuditLog({
        entityType: "Attachment",
        entityId: attachment.id,
        action: "CREATE",
        payload: serializePayload({
          originalName: attachment.originalName,
          outgoingLetterId: id,
        }),
      });
    }

    revalidatePath("/surat-keluar");
    redirect("/surat-keluar");
  } catch (error) {
    console.error("outgoing letter action error:", error);
    if ((error as Error).message?.includes("Unique constraint")) {
      return { error: { agendaNumber: ["Nomor agenda sudah digunakan"] } };
    }
    throw error;
  }
}

export async function deleteOutgoingLetter(id: string) {
  const user = await requireAdminOrStaff();

  const letter = await prisma.outgoingLetter.findUnique({
    where: { id },
    include: { attachments: true },
  });

  if (!letter) throw new Error("Surat tidak ditemukan");
  if (letter.approvedById && user.role === UserRole.STAFF) {
    throw new Error("Surat sudah disetujui, tidak dapat dihapus");
  }

  for (const attachment of letter.attachments) {
    await deleteFile(attachment.filename, attachment.url);
    await createAuditLog({
      entityType: "Attachment",
      entityId: attachment.id,
      action: "DELETE",
      payload: serializePayload({
        originalName: attachment.originalName,
        outgoingLetterId: id,
      }),
    });
  }

  await prisma.outgoingLetter.delete({ where: { id } });

  await createAuditLog({
    entityType: "OutgoingLetter",
    entityId: id,
    action: "DELETE",
    payload: serializePayload({
      agendaNumber: letter.agendaNumber,
      letterNumber: letter.letterNumber,
      recipient: letter.recipient,
      subject: letter.subject,
    }),
  });

  revalidatePath("/surat-keluar");
  return { success: true };
}

export async function deleteOutgoingAttachment(id: string) {
  await requireAdminOrStaff();

  const attachment = await prisma.attachment.findUnique({ where: { id } });
  if (!attachment) throw new Error("Lampiran tidak ditemukan");

  await deleteFile(attachment.filename, attachment.url);
  await prisma.attachment.delete({ where: { id } });

  await createAuditLog({
    entityType: "Attachment",
    entityId: id,
    action: "DELETE",
    payload: serializePayload({
      originalName: attachment.originalName,
      incomingLetterId: attachment.incomingLetterId,
      outgoingLetterId: attachment.outgoingLetterId,
    }),
  });

  revalidatePath("/surat-keluar");
  return { success: true };
}

export async function approveOutgoingLetter(id: string) {
  const user = await requireAdminOrPimpinan();

  const letter = await prisma.outgoingLetter.findUnique({ where: { id } });
  if (!letter) throw new Error("Surat tidak ditemukan");
  if (letter.approvedById) throw new Error("Surat sudah disetujui sebelumnya");

  await prisma.outgoingLetter.update({
    where: { id },
    data: {
      approvedById: user.id,
      approvedAt: new Date(),
      rejectionReason: null,
    },
  });

  await createAuditLog({
    entityType: "OutgoingLetter",
    entityId: id,
    action: "APPROVE",
    payload: serializePayload({
      agendaNumber: letter.agendaNumber,
      letterNumber: letter.letterNumber,
      recipient: letter.recipient,
      subject: letter.subject,
      approvedBy: user.name,
    }),
  });

  revalidatePath("/surat-keluar");
  revalidatePath(`/surat-keluar/${id}`);
  return { success: true };
}

export async function rejectOutgoingLetter(id: string, formData: FormData) {
  const user = await requireAdminOrPimpinan();

  const letter = await prisma.outgoingLetter.findUnique({ where: { id } });
  if (!letter) throw new Error("Surat tidak ditemukan");
  if (letter.approvedById) throw new Error("Surat sudah disetujui, tidak dapat ditolak");

  const raw = Object.fromEntries(formData.entries());
  const parsed = rejectionSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  await prisma.outgoingLetter.update({
    where: { id },
    data: {
      approvedById: null,
      approvedAt: null,
      rejectionReason: parsed.data.reason,
    },
  });

  await createAuditLog({
    entityType: "OutgoingLetter",
    entityId: id,
    action: "REJECT",
    payload: serializePayload({
      agendaNumber: letter.agendaNumber,
      letterNumber: letter.letterNumber,
      recipient: letter.recipient,
      subject: letter.subject,
      rejectedBy: user.name,
      reason: parsed.data.reason,
    }),
  });

  revalidatePath("/surat-keluar");
  revalidatePath(`/surat-keluar/${id}`);
  return { success: true };
}
