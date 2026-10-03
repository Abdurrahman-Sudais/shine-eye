import "server-only";
import type { z } from "zod";

/**
 * Provider abstraction. Pipeline stages call these four functions and never
 * import a provider SDK directly, so models can be swapped via env vars.
 *
 * Tonight these are stubs. Planned wiring:
 * - generateStructured / describeImage → Anthropic (LLM_MODEL, LLM_MODEL_CHEAP)
 * - transcribe / embed                  → Gemini (GEMINI_API_KEY)
 */

export type ModelTier = "main" | "cheap";

export interface StructuredRequest<T extends z.ZodType> {
  system: string;
  prompt: string;
  schema: T;
  tier?: ModelTier;
  images?: { mediaType: string; base64: string }[];
}

export class LlmNotConfiguredError extends Error {
  constructor(what: string) {
    super(`${what} is not configured yet`);
    this.name = "LlmNotConfiguredError";
  }
}

export const models = {
  main: process.env.LLM_MODEL ?? "claude-sonnet-5-5",
  cheap: process.env.LLM_MODEL_CHEAP ?? "claude-haiku-4-5",
} as const;

export async function generateStructured<T extends z.ZodType>(
  req: StructuredRequest<T>,
): Promise<z.infer<T>> {
  void req;
  throw new LlmNotConfiguredError("generateStructured");
}

export async function describeImage(image: { mediaType: string; base64: string }): Promise<string> {
  void image;
  throw new LlmNotConfiguredError("describeImage");
}

export async function transcribe(audio: { mediaType: string; base64: string }): Promise<string> {
  void audio;
  throw new LlmNotConfiguredError("transcribe");
}

export async function embed(texts: string[]): Promise<number[][]> {
  void texts;
  throw new LlmNotConfiguredError("embed");
}
