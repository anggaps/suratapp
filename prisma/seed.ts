import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const defaultPassword = "password123";
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  // Admin user
  const admin = await prisma.user.upsert({
    where: { email: "admin@surat.app" },
    update: {},
    create: {
      name: "Administrator",
      email: "admin@surat.app",
      password: hashedPassword,
      role: UserRole.ADMIN,
      phone: "081234567890",
      isActive: true,
    },
  });

  // Staff user
  await prisma.user.upsert({
    where: { email: "staff@surat.app" },
    update: {},
    create: {
      name: "Staff Keuangan",
      email: "staff@surat.app",
      password: hashedPassword,
      role: UserRole.STAFF,
      phone: "089876543210",
      isActive: true,
    },
  });

  // Pimpinan user
  await prisma.user.upsert({
    where: { email: "pimpinan@surat.app" },
    update: {},
    create: {
      name: "Pimpinan",
      email: "pimpinan@surat.app",
      password: hashedPassword,
      role: UserRole.PIMPINAN,
      phone: "081111222333",
      isActive: true,
    },
  });

  // Classifications
  const classifications = [
    { code: "II.3.AU", name: "Akademik / Undangan", description: "Surat akademik dan undangan resmi" },
    { code: "KU", name: "Keuangan", description: "Surat terkait keuangan" },
    { code: "SDM", name: "Kepegawaian", description: "Surat terkait SDM/kepegawaian" },
    { code: "UM", name: "Umum", description: "Surat umum" },
  ];

  for (const c of classifications) {
    await prisma.classification.upsert({
      where: { code: c.code },
      update: {},
      create: { ...c, createdBy: admin.id },
    });
  }

  // Letter statuses
  const statuses = [
    { name: "Biasa", color: "#22c55e" },
    { name: "Penting", color: "#f97316" },
    { name: "Rahasia", color: "#ef4444" },
    { name: "Sangat Rahasia", color: "#7f1d1d" },
  ];

  for (const s of statuses) {
    await prisma.letterStatus.upsert({
      where: { name: s.name },
      update: {},
      create: { ...s, createdBy: admin.id },
    });
  }

  // Default settings
  await prisma.setting.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      appName: "SuratAPP",
      institutionName: "Nama Institusi",
      address: "Alamat Institusi",
      contact: "081234567890",
      defaultPassword,
      itemsPerPage: 10,
      incomingLetterFormat: "{nomorUrut}/{kodeKlasifikasi}/{kodeStatus}/{tahun}",
      outgoingLetterFormat: "{nomorUrut}/{kodeKlasifikasi}/{kodeStatus}/{tahun}",
      whatsappTemplate: "Assalamu'alaikum Wr. Wb.\n\nYth. {namaPenerima},\nKami informasikan mengenai surat dengan nomor {nomorSurat} perihal \"{perihal}\".\n\nTanggal Surat: {tanggal}\nPengirim: {pengirim}\nPenerima: {penerima}\n\nTerima kasih.\nWassalamu'alaikum Wr. Wb.",
    },
  });

  console.log("✅ Seed data berhasil dibuat");
  console.log("   Admin: admin@surat.app / password123");
  console.log("   Staff: staff@surat.app / password123");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
