"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { uploadFile } from "@/lib/storage";
import { parseLetterNumberFormat } from "@/lib/utils/letter-number";

const settingsSchema = z.object({
  appName: z.string().min(1, "Nama aplikasi wajib diisi"),
  institutionName: z.string().min(1, "Nama institusi wajib diisi"),
  address: z.string().optional(),
  contact: z.string().optional(),
  defaultPassword: z.string().min(1, "Kata sandi bawaan wajib diisi"),
  itemsPerPage: z.string().min(1, "Jumlah data per halaman wajib diisi"),
  incomingLetterFormat: z.string().min(1, "Format surat masuk wajib diisi"),
  outgoingLetterFormat: z.string().min(1, "Format surat keluar wajib diisi"),
  whatsappTemplate: z.string().min(1, "Template WhatsApp wajib diisi"),
}).refine((data) => parseLetterNumberFormat(data.incomingLetterFormat), {
  message: "Format surat masuk mengandung token yang tidak valid",
  path: ["incomingLetterFormat"],
}).refine((data) => parseLetterNumberFormat(data.outgoingLetterFormat), {
  message: "Format surat keluar mengandung token yang tidak valid",
  path: ["outgoingLetterFormat"],
});

export async function updateSettings(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  const raw = Object.fromEntries(formData.entries());
  const parsed = settingsSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const setting = await prisma.setting.findFirst();

  const logoFile = formData.get("logo") as File | null;
  let logoUrl = setting?.logo;

  if (logoFile && logoFile.size > 0) {
    const uploaded = await uploadFile(logoFile);
    logoUrl = uploaded.url;
  }

  try {
    await prisma.setting.upsert({
      where: { id: setting?.id ?? "default" },
      create: {
        appName: parsed.data.appName,
        institutionName: parsed.data.institutionName,
        address: parsed.data.address,
        contact: parsed.data.contact,
        defaultPassword: parsed.data.defaultPassword,
        itemsPerPage: Number(parsed.data.itemsPerPage),
        logo: logoUrl,
        incomingLetterFormat: parsed.data.incomingLetterFormat,
        outgoingLetterFormat: parsed.data.outgoingLetterFormat,
        whatsappTemplate: parsed.data.whatsappTemplate,
      },
      update: {
        appName: parsed.data.appName,
        institutionName: parsed.data.institutionName,
        address: parsed.data.address,
        contact: parsed.data.contact,
        defaultPassword: parsed.data.defaultPassword,
        itemsPerPage: Number(parsed.data.itemsPerPage),
        logo: logoUrl,
        incomingLetterFormat: parsed.data.incomingLetterFormat,
        outgoingLetterFormat: parsed.data.outgoingLetterFormat,
        whatsappTemplate: parsed.data.whatsappTemplate,
      },
    });

    revalidatePath("/pengaturan");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("settings action error:", error);
    throw error;
  }
}
