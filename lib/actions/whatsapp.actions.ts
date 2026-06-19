"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function getNotificationRecipients() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const users = await prisma.user.findMany({
    where: {
      phone: {
        not: null,
      },
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      phone: true,
    },
    orderBy: { name: "asc" },
  });

  return users
    .filter((u) => u.phone && u.phone.trim().length > 0)
    .map((u) => ({
      id: u.id,
      name: u.name,
      phone: u.phone as string,
    }));
}

export async function getIncomingLetterNotificationData(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const letter = await prisma.incomingLetter.findUnique({
    where: { id },
    include: {
      classification: true,
      status: true,
    },
  });

  if (!letter) throw new Error("Surat tidak ditemukan");

  const settings = await prisma.setting.findFirst();

  return {
    letter: {
      id: letter.id,
      letterNumber: letter.letterNumber,
      agendaNumber: letter.agendaNumber,
      subject: letter.subject,
      date: letter.date,
      sender: letter.sender,
      recipient: letter.sender,
      classification: letter.classification?.name,
      status: letter.status?.name,
    },
    settings: {
      institutionName: settings?.institutionName,
      whatsappTemplate: settings?.whatsappTemplate,
    },
  };
}

export async function getOutgoingLetterNotificationData(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const letter = await prisma.outgoingLetter.findUnique({
    where: { id },
    include: {
      classification: true,
      status: true,
    },
  });

  if (!letter) throw new Error("Surat tidak ditemukan");

  const settings = await prisma.setting.findFirst();

  return {
    letter: {
      id: letter.id,
      letterNumber: letter.letterNumber,
      agendaNumber: letter.agendaNumber,
      subject: letter.subject,
      date: letter.date,
      sender: "-",
      recipient: letter.recipient,
      classification: letter.classification?.name,
      status: letter.status?.name,
    },
    settings: {
      institutionName: settings?.institutionName,
      whatsappTemplate: settings?.whatsappTemplate,
    },
  };
}

export type WhatsappLetterType = "INCOMING" | "OUTGOING";

export async function recordWhatsappLog(input: {
  letterType: WhatsappLetterType;
  letterId: string;
  recipientName: string | null;
  recipientPhone: string;
  message: string;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await prisma.whatsappLog.create({
    data: {
      letterType: input.letterType,
      letterId: input.letterId,
      recipientName: input.recipientName,
      recipientPhone: input.recipientPhone,
      message: input.message,
      sentById: session.user.id,
    },
  });

  revalidatePath("/surat-masuk");
  revalidatePath("/surat-keluar");
  return { success: true };
}

export async function getWhatsappLogsForLetter(
  letterType: WhatsappLetterType,
  letterId: string,
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const logs = await prisma.whatsappLog.findMany({
    where: { letterType, letterId },
    include: { sentBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return logs.map((log) => ({
    id: log.id,
    recipientName: log.recipientName,
    recipientPhone: log.recipientPhone,
    createdAt: log.createdAt,
    sentByName: log.sentBy.name,
  }));
}
