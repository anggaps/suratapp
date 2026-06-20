import { describe, expect, it } from "vitest";
import { serializePayload } from "@/lib/utils/audit";

describe("serializePayload", () => {
  it("mengembalikan undefined untuk null", () => {
    expect(serializePayload(null)).toBeUndefined();
  });

  it("mengembalikan undefined untuk undefined", () => {
    expect(serializePayload(undefined)).toBeUndefined();
  });

  it("mengembalikan objek yang sama untuk input primitif", () => {
    expect(serializePayload("teks")).toBe("teks");
    expect(serializePayload(42)).toBe(42);
    expect(serializePayload(true)).toBe(true);
  });

  it("menduplikasi objek melalui JSON round-trip", () => {
    const input = { a: 1, b: "teks", c: { nested: true } };
    const result = serializePayload(input);
    expect(result).toEqual(input);
    expect(result).not.toBe(input);
  });

  it("menghapus fungsi dan undefined dari objek", () => {
    const input = { a: 1, fn: () => "halo", b: undefined };
    const result = serializePayload(input) as Record<string, unknown>;
    expect(result.a).toBe(1);
    expect(result.fn).toBeUndefined();
    expect(result.b).toBeUndefined();
  });

  it("mengembalikan undefined untuk nilai yang tidak bisa di-serialize", () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(serializePayload(circular)).toBeUndefined();
  });
});
