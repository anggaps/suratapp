import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import UserManager from "@/components/user-manager";

export default async function UsersPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      isActive: true,
    },
  });

  const settings = await prisma.setting.findFirst();
  const pageSize = settings?.itemsPerPage ?? 10;

  return (
    <UserManager users={users} currentUserId={session.user.id} pageSize={pageSize} />
  );
}
