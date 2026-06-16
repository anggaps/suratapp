import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const settings = await prisma.setting.findFirst();
  const appName = settings?.appName ?? "SuratAPP";

  return (
    <div className="flex min-h-screen">
      <Sidebar role={session.user.role ?? "STAFF"} appName={appName} />
      <div className="flex flex-1 flex-col">
        <Header user={session.user} appName={appName} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
