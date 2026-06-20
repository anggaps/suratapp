import { format } from "date-fns";
import { id } from "date-fns/locale";

export interface WhatsAppTemplateData {
  letterNumber: string;
  agendaNumber: string;
  subject: string;
  date: Date | string;
  sender: string;
  recipient: string;
  recipientName?: string;
  classification?: string;
  status?: string;
  institutionName?: string;
}

export function getDefaultWhatsAppTemplate(): string {
  return "Assalamu'alaikum Wr. Wb.\n\nYth. {namaPenerima},\nKami informasikan mengenai surat dengan nomor {nomorSurat} perihal \"{perihal}\".\n\nTanggal Surat: {tanggal}\nPengirim: {pengirim}\nPenerima: {penerima}\n\nTerima kasih.\nWassalamu'alaikum Wr. Wb.";
}

export function cleanPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (!digits) return "";

  if (digits.startsWith("0")) {
    return `62${digits.slice(1)}`;
  }

  if (digits.startsWith("62")) {
    return digits;
  }

  if (digits.startsWith("8")) {
    return `62${digits}`;
  }

  return digits;
}

function formatDate(value: Date | string): string {
  try {
    const date = typeof value === "string" ? new Date(value) : value;
    return format(date, "dd MMMM yyyy", { locale: id });
  } catch {
    return String(value);
  }
}

export function formatWhatsAppTemplate(
  template: string,
  data: WhatsAppTemplateData
): string {
  const dateStr = formatDate(data.date);
  const replacements: Array<[RegExp, string]> = [
    [/\{nomorSurat\}/g, data.letterNumber],
    [/\{letterNumber\}/g, data.letterNumber],
    [/\{nomorAgenda\}/g, data.agendaNumber],
    [/\{agendaNumber\}/g, data.agendaNumber],
    [/\{perihal\}/g, data.subject],
    [/\{subject\}/g, data.subject],
    [/\{tanggal\}/g, dateStr],
    [/\{date\}/g, dateStr],
    [/\{pengirim\}/g, data.sender],
    [/\{sender\}/g, data.sender],
    [/\{penerima\}/g, data.recipient],
    [/\{recipient\}/g, data.recipient],
    [/\{namaPenerima\}/g, data.recipientName ?? data.recipient],
    [/\{recipientName\}/g, data.recipientName ?? data.recipient],
    [/\{klasifikasi\}/g, data.classification ?? "-"],
    [/\{classification\}/g, data.classification ?? "-"],
    [/\{status\}/g, data.status ?? "-"],
    [/\{namaInstitusi\}/g, data.institutionName ?? "Institusi"],
    [/\{institutionName\}/g, data.institutionName ?? "Institusi"],
  ];

  return replacements.reduce(
    (acc, [pattern, value]) => acc.replace(pattern, value),
    template
  );
}

export function buildWhatsAppLink(phone: string, message: string): string {
  const cleaned = cleanPhoneNumber(phone);
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${cleaned}?text=${encoded}`;
}
