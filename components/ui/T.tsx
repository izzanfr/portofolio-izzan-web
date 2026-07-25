"use client";

import type { ReactNode } from "react";
import { useCurrentLocale } from "@/components/providers/LocaleProvider";

/**
 * Renders one language, not both.
 *
 * This used to emit both versions and let CSS hide the inactive one, which kept
 * switching free of re-renders but left every translated string duplicated in
 * the document: a crawler indexed the page as two languages spliced together,
 * and a screen reader read it out twice. Only the active language is in the DOM
 * now, so both of those read a single coherent language.
 *
 * The locale resolves to "en" during SSR and on the first client render, then
 * syncs from <html lang> in an effect — matching markup on both sides, so there
 * is no hydration mismatch. The consequence is that a returning Indonesian
 * visitor sees English for the first frame; that is the price of keeping one URL
 * for both languages, since the server has nothing to read the preference from.
 *
 * No wrapper element: the chosen node is returned as-is, so this adds nothing to
 * the markup and stays usable inline, around a block, or around a whole MDX body.
 */
export function T({ en, id }: { en: ReactNode; id: ReactNode }) {
  const locale = useCurrentLocale();
  return <>{locale === "id" ? id : en}</>;
}
