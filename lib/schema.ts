import { z } from "zod";

/**
 * The verdict contract shared by the pipeline, the API, and the UI.
 * Change it here first; everything else follows the types.
 */

export const LANGUAGES = {
  en: { label: "English", native: "English", beta: false },
  pcm: { label: "Pidgin", native: "Naijá", beta: false },
  yo: { label: "Yoruba", native: "Yorùbá", beta: true },
  ha: { label: "Hausa", native: "Hausa", beta: true },
  ig: { label: "Igbo", native: "Igbo", beta: true },
} as const;

export const LanguageSchema = z.enum(["en", "pcm", "yo", "ha", "ig"]);
export type Language = z.infer<typeof LanguageSchema>;

export const AnalyzeModeSchema = z.enum(["full", "llm_only"]);
export type AnalyzeMode = z.infer<typeof AnalyzeModeSchema>;

export const InputKindSchema = z.enum(["text", "url", "image", "audio"]);
export type InputKind = z.infer<typeof InputKindSchema>;

export const MAX_TEXT_CHARS = 5000;

export const AnalyzeRequestSchema = z.object({
  text: z.string().trim().min(1, "Paste a message or link to check.").max(MAX_TEXT_CHARS),
  language: LanguageSchema.default("en"),
  mode: AnalyzeModeSchema.default("full"),
});
export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;

export const RiskLevelSchema = z.enum(["likely_safe", "suspicious", "likely_scam"]);
export type RiskLevel = z.infer<typeof RiskLevelSchema>;

export const ConfidenceSchema = z.enum(["low", "medium", "high"]);

/** A character range inside the normalized input text. */
export const SpanSchema = z.object({
  text: z.string(),
  start: z.number().int().nonnegative(),
  end: z.number().int().nonnegative(),
});

/** Deterministic, rule-based finding (no LLM). */
export const SignalSchema = z.object({
  type: z.string(), // e.g. "url.lookalike", "request.otp", "urgency"
  label: z.string(),
  weight: z.number(), // contribution to the score, documented in score.ts
  span: SpanSchema.optional(),
});
export type Signal = z.infer<typeof SignalSchema>;

export const RedFlagSchema = z.object({
  quote: z.string(), // must be a verbatim substring of the input
  why: z.string(),
  span: SpanSchema.optional(),
});
export type RedFlag = z.infer<typeof RedFlagSchema>;

export const PipelineStageSchema = z.object({
  stage: z.enum(["ingest", "signals", "retrieve", "reason", "score", "localize"]),
  status: z.enum(["ok", "skipped", "failed"]),
  ms: z.number().nonnegative(),
  note: z.string().optional(),
});
export type PipelineStage = z.infer<typeof PipelineStageSchema>;

export const VerdictSchema = z.object({
  risk_level: RiskLevelSchema,
  risk_score: z.number().int().min(0).max(100),
  confidence: ConfidenceSchema,
  scam_type: z.string(), // taxonomy id, e.g. "fake_bank_alert"
  scam_type_label: z.string(),
  red_flags: z.array(RedFlagSchema),
  explanation: z.string(),
  next_steps: z.array(z.string()).min(1).max(6),
  uncertainty_notes: z.array(z.string()),
  signals: z.array(SignalSchema),
  matched_patterns: z.array(z.object({ id: z.string(), title: z.string(), similarity: z.number() })),
  language: LanguageSchema,
  mode: AnalyzeModeSchema,
  input: z.object({ kind: InputKindSchema, text: z.string() }),
  pipeline: z.array(PipelineStageSchema),
  /** True while a stage is a placeholder; the UI must say so. */
  stub: z.boolean(),
});
export type Verdict = z.infer<typeof VerdictSchema>;

export const ApiErrorSchema = z.object({ error: z.string() });
export type ApiError = z.infer<typeof ApiErrorSchema>;
