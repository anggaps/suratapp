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
  return "Assalamu'alaikum Wr. Wb.\n\nYth. {recipientName},\nKami informasikan mengenai surat dengan nomor {letterNumber} perihal \"{subject}\".\n\nTanggal Surat: {date}\nPengirim: {sender}\nPenerima: {recipient}\n\nTerima kasih.\nWassalamu'alaikum Wr. Wb.";
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

  return template
    .replace(/\{letterNumber\}/g, data.letterNumber)
    .replace(/\{agendaNumber\}/g, data.agendaNumber)
    .replace(/\{subject\}/g, data.subject)
    .replace(/\{date\}/g, dateStr)
    .replace(/\{sender\}/g, data.sender)
    .replace(/\{recipient\}/g, data.recipient)
    .replace(/\{recipientName\}/g, data.recipientName ?? data.recipient)
    .replace(/\{classification\}/g, data.classification ?? "-")
    .replace(/\{status\}/g, data.status ?? "-")
    .replace(/\{institutionName\}/g, data.institutionName ?? "Institusi");
}

export function buildWhatsAppLink(phone: string, message: string): string {
  const cleaned = cleanPhoneNumber(phone);
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${cleaned}?text=${encoded}`;
}
