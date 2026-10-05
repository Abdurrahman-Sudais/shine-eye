import { describe, expect, it } from "vitest";
import { bucket, calibrate, signalScore } from "@/lib/pipeline/score";
import type { Signal } from "@/lib/schema";

const sig = (weight: number): Signal => ({ type: "t", label: "l", weight });

describe("calibrate", () => {
  it("agreeing scam evidence → likely scam, high confidence, never 100", () => {
    const r = calibrate({ mode: "full", signals: [sig(35), sig(35), sig(30)], llm: { risk_level: "likely_scam", confidence: 0.99 } });
    expect(r.risk_level).toBe("likely_scam");
    expect(r.confidence).toBe("high");
    expect(r.score).toBeLessThanOrEqual(97);
  });

  it("hard signal floors a 'safe' LLM verdict at suspicious", () => {
    const r = calibrate({ mode: "full", signals: [sig(35)], llm: { risk_level: "likely_safe", confidence: 0.9 } });
    expect(r.risk_level).toBe("suspicious");
  });

  it("clean message the LLM calls safe stays safe", () => {
    const r = calibrate({ mode: "full", signals: [sig(-12)], llm: { risk_level: "likely_safe", confidence: 0.9 } });
    expect(r.risk_level).toBe("likely_safe");
    expect(r.score).toBeGreaterThanOrEqual(3);
  });

  it("llm_only ignores signals", () => {
    const a = calibrate({ mode: "llm_only", signals: [sig(80)], llm: { risk_level: "likely_safe", confidence: 0.8 } });
    expect(a.risk_level).toBe("likely_safe");
  });

  it("strong disagreement lowers confidence", () => {
    const r = calibrate({ mode: "full", signals: [], llm: { risk_level: "likely_scam", confidence: 0.9 } });
    expect(r.confidence).toBe("medium");
  });
});

describe("helpers", () => {
  it("signalScore has diminishing returns and ignores net-negative", () => {
    expect(signalScore([sig(-20)])).toBe(0);
    expect(Math.round(signalScore([sig(60)]))).toBe(63);
  });
  it("bucket boundaries", () => {
    expect([bucket(34), bucket(35), bucket(64), bucket(65)]).toEqual(["likely_safe", "suspicious", "suspicious", "likely_scam"]);
  });
});
