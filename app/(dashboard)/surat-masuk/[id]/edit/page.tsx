import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { IncomingLetterForm } from "@/components/incoming-letter-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditIncomingLetterPage({ params }: PageProps) {
  const session = await auth();
  if (session?.user?.role === "PIMPINAN") redirect("/dashboard");

  const { id: letterId } = await params;
  const [letter, classifications, statuses, settings] = await Promise.all([
    prisma.incomingLetter.findUnique({
      where: { id: letterId },
      include: { attachments: true },
    }),
    prisma.classification.findMany({ orderBy: { code: "asc" } }),
    prisma.letterStatus.findMany({ orderBy: { name: "asc" } }),
    prisma.setting.findFirst(),
  ]);

  if (!letter) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Edit Surat Masuk</h1>
        <p className="text-muted-foreground">Perbarui data surat masuk</p>
      </div>
      <IncomingLetterForm
        letter={{
          ...letter,
          content: letter.content ?? "",
          classificationId: letter.classificationId,
          statusId: letter.statusId,
        }}
        classifications={classifications}
        statuses={statuses}
        letterNumberFormat={settings?.incomingLetterFormat}
      />
    </div>
  );
}
