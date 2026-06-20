import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("menggabungkan kelas string sederhana", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("menghapus duplikat menggunakan tailwind-merge", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("menangani nilai falsy", () => {
    expect(cn("base", false, null, undefined, "")).toBe("base");
  });

  it("menangani objek bersyarat via clsx", () => {
    expect(cn("base", { active: true, hidden: false })).toBe("base active");
  });
});
