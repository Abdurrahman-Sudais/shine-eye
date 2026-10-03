# ShineEye (formerly Scam Shield) — PRD & Builder Brief (ForgeHacks 2026)

> **Read this entire file before writing any code.** It is the single source of truth for what we're building, why, for whom, and how we'll be judged. Everything below was decided in a planning session between the builder (Abdurrahman Sudais) and Claude (chat). Your job now is to be the engineering partner who turns this into a shipped, polished, winning hackathon project in ~6 days.

---

## 0. How to work with me (instructions for Claude Code)

- **First action:** read this file, then reply with (a) a 10-line summary of your understanding, (b) the answers to / questions about the "Open decisions" in section 14, and (c) a proposed build order. Do NOT scaffold until I confirm.
- **Create a `CLAUDE.md`** in the repo root distilling this file into the rules you need every session (stack, conventions, scope boundaries, definition of done). Keep it short; link back to `PRD.md`.
- **Optimize for a working, demo-able end-to-end product over breadth.** A polished core flow beats ten half-built features. Cut scope aggressively when time is tight.
- **Work in small vertical slices.** Each slice should run end-to-end (UI → API → AI → result) and be committed with a clear message. Never leave the app broken at the end of a session.
- **Ask before big decisions** (new dependency, new paid API, schema change). For small things, decide and tell me.
- **Be honest about uncertainty** in code and in the product (see section 8, "Trust & honesty"). Don't fake results. Don't hardcode demo answers except clearly-labelled sample data.
- **Keep my dev machine in mind:** it is modest. Use hosted APIs for AI. No local model inference, no heavy Docker setups.
- Explain non-obvious choices briefly. I'm comfortable with TypeScript and Next.js but strongest in Flutter/Dart and Python, so briefly explain non-obvious Next.js, Tailwind, and Supabase choices. Skip general programming basics.

---

## 1. The hackathon (what we're competing in)

**ForgeHacks 2026** — first-edition, fully online AI hackathon for students worldwide, run by a student-led team. Devpost: https://forgehacks-2026.devpost.com · Site: https://www.forgehacks.dev · ~1,000+ participants.

- **Dates:** Oct 3 → Oct 10, 2026. **Submission deadline: Oct 10, 2026, 12:00 PM EDT** (Devpost) = **5:00 PM Lagos time (WAT)**. The main site says "12:00 PM" without a timezone, so treat the earlier reading as risky. **Our internal target: submit by the night of Fri Oct 9** and use Oct 10 morning only as buffer.
- **Judging weekend:** Oct 10–11, public Audience Favorite vote on Devpost. Winners announced Oct 12.
- **Team:** up to 4 students (solo allowed). Students only.
- **Our track: AI + Cybersecurity.**
  - Official prompt (paraphrased): *Build an AI-powered solution that helps people recognize, prevent, verify, or respond to scams, impersonation, and fraud enabled by AI or modern technologies.*
  - Track prize: highest-scoring project in the track that is NOT in the overall top 3 gets $100 cash + 6 months Agentboxd Team plan + certificate + site/social recognition. Top-3 overall (1st/2nd/3rd) is where the real prizes are, so we aim for a top-3 overall finish and treat the track prize as the floor.

### Judging criteria (design every decision around these)
1. **Real-World Impact & Relevance** — genuine problem, potential for actual use, and it must clearly answer the track prompt.
2. **Technical Implementation & AI Use** — quality and depth of the AI components, correctness, thoughtful integration. **Explicitly: "not just a wrapper."** A thin "paste text into an LLM" app will score poorly here.
3. **Innovation & Creativity** — originality, fresh combination of tech.
4. **Execution & Completeness** — working demo, polish, usability, and *how much was actually shipped during the hackathon*.
5. **Presentation & Communication** — clarity of the demo video, README, and written description.

### Submission requirements (incomplete submissions are NOT judged)
1. Project title + short description (problem + solution)
2. Track selection: AI + Cybersecurity
3. **Public demo video, 2–4 minutes max**, hosted online (e.g. YouTube), showing the problem, how it works
4. **GitHub repo** with source code and a **clear README**
5. Written description: problem statement & target users, technical approach & components, real-world impact
6. Screenshots, architecture diagram, or a **live deployment link** for testing

### Rules/constraints to respect
- Everything substantive must be built during the hackathon window (Oct 3–10). Start the repo fresh. Do not reuse code from older projects.
- The project must clearly use AI/ML (models, APIs, agents, vision, NLP, etc.).
- Check https://forgehacks-2026.devpost.com/rules if any doubt arises about open-source libraries or third-party APIs (using standard libraries and APIs is normal; the logic and product must be ours).

### Participation perks we can use (redeemed via the ForgeHacks Discord)
Featherless.ai ($25 credits, 30k+ open-source models via an OpenAI-compatible API), Adaption Labs ($500 platform credits), Momen ($100), n8n Cloud Pro (1 mo), Agentboxd (30 days Builder plan: AI-agent email inboxes + prompt-injection/phishing checks on incoming email), YouCam API ($27.50, image APIs), Kariaa ($40), ProjectAAL ($5), DevSwarm Pro (1 mo). **None are required.** Use only what genuinely helps. A sponsor integration is a nice bonus only if it's natural (e.g. Agentboxd for an email-scam angle), never forced.

---

## 2. The builder

**Abdurrahman Sudais** (GitHub: [Abdurrahman-Sudais](https://github.com/Abdurrahman-Sudais)) — 300-level Computer Engineering student at the University of Ilorin, Nigeria, building across mobile, web, blockchain, and AI.

- **Home base:** Flutter/Dart. Also uses Python, JavaScript, TypeScript, Next.js, React, FastAPI, Node.js, Firebase, Vercel, and Railway.
- **Relevant experience:** LLM-API tools, RAG (a PDF-summary feature in a GDG hackathon project), text-to-speech, and a production Telegram bot.
- **Teaching:** teaches AI and Python to teenagers at Intelligeeks Africa.
- **Working style for Claude:** treat as comfortable with TypeScript/Next.js but strongest in Flutter and Python; briefly explain non-obvious Next.js/Tailwind/Supabase choices. Knows Firebase better than Supabase. Modest dev machine: hosted APIs only, no local inference or heavy Docker.
- **Team:** solo.

Polish and design quality are still a competitive advantage we should lean into.

---

## 3. The product

**Name: ShineEye** — from the Pidgin "shine your eye" (stay alert). Formerly "Scam Shield". Hosted on a free Vercel subdomain.

**One-liner:** Paste, upload, or forward anything suspicious — a message, a link, a screenshot, a voice note — and ShineEye tells you in plain language (English, Pidgin, Yoruba, Hausa, Igbo) whether it's a scam, exactly why, and what to do next.

### The problem (Nigerian context — this is our edge)
Fraud and impersonation are everyday life for Nigerians: fake bank "credit alerts" and fake transfer screenshots, phishing SMS and WhatsApp links that spoof banks/telcos/government, fake job and scholarship offers, investment/"double your money" and crypto schemes, romance and impersonation scams, "I'm your relative/boss, send airtime/money" messages, fake delivery/customs fees, loan-app threats, OTP/BVN/PIN theft, and increasingly **AI-enabled** scams (voice clones, deepfake videos, AI-written phishing that has no spelling mistakes anymore). Most existing scam detectors are English-only, tied to US/EU patterns, and don't understand local context (Nigerian banks, USSD codes, NIN/BVN, naira, Pidgin). Many victims are not tech-savvy and read mostly in Pidgin or their mother tongue. Scams spread over WhatsApp, SMS, Telegram and Instagram — channels where there is no spam filter.

### Target users
1. **Everyday people / students / small business owners** who receive a suspicious message and want a fast second opinion. (Primary)
2. **Parents and older relatives** — they need results in simple language and their mother tongue.
3. **Online sellers/merchants** who get "payment sent" screenshots and need to know if it's safe to release goods.

### Why we win (our thesis)
- **Hyper-local + multilingual.** Nigeria-specific scam taxonomy and signal rules; explanations in English/Pidgin/Yoruba/Hausa/Igbo with the option to read them aloud (text-to-speech if feasible).
- **Multi-modal.** Text, URLs, screenshots (vision), and voice notes (transcription). Scam voice notes and image-based scams are where text-only tools fail.
- **A real pipeline, not a wrapper.** Deterministic signal extraction + retrieval over a scam-pattern knowledge base + LLM reasoning + calibrated scoring + an evaluation harness with measured accuracy. (See section 6.)
- **A community loop.** Users can report scams; reports are anonymized, clustered, and surfaced as a "Trending scams near you" feed, so each check makes the system smarter and gives the demo a living, real-time feel.
- **Responsible by design.** It says "I can't be sure" when it can't, never claims certainty, minimizes data stored, and gives concrete next steps (who to report to, what to do if you've already clicked or sent money).

---

## 4. Scope

### MVP (must ship by end of Day 4 — everything else is a bonus)
1. **Check screen** (mobile-first web app): one input area that accepts pasted text, a URL, an uploaded image/screenshot, or a recorded/uploaded voice note. Language selector for the explanation.
2. **Analysis pipeline** (section 6) returning a structured verdict: risk level (Likely safe / Suspicious / Likely scam), a 0–100 risk score, scam type, specific red flags *quoted from the user's own input*, a plain-language explanation in the chosen language, and 3–5 concrete next steps.
3. **URL analysis**: parse the domain, detect lookalike/typosquat of known Nigerian and global brands (banks, telcos, fintechs, government), URL shorteners, suspicious TLDs, and optionally check against Google Safe Browsing / URLhaus.
4. **Result screen** designed to be screenshot-friendly and shareable ("Warn a friend" generates a clean share card/text).
5. **Report a scam** button on every result, which stores an anonymized report.
6. **Trending scams feed**: a page showing recently reported/clustered scam patterns.
7. **Evaluation harness**: a labelled dataset of ≥60 realistic examples (scam and legitimate, Nigerian context, mix of languages) and a script that runs the pipeline and prints accuracy/precision/recall. **We will cite these real numbers in the README and demo.**
8. Deployed live (Vercel + Supabase) with a public URL.

### Stretch (only after MVP is solid, in this order)
1. Read-aloud (TTS) of the result in the chosen language.
2. "Fake transfer alert" mode: merchant uploads a bank alert screenshot; vision + heuristics flag inconsistencies and show a "don't release goods until you confirm in your banking app" checklist. **Be explicit that this is heuristic and cannot confirm a real payment.**
3. Telegram bot (easy) or WhatsApp bot (hard; requires Business API approval, so do NOT depend on it) that forwards messages into the same pipeline.
4. Browser-extension or PWA "Share to ShineEye" target.
5. Impersonation/"safe word" helper for families against voice-clone calls.

### Explicitly out of scope
User accounts/auth (anonymous use is a feature), payments, native mobile apps, training custom models from scratch, scraping private data, anything that stores users' raw messages by default.

---

## 5. Key user flows

**Flow A — Check something suspicious (the demo hero flow)**
1. User opens the app, picks a language, pastes a message (or uploads a screenshot / records a voice note).
2. App shows a progress state that reveals the pipeline steps ("Reading message → Checking link → Matching known scams → Explaining") so judges *see* it isn't a thin wrapper.
3. Result card: verdict color + score, scam type, red flags highlighted inside the original text, explanation, next steps, "Warn a friend" and "Report this scam".

**Flow B — Already fell for it**
A clear "I already clicked / I already sent money" path that gives urgent, calm, step-by-step guidance (call your bank's official line, freeze card, change passwords, report to relevant Nigerian bodies, keep evidence). Keep guidance general and accurate; don't invent phone numbers. Link to official channels only if you are certain they are correct, otherwise tell users to use the number on the back of their card or the bank's official app/website.

**Flow C — Community**
User taps "Report" → anonymized report saved → clustered into a pattern → appears in the Trending feed.

---

## 6. AI & technical approach (the part judges will scrutinize)

### Pipeline (each stage is a separate, testable module)
1. **Ingest & normalize.** Text passes through as-is. Image → OCR/vision extraction of text + visual cues (logos, layout, tampering hints). Audio → speech-to-text transcript. Detect language (English/Pidgin/Yoruba/Hausa/Igbo/other).
2. **Deterministic signal extraction (no LLM).** Regex/rule layer for: URLs and domains (typosquat/edit-distance vs a curated brand list, homoglyphs, punycode, shorteners, suspicious TLDs, domain-age via RDAP if available), phone numbers and USSD codes, account numbers, requests for OTP/BVN/NIN/PIN/password, urgency/threat language, money/advance-fee patterns, "click here / verify now" patterns, impersonated-institution mentions. Output a typed list of signals with the exact matching text spans.
3. **Retrieval over a scam-pattern knowledge base.** A curated set (aim for 40–80 entries) of Nigerian and global scam archetypes, each with description, example phrasing, red flags, and recommended action. Embed them (pgvector in Supabase, or an in-memory embedding index if simpler) and retrieve the top-k most similar to the input. This grounds the LLM and makes results consistent. Include community-reported items as they accrue.
4. **LLM reasoning (structured output).** Give the LLM the input, the extracted signals, and the retrieved patterns. Require a strict JSON schema: `{scam_type, risk_level, confidence, red_flags[{quote, why}], explanation, next_steps[], uncertainty_notes}`. Validate with Zod; retry/repair on invalid output. Be careful with prompt injection: the user's content is untrusted data and may contain instructions to the model. Wrap it in clear delimiters and instruct the model to treat it purely as data to analyze.
5. **Score calibration.** Combine deterministic signal weights with the LLM's judgement into a final 0–100 score and risk bucket. Keep the formula simple and documented. Prefer false-positive-safe wording ("Suspicious, verify before acting") over overconfident "100% scam."
6. **Localized explanation.** Produce the explanation and steps in the user's selected language. Write natural Nigerian Pidgin, not exaggerated caricature. Have a quick QA pass on Yoruba/Hausa/Igbo output and flag in the README that translations are AI-generated and should be reviewed by native speakers.
7. **Community loop.** Anonymize and store reports (strip phone numbers/account numbers/names), embed, and cluster by similarity to power the Trending feed.

### Model/provider strategy
- Build a thin **provider abstraction** (single `llm.ts` with `generateStructured()`, `describeImage()`, `transcribe()`) so we can swap providers via env vars. Default to the best available hosted model for structured JSON + vision. Featherless credits (OpenAI-compatible, many open models) are available as a budget option for cheaper steps like language detection or clustering.
- Transcription: pick a hosted speech-to-text API (decide in section 14). If it proves flaky, degrade gracefully ("Voice notes coming soon") rather than breaking the demo.
- All keys in `.env.local`, never committed. Provide `.env.example`.
- Add basic rate limiting and input size limits so a public deployment can't burn our credits.

### Evaluation (our credibility weapon)
- `eval/dataset.json`: ≥60 labelled items: ~35 scams (varied types, channels, languages) and ~25 legitimate messages (real-looking bank alerts, OTP notices, delivery updates, normal chats) to measure false positives.
- `eval/run.ts`: runs the full pipeline and prints accuracy, precision, recall, per-scam-type breakdown, and a confusion matrix. Save results to `eval/results.md` and cite in README + video. Also compare "LLM only" vs "full pipeline" to *prove* the pipeline adds value (this directly answers the "not just a wrapper" criterion).
- Never tune on the same examples we report on without noting it. Keep a small held-out slice.

---

## 7. Suggested stack

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS, mobile-first, PWA-ready. Optional: Framer Motion for the pipeline-progress animation. Accessible, high-contrast, large tap targets (many users are on low-end phones and slow networks).
- **Backend:** Next.js route handlers (server-side only for AI keys). Zod for validation.
- **Data:** Supabase (Postgres + pgvector for scam-pattern retrieval + storage for temp uploads, which are deleted after analysis).
- **AI:** provider-abstracted hosted LLM (structured JSON + vision), hosted STT, embeddings for retrieval.
- **Hosting:** Vercel (frontend/API) + Supabase. Must have a public URL.
- **Tooling:** pnpm or npm, ESLint, Prettier, Vitest (for the eval/unit tests of the signal extractor), GitHub Actions optional.

If you believe a different choice is clearly better for the 6-day window, propose it with a one-line reason before switching.

### Suggested structure
```
/app                # Next.js routes: /, /check, /result/[id], /trending, /about
/app/api            # analyze, report, trending
/lib/pipeline       # ingest.ts, signals.ts, retrieve.ts, reason.ts, score.ts, localize.ts
/lib/llm.ts         # provider abstraction
/lib/brands.ts      # curated brand/domain list (Nigerian banks, telcos, fintechs, gov, global)
/data/patterns.json # scam-pattern knowledge base seed
/eval               # dataset.json, run.ts, results.md
/docs               # architecture diagram, demo script, screenshots
```

### Data (keep it minimal)
- `scam_patterns` (id, title, description, examples, red_flags, action, embedding)
- `reports` (id, anonymized_text, scam_type, language, channel, embedding, cluster_id, created_at)
- `clusters` (id, label, count, last_seen)
- Do not store raw user checks by default. If we keep anything for analytics, store only non-identifying metadata (scam type, language, score bucket).

---

## 8. Trust, safety & honesty (also a scoring opportunity)

- Always present results as **guidance, not guarantees.** Show confidence and an "I could not verify X" note when relevant.
- **Privacy by default:** no accounts, no raw-message storage, uploads auto-deleted, anonymization on reports, clear privacy note in the UI and README.
- **Don't help scammers.** The product detects and explains; it must not generate scam messages or evade detection advice. Evaluation examples of scams are for testing only.
- **Prompt-injection safe:** the content we analyze is hostile by nature. Treat as data, never as instructions.
- Acknowledge limitations plainly in the README (heuristic screenshot analysis, AI-generated translations, can't verify real payments).

---

## 9. UX & design direction

- Calm, trustworthy, modern. It should feel like a security product people would actually trust on their phone, not a hackathon prototype. Strong visual hierarchy for the verdict (color + icon + score), generous spacing, readable type, dark/light support.
- The **result card** and the **pipeline-progress** view are the two hero visuals; spend design effort there.
- Language selector prominent on first screen. Copy should be short, human, and non-alarmist. Use Nigerian-relevant examples in placeholders and the "Try an example" chips (so judges can try it in 5 seconds).
- Include a one-tap "Try a sample scam" for demo reliability.
- Landing page: one-sentence promise, the live check box right there (no sign-up wall), "How it works" with the pipeline diagram, a few headline stats from our eval, and the Trending feed preview.

---

## 10. Timeline (today is Sat Oct 3 evening, Lagos time)

| Day | Goal |
|---|---|
| **Sat Oct 3 (tonight)** | Confirm plan, scaffold repo, deploy hello-world to Vercel, set up Supabase, `.env.example`, redeem perks. Skeleton of `/api/analyze` returning a stub. |
| **Sun Oct 4** | Pipeline v1 text-only end-to-end: signals → LLM structured output → score → result UI. First curated scam-pattern set. |
| **Mon Oct 5** | URL analysis + brand lookalike detection; retrieval over patterns (pgvector); pipeline-progress UI. |
| **Tue Oct 6** | Screenshot (vision) + voice note (STT) inputs; multilingual output (Pidgin first, then Yoruba/Hausa/Igbo). |
| **Wed Oct 7** | Report + Trending feed + clustering; evaluation dataset + `run.ts` + first accuracy numbers. **MVP complete by end of this day.** (Note: Devpost has planned maintenance Oct 7 ~06:00 UTC, so don't rely on Devpost that morning.) |
| **Thu Oct 8** | Polish, mobile QA on a real low-end phone, error states, rate limiting, stretch features (TTS / fake-alert mode) only if MVP is rock solid. Tune pipeline using eval, document comparison vs LLM-only. |
| **Fri Oct 9** | README, architecture diagram, screenshots, record + edit demo video (≤4 min), upload to YouTube, fill the Devpost submission, **submit tonight**. |
| **Sat Oct 10** | Buffer only. Verify the submission is complete and links work before the deadline (5 PM WAT / 12 PM EDT). No new features. |

---

## 11. Demo video plan (2–4 minutes, hard cap)

1. **0:00–0:25 Hook:** a real-feeling Nigerian scam message on a phone; "Would you click?" Stat/context on the scale of fraud (only use figures we can verify, otherwise stay qualitative).
2. **0:25–1:45 Live demo:** paste a scam in Pidgin → pipeline steps animate → verdict, highlighted red flags, next steps; then a screenshot and a voice note.
3. **1:45–2:30 Under the hood:** architecture diagram — signals + retrieval + LLM + scoring + eval. Show the accuracy numbers and the "LLM-only vs full pipeline" comparison.
4. **2:30–3:15 Community & impact:** report → Trending feed; who it helps (parents, merchants, students), languages.
5. **3:15–3:45 Close:** honest limitations, what's next, call to action with the live URL.

Keep audio clear, captions on, no dead air. Show the problem, how it works, and impact (exactly what judges asked for).

---

## 12. README outline (judges read this)

Title + one-liner + live demo link + video link → problem & users → features (with screenshots) → architecture diagram & pipeline explanation → AI approach & why it's not a wrapper → evaluation results (real numbers) → privacy & safety → tech stack → setup/run instructions (clone, env vars, `npm run dev`, `npm run eval`) → limitations & roadmap → team/credits → license.

---

## 13. Definition of done

- Public URL works on mobile and desktop with no login.
- Text, URL, screenshot, and voice inputs work (or degrade gracefully with a clear message).
- Results in English and Pidgin at minimum; Yoruba/Hausa/Igbo working or clearly marked beta.
- Eval script runs with one command and its results are in the README.
- Report + Trending feed work with seeded and real data.
- No secrets in the repo; `.env.example` present; rate limiting on.
- README, architecture diagram, screenshots, and demo video complete; Devpost submission verified.

---

## 14. Open decisions (ask me these first)

1. **LLM provider + keys:** which hosted model(s) do I have API keys/credits for (Anthropic, OpenAI, Gemini, Featherless via perks)? Recommend a default for structured output + vision.
2. **Speech-to-text:** which provider (OpenAI Whisper API, Groq Whisper, other)? Fallback if none is available?
3. **Embeddings/retrieval:** pgvector in Supabase vs a simpler in-memory index for speed of build?
4. **Name:** keep "Scam Shield" or pick something more distinctive and ownable (check domain/handle availability)?
5. **Team:** am I solo, or will teammates from Discord join (and if so, who takes design/data/eval)?
6. **Languages:** commit to English + Pidgin first and add Yoruba/Hausa/Igbo as time allows, or all five from the start?
7. **Safe Browsing / URL reputation:** use Google Safe Browsing (free key) and/or URLhaus?
8. **Sponsor tie-in:** worth a light Agentboxd integration for an email-scam angle, or skip to stay focused?

Once these are settled, propose the build order and start with the Sat Oct 3 tasks.

### Resolved (Sat Oct 3)
1. **LLM:** Claude Sonnet 5.5 (`claude-sonnet-5-5`) for verdict + vision; Claude Haiku 4.5 (`claude-haiku-4-5`) for cheap steps; all behind `lib/llm.ts`.
2. **STT:** Gemini (audio input via Google AI Studio key) as default, chosen because it handles code-switched English/Pidgin voice notes and needs no extra account. Spitch (Nigerian speech API: Yoruba/Hausa/Igbo STT + TTS) is the candidate upgrade for Yoruba/Igbo transcription and the read-aloud stretch, to be verified on Tue Oct 6. Fallback: "Voice notes coming soon".
3. **Retrieval:** scam-pattern library in memory with precomputed embeddings (Gemini embeddings, saved to JSON); community reports in Supabase + pgvector. If pgvector adds real friction, raise it before switching.
4. **Name:** ShineEye, free Vercel subdomain.
5. **Team:** solo (Abdurrahman Sudais).
6. **Languages:** all five in the selector; English + Pidgin QA'd first; Yoruba/Hausa/Igbo labelled beta.
7. **URL reputation:** Google Safe Browsing + URLhaus + RDAP domain age, each with a strict timeout and graceful failure.
8. **Sponsor:** skip Agentboxd for now. Stretch goal #1 is the Telegram bot.
- Also: no `/result/[id]` route (results never stored; share card built client-side). "LLM only" eval mode built from day one.
