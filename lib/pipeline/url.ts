import {
  BRANDS,
  MULTI_PART_SUFFIXES,
  OFFICIAL_DOMAINS,
  SUSPICIOUS_TLDS,
  TRUSTED_SUFFIXES,
  URL_SHORTENERS,
  type Brand,
} from "@/lib/brands";
import type { Signal } from "@/lib/schema";

/**
 * Deterministic URL analysis: find links in text, then flag lookalike brand
 * domains, shorteners, risky TLDs, punycode/homoglyphs, raw IPs, etc.
 * No network calls here; reputation lookups (Safe Browsing, URLhaus, RDAP) live elsewhere.
 */

export interface FoundUrl {
  raw: string;
  start: number;
  end: number;
  host: string; // ASCII (punycode) hostname, lowercased
  registrable: string; // e.g. "gtbank-verify-ng.com"
  official: Brand | null; // brand this domain officially belongs to
}

const COMMON_TLDS = [
  "com", "ng", "net", "org", "io", "co", "me", "app", "dev", "ly", "gl", "gy", "at", "id", "ee",
  "uk", "us", "de", "fr", "za", "gh", "ke", "biz", "pro", "tv", "cc", "in", "ru", "cn", "to",
  "ai", "gov", "edu", "africa", "page", "web", "store", "tech", "space", "website", "fun",
  "news", "life", "world", "email", "cloud",
  ...SUSPICIOUS_TLDS,
];

// Scheme URLs, www.-prefixed hosts, or bare domains ending in a known TLD.
const URL_RE = new RegExp(
  String.raw`\bhttps?:\/\/[^\s<>"']+` +
    String.raw`|\bwww\.[^\s<>"']+` +
    String.raw`|\b(?:[\p{L}\p{N}](?:[\p{L}\p{N}-]{0,61}[\p{L}\p{N}])?\.)+(?:${COMMON_TLDS.join("|")})\b(?:\/[^\s<>"']*)?`,
  "giu",
);

const TRAILING_PUNCT = /[.,;:!?)\]}"'’”]+$/;

export function registrableDomain(host: string): string {
  const labels = host.split(".").filter(Boolean);
  if (labels.length <= 2) return labels.join(".");
  const lastTwo = labels.slice(-2).join(".");
  return MULTI_PART_SUFFIXES.has(lastTwo) ? labels.slice(-3).join(".") : lastTwo;
}

function officialBrandFor(host: string, registrable: string): Brand | null {
  if (!OFFICIAL_DOMAINS.has(registrable)) return null;
  return BRANDS.find((b) => b.domains.includes(registrable)) ?? null;
}

export function isOfficialHost(host: string): boolean {
  const reg = registrableDomain(host);
  return OFFICIAL_DOMAINS.has(reg) || TRUSTED_SUFFIXES.some((s) => host.endsWith(s));
}

export function findUrls(text: string): FoundUrl[] {
  const out: FoundUrl[] = [];
  for (const m of text.matchAll(URL_RE)) {
    const raw = m[0].replace(TRAILING_PUNCT, "");
    const start = m.index ?? 0;
    // Skip emails: "name@gtbank.com" matches the bare-domain branch.
    if (start > 0 && text[start - 1] === "@") continue;
    let host: string;
    try {
      host = new URL(/^https?:\/\//i.test(raw) ? raw : `http://${raw}`).hostname.toLowerCase();
    } catch {
      continue;
    }
    if (!host.includes(".")) continue;
    const registrable = registrableDomain(host);
    out.push({ raw, start, end: start + raw.length, host, registrable, official: officialBrandFor(host, registrable) });
  }
  return out;
}

/** Levenshtein distance, early-exit when it exceeds `max`. */
export function editDistance(a: string, b: string, max = 3): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      rowMin = Math.min(rowMin, cur[j]);
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

/** Undo common visual substitutions: 0→o, 1→l, rn→m, vv→w. */
function deconfuse(s: string): string {
  return s.replace(/0/g, "o").replace(/1/g, "l").replace(/rn/g, "m").replace(/vv/g, "w");
}

function stripSuffix(registrable: string): string {
  return registrable.split(".")[0];
}

export interface Lookalike {
  brand: Brand;
  reason: "keyword" | "typosquat";
}

/** Which brand (if any) a non-official host appears to imitate. */
export function detectLookalike(host: string): Lookalike | null {
  if (isOfficialHost(host)) return null;
  const registrable = registrableDomain(host);
  if (URL_SHORTENERS.has(registrable)) return null;

  const tokens = host.split(/[.-]/);
  const squashed = host.replace(/[.-]/g, "");
  for (const brand of BRANDS) {
    for (const kw of brand.keywords) {
      const hit = kw.length >= 5 ? squashed.includes(kw.replace(/-/g, "")) : tokens.includes(kw);
      if (hit) return { brand, reason: "keyword" };
    }
  }

  const label = stripSuffix(registrable);
  if (label.length < 5) return null;
  for (const brand of BRANDS) {
    for (const domain of brand.domains) {
      const official = stripSuffix(domain);
      if (official.length < 5) continue;
      if (deconfuse(label) === official) return { brand, reason: "typosquat" };
      // Allowed edits scale with length so short names don't match ordinary words.
      const allowed = official.length >= 8 ? 2 : official.length >= 6 ? 1 : 0;
      const d = editDistance(label, official, 2);
      if (d >= 1 && d <= allowed) return { brand, reason: "typosquat" };
    }
  }
  return null;
}

/** Signal weights for links. Documented here; score.ts combines them. */
export const URL_WEIGHTS = {
  lookalike: 35,
  homoglyph: 30,
  ip: 25,
  shortener: 15,
  suspicious_tld: 15,
  at_sign: 20,
  http: 5,
  deep_subdomain: 8,
  chat_link: 3,
} as const;

export function urlSignals(text: string): { urls: FoundUrl[]; signals: Signal[] } {
  const urls = findUrls(text);
  const signals: Signal[] = [];

  for (const u of urls) {
    const span = { text: u.raw, start: u.start, end: u.end };
    const add = (type: string, label: string, weight: number) => signals.push({ type, label, weight, span });

    if (u.official) {
      add("url.official", `Link goes to an official ${u.official.name} domain (${u.registrable})`, -10);
      continue;
    }
    if (TRUSTED_SUFFIXES.some((s) => u.host.endsWith(s))) {
      add("url.official", `Link goes to an official Nigerian government domain (${u.registrable})`, -10);
      continue;
    }

    const hostInRaw = u.raw.replace(/^https?:\/\//i, "").split(/[/?#]/)[0];
    if (/[^\x00-\x7F]/.test(hostInRaw) || u.host.split(".").some((l) => l.startsWith("xn--"))) {
      add("url.homoglyph", "Link uses look-alike or foreign characters to disguise the address", URL_WEIGHTS.homoglyph);
    }

    const look = detectLookalike(u.host);
    if (look) {
      add(
        "url.lookalike",
        look.reason === "typosquat"
          ? `"${u.registrable}" is misspelt to look like ${look.brand.name}, but it is not their official site`
          : `"${u.registrable}" uses the ${look.brand.name} name, but it is not their official site`,
        URL_WEIGHTS.lookalike,
      );
    }

    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(u.host)) {
      add("url.ip", "Link points to a raw IP address instead of a company website", URL_WEIGHTS.ip);
    }
    if (URL_SHORTENERS.has(u.registrable)) {
      add("url.shortener", `Shortened link (${u.registrable}) hides where it really goes`, URL_WEIGHTS.shortener);
    }
    const tld = u.host.split(".").pop() ?? "";
    if (SUSPICIOUS_TLDS.has(tld)) {
      add("url.suspicious_tld", `".${tld}" addresses are cheap and often used for scam sites`, URL_WEIGHTS.suspicious_tld);
    }
    if (/^https?:\/\/[^/]*@/i.test(u.raw)) {
      add("url.at_sign", "Link uses an @ trick to hide the real destination", URL_WEIGHTS.at_sign);
    }
    if (/^http:\/\//i.test(u.raw)) {
      add("url.http", "Link is not secure (http, not https)", URL_WEIGHTS.http);
    }
    if (u.host.split(".").length >= 5) {
      add("url.deep_subdomain", "Unusually long web address, a common disguise", URL_WEIGHTS.deep_subdomain);
    }
    if (u.registrable === "t.me") {
      add("url.chat_link", "Link moves the conversation to a private chat", URL_WEIGHTS.chat_link);
    }
  }
  return { urls, signals };
}
