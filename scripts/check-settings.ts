import { prisma } from "@/lib/prisma";

async function main() {
  const settings = await prisma.setting.findFirst();
  if (!settings) {
    console.log("Tidak ada data setting di database");
    return;
  }
  console.log("incomingLetterFormat:", settings.incomingLetterFormat);
  console.log("outgoingLetterFormat:", settings.outgoingLetterFormat);
  console.log("---");
  console.log("whatsappTemplate:");
  console.log(settings.whatsappTemplate);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
