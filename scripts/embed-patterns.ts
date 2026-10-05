/**
 * Precompute embeddings for data/patterns.json → data/pattern-embeddings.json.
 * Run after editing patterns:  npm run embed:patterns
 */
import { writeFileSync } from "node:fs";
import { EMBED_DIM, embed, models } from "@/lib/llm";
import { PATTERNS, patternDocument } from "@/lib/patterns";

const BATCH = 20;

async function main() {
  const vectors: Record<string, number[]> = {};
  for (let i = 0; i < PATTERNS.length; i += BATCH) {
    const batch = PATTERNS.slice(i, i + BATCH);
    const out = await embed(batch.map(patternDocument), "RETRIEVAL_DOCUMENT");
    if (out.length !== batch.length) throw new Error(`Expected ${batch.length} vectors, got ${out.length}`);
    batch.forEach((p, j) => (vectors[p.id] = out[j].map((x) => Math.round(x * 1e5) / 1e5)));
    console.log(`embedded ${Math.min(i + BATCH, PATTERNS.length)}/${PATTERNS.length}`);
  }
  const dim = Object.values(vectors)[0]?.length ?? 0;
  if (dim !== EMBED_DIM) console.warn(`Note: got ${dim}-dim vectors (requested ${EMBED_DIM}).`);
  writeFileSync("data/pattern-embeddings.json", JSON.stringify({ model: models.embed, dim, vectors }));
  console.log(`wrote data/pattern-embeddings.json (${models.embed}, ${dim} dims)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
