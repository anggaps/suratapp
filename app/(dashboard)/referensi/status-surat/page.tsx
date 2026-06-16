import { prisma } from "@/lib/prisma";
import StatusManager from "@/components/status-manager";

export default async function StatusPage() {
  const statuses = await prisma.letterStatus.findMany({
    orderBy: { name: "asc" },
  });

  return <StatusManager statuses={statuses} />;
}
