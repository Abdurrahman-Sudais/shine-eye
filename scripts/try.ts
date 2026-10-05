/**
 * Run text through the real pipeline from the terminal.
 *   npm run try -- "message text" [--lang=pcm] [--mode=llm_only] [--json]
 * With no text, runs the built-in samples.
 */
import { analyze } from "@/lib/pipeline";
import { SAMPLES } from "@/lib/samples";
import { AnalyzeRequestSchema, type Verdict } from "@/lib/schema";

const args = process.argv.slice(2);
const flag = (name: string) => args.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
const json = args.includes("--json");
const texts = args.filter((a) => !a.startsWith("--"));
const inputs = texts.length ? texts : SAMPLES.map((s) => s.text);

function print(v: Verdict) {
  console.log(`\n${"─".repeat(70)}\n${v.input.text.slice(0, 120)}${v.input.text.length > 120 ? "…" : ""}`);
  console.log(`→ ${v.risk_level.toUpperCase()} ${v.risk_score}/100 · ${v.scam_type_label} · ${v.confidence} confidence`);
  console.log(`  pipeline: ${v.pipeline.map((p) => `${p.stage}:${p.status}${p.note ? `(${p.note})` : ""} ${p.ms}ms`).join(" · ")}`);
  if (v.matched_patterns.length) console.log(`  patterns: ${v.matched_patterns.map((m) => `${m.id} ${m.similarity}`).join(", ")}`);
  console.log(`  ${v.explanation}`);
  for (const f of v.red_flags) console.log(`  ⚑ "${f.quote}": ${f.why}`);
  for (const s of v.next_steps) console.log(`  → ${s}`);
  for (const n of v.uncertainty_notes) console.log(`  ? ${n}`);
}

(async () => {
  for (const text of inputs) {
    const req = AnalyzeRequestSchema.parse({ text, language: flag("lang") ?? "en", mode: flag("mode") ?? "full" });
    const v = await analyze(req);
    if (json) console.log(JSON.stringify(v, null, 2));
    else print(v);
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
