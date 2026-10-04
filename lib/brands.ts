/**
 * Curated brands that scammers impersonate in Nigeria, with their official
 * registrable domains. Used to flag lookalike/typosquat links.
 *
 * Rules of thumb:
 * - `domains` are registrable domains (no "www."); subdomains of these count as official.
 * - `keywords` are tokens that, when found inside a non-official domain, suggest impersonation.
 *   Keep them distinctive (≥4 chars or unambiguous) to avoid false positives.
 * - A missing official domain causes false positives, so when unsure, add it.
 */

export type BrandKind = "bank" | "fintech" | "telco" | "government" | "global" | "logistics" | "crypto";

export interface Brand {
  id: string;
  name: string;
  kind: BrandKind;
  domains: string[];
  keywords: string[];
  /** Mentions of these words in text count as naming the brand. */
  aliases: string[];
}

export const BRANDS: Brand[] = [
  // --- Nigerian banks ---
  { id: "gtbank", name: "GTBank", kind: "bank", domains: ["gtbank.com", "gtco.com"], keywords: ["gtbank", "gtco", "guarantytrust"], aliases: ["gtbank", "gtb", "gtco", "guaranty trust"] },
  { id: "access", name: "Access Bank", kind: "bank", domains: ["accessbankplc.com", "accessbank.com"], keywords: ["accessbank"], aliases: ["access bank"] },
  { id: "zenith", name: "Zenith Bank", kind: "bank", domains: ["zenithbank.com"], keywords: ["zenithbank", "zenith"], aliases: ["zenith bank", "zenith"] },
  { id: "firstbank", name: "First Bank", kind: "bank", domains: ["firstbanknigeria.com", "firstbank.ng"], keywords: ["firstbank"], aliases: ["first bank", "firstbank"] },
  { id: "uba", name: "UBA", kind: "bank", domains: ["ubagroup.com"], keywords: ["ubagroup", "ubabank"], aliases: ["uba", "united bank for africa"] },
  { id: "fidelity", name: "Fidelity Bank", kind: "bank", domains: ["fidelitybank.ng"], keywords: ["fidelitybank"], aliases: ["fidelity bank"] },
  { id: "fcmb", name: "FCMB", kind: "bank", domains: ["fcmb.com"], keywords: ["fcmb"], aliases: ["fcmb"] },
  { id: "unionbank", name: "Union Bank", kind: "bank", domains: ["unionbankng.com"], keywords: ["unionbank"], aliases: ["union bank"] },
  { id: "sterling", name: "Sterling Bank", kind: "bank", domains: ["sterling.ng"], keywords: ["sterlingbank"], aliases: ["sterling bank"] },
  { id: "stanbic", name: "Stanbic IBTC", kind: "bank", domains: ["stanbicibtcbank.com", "stanbicibtc.com"], keywords: ["stanbic"], aliases: ["stanbic", "stanbic ibtc"] },
  { id: "wema", name: "Wema Bank / ALAT", kind: "bank", domains: ["wemabank.com", "alat.ng"], keywords: ["wemabank", "alat"], aliases: ["wema", "alat"] },
  { id: "polaris", name: "Polaris Bank", kind: "bank", domains: ["polarisbanklimited.com"], keywords: ["polarisbank"], aliases: ["polaris bank"] },
  { id: "ecobank", name: "Ecobank", kind: "bank", domains: ["ecobank.com"], keywords: ["ecobank"], aliases: ["ecobank"] },
  { id: "keystone", name: "Keystone Bank", kind: "bank", domains: ["keystonebankng.com"], keywords: ["keystonebank"], aliases: ["keystone bank"] },

  // --- Fintechs / payments ---
  { id: "opay", name: "OPay", kind: "fintech", domains: ["opayweb.com", "opay.ng"], keywords: ["opay"], aliases: ["opay"] },
  { id: "moniepoint", name: "Moniepoint", kind: "fintech", domains: ["moniepoint.com"], keywords: ["moniepoint"], aliases: ["moniepoint"] },
  { id: "palmpay", name: "PalmPay", kind: "fintech", domains: ["palmpay.com"], keywords: ["palmpay"], aliases: ["palmpay", "palm pay"] },
  { id: "kuda", name: "Kuda", kind: "fintech", domains: ["kuda.com"], keywords: ["kudabank"], aliases: ["kuda"] },
  { id: "paystack", name: "Paystack", kind: "fintech", domains: ["paystack.com", "paystack.co"], keywords: ["paystack"], aliases: ["paystack"] },
  { id: "flutterwave", name: "Flutterwave", kind: "fintech", domains: ["flutterwave.com"], keywords: ["flutterwave"], aliases: ["flutterwave"] },

  // --- Telcos ---
  { id: "mtn", name: "MTN", kind: "telco", domains: ["mtn.ng", "mtn.com", "mtnonline.com"], keywords: ["mtnng", "mtn-ng", "mymtn"], aliases: ["mtn"] },
  { id: "airtel", name: "Airtel", kind: "telco", domains: ["airtel.com.ng", "airtel.com"], keywords: ["airtel"], aliases: ["airtel"] },
  { id: "glo", name: "Glo", kind: "telco", domains: ["gloworld.com"], keywords: ["gloworld"], aliases: ["glo"] },
  { id: "9mobile", name: "9mobile", kind: "telco", domains: ["9mobile.com.ng"], keywords: ["9mobile"], aliases: ["9mobile"] },

  // --- Nigerian government / agencies (all *.gov.ng is treated as official too) ---
  { id: "cbn", name: "Central Bank of Nigeria", kind: "government", domains: ["cbn.gov.ng"], keywords: ["cbn"], aliases: ["cbn", "central bank"] },
  { id: "nimc", name: "NIMC", kind: "government", domains: ["nimc.gov.ng"], keywords: ["nimc"], aliases: ["nimc"] },
  { id: "efcc", name: "EFCC", kind: "government", domains: ["efcc.gov.ng"], keywords: ["efcc"], aliases: ["efcc"] },
  { id: "firs", name: "FIRS", kind: "government", domains: ["firs.gov.ng"], keywords: ["firs"], aliases: ["firs"] },
  { id: "jamb", name: "JAMB", kind: "government", domains: ["jamb.gov.ng"], keywords: ["jamb"], aliases: ["jamb"] },
  { id: "ncc", name: "NCC", kind: "government", domains: ["ncc.gov.ng"], keywords: [], aliases: ["ncc"] },
  { id: "customs", name: "Nigeria Customs Service", kind: "government", domains: ["customs.gov.ng"], keywords: ["nigeriacustoms", "ngcustoms"], aliases: ["customs"] },
  { id: "nnpc", name: "NNPC", kind: "government", domains: ["nnpcgroup.com", "nnpcltd.com"], keywords: ["nnpc"], aliases: ["nnpc"] },
  { id: "npower", name: "N-Power", kind: "government", domains: ["npower.gov.ng"], keywords: ["npower"], aliases: ["n-power", "npower"] },

  // --- Logistics ---
  { id: "dhl", name: "DHL", kind: "logistics", domains: ["dhl.com"], keywords: ["dhl"], aliases: ["dhl"] },
  { id: "gig", name: "GIG Logistics", kind: "logistics", domains: ["giglogistics.com"], keywords: ["giglogistics"], aliases: ["gig logistics", "gigl"] },

  // --- Global ---
  { id: "whatsapp", name: "WhatsApp", kind: "global", domains: ["whatsapp.com", "wa.me", "whatsapp.net"], keywords: ["whatsapp"], aliases: ["whatsapp"] },
  { id: "facebook", name: "Facebook / Meta", kind: "global", domains: ["facebook.com", "fb.com", "meta.com", "messenger.com"], keywords: ["facebook", "meta-support"], aliases: ["facebook", "meta"] },
  { id: "instagram", name: "Instagram", kind: "global", domains: ["instagram.com"], keywords: ["instagram"], aliases: ["instagram"] },
  { id: "google", name: "Google", kind: "global", domains: ["google.com", "google.com.ng", "gmail.com", "youtube.com", "goo.gl", "g.co"], keywords: ["google", "gmail"], aliases: ["google", "gmail"] },
  { id: "apple", name: "Apple", kind: "global", domains: ["apple.com", "icloud.com"], keywords: ["apple-id", "appleid", "icloud"], aliases: ["apple id", "icloud"] },
  { id: "microsoft", name: "Microsoft", kind: "global", domains: ["microsoft.com", "live.com", "outlook.com", "office.com"], keywords: ["microsoft", "office365"], aliases: ["microsoft", "outlook"] },
  { id: "paypal", name: "PayPal", kind: "global", domains: ["paypal.com"], keywords: ["paypal"], aliases: ["paypal"] },
  { id: "netflix", name: "Netflix", kind: "global", domains: ["netflix.com"], keywords: ["netflix"], aliases: ["netflix"] },
  { id: "amazon", name: "Amazon", kind: "global", domains: ["amazon.com"], keywords: ["amazon"], aliases: ["amazon"] },
  { id: "binance", name: "Binance", kind: "crypto", domains: ["binance.com"], keywords: ["binance"], aliases: ["binance"] },
];

/** Domains that are official for some brand, flattened for quick lookup. */
export const OFFICIAL_DOMAINS = new Set(BRANDS.flatMap((b) => b.domains));

/** Suffixes always treated as official government domains. */
export const TRUSTED_SUFFIXES = [".gov.ng"];

export const URL_SHORTENERS = new Set([
  "bit.ly", "tinyurl.com", "cutt.ly", "rb.gy", "is.gd", "shorturl.at", "tiny.cc", "ow.ly",
  "s.id", "t.ly", "rebrand.ly", "bl.ink", "short.io", "shorte.st", "v.gd", "tinu.be", "lnkd.in",
  "t.co", "buff.ly", "linktr.ee", "urlz.fr", "qrco.de",
]);

/** TLDs heavily abused for phishing relative to legitimate Nigerian use. */
export const SUSPICIOUS_TLDS = new Set([
  "xyz", "top", "click", "live", "buzz", "icu", "monster", "rest", "sbs", "cfd", "cyou",
  "online", "site", "shop", "work", "loan", "win", "bid", "vip", "club", "support", "help",
  "info", "link", "gq", "ml", "cf", "tk", "ga",
]);

/** Multi-label public suffixes we care about (a tiny subset of the Public Suffix List). */
export const MULTI_PART_SUFFIXES = new Set([
  "com.ng", "gov.ng", "org.ng", "edu.ng", "net.ng", "name.ng", "sch.ng", "mil.ng", "mobi.ng",
  "co.uk", "org.uk", "com.au", "co.za", "com.gh", "co.ke",
]);
