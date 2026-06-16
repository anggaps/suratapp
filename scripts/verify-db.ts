import { prisma } from "../lib/prisma";

async function main() {
  const [users, classifications, statuses, settings] = await Promise.all([
    prisma.user.count(),
    prisma.classification.count(),
    prisma.letterStatus.count(),
    prisma.setting.count(),
  ]);

  console.log({ users, classifications, statuses, settings });

  const admin = await prisma.user.findFirst({
    where: { email: "admin@surat.app" },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  console.log("Admin found:", admin ? "yes" : "no");
  if (admin) console.log(admin);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
