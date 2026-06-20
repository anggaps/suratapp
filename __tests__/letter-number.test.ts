import { describe, expect, it } from "vitest";
import { parseLetterNumberFormat } from "@/lib/utils/letter-number";

describe("parseLetterNumberFormat", () => {
  it("menerima format default bahasa Indonesia dengan semua token valid", () => {
    expect(parseLetterNumberFormat("{nomorUrut}/{kodeKlasifikasi}/{kodeStatus}/{tahun}")).toBe(true);
  });

  it("menerima format lama (bahasa Inggris) untuk backward compatibility", () => {
    expect(parseLetterNumberFormat("{sequence}/{classificationCode}/{statusCode}/{year}")).toBe(true);
  });

  it("menerima format dengan hanya sebagian token", () => {
    expect(parseLetterNumberFormat("{nomorUrut}/{tahun}")).toBe(true);
  });

  it("menerima format campuran token lama dan baru", () => {
    expect(parseLetterNumberFormat("{nomorUrut}/{classificationCode}/{year}")).toBe(true);
  });

  it("menerima format tanpa token sama sekali", () => {
    expect(parseLetterNumberFormat("FIXED-001")).toBe(true);
  });

  it("menolak format dengan token tidak dikenal", () => {
    expect(parseLetterNumberFormat("{nomorUrut}/{unknown}/{tahun}")).toBe(false);
  });

  it("menolak format dengan token salah ejaan", () => {
    expect(parseLetterNumberFormat("{urut}/")).toBe(false);
  });

  it("menerima format dengan token berulang", () => {
    expect(parseLetterNumberFormat("{tahun}-{tahun}")).toBe(true);
  });
});
