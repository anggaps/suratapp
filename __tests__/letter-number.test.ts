import { describe, expect, it } from "vitest";
import { parseLetterNumberFormat } from "@/lib/utils/letter-number";

describe("parseLetterNumberFormat", () => {
  it("menerima format default dengan semua token valid", () => {
    expect(parseLetterNumberFormat("{sequence}/{classificationCode}/{statusCode}/{year}")).toBe(true);
  });

  it("menerima format dengan hanya sebagian token", () => {
    expect(parseLetterNumberFormat("{sequence}/{year}")).toBe(true);
  });

  it("menerima format tanpa token sama sekali", () => {
    expect(parseLetterNumberFormat("FIXED-001")).toBe(true);
  });

  it("menolak format dengan token tidak dikenal", () => {
    expect(parseLetterNumberFormat("{sequence}/{unknown}/{year}")).toBe(false);
  });

  it("menolak format dengan token salah ejaan", () => {
    expect(parseLetterNumberFormat("{seq}/")).toBe(false);
  });

  it("menerima format dengan token berulang", () => {
    expect(parseLetterNumberFormat("{year}-{year}")).toBe(true);
  });
});
