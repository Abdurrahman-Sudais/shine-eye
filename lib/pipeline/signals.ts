import { BRANDS } from "@/lib/brands";
import { urlSignals } from "@/lib/pipeline/url";
import type { Signal } from "@/lib/schema";

/**
 * Stage 2: deterministic signal extraction. No LLM. Every signal carries the
 * exact span that triggered it so the UI can highlight it and the eval can audit it.
 *
 * Weights are rough "how much does this raise suspicion" points (negative = reassuring).
 * score.ts combines them with the LLM's judgement; keep both files in sync.
 */

interface Rule {
  type: string;
  label: string;
  weight: number;
  patterns: RegExp[];
  /** If true, matches preceded by "don't / never / do not" in the same clause are ignored. */
  negatable?: boolean;
  /** Max matches reported for this rule (avoids noisy duplicates). */
  max?: number;
}

const W = String.raw`[^.!?\n]`; // "within the same clause"

const RULES: Rule[] = [
  {
    type: "request.otp",
    label: "Asks you to share an OTP or verification code",
    weight: 35,
    negatable: true,
    patterns: [
      new RegExp(String.raw`\b(send|share|give|forward|tell|provide|reply(?: with)?|drop|read out|call out)\b${W}{0,40}\b(otp|one[- ]time (?:password|pin|code)|verification code|token|the code|(?:4|6)[- ]digit code)\b`, "giu"),
    ],
  },
  {
    type: "request.credentials",
    label: "Asks for your PIN or password",
    weight: 35,
    negatable: true,
    patterns: [
      new RegExp(String.raw`\b(send|share|give|tell|provide|confirm|reply with|enter)\b${W}{0,30}\b(atm pin|card pin|pin|password|passcode|login details)\b`, "giu"),
    ],
  },
  {
    type: "request.identity",
    label: "Pressures you about your BVN or NIN",
    weight: 22,
    negatable: true,
    patterns: [
      new RegExp(String.raw`\b(send|share|give|provide|confirm|update|verify|link|submit|re-?validate)\b${W}{0,30}\b(bvn|nin|bank verification number|national identity number)\b`, "giu"),
      new RegExp(String.raw`\b(bvn|nin)\b${W}{0,30}\b(update|verif\w*|expire\w*|block\w*|suspend\w*|link\w*|never update|no update)\b`, "giu"),
    ],
  },
  {
    type: "request.card",
    label: "Asks for card details",
    weight: 30,
    negatable: true,
    patterns: [/\b(card number|cvv|cvc|card details|expiry date|16[- ]digit)\b/giu],
  },
  {
    type: "threat.account",
    label: "Threatens to block or close your account",
    weight: 20,
    patterns: [
      new RegExp(String.raw`\b(account|card|line|sim|wallet|whatsapp)\b${W}{0,40}\b(block(?:ed)?|suspend(?:ed)?|deactivat\w*|clos(?:e|ed)|restrict\w*|frozen|freeze|terminat\w*|don block|go close|go block)\b`, "giu"),
      new RegExp(String.raw`\b(block|suspend|deactivat|close|restrict|freeze)\w*\b${W}{0,20}\b(your|the) (account|card|line|sim|wallet)\b`, "giu"),
    ],
    max: 1,
  },
  {
    type: "threat.legal",
    label: "Threatens arrest or legal action",
    weight: 15,
    patterns: [/\b(arrest(?:ed)?|warrant|prosecut\w*|legal action|lawsuit|jail|police will|court summons)\b/giu],
    max: 1,
  },
  {
    type: "urgency",
    label: "Creates pressure to act fast",
    weight: 10,
    patterns: [
      /\b(urgent(?:ly)?|immediately|right now|asap|act now|today only|within \d+\s*(?:hours?|hrs?|minutes?|mins?)|before (?:midnight|it'?s too late)|last (?:warning|chance|reminder)|final (?:notice|warning)|sharp sharp|now now|quick quick)\b/giu,
    ],
    max: 2,
  },
  {
    type: "action.click",
    label: "Pushes you to click a link",
    weight: 8,
    patterns: [new RegExp(String.raw`\b(click|tap|follow|visit|open)\b${W}{0,25}\b(link|here|below|button|url)\b`, "giu")],
    max: 1,
  },
  {
    type: "action.verify",
    label: "Asks you to \"verify\" or \"update\" your account",
    weight: 12,
    patterns: [
      new RegExp(String.raw`\b(verify|update|reactivate|unlock|restore|validate|upgrade)\b${W}{0,25}\b(account|details|information|info|profile|wallet|sim|line)\b`, "giu"),
    ],
    max: 1,
  },
  {
    type: "money.advance_fee",
    label: "Asks for a fee before you receive something",
    weight: 30,
    patterns: [
      /\b(registration|processing|activation|clearance|delivery|customs|handling|release|verification|insurance|admin(?:istrative)?|refundable|commitment|unlocking|withdrawal)\s+(fee|charge|levy)\b/giu,
      new RegExp(String.raw`\bpay\b${W}{0,40}\bto (secure|claim|receive|unlock|release|activate|confirm|process)\b`, "giu"),
    ],
    max: 1,
  },
  {
    type: "money.too_good",
    label: "Promises unrealistic money or prizes",
    weight: 25,
    patterns: [
      /\b(double your (?:money|investment)|guaranteed (?:returns?|profit|income)|risk[- ]free (?:investment|returns?)|\d{2,3}\s*%\s*(?:daily|weekly|monthly|returns?|profit|interest)|you (?:have )?won|lottery|jackpot|giveaway|free (?:money|airtime|data|cash)|cash prize|(?:federal|government|covid|cbn) grant)\b/giu,
    ],
    max: 2,
  },
  {
    type: "money.request",
    label: "Asks you to send money",
    weight: 15,
    patterns: [
      /\b(send|transfer(?! (?:of|from))|pay)\b[^.!?\n]{0,40}?(₦\s?\d[\d,]*|\bn\s?\d[\d,]{2,}\b|\bngn\s?\d[\d,]*|\d[\d,]*\s?naira|\bairtime\b|recharge card)/giu,
    ],
    max: 1,
  },
  {
    type: "impersonation.relative",
    label: "Claims to be someone you know on a new number",
    weight: 22,
    patterns: [
      /\b(this is my new (?:number|line)|my (?:phone|line) (?:spoil|don spoil|fall|fell|got stolen|was stolen|is bad|enter water|fall inside water)|i dey use (?:my )?(?:friend|somebody)'?s? phone|i'?m using (?:a |my )?friend'?s phone|(?:mummy|mum|mom|daddy|dad|aunty|uncle)[,!]? (?:na me|it'?s me|its me))\b/giu,
    ],
    max: 1,
  },
  {
    type: "secrecy",
    label: "Asks you to keep it secret or not to call",
    weight: 14,
    patterns: [
      /\b(don'?t tell (?:anyone|anybody)|no tell anybody|keep (?:this|it) (?:secret|confidential|between us)|no call (?:this|me|the)? ?(?:number|line)?|don'?t call (?:me|this number)|i can'?t (?:talk|call) now)\b/giu,
    ],
    max: 1,
  },
  {
    type: "context.job",
    label: "Job or recruitment offer",
    weight: 5,
    patterns: [/\b(shortlisted|recruitment|graduate trainee|job offer|you have been selected|vacancy|employment opportunity)\b/giu],
    max: 1,
  },
  {
    type: "context.crypto",
    label: "Crypto or trading investment talk",
    weight: 8,
    patterns: [/\b(usdt|bitcoin|btc|crypto(?:currency)?|forex|binary options?|trading bot|airdrop|mining pool)\b/giu],
    max: 1,
  },
  {
    type: "reassure.never_ask",
    label: "Says it will never ask for your PIN/OTP (typical of real banks)",
    weight: -12,
    patterns: [
      /\b(never ask (?:you )?for your|do not share (?:this|your) (?:code|otp|pin)|don'?t share (?:this|your) (?:code|otp|pin)|will never (?:call|ask))\b/giu,
    ],
    max: 1,
  },
];

const NEGATION_BEFORE = /\b(do not|don'?t|dont|never|no go|will never|won'?t|not)\b[^.!?\n]{0,30}$/iu;

function isNegated(text: string, start: number): boolean {
  const clauseStart = Math.max(
    text.lastIndexOf(".", start - 1),
    text.lastIndexOf("!", start - 1),
    text.lastIndexOf("?", start - 1),
    text.lastIndexOf("\n", start - 1),
  );
  const prefix = text.slice(clauseStart + 1, start);
  // "if you don't send the OTP…" is a threat, not a reassurance.
  if (/\b(if|unless|or else)\b/iu.test(prefix)) return false;
  return NEGATION_BEFORE.test(prefix);
}

function overlaps(a: { start: number; end: number }, b: { start: number; end: number }) {
  return a.start < b.end && b.start < a.end;
}

function textSignals(text: string): Signal[] {
  const out: Signal[] = [];
  for (const rule of RULES) {
    const found: Signal[] = [];
    for (const pattern of rule.patterns) {
      for (const m of text.matchAll(pattern)) {
        const start = m.index ?? 0;
        const span = { text: m[0], start, end: start + m[0].length };
        if (rule.negatable && isNegated(text, start)) continue;
        if (found.some((s) => s.span && overlaps(s.span, span))) continue;
        found.push({ type: rule.type, label: rule.label, weight: rule.weight, span });
      }
    }
    out.push(...found.slice(0, rule.max ?? 2));
  }
  return out;
}

const NG_PHONE = /(?<![\d+])(?:\+?234|0)[789][01]\d{8}(?!\d)/g;
const NUBAN = /(?<![\d+])\d{10}(?!\d)/g;
const USSD = /\*\d{2,4}(?:\*[\d]+)*#/g;

function numberSignals(text: string): Signal[] {
  const out: Signal[] = [];
  for (const m of text.matchAll(NG_PHONE)) {
    const start = m.index ?? 0;
    out.push({ type: "info.phone", label: "Contains a phone number", weight: 0, span: { text: m[0], start, end: start + m[0].length } });
  }
  for (const m of text.matchAll(NUBAN)) {
    const start = m.index ?? 0;
    out.push({ type: "info.account_number", label: "Contains a bank account number", weight: 5, span: { text: m[0], start, end: start + m[0].length } });
  }
  for (const m of text.matchAll(USSD)) {
    const start = m.index ?? 0;
    const segments = m[0].split("*").length - 1;
    out.push(
      segments >= 3
        ? { type: "ussd.transfer", label: "USSD code that could move money from your account", weight: 20, span: { text: m[0], start, end: start + m[0].length } }
        : { type: "info.ussd", label: "Contains a USSD code", weight: 0, span: { text: m[0], start, end: start + m[0].length } },
    );
  }
  return out;
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const BRAND_MENTION_RES = BRANDS.map((b) => ({
  brand: b,
  re: new RegExp(String.raw`(?<![\p{L}\p{N}])(${b.aliases.map(escapeRe).join("|")})(?![\p{L}\p{N}])`, "iu"),
}));

/** Which brands the text names. Informational: lets later stages spot impersonation. */
export function brandMentions(text: string): Signal[] {
  const out: Signal[] = [];
  for (const { brand, re } of BRAND_MENTION_RES) {
    const m = re.exec(text);
    if (!m) continue;
    out.push({
      type: "info.brand",
      label: `Mentions ${brand.name}`,
      weight: 0,
      span: { text: m[0], start: m.index, end: m.index + m[0].length },
    });
  }
  return out;
}

export function extractSignals(text: string): Signal[] {
  const { signals: url } = urlSignals(text);
  const all = [...url, ...textSignals(text), ...numberSignals(text), ...brandMentions(text)];
  return all.sort((a, b) => b.weight - a.weight || (a.span?.start ?? 0) - (b.span?.start ?? 0));
}
