import { describe, expect, it } from "vitest";
import { extractSignals } from "@/lib/pipeline/signals";
import { SAMPLES } from "@/lib/samples";

const types = (text: string) => extractSignals(text).map((s) => s.type);
const sample = (id: string) => SAMPLES.find((s) => s.id === id)!.text;
const risk = (text: string) => extractSignals(text).reduce((sum, s) => sum + s.weight, 0);

describe("extractSignals: scams", () => {
  it("Pidgin BVN phishing", () => {
    expect(types(sample("bvn-pidgin"))).toEqual(
      expect.arrayContaining(["url.lookalike", "request.otp", "request.identity", "threat.account", "urgency", "info.brand"]),
    );
  });

  it("job offer with fee", () => {
    expect(types(sample("job-fee"))).toEqual(
      expect.arrayContaining(["money.advance_fee", "context.job", "info.account_number", "urgency"]),
    );
  });

  it("relative on a new number", () => {
    expect(types(sample("relative-airtime"))).toEqual(
      expect.arrayContaining(["impersonation.relative", "money.request", "secrecy", "info.account_number"]),
    );
  });

  it("conditional threats are not mistaken for negation", () => {
    expect(types("Your account will be blocked if you do not send the OTP now")).toContain("request.otp");
  });

  it("USSD transfer code", () => {
    expect(types("Dial *737*2*5000*0123456789# to confirm your reward")).toContain("ussd.transfer");
  });

  it("investment scheme", () => {
    expect(types("Invest N50,000 and get 40% weekly profit, guaranteed returns! Join via USDT")).toEqual(
      expect.arrayContaining(["money.too_good", "context.crypto"]),
    );
  });
});

describe("extractSignals: legitimate messages stay quiet", () => {
  it("real OTP notice has no request.otp and nets reassuring", () => {
    const t = types(sample("legit-otp"));
    expect(t).not.toContain("request.otp");
    expect(t).toContain("reassure.never_ask");
    expect(risk(sample("legit-otp"))).toBeLessThanOrEqual(0);
  });

  it.each([
    "Hi, are we still meeting at 4pm by the faculty gate?",
    "Acct: 0123****89 Amt: NGN5,000.00 CR Desc: Transfer from ADE Bal: NGN12,400.00",
    "Your GIG Logistics package is out for delivery. Track at https://giglogistics.com/track",
    "Never share your PIN or OTP with anyone. GTBank will never ask for your PIN.",
  ])("%s", (text) => {
    expect(risk(text)).toBeLessThan(15);
  });
});

describe("extractSignals: spans", () => {
  it("every span matches the source text exactly", () => {
    for (const s of SAMPLES) {
      for (const sig of extractSignals(s.text)) {
        if (sig.span) expect(s.text.slice(sig.span.start, sig.span.end)).toBe(sig.span.text);
      }
    }
  });
});
