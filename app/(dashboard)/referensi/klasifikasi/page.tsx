import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ClassificationManager } from "@/components/classification-manager";

export default async function ClassificationPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");

  const classifications = await prisma.classification.findMany({
    orderBy: { code: "asc" },
  });

  return <ClassificationManager classifications={classifications} />;
}
