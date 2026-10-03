import { describe, expect, it } from "vitest";
import { analyze } from "@/lib/pipeline";
import { AnalyzeRequestSchema, VerdictSchema } from "@/lib/schema";

describe("analyze (slice 0 stub)", () => {
  it("returns a verdict that satisfies the shared contract", async () => {
    const req = AnalyzeRequestSchema.parse({ text: "Your account don block, click here" });
    const verdict = await analyze(req);
    expect(VerdictSchema.safeParse(verdict).success).toBe(true);
    expect(verdict.stub).toBe(true);
  });

  it("skips signals and retrieval in llm_only mode", async () => {
    const req = AnalyzeRequestSchema.parse({ text: "hello", mode: "llm_only" });
    const verdict = await analyze(req);
    const skipped = verdict.pipeline.filter((s) => s.note === "llm_only mode").map((s) => s.stage);
    expect(skipped).toEqual(["signals", "retrieve"]);
  });

  it("rejects empty and oversized input", () => {
    expect(AnalyzeRequestSchema.safeParse({ text: "   " }).success).toBe(false);
    expect(AnalyzeRequestSchema.safeParse({ text: "a".repeat(5001) }).success).toBe(false);
  });
});
