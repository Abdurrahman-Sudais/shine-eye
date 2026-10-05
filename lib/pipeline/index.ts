import "server-only";
import { LlmNotConfiguredError, LlmOutputError, LlmRateLimitError } from "@/lib/llm";
import { SCAM_TYPES, type ScamType } from "@/lib/patterns";
import { looksLikeBareUrl, normalizeText } from "@/lib/pipeline/ingest";
import { reason, type LlmVerdict } from "@/lib/pipeline/reason";
import { locateQuote, redact } from "@/lib/pipeline/redact";
import { retrievePatterns, type Match } from "@/lib/pipeline/retrieve";
import { calibrate } from "@/lib/pipeline/score";
import { extractSignals } from "@/lib/pipeline/signals";
import type { AnalyzeRequest, Language, PipelineStage, RedFlag, Signal, Verdict } from "@/lib/schema";

/**
 * Pipeline entry point:
 *   ingest → signals → retrieve → reason (+localize) → score
 * `mode: "llm_only"` skips signals + retrieval so the eval can measure what the
 * full pipeline adds. If the LLM is unavailable, we return a clearly-labelled
 * rules-only estimate instead of failing.
 */
export async function analyze(req: AnalyzeRequest): Promise<Verdict> {
  const pipeline: PipelineStage[] = [];
  async function timed<T>(stage: PipelineStage["stage"], fn: () => T | Promise<T>, note?: (r: T) => string | undefined) {
    const t0 = performance.now();
    const result = await fn();
    pipeline.push({ stage, status: "ok", ms: Math.round(performance.now() - t0), note: note?.(result) });
    return result;
  }
  const skip = (stage: PipelineStage["stage"], note: string) => pipeline.push({ stage, status: "skipped", ms: 0, note });

  const text = await timed("ingest", () => normalizeText(req.text));
  const full = req.mode === "full";

  let signals: Signal[] = [];
  let matches: Match[] = [];
  if (full) {
    signals = await timed("signals", () => extractSignals(text), (s) => `${s.length} signals`);
    const retrieval = await timed("retrieve", () => retrievePatterns(redact(text)), (r) => [r.method, r.note].filter(Boolean).join(", "));
    matches = retrieval.matches;
  } else {
    skip("signals", "llm_only mode");
    skip("retrieve", "llm_only mode");
  }

  let llm: LlmVerdict | null = null;
  let llmError: string | null = null;
  const t0 = performance.now();
  try {
    const out = await reason({ redactedText: redact(text), language: req.language, evidence: full ? { signals, matches } : undefined });
    llm = out.data;
    pipeline.push({ stage: "reason", status: "ok", ms: Math.round(performance.now() - t0), note: out.model });
    pipeline.push({ stage: "localize", status: "ok", ms: 0, note: "written in the reasoning call" });
  } catch (err) {
    if (!(err instanceof LlmNotConfiguredError || err instanceof LlmRateLimitError || err instanceof LlmOutputError)) {
      console.error("[analyze] reason failed", err);
    }
    llmError = err instanceof LlmRateLimitError ? "rate limited" : err instanceof LlmNotConfiguredError ? "not configured" : "failed";
    pipeline.push({ stage: "reason", status: "failed", ms: Math.round(performance.now() - t0), note: llmError });
    skip("localize", "no AI output");
  }

  const t1 = performance.now();
  const base = llm ?? rulesOnlyJudgement(signals, matches);
  const scored = calibrate({ mode: req.mode, signals, llm: base });
  pipeline.push({ stage: "score", status: "ok", ms: Math.round(performance.now() - t1), note: `llm ${scored.parts.llmScore}, rules ${scored.parts.signalScore}` });

  const scamType: ScamType = llm?.scam_type ?? base.scam_type;
  const common = {
    risk_level: scored.risk_level,
    risk_score: scored.score,
    signals,
    matched_patterns: matches.map((m) => ({ id: m.pattern.id, title: m.pattern.title, similarity: round2(m.similarity) })),
    language: req.language,
    mode: req.mode,
    input: { kind: looksLikeBareUrl(text) ? ("url" as const) : ("text" as const), text },
    pipeline,
    stub: false,
  };

  if (llm) {
    return {
      ...common,
      confidence: scored.confidence,
      scam_type: scamType,
      scam_type_label: SCAM_TYPES[scamType],
      red_flags: groundRedFlags(text, llm.red_flags),
      explanation: llm.explanation,
      next_steps: llm.next_steps,
      uncertainty_notes: llm.uncertainty_notes,
    };
  }

  return {
    ...common,
    confidence: "low",
    scam_type: scamType,
    scam_type_label: SCAM_TYPES[scamType],
    red_flags: signals
      .filter((s) => s.weight >= 10 && s.span)
      .slice(0, 5)
      .map((s) => ({ quote: s.span!.text, why: s.label, span: s.span })),
    explanation: FALLBACK_COPY[req.language].explanation,
    next_steps: [...(matches[0] && matches[0].similarity > 0.3 ? [matches[0].pattern.action] : []), ...FALLBACK_COPY[req.language].steps].slice(0, 5),
    uncertainty_notes: [FALLBACK_COPY[req.language].note(llmError ?? "failed")],
  };
}

/** Keep only red flags whose quote really appears in the input; attach its span. */
function groundRedFlags(original: string, flags: LlmVerdict["red_flags"]): RedFlag[] {
  const out: RedFlag[] = [];
  for (const f of flags) {
    const loc = locateQuote(original, f.quote);
    if (!loc) continue;
    const quote = original.slice(loc.start, loc.end);
    if (out.some((o) => o.quote === quote)) continue;
    out.push({ quote, why: f.why, span: { text: quote, ...loc } });
  }
  return out;
}

/** Stand-in for the LLM judgement, derived from rules + retrieval only. */
function rulesOnlyJudgement(signals: Signal[], matches: Match[]): Pick<LlmVerdict, "risk_level" | "confidence" | "scam_type"> {
  const sum = signals.reduce((s, x) => s + x.weight, 0);
  const top = matches[0];
  return {
    risk_level: sum >= 50 ? "likely_scam" : sum >= 15 ? "suspicious" : "likely_safe",
    confidence: 0.4,
    scam_type: top && top.similarity > 0.3 && sum >= 15 ? top.pattern.scam_type : "unknown",
  };
}

const round2 = (n: number) => Math.round(n * 100) / 100;

// Yoruba/Hausa/Igbo fall back to English here; the AI path localizes properly.
const EN_FALLBACK = {
  explanation: "Our AI check is unavailable right now, so this estimate is based only on our rule-based checks. Treat it as a rough guide.",
  steps: [
    "Don't share OTPs, PINs, BVN, or passwords with anyone who messages you.",
    "Confirm directly with the company using their official app or the number on your card.",
    "Don't send money or click links until you've verified who sent this.",
  ],
  note: (why: string) => `AI analysis ${why}; only rule-based checks ran.`,
};

const FALLBACK_COPY: Record<Language, typeof EN_FALLBACK> = {
  en: EN_FALLBACK,
  pcm: {
    explanation: "Our AI check no dey work now, so na only our rule-based checks we use. Take am as rough guide.",
    steps: [
      "No give anybody your OTP, PIN, BVN or password.",
      "Confirm with the company yourself, use their official app or the number for back of your card.",
      "No send money or click link until you sure say na who you know send am.",
    ],
    note: (why: string) => `AI check ${why === "rate limited" ? "too busy now" : "no work"}; na only rule-based checks run.`,
  },
  yo: EN_FALLBACK,
  ha: EN_FALLBACK,
  ig: EN_FALLBACK,
};
