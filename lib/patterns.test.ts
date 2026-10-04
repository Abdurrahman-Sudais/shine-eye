import { describe, expect, it } from "vitest";
import { PATTERNS, SCAM_TYPES } from "@/lib/patterns";

describe("scam pattern knowledge base", () => {
  it("parses and has a useful number of entries", () => {
    expect(PATTERNS.length).toBeGreaterThanOrEqual(40);
  });

  it("has unique ids", () => {
    const ids = PATTERNS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("covers legitimate examples to keep false positives down", () => {
    expect(PATTERNS.filter((p) => p.scam_type === "legitimate").length).toBeGreaterThanOrEqual(3);
  });

  it("never contains real-looking Nigerian phone numbers", () => {
    const phone = /(?:\+?234|0)[789][01]\d{8}/;
    for (const p of PATTERNS) expect(p.examples.join(" ")).not.toMatch(phone);
  });

  it("uses every non-fallback scam type at least once", () => {
    const used = new Set(PATTERNS.map((p) => p.scam_type));
    const unused = Object.keys(SCAM_TYPES).filter((t) => t !== "unknown" && !used.has(t as never));
    expect(unused).toEqual([]);
  });
});
