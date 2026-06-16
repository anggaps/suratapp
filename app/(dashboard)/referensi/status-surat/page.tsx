import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import StatusManager from "@/components/status-manager";

export default async function StatusPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");

  const statuses = await prisma.letterStatus.findMany({
    orderBy: { name: "asc" },
  });

  return <StatusManager statuses={statuses} />;
}
