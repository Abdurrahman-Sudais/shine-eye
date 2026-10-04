/**
 * Stage 1: normalize input text. Everything downstream (signals, spans, red-flag
 * quotes, UI highlighting) uses the normalized string, so offsets stay consistent.
 */
export function normalizeText(raw: string): string {
  return raw
    .replace(/\r\n?/g, "\n")
    .replace(/[​-‍﻿]/g, "") // zero-width chars used to dodge filters
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function looksLikeBareUrl(text: string): boolean {
  return /^(https?:\/\/)?[^\s/]+\.[a-z]{2,}(\/\S*)?$/i.test(text.trim());
}
