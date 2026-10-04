import type { Signal } from "@/lib/schema";

type Severity = "high" | "medium" | "good";

interface Range {
  start: number;
  end: number;
  severity: Severity;
  labels: string[];
}

const RANK: Record<Severity, number> = { good: 0, medium: 1, high: 2 };

const MARK_CLASS: Record<Severity, string> = {
  high: "bg-danger-soft text-danger decoration-danger",
  medium: "bg-warn-soft text-warn decoration-warn",
  good: "bg-safe-soft text-safe decoration-safe",
};

function severityOf(weight: number): Severity | null {
  if (weight < 0) return "good";
  if (weight >= 25) return "high";
  if (weight > 0) return "medium";
  return null; // informational: not highlighted
}

/** Merge overlapping spans; the most severe wins and labels accumulate. */
function toRanges(signals: Signal[]): Range[] {
  const raw = signals
    .flatMap((s) => {
      const severity = severityOf(s.weight);
      return s.span && severity ? [{ start: s.span.start, end: s.span.end, severity, labels: [s.label] }] : [];
    })
    .sort((a, b) => a.start - b.start);

  const merged: Range[] = [];
  for (const r of raw) {
    const last = merged.at(-1);
    if (last && r.start < last.end) {
      last.end = Math.max(last.end, r.end);
      if (RANK[r.severity] > RANK[last.severity]) last.severity = r.severity;
      last.labels.push(...r.labels);
    } else {
      merged.push({ ...r, labels: [...r.labels] });
    }
  }
  return merged;
}

export function HighlightedText({ text, signals }: { text: string; signals: Signal[] }) {
  const ranges = toRanges(signals);
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  ranges.forEach((r, i) => {
    if (r.start > cursor) parts.push(text.slice(cursor, r.start));
    parts.push(
      <mark
        key={i}
        title={r.labels.join(" · ")}
        className={`rounded px-0.5 underline decoration-2 underline-offset-4 ${MARK_CLASS[r.severity]}`}
      >
        {text.slice(r.start, r.end)}
      </mark>,
    );
    cursor = r.end;
  });
  if (cursor < text.length) parts.push(text.slice(cursor));

  return <p className="whitespace-pre-wrap break-words text-base leading-8">{parts}</p>;
}
