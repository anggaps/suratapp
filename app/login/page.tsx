import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import LoginForm from "@/components/login-form";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  const settings = await prisma.setting.findFirst();

  return (
    <LoginForm
      appName={settings?.appName ?? "SuratAPP"}
      institutionName={settings?.institutionName ?? "Sistem Manajemen Surat Menyurat"}
    />
  );
}
