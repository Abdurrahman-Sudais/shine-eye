import { describe, expect, it } from "vitest";
import { locateQuote, redact } from "@/lib/pipeline/redact";

describe("redact", () => {
  it("masks phones, account numbers, cards and emails", () => {
    const out = redact("Call 08031234567 or +2348031234567, pay 0123456789, card 5399 4123 4567 8901, mail a.b@gmail.com");
    expect(out).toBe("Call [PHONE] or [PHONE], pay [ACCOUNT_NUMBER], card [CARD_NUMBER], mail [EMAIL]");
  });

  it("leaves OTPs and amounts alone", () => {
    expect(redact("OTP 482913 for N15,000")).toBe("OTP 482913 for N15,000");
  });
});

describe("locateQuote", () => {
  const original = "Abeg send N20,000 to this account 2034567891 Moniepoint.\nNo call this number o";

  it("finds verbatim, case- and whitespace-insensitive quotes", () => {
    expect(locateQuote(original, "send N20,000")).toEqual({ start: 5, end: 17 });
    expect(locateQuote(original, "NO CALL   this number")).not.toBeNull();
  });

  it("maps placeholders back to the original digits", () => {
    const loc = locateQuote(original, "this account [ACCOUNT_NUMBER] Moniepoint")!;
    expect(original.slice(loc.start, loc.end)).toBe("this account 2034567891 Moniepoint");
  });

  it("rejects paraphrases and trims surrounding quote marks", () => {
    expect(locateQuote(original, "please send money")).toBeNull();
    expect(locateQuote(original, "“send N20,000”")).not.toBeNull();
  });
});
