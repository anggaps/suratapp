"use server";

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
