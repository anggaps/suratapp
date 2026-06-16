import { prisma } from "@/lib/prisma";
import { ClassificationManager } from "@/components/classification-manager";

export default async function ClassificationPage() {
  const classifications = await prisma.classification.findMany({
    orderBy: { code: "asc" },
  });

  return <ClassificationManager classifications={classifications} />;
}
