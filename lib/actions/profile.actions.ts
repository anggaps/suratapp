"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { uploadFile } from "@/lib/storage";

const profileSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Email tidak valid"),
  phone: z.string().optional(),
});

const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Password saat ini wajib diisi"),
    newPassword: z.string().min(6, "Password baru minimal 6 karakter"),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });

export async function changePassword(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const raw = Object.fromEntries(formData.entries());
  const parsed = passwordChangeSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  });
  if (!user) throw new Error("Pengguna tidak ditemukan");

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.password);
  if (!valid) {
    return { error: { currentPassword: ["Password saat ini salah"] } };
  }

  const hashedPassword = await bcrypt.hash(parsed.data.newPassword, 10);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hashedPassword },
  });

  return { success: true };
}

export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const raw = Object.fromEntries(formData.entries());
  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const avatarFile = formData.get("avatar") as File | null;
  let avatarUrl = session.user.avatar;

  if (avatarFile && avatarFile.size > 0) {
    const uploaded = await uploadFile(avatarFile);
    avatarUrl = uploaded.url;
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        avatar: avatarUrl,
      },
    });
    revalidatePath("/profil");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("profile action error:", error);
    if ((error as Error).message?.includes("Unique constraint")) {
      return { error: { email: ["Email sudah digunakan"] } };
    }
    throw error;
  }
}

export async function deactivateAccount() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await prisma.user.update({
    where: { id: session.user.id },
    data: { isActive: false },
  });

  return { success: true };
}
