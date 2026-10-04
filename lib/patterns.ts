import { z } from "zod";
import raw from "@/data/patterns.json";

/** Scam taxonomy: ids are what `Verdict.scam_type` holds; labels are user-facing (English). */
export const SCAM_TYPES = {
  bank_phishing: "Bank phishing",
  otp_theft: "OTP / PIN theft",
  fake_payment: "Fake payment or alert",
  impersonation: "Impersonation",
  account_takeover: "Account takeover",
  fake_job: "Fake job offer",
  fake_scholarship: "Fake scholarship or visa",
  investment: "Investment scam",
  prize: "Fake prize or giveaway",
  fake_grant: "Fake government grant",
  delivery: "Delivery or customs fee",
  romance: "Romance scam",
  sextortion: "Sextortion / blackmail",
  loan_app: "Loan app fraud",
  telco: "Telco / SIM scam",
  fake_support: "Fake customer support",
  rental: "Rental scam",
  marketplace: "Online shopping scam",
  charity: "Fake charity appeal",
  authority_threat: "Fake police / agency threat",
  advance_fee: "Advance-fee (419) fraud",
  ai_voice_clone: "AI voice-clone scam",
  credential_phishing: "Account phishing",
  education: "Exam / admission scam",
  legitimate: "Looks legitimate",
  unknown: "Unclear",
} as const;

export type ScamType = keyof typeof SCAM_TYPES;
const scamTypeIds = Object.keys(SCAM_TYPES) as [ScamType, ...ScamType[]];
export const ScamTypeSchema = z.enum(scamTypeIds);

export const PatternSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  scam_type: ScamTypeSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  examples: z.array(z.string().min(1)).min(1),
  red_flags: z.array(z.string()),
  action: z.string().min(1),
});
export type Pattern = z.infer<typeof PatternSchema>;

export const PATTERNS: Pattern[] = z.array(PatternSchema).parse(raw);

/** Text used to embed / match a pattern. */
export function patternDocument(p: Pattern): string {
  return [p.title, p.description, ...p.examples, ...p.red_flags].join("\n");
}
