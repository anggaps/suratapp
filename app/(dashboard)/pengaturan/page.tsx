import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import SettingsForm from "@/components/settings-form";

export default async function SettingsPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const settings = await prisma.setting.findFirst();

  const defaultSettings = {
    appName: "SuratAPP",
    institutionName: "Nama Institusi",
    address: "",
    contact: "",
    defaultPassword: "password123",
    itemsPerPage: 10,
    logo: null,
    incomingLetterFormat: "{sequence}/{classificationCode}/{statusCode}/{year}",
    outgoingLetterFormat: "{sequence}/{classificationCode}/{statusCode}/{year}",
    whatsappTemplate: "Assalamu'alaikum Wr. Wb.\n\nYth. {namaPenerima},\nKami informasikan mengenai surat dengan nomor {nomorSurat} perihal \"{perihal}\".\n\nTanggal Surat: {tanggal}\nPengirim: {pengirim}\nPenerima: {penerima}\n\nTerima kasih.\nWassalamu'alaikum Wr. Wb.",
  };

  return <SettingsForm settings={settings ?? defaultSettings} />;
}
