"use client";

import { useState } from "react";
import { ResultCard } from "@/components/result-card";
import { SAMPLES } from "@/lib/samples";
import { LANGUAGES, MAX_TEXT_CHARS, type Language, type Verdict } from "@/lib/schema";

type Status = { kind: "idle" } | { kind: "loading" } | { kind: "error"; message: string };

export function CheckForm() {
  const [text, setText] = useState("");
  const [language, setLanguage] = useState<Language>("en");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [verdict, setVerdict] = useState<Verdict | null>(null);

  async function check(input: string) {
    if (!input.trim()) return;
    setStatus({ kind: "loading" });
    setVerdict(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input, language }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setVerdict(data as Verdict);
      setStatus({ kind: "idle" });
    } catch (err) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : "Network error. Check your connection.",
      });
    }
  }

  const loading = status.kind === "loading";

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="text-sm font-medium text-muted">Explain the result in</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {(Object.keys(LANGUAGES) as Language[]).map((code) => {
            const lang = LANGUAGES[code];
            const selected = code === language;
            return (
              <button
                key={code}
                type="button"
                aria-pressed={selected}
                onClick={() => setLanguage(code)}
                className={`min-h-11 rounded-full border px-4 text-sm font-medium transition-colors ${
                  selected
                    ? "border-brand bg-brand text-brand-fg"
                    : "border-border bg-surface hover:border-brand"
                }`}
              >
                {lang.native}
                {lang.beta && <span className="ml-1 text-xs opacity-70">beta</span>}
              </button>
            );
          })}
        </div>
      </fieldset>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          check(text);
        }}
        className="rounded-3xl border border-border bg-surface p-3 shadow-sm focus-within:border-brand"
      >
        <label htmlFor="input" className="sr-only">
          Message or link to check
        </label>
        <textarea
          id="input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={MAX_TEXT_CHARS}
          rows={5}
          placeholder="Paste the message or link you received, e.g. “Your account don block, click this link to update your BVN…”"
          className="w-full resize-y bg-transparent p-2 text-base leading-7 outline-none placeholder:text-muted"
        />
        <div className="flex items-center justify-between gap-3 px-2 pb-1">
          <span className="text-xs text-muted tabular-nums">
            {text.length}/{MAX_TEXT_CHARS}
          </span>
          <button
            type="submit"
            disabled={loading || !text.trim()}
            className="min-h-11 rounded-full bg-brand px-6 font-semibold text-brand-fg transition-opacity disabled:opacity-40"
          >
            {loading ? "Checking…" : "Check it"}
          </button>
        </div>
      </form>

      <div>
        <p className="text-sm font-medium text-muted">Try an example</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {SAMPLES.map((s) => (
            <button
              key={s.id}
              type="button"
              disabled={loading}
              onClick={() => {
                setText(s.text);
                check(s.text);
              }}
              className="min-h-11 rounded-full border border-dashed border-border px-4 text-sm hover:border-brand disabled:opacity-40"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {status.kind === "error" && (
        <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
          {status.message}
        </p>
      )}

      {verdict && <ResultCard verdict={verdict} />}
    </div>
  );
}
