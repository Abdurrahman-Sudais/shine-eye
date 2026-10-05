import "server-only";
import { embed, isLlmConfigured, models } from "@/lib/llm";
import { PATTERNS, patternDocument, type Pattern } from "@/lib/patterns";
import embeddingsFile from "@/data/pattern-embeddings.json";

/**
 * Stage 3: retrieve the scam patterns most similar to the input.
 * Primary: cosine similarity over precomputed embeddings (scripts/embed-patterns.ts).
 * Fallback: lexical overlap, so retrieval still works if the embedding call fails
 * or the precomputed file is stale.
 */

export interface Match {
  pattern: Pattern;
  similarity: number; // 0..1
}

export interface RetrievalResult {
  matches: Match[];
  method: "embedding" | "lexical";
  note?: string;
}

interface EmbeddingsFile {
  model: string;
  dim: number;
  vectors: Record<string, number[]>;
}

const precomputed = embeddingsFile as EmbeddingsFile;
const TOP_K = 4;

function dot(a: number[], b: number[]) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

function hasFreshEmbeddings(): boolean {
  return precomputed.model === models.embed && PATTERNS.every((p) => precomputed.vectors[p.id]?.length === precomputed.dim);
}

// --- lexical fallback --------------------------------------------------------

const STOP = new Set("the a an and or to of in on for is are you your we our it this that be with from at by as i me my am na dey go wey".split(" "));

function tokens(text: string): string[] {
  return text.toLowerCase().normalize("NFKC").match(/[\p{L}\p{N}]+/gu)?.filter((t) => t.length > 2 && !STOP.has(t)) ?? [];
}

const docTokens = new Map(PATTERNS.map((p) => [p.id, new Set(tokens(patternDocument(p)))]));
const docFreq = new Map<string, number>();
for (const set of docTokens.values()) for (const t of set) docFreq.set(t, (docFreq.get(t) ?? 0) + 1);

export function lexicalMatches(text: string, k = TOP_K): Match[] {
  const q = new Set(tokens(text));
  if (q.size === 0) return [];
  const n = PATTERNS.length;
  const idf = (t: string) => Math.log(1 + n / (docFreq.get(t) ?? n));
  const qWeight = [...q].reduce((s, t) => s + idf(t), 0);
  return PATTERNS.map((pattern) => {
    const doc = docTokens.get(pattern.id)!;
    const hit = [...q].reduce((s, t) => s + (doc.has(t) ? idf(t) : 0), 0);
    return { pattern, similarity: qWeight ? hit / qWeight : 0 };
  })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, k)
    .filter((m) => m.similarity > 0.05);
}

// --- main --------------------------------------------------------------------

export async function retrievePatterns(text: string, k = TOP_K): Promise<RetrievalResult> {
  if (isLlmConfigured() && hasFreshEmbeddings()) {
    try {
      const [q] = await embed([text], "RETRIEVAL_QUERY");
      const matches = PATTERNS.map((pattern) => ({ pattern, similarity: dot(q, precomputed.vectors[pattern.id]) }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, k);
      return { matches, method: "embedding" };
    } catch (err) {
      return { matches: lexicalMatches(text, k), method: "lexical", note: `embedding failed (${(err as Error).name})` };
    }
  }
  return {
    matches: lexicalMatches(text, k),
    method: "lexical",
    note: isLlmConfigured() ? "pattern embeddings missing or stale" : "no API key",
  };
}
