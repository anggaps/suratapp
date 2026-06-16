import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { OutgoingLetterForm } from "@/components/outgoing-letter-form";
import { generateLetterNumber } from "@/lib/utils/letter-number";

export default async function AddOutgoingLetterPage() {
  const session = await auth();
  if (session?.user?.role === "PIMPINAN") redirect("/dashboard");
  const [classifications, statuses, settings] = await Promise.all([
    prisma.classification.findMany({ orderBy: { code: "asc" } }),
    prisma.letterStatus.findMany({ orderBy: { name: "asc" } }),
    prisma.setting.findFirst(),
  ]);

  const defaultLetterNumber = await generateLetterNumber({
    type: "outgoing",
  });

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Tambah Surat Keluar</h1>
        <p className="text-muted-foreground">Isi formulir untuk mencatat surat keluar baru</p>
      </div>
      <OutgoingLetterForm
        classifications={classifications}
        statuses={statuses}
        defaultLetterNumber={defaultLetterNumber ?? ""}
        letterNumberFormat={settings?.outgoingLetterFormat}
      />
    </div>
  );
}
