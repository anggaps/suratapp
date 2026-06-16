"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
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

export async function createOutgoingLetter(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

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
        createdBy: session.user.id,
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
          uploadedBy: session.user.id,
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
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

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
          uploadedBy: session.user.id,
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
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const letter = await prisma.outgoingLetter.findUnique({
    where: { id },
    include: { attachments: true },
  });

  if (!letter) throw new Error("Surat tidak ditemukan");

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
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

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
