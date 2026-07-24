import type { Locale } from "@/components/providers/LocaleProvider";

export type { Locale };

/** A string that exists in both languages. */
export type BiText = { en: string; id: string };

/** A list of strings in both languages (e.g. bullet points, tags). */
export type BiList = { en: string[]; id: string[] };

/** Pick one locale out of a {en, id} pair. Used by the few JS-time reads
 *  (mailto composition) that can't dual-render into the DOM. */
export function pick<T>(value: { en: T; id: T }, locale: Locale): T {
  return locale === "id" ? value.id : value.en;
}

/** Read the language the document is currently showing. Safe on the client
 *  only; falls back to "en" during SSR. */
export function currentLocale(): Locale {
  if (typeof document === "undefined") return "en";
  return document.documentElement.lang === "id" ? "id" : "en";
}
