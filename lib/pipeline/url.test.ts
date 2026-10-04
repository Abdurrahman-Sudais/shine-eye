import { describe, expect, it } from "vitest";
import { detectLookalike, editDistance, findUrls, registrableDomain, urlSignals } from "@/lib/pipeline/url";

const types = (text: string) => urlSignals(text).signals.map((s) => s.type);

describe("findUrls", () => {
  it("finds scheme, www and bare-domain links with correct spans", () => {
    const text = "Go to https://gtbank-verify-ng.com/update, or www.opay-bonus.xyz and zenithbank.com.";
    const urls = findUrls(text);
    expect(urls.map((u) => u.host)).toEqual(["gtbank-verify-ng.com", "www.opay-bonus.xyz", "zenithbank.com"]);
    for (const u of urls) expect(text.slice(u.start, u.end)).toBe(u.raw);
  });

  it("ignores emails, money amounts and abbreviations", () => {
    expect(findUrls("Email help@gtbank.com about N5,000.00 e.g. today")).toEqual([]);
  });
});

describe("registrableDomain", () => {
  it("handles multi-part Nigerian suffixes", () => {
    expect(registrableDomain("ibank.airtel.com.ng")).toBe("airtel.com.ng");
    expect(registrableDomain("gtbank.com.secure-login.xyz")).toBe("secure-login.xyz");
    expect(registrableDomain("portal.nimc.gov.ng")).toBe("nimc.gov.ng");
  });
});

describe("detectLookalike", () => {
  it.each([
    ["gtbank-verify-ng.com", "gtbank", "keyword"],
    ["gtbank.com.secure-login.xyz", "gtbank", "keyword"],
    ["zenlthbank.com", "zenith", "typosquat"],
    ["firstbankniger1a.com", "firstbank", "keyword"],
    ["moniepoint-rewards.online", "moniepoint", "keyword"],
    ["paypa1.com", "paypal", "typosquat"],
  ])("%s imitates %s (%s)", (host, brandId, reason) => {
    expect(detectLookalike(host)).toMatchObject({ brand: { id: brandId }, reason });
  });

  it.each(["gtbank.com", "ibank.gtbank.com", "portal.nimc.gov.ng", "bit.ly", "example.com", "apply.com", "firstclass.com"])(
    "%s is not flagged",
    (host) => expect(detectLookalike(host)).toBeNull(),
  );
});

describe("urlSignals", () => {
  it("flags lookalike + suspicious TLD + shortener + IP", () => {
    expect(types("Claim at http://opay-bonus.xyz")).toEqual(expect.arrayContaining(["url.lookalike", "url.suspicious_tld", "url.http"]));
    expect(types("see bit.ly/3xYz")).toContain("url.shortener");
    expect(types("login at http://192.168.10.4/gtb")).toContain("url.ip");
  });

  it("treats official domains as reassuring", () => {
    const { signals } = urlSignals("Download from https://www.gtbank.com/app");
    expect(signals).toHaveLength(1);
    expect(signals[0]).toMatchObject({ type: "url.official" });
    expect(signals[0].weight).toBeLessThan(0);
  });

  it("flags punycode / homoglyph hosts", () => {
    expect(types("https://gtbаnk.com/login")).toContain("url.homoglyph"); // Cyrillic "а"
  });
});

describe("editDistance", () => {
  it("computes small distances and early-exits", () => {
    expect(editDistance("zenithbank", "zenlthbank")).toBe(1);
    expect(editDistance("abc", "abcdefgh", 2)).toBe(3);
  });
});
