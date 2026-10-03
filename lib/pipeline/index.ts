import "server-only";
import type { AnalyzeRequest, PipelineStage, Verdict } from "@/lib/schema";

/**
 * Pipeline entry point. Stages (see CLAUDE.md):
 *   ingest → signals → retrieve → reason → score → localize
 * `mode: "llm_only"` skips signals + retrieval so the eval can measure what
 * the full pipeline adds.
 *
 * Slice 0: placeholder output with the final shape, flagged `stub: true`.
 */
export async function analyze(req: AnalyzeRequest): Promise<Verdict> {
  const started = performance.now();
  const text = req.text;
  const isUrl = /^https?:\/\/\S+$/i.test(text) || /^[\w-]+(\.[\w-]+)+\/?\S*$/i.test(text);

  const skipped = (stage: PipelineStage["stage"], note: string): PipelineStage => ({
    stage,
    status: "skipped",
    ms: 0,
    note,
  });

  const pipeline: PipelineStage[] = [
    { stage: "ingest", status: "ok", ms: Math.round(performance.now() - started) },
    req.mode === "llm_only" ? skipped("signals", "llm_only mode") : skipped("signals", "not built yet"),
    req.mode === "llm_only" ? skipped("retrieve", "llm_only mode") : skipped("retrieve", "not built yet"),
    skipped("reason", "not built yet"),
    skipped("score", "not built yet"),
    skipped("localize", "not built yet"),
  ];

  return {
    risk_level: "suspicious",
    risk_score: 50,
    confidence: "low",
    scam_type: "unknown",
    scam_type_label: "Not analysed yet",
    red_flags: [],
    explanation:
      "The analysis pipeline isn't connected yet, so this is placeholder output, not a real check.",
    next_steps: [
      "Don't share OTPs, PINs, BVN, or passwords with anyone who messages you.",
      "Confirm directly with the company using their official app or the number on your card.",
    ],
    uncertainty_notes: ["Placeholder result: no analysis was performed."],
    signals: [],
    matched_patterns: [],
    language: req.language,
    mode: req.mode,
    input: { kind: isUrl ? "url" : "text", text },
    pipeline,
    stub: true,
  };
}
