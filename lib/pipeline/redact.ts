/**
 * Masks personal numbers before text leaves our server (LLM calls) or is stored
 * (community reports). Placeholders keep the meaning ("asks you to pay into an
 * account") without the identifying digits.
 */

const RULES: { placeholder: string; pattern: RegExp }[] = [
  { placeholder: "[EMAIL]", pattern: /[\w.+-]+@[\w-]+\.[\w.-]+/g },
  { placeholder: "[CARD_NUMBER]", pattern: /(?<!\d)(?:\d[ -]?){15,18}\d(?!\d)/g },
  { placeholder: "[PHONE]", pattern: /(?<![\d+])(?:\+?234|0)[789][01]\d{8}(?!\d)/g },
  { placeholder: "[ACCOUNT_NUMBER]", pattern: /(?<![\d+])\d{10}(?!\d)/g },
];

export const PLACEHOLDERS = RULES.map((r) => r.placeholder);

export function redact(text: string): string {
  return RULES.reduce((t, r) => t.replace(r.pattern, r.placeholder), text);
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Find where a model's quote (taken from redacted text) occurs in the original.
 * Placeholders match any digits/characters they could have replaced; whitespace
 * and case are forgiven. Returns null if the quote isn't really in the input.
 */
export function locateQuote(original: string, quote: string): { start: number; end: number } | null {
  const q = quote.trim().replace(/^["“'‘]+|["”'’]+$/g, "").trim();
  if (q.length < 3) return null;

  let source = escapeRe(q).replace(/\s+/g, "\\s+");
  for (const r of RULES) source = source.split(escapeRe(r.placeholder)).join(`(?:${r.pattern.source})`);

  const m = new RegExp(source, "iu").exec(original);
  return m ? { start: m.index, end: m.index + m[0].length } : null;
}
