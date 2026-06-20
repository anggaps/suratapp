"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminOrStaff, requireAdminOrPimpinan, requireRole } from "@/lib/auth-utils";
import { UserRole } from "@prisma/client";
import { uploadFile, deleteFile } from "@/lib/storage";
import { createAuditLog } from "@/lib/actions/audit.actions";
import { serializePayload } from "@/lib/utils/audit";

const incomingLetterSchema = z.object({
  agendaNumber: z.string().min(1, "Nomor agenda wajib diisi"),
  letterNumber: z.string().min(1, "Nomor surat wajib diisi"),
  sender: z.string().min(1, "Pengirim wajib diisi"),
  date: z.string().min(1, "Tanggal surat wajib diisi"),
  receivedDate: z.string().min(1, "Tanggal diterima wajib diisi"),
  subject: z.string().min(1, "Perihal wajib diisi"),
  content: z.string().optional(),
  classificationId: z.string().optional(),
  statusId: z.string().optional(),
});

const dispositionSchema = z.object({
  incomingLetterId: z.string(),
  instruction: z.string().min(1, "Instruksi wajib diisi"),
  dispositionDate: z.string().min(1, "Tanggal disposisi wajib diisi"),
  target: z.string().min(1, "Tujuan disposisi wajib diisi"),
  notes: z.string().optional(),
});

export async function createIncomingLetter(
  formData: FormData
) {
  const user = await requireAdminOrStaff();

  const raw = Object.fromEntries(formData.entries());
  const parsed = incomingLetterSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;

  try {
    const letter = await prisma.incomingLetter.create({
      data: {
        agendaNumber: data.agendaNumber,
        letterNumber: data.letterNumber,
        sender: data.sender,
        date: new Date(data.date),
        receivedDate: new Date(data.receivedDate),
        subject: data.subject,
        content: data.content,
        classificationId: data.classificationId || null,
        statusId: data.statusId || null,
        createdBy: user.id,
      },
    });

    await createAuditLog({
      entityType: "IncomingLetter",
      entityId: letter.id,
      action: "CREATE",
      payload: serializePayload({
        agendaNumber: letter.agendaNumber,
        letterNumber: letter.letterNumber,
        sender: letter.sender,
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
          incomingLetterId: letter.id,
          uploadedBy: user.id,
        },
      });

      await createAuditLog({
        entityType: "Attachment",
        entityId: attachment.id,
        action: "CREATE",
        payload: serializePayload({
          originalName: attachment.originalName,
          incomingLetterId: letter.id,
        }),
      });
    }

    revalidatePath("/surat-masuk");
    redirect("/surat-masuk");
  } catch (error) {
    console.error("createIncomingLetter error:", error);
    if ((error as Error).message?.includes("Unique constraint")) {
      return { error: { agendaNumber: ["Nomor agenda sudah digunakan"] } };
    }
    throw error;
  }
}

export async function updateIncomingLetter(
  id: string,
  formData: FormData
) {
  const user = await requireAdminOrStaff();

  const raw = Object.fromEntries(formData.entries());
  const parsed = incomingLetterSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;

  try {
    const existing = await prisma.incomingLetter.findUnique({
      where: { id },
      include: { classification: true, status: true },
    });

    const updated = await prisma.incomingLetter.update({
      where: { id },
      data: {
        agendaNumber: data.agendaNumber,
        letterNumber: data.letterNumber,
        sender: data.sender,
        date: new Date(data.date),
        receivedDate: new Date(data.receivedDate),
        subject: data.subject,
        content: data.content,
        classificationId: data.classificationId || null,
        statusId: data.statusId || null,
      },
    });

    await createAuditLog({
      entityType: "IncomingLetter",
      entityId: id,
      action: "UPDATE",
      payload: serializePayload({
        old: {
          agendaNumber: existing?.agendaNumber,
          letterNumber: existing?.letterNumber,
          sender: existing?.sender,
          subject: existing?.subject,
          classification: existing?.classification?.name,
          status: existing?.status?.name,
        },
        new: {
          agendaNumber: updated.agendaNumber,
          letterNumber: updated.letterNumber,
          sender: updated.sender,
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
          incomingLetterId: id,
          uploadedBy: user.id,
        },
      });

      await createAuditLog({
        entityType: "Attachment",
        entityId: attachment.id,
        action: "CREATE",
        payload: serializePayload({
          originalName: attachment.originalName,
          incomingLetterId: id,
        }),
      });
    }

    revalidatePath("/surat-masuk");
    redirect("/surat-masuk");
  } catch (error) {
    console.error("incoming letter action error:", error);
    if ((error as Error).message?.includes("Unique constraint")) {
      return { error: { agendaNumber: ["Nomor agenda sudah digunakan"] } };
    }
    throw error;
  }
}

export async function deleteIncomingLetter(id: string) {
  const user = await requireRole(UserRole.ADMIN);

  const letter = await prisma.incomingLetter.findUnique({
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
        incomingLetterId: id,
      }),
    });
  }

  await prisma.incomingLetter.delete({ where: { id } });

  await createAuditLog({
    entityType: "IncomingLetter",
    entityId: id,
    action: "DELETE",
    payload: serializePayload({
      agendaNumber: letter.agendaNumber,
      letterNumber: letter.letterNumber,
      sender: letter.sender,
      subject: letter.subject,
    }),
  });

  revalidatePath("/surat-masuk");
  return { success: true };
}

export async function createDisposition(formData: FormData) {
  const user = await requireAdminOrPimpinan();

  const raw = Object.fromEntries(formData.entries());
  const parsed = dispositionSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;

  const disposition = await prisma.incomingDisposition.create({
    data: {
      incomingLetterId: data.incomingLetterId,
      instruction: data.instruction,
      dispositionDate: new Date(data.dispositionDate),
      target: data.target,
      notes: data.notes,
      createdBy: user.id,
    },
  });

  await createAuditLog({
    entityType: "IncomingDisposition",
    entityId: disposition.id,
    action: "CREATE",
    payload: serializePayload({
      incomingLetterId: data.incomingLetterId,
      target: data.target,
      instruction: data.instruction,
    }),
  });

  revalidatePath(`/surat-masuk/${data.incomingLetterId}`);
  return { success: true };
}

export async function deleteDisposition(id: string, letterId: string) {
  await requireAdminOrPimpinan();

  const disposition = await prisma.incomingDisposition.findUnique({ where: { id } });

  await prisma.incomingDisposition.delete({ where: { id } });

  await createAuditLog({
    entityType: "IncomingDisposition",
    entityId: id,
    action: "DELETE",
    payload: serializePayload({
      incomingLetterId: letterId,
      target: disposition?.target,
      instruction: disposition?.instruction,
    }),
  });

  revalidatePath(`/surat-masuk/${letterId}`);
  return { success: true };
}

export async function deleteAttachment(id: string) {
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

  revalidatePath("/surat-masuk");
  return { success: true };
}
