"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";

const userSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Email tidak valid"),
  role: z.enum(["ADMIN", "STAFF"]),
  phone: z.string().optional(),
  isActive: z.enum(["true", "false"]).optional(),
});

export async function createUser(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  const raw = Object.fromEntries(formData.entries());
  const parsed = userSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const settings = await prisma.setting.findFirst();
  const defaultPassword = settings?.defaultPassword ?? "password123";
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  try {
    await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: hashedPassword,
        role: parsed.data.role as UserRole,
        phone: parsed.data.phone,
        isActive: parsed.data.isActive === "true" || parsed.data.isActive === undefined,
      },
    });
    revalidatePath("/pengguna");
    return { success: true };
  } catch (error) {
    console.error("user action error:", error);
    if ((error as Error).message?.includes("Unique constraint")) {
      return { error: { email: ["Email sudah digunakan"] } };
    }
    throw error;
  }
}

export async function updateUser(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  const raw = Object.fromEntries(formData.entries());
  const parsed = userSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  try {
    await prisma.user.update({
      where: { id },
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        role: parsed.data.role as UserRole,
        phone: parsed.data.phone,
        isActive: parsed.data.isActive === "true",
      },
    });
    revalidatePath("/pengguna");
    return { success: true };
  } catch (error) {
    console.error("user action error:", error);
    if ((error as Error).message?.includes("Unique constraint")) {
      return { error: { email: ["Email sudah digunakan"] } };
    }
    throw error;
  }
}

export async function resetPassword(id: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  const settings = await prisma.setting.findFirst();
  const defaultPassword = settings?.defaultPassword ?? "password123";
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  await prisma.user.update({
    where: { id },
    data: { password: hashedPassword },
  });

  revalidatePath("/pengguna");
  return { success: true };
}

export async function deleteUser(id: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  // Prevent self deletion
  if (session.user.id === id) throw new Error("Tidak bisa menghapus diri sendiri");

  await prisma.user.delete({ where: { id } });
  revalidatePath("/pengguna");
  return { success: true };
}
