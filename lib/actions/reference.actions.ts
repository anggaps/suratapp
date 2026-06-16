"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

const classificationSchema = z.object({
  code: z.string().min(1, "Kode wajib diisi").regex(/^[A-Za-z0-9./\-]+$/, "Kode hanya boleh huruf, angka, titik, slash, dan strip"),
  name: z.string().min(1, "Nama wajib diisi"),
  description: z.string().optional(),
});

const statusSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  color: z.string().min(1, "Warna wajib diisi"),
});

export async function createClassification(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const raw = Object.fromEntries(formData.entries());
  const parsed = classificationSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  try {
    await prisma.classification.create({
      data: { ...parsed.data, createdBy: session.user.id },
    });
    revalidatePath("/referensi/klasifikasi");
    return { success: true };
  } catch (error) {
    console.error("classification action error:", error);
    if ((error as Error).message?.includes("Unique constraint")) {
      return { error: { code: ["Kode sudah digunakan"] } };
    }
    throw error;
  }
}

export async function updateClassification(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const raw = Object.fromEntries(formData.entries());
  const parsed = classificationSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  try {
    await prisma.classification.update({
      where: { id },
      data: parsed.data,
    });
    revalidatePath("/referensi/klasifikasi");
    return { success: true };
  } catch (error) {
    console.error("classification action error:", error);
    if ((error as Error).message?.includes("Unique constraint")) {
      return { error: { code: ["Kode sudah digunakan"] } };
    }
    throw error;
  }
}

export async function deleteClassification(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await prisma.classification.delete({ where: { id } });
  revalidatePath("/referensi/klasifikasi");
  return { success: true };
}

export async function createStatus(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const raw = Object.fromEntries(formData.entries());
  const parsed = statusSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  try {
    await prisma.letterStatus.create({
      data: { ...parsed.data, createdBy: session.user.id },
    });
    revalidatePath("/referensi/status-surat");
    return { success: true };
  } catch (error) {
    console.error("status action error:", error);
    if ((error as Error).message?.includes("Unique constraint")) {
      return { error: { name: ["Nama sudah digunakan"] } };
    }
    throw error;
  }
}

export async function updateStatus(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const raw = Object.fromEntries(formData.entries());
  const parsed = statusSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  try {
    await prisma.letterStatus.update({
      where: { id },
      data: parsed.data,
    });
    revalidatePath("/referensi/status-surat");
    return { success: true };
  } catch (error) {
    console.error("status action error:", error);
    if ((error as Error).message?.includes("Unique constraint")) {
      return { error: { name: ["Nama sudah digunakan"] } };
    }
    throw error;
  }
}

export async function deleteStatus(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await prisma.letterStatus.delete({ where: { id } });
  revalidatePath("/referensi/status-surat");
  return { success: true };
}
