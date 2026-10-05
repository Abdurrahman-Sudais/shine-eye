import { beforeAll, describe, expect, it } from "vitest";
import { analyze } from "@/lib/pipeline";
import { AnalyzeRequestSchema, VerdictSchema } from "@/lib/schema";
import { SAMPLES } from "@/lib/samples";

// These tests exercise the no-API-key path; real model calls belong in the eval.
beforeAll(() => {
  delete process.env.GEMINI_API_KEY;
});

describe("analyze without an LLM (rules-only fallback)", () => {
  it("returns a valid, honest verdict", async () => {
    const verdict = await analyze(AnalyzeRequestSchema.parse({ text: SAMPLES[0].text }));
    expect(VerdictSchema.safeParse(verdict).success).toBe(true);
    expect(verdict.pipeline.find((s) => s.stage === "reason")).toMatchObject({ status: "failed", note: "not configured" });
    expect(verdict.confidence).toBe("low");
    expect(verdict.risk_level).not.toBe("likely_safe");
    expect(verdict.red_flags.length).toBeGreaterThan(0);
    for (const f of verdict.red_flags) expect(verdict.input.text).toContain(f.quote);
  });

  it("keeps a genuine OTP notice safe", async () => {
    const legit = SAMPLES.find((s) => s.id === "legit-otp")!;
    const verdict = await analyze(AnalyzeRequestSchema.parse({ text: legit.text }));
    expect(verdict.risk_level).toBe("likely_safe");
  });

  it("skips signals and retrieval in llm_only mode", async () => {
    const verdict = await analyze(AnalyzeRequestSchema.parse({ text: "hello", mode: "llm_only" }));
    const skipped = verdict.pipeline.filter((s) => s.note === "llm_only mode").map((s) => s.stage);
    expect(skipped).toEqual(["signals", "retrieve"]);
  });

  it("rejects empty and oversized input", () => {
    expect(AnalyzeRequestSchema.safeParse({ text: "   " }).success).toBe(false);
    expect(AnalyzeRequestSchema.safeParse({ text: "a".repeat(5001) }).success).toBe(false);
  });
});
