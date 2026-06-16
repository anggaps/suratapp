import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { OutgoingLetterForm } from "@/components/outgoing-letter-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditOutgoingLetterPage({ params }: PageProps) {
  const session = await auth();
  if (session?.user?.role === "PIMPINAN") redirect("/dashboard");

  const { id: letterId } = await params;
  const [letter, classifications, statuses, settings] = await Promise.all([
    prisma.outgoingLetter.findUnique({
      where: { id: letterId },
      include: { attachments: true },
    }),
    prisma.classification.findMany({ orderBy: { code: "asc" } }),
    prisma.letterStatus.findMany({ orderBy: { name: "asc" } }),
    prisma.setting.findFirst(),
  ]);

  if (!letter) notFound();
  if (session?.user?.role === "STAFF" && letter.approvedById) {
    redirect("/surat-keluar");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Edit Surat Keluar</h1>
        <p className="text-muted-foreground">Perbarui data surat keluar</p>
      </div>
      <OutgoingLetterForm
        letter={{
          ...letter,
          content: letter.content ?? "",
          classificationId: letter.classificationId,
          statusId: letter.statusId,
        }}
        classifications={classifications}
        statuses={statuses}
        letterNumberFormat={settings?.outgoingLetterFormat}
      />
    </div>
  );
}
