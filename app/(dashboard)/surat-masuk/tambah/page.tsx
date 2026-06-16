import { prisma } from "@/lib/prisma";
import { IncomingLetterForm } from "@/components/incoming-letter-form";
import { generateLetterNumber } from "@/lib/utils/letter-number";

export default async function AddIncomingLetterPage() {
  const [classifications, statuses, settings] = await Promise.all([
    prisma.classification.findMany({ orderBy: { code: "asc" } }),
    prisma.letterStatus.findMany({ orderBy: { name: "asc" } }),
    prisma.setting.findFirst(),
  ]);

  const defaultLetterNumber = await generateLetterNumber({
    type: "incoming",
  });

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Tambah Surat Masuk</h1>
        <p className="text-muted-foreground">Isi formulir untuk mencatat surat masuk baru</p>
      </div>
      <IncomingLetterForm
        classifications={classifications}
        statuses={statuses}
        defaultLetterNumber={defaultLetterNumber ?? ""}
        letterNumberFormat={settings?.incomingLetterFormat}
      />
    </div>
  );
}
