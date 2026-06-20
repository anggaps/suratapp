import { describe, expect, it } from "vitest";
import {
  cleanPhoneNumber,
  formatWhatsAppTemplate,
  buildWhatsAppLink,
  getDefaultWhatsAppTemplate,
} from "@/lib/utils/whatsapp";

describe("cleanPhoneNumber", () => {
  it("mengubah nomor dengan awalan 0 menjadi 62", () => {
    expect(cleanPhoneNumber("081234567890")).toBe("6281234567890");
  });

  it("mempertahankan nomor yang sudah berawalan 62", () => {
    expect(cleanPhoneNumber("6281234567890")).toBe("6281234567890");
  });

  it("menambahkan 62 untuk nomor berawalan 8", () => {
    expect(cleanPhoneNumber("81234567890")).toBe("6281234567890");
  });

  it("menghapus karakter non-digit", () => {
    expect(cleanPhoneNumber("+62 812-345-678-90")).toBe("6281234567890");
  });

  it("mengembalikan string kosong untuk input kosong", () => {
    expect(cleanPhoneNumber("")).toBe("");
  });

  it("mengembalikan string kosong untuk input hanya simbol", () => {
    expect(cleanPhoneNumber("---")).toBe("");
  });
});

describe("formatWhatsAppTemplate", () => {
  const data = {
    letterNumber: "001/A/D/2026",
    agendaNumber: "AG-001",
    subject: "Undangan Rapat",
    date: new Date("2026-06-20T00:00:00.000Z"),
    sender: "Sekretariat",
    recipient: "Kepala Dinas",
    recipientName: "Budi",
    classification: "Rahasia",
    status: "Diproses",
    institutionName: "Pemda Kota",
  };

  it("mengganti semua placeholder bahasa Indonesia dengan nilai data", () => {
    const result = formatWhatsAppTemplate(
      "{nomorSurat} | {nomorAgenda} | {perihal} | {tanggal} | {pengirim} | {penerima} | {namaPenerima} | {klasifikasi} | {status} | {namaInstitusi}",
      data
    );
    expect(result).toContain("001/A/D/2026");
    expect(result).toContain("AG-001");
    expect(result).toContain("Undangan Rapat");
    expect(result).toContain("20 Juni 2026");
    expect(result).toContain("Sekretariat");
    expect(result).toContain("Kepala Dinas");
    expect(result).toContain("Budi");
    expect(result).toContain("Rahasia");
    expect(result).toContain("Diproses");
    expect(result).toContain("Pemda Kota");
  });

  it("mendukung token lama (bahasa Inggris) untuk backward compatibility", () => {
    const result = formatWhatsAppTemplate(
      "{letterNumber} | {agendaNumber} | {subject} | {date} | {sender} | {recipient} | {recipientName} | {classification} | {status} | {institutionName}",
      data
    );
    expect(result).toContain("001/A/D/2026");
    expect(result).toContain("AG-001");
    expect(result).toContain("Undangan Rapat");
    expect(result).toContain("20 Juni 2026");
    expect(result).toContain("Sekretariat");
    expect(result).toContain("Kepala Dinas");
    expect(result).toContain("Budi");
    expect(result).toContain("Rahasia");
    expect(result).toContain("Diproses");
    expect(result).toContain("Pemda Kota");
  });

  it("mendukung campuran token lama dan baru", () => {
    const result = formatWhatsAppTemplate(
      "{nomorSurat} - {subject} - {namaPenerima}",
      data
    );
    expect(result).toBe("001/A/D/2026 - Undangan Rapat - Budi");
  });

  it("menggunakan recipient sebagai namaPenerima jika tidak disediakan", () => {
    const { recipientName, ...dataWithoutName } = data;
    void recipientName;
    const result = formatWhatsAppTemplate("Yth. {namaPenerima}", dataWithoutName);
    expect(result).toBe("Yth. Kepala Dinas");
  });

  it("menggunakan nilai default untuk field opsional yang kosong", () => {
    const result = formatWhatsAppTemplate(
      "{klasifikasi} | {status} | {namaInstitusi}",
      { ...data, classification: undefined, status: undefined, institutionName: undefined }
    );
    expect(result).toBe("- | - | Institusi");
  });
});

describe("buildWhatsAppLink", () => {
  it("membangun URL wa.me dengan nomor dan pesan ter-encode", () => {
    const link = buildWhatsAppLink("081234567890", "Halo & selamat datang");
    expect(link).toBe("https://wa.me/6281234567890?text=Halo%20%26%20selamat%20datang");
  });
});

describe("getDefaultWhatsAppTemplate", () => {
  it("mengembalikan template default yang berisi placeholder bahasa Indonesia", () => {
    const template = getDefaultWhatsAppTemplate();
    expect(template).toContain("{nomorSurat}");
    expect(template).toContain("{perihal}");
    expect(template).toContain("{namaPenerima}");
  });
});
