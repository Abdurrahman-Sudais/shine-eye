import type { AnalyzeMode, RiskLevel, Signal } from "@/lib/schema";

/**
 * Stage 5: score calibration. Combines deterministic signals with the LLM's
 * judgement into a 0-100 score and a risk bucket.
 *
 *   signalScore = 100 · (1 − e^(−S/60)),  S = max(0, Σ signal weights)
 *                 (diminishing returns: S=20→28, S=60→63, S=130→89)
 *   llmScore    = likely_safe: 25 − 20c · suspicious: 40 + 20c · likely_scam: 65 + 30c
 *                 (c = LLM confidence 0..1)
 *   full mode   = 0.6 · llmScore + 0.4 · signalScore, then guards:
 *                 - a "hard" signal (weight ≥ 30, e.g. OTP request, lookalike link,
 *                   advance fee) floors the score at 45 ("Suspicious" at least)
 *                 - if the LLM says likely_safe and no positive signals fired,
 *                   cap at 30 so rules can't over-ride a clean message
 *   llm_only    = llmScore
 *   Final score is clamped to 3..97: we never claim 0% or 100%.
 *
 * Buckets: < 35 likely_safe · 35-64 suspicious · ≥ 65 likely_scam.
 * Confidence label: LLM confidence, raised a level when rules and LLM agree
 * (|llmScore − signalScore| < 25) and lowered when they disagree (> 50).
 */

export interface ScoreInput {
  mode: AnalyzeMode;
  signals: Signal[];
  llm: { risk_level: RiskLevel; confidence: number };
}

export interface ScoreResult {
  score: number;
  risk_level: RiskLevel;
  confidence: "low" | "medium" | "high";
  parts: { signalScore: number; llmScore: number };
}

const HARD_SIGNAL = 30;

export function signalScore(signals: Signal[]): number {
  const sum = Math.max(0, signals.reduce((s, x) => s + x.weight, 0));
  return 100 * (1 - Math.exp(-sum / 60));
}

export function llmScore(level: RiskLevel, c: number): number {
  const conf = Math.min(1, Math.max(0, c));
  if (level === "likely_safe") return 25 - 20 * conf;
  if (level === "suspicious") return 40 + 20 * conf;
  return 65 + 30 * conf;
}

export function bucket(score: number): RiskLevel {
  if (score >= 65) return "likely_scam";
  if (score >= 35) return "suspicious";
  return "likely_safe";
}

const LEVELS = ["low", "medium", "high"] as const;

export function calibrate({ mode, signals, llm }: ScoreInput): ScoreResult {
  const sig = signalScore(signals);
  const lm = llmScore(llm.risk_level, llm.confidence);

  let score = lm;
  let level = llm.confidence >= 0.8 ? 2 : llm.confidence >= 0.55 ? 1 : 0;

  if (mode === "full") {
    score = 0.6 * lm + 0.4 * sig;
    if (signals.some((s) => s.weight >= HARD_SIGNAL)) score = Math.max(score, 45);
    if (llm.risk_level === "likely_safe" && !signals.some((s) => s.weight > 0)) score = Math.min(score, 30);

    const gap = Math.abs(lm - sig);
    if (gap < 25) level = Math.min(2, level + 1);
    else if (gap > 50) level = Math.max(0, level - 1);
  }

  const final = Math.round(Math.min(97, Math.max(3, score)));
  return {
    score: final,
    risk_level: bucket(final),
    confidence: LEVELS[level],
    parts: { signalScore: Math.round(sig), llmScore: Math.round(lm) },
  };
}
