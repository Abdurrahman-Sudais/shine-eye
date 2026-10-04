import "server-only";
import { looksLikeBareUrl, normalizeText } from "@/lib/pipeline/ingest";
import { extractSignals } from "@/lib/pipeline/signals";
import type { AnalyzeRequest, PipelineStage, Signal, Verdict } from "@/lib/schema";

/**
 * Pipeline entry point. Stages (see CLAUDE.md):
 *   ingest → signals → retrieve → reason → score → localize
 * `mode: "llm_only"` skips signals + retrieval so the eval can measure what
 * the full pipeline adds.
 *
 * Slice 1: ingest + signals are real; retrieve/reason/score/localize are pending,
 * so the verdict itself is still a placeholder (`stub: true`).
 */
export async function analyze(req: AnalyzeRequest): Promise<Verdict> {
  const pipeline: PipelineStage[] = [];
  const timed = <T>(stage: PipelineStage["stage"], fn: () => T): T => {
    const t0 = performance.now();
    const result = fn();
    pipeline.push({ stage, status: "ok", ms: Math.round(performance.now() - t0) });
    return result;
  };
  const skip = (stage: PipelineStage["stage"], note: string) =>
    pipeline.push({ stage, status: "skipped", ms: 0, note });

  const text = timed("ingest", () => normalizeText(req.text));

  let signals: Signal[] = [];
  if (req.mode === "llm_only") {
    skip("signals", "llm_only mode");
    skip("retrieve", "llm_only mode");
  } else {
    signals = timed("signals", () => extractSignals(text));
    skip("retrieve", "not built yet");
  }
  skip("reason", "not built yet");
  skip("score", "not built yet");
  skip("localize", "not built yet");

  return {
    risk_level: "suspicious",
    risk_score: 50,
    confidence: "low",
    scam_type: "unknown",
    scam_type_label: "AI verdict not connected yet",
    red_flags: [],
    explanation:
      "The AI verdict isn't connected yet, so the risk level above is a placeholder. The rule-based findings below are real.",
    next_steps: [
      "Don't share OTPs, PINs, BVN, or passwords with anyone who messages you.",
      "Confirm directly with the company using their official app or the number on your card.",
    ],
    uncertainty_notes: ["Placeholder verdict: only the rule-based checks ran."],
    signals,
    matched_patterns: [],
    language: req.language,
    mode: req.mode,
    input: { kind: looksLikeBareUrl(text) ? "url" : "text", text },
    pipeline,
    stub: true,
  };
}
