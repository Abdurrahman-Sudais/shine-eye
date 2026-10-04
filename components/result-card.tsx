import { HighlightedText } from "@/components/highlighted-text";
import type { RiskLevel, Verdict } from "@/lib/schema";

const RISK_STYLES: Record<RiskLevel, { label: string; text: string; soft: string; bar: string }> = {
  likely_safe: { label: "Likely safe", text: "text-safe", soft: "bg-safe-soft", bar: "bg-safe" },
  suspicious: { label: "Suspicious", text: "text-warn", soft: "bg-warn-soft", bar: "bg-warn" },
  likely_scam: { label: "Likely scam", text: "text-danger", soft: "bg-danger-soft", bar: "bg-danger" },
};

export function ResultCard({ verdict }: { verdict: Verdict }) {
  const risk = RISK_STYLES[verdict.risk_level];
  // One line per distinct finding; informational (weight 0) signals stay out of the list.
  const findings = verdict.signals
    .filter((s) => s.weight !== 0)
    .filter((s, i, all) => all.findIndex((o) => o.label === s.label) === i);

  return (
    <section
      aria-live="polite"
      className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm"
    >
      {verdict.stub && (
        <p className="border-b border-border bg-warn-soft px-5 py-2 text-sm font-medium text-warn">
          Placeholder verdict: the AI step isn&apos;t connected yet. Rule-based findings are real.
        </p>
      )}

      <header className={`${risk.soft} px-5 py-5`}>
        <div className="flex items-baseline justify-between gap-4">
          <h2 className={`text-2xl font-semibold ${risk.text}`}>{risk.label}</h2>
          <p className={`text-3xl font-semibold tabular-nums ${risk.text}`}>
            {verdict.risk_score}
            <span className="text-base font-medium opacity-70">/100</span>
          </p>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface/70">
          <div className={`h-full ${risk.bar}`} style={{ width: `${verdict.risk_score}%` }} />
        </div>
        <p className="mt-3 text-sm text-muted">
          {verdict.scam_type_label} · {verdict.confidence} confidence
        </p>
      </header>

      <div className="space-y-6 px-5 py-6">
        <p className="text-base leading-7">{verdict.explanation}</p>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">Your message</h3>
          <div className="mt-2 rounded-2xl border border-border px-4 py-3">
            <HighlightedText text={verdict.input.text} signals={verdict.signals} />
          </div>
        </div>

        {findings.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
              What our checks found
            </h3>
            <ul className="mt-2 space-y-2">
              {findings.map((s) => (
                <li key={s.label} className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${
                      s.weight < 0 ? "bg-safe" : s.weight >= 25 ? "bg-danger" : "bg-warn"
                    }`}
                  />
                  <span className="leading-7">{s.label}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {verdict.red_flags.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">Red flags</h3>
            <ul className="mt-2 space-y-2">
              {verdict.red_flags.map((flag, i) => (
                <li key={i} className="rounded-xl bg-danger-soft px-4 py-3">
                  <q className="font-medium">{flag.quote}</q>
                  <p className="mt-1 text-sm text-muted">{flag.why}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">What to do</h3>
          <ol className="mt-2 list-decimal space-y-2 pl-5">
            {verdict.next_steps.map((step, i) => (
              <li key={i} className="leading-7">
                {step}
              </li>
            ))}
          </ol>
        </div>

        {verdict.uncertainty_notes.length > 0 && (
          <p className="text-sm text-muted">{verdict.uncertainty_notes.join(" ")}</p>
        )}
      </div>
    </section>
  );
}
