"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Locale = "en" | "id";

/** Fired on <window> whenever the language changes, so the few components that
 *  can't dual-render into the DOM (form placeholders, JS-composed strings) can
 *  react. Static text should use <T> instead and needs none of this. */
export const LOCALE_EVENT = "izzan:locale";

type LocaleContextValue = {
  /** Set the active language explicitly (used by the two-option toggle). */
  setLocale: (locale: Locale) => void;
  /** Flip between the two languages. */
  toggleLocale: () => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export const LOCALE_STORAGE_KEY = "izzan-locale";

/**
 * Inlined in <head> before paint so the document advertises the right
 * `<html lang>` from the first frame — which is what assistive tech and
 * translation tooling read to decide the page's language.
 *
 * It also seeds the value <T> picks up on mount. It cannot prevent the first
 * paint being English, though: the markup is prerendered, so a stored
 * Indonesian preference only takes effect once React hydrates.
 */
export const localeInitScript = `(function(){try{var k="${LOCALE_STORAGE_KEY}";var s=localStorage.getItem(k);var l=(s==="en"||s==="id")?s:"en";document.documentElement.lang=l;}catch(e){}})();`;

/**
 * The active language lives on <html lang="en|id">, and the change is broadcast
 * so every <T> re-renders with the other language. It cannot be a pure CSS swap:
 * only one version may exist in the DOM at a time, or crawlers and screen
 * readers see the page in two languages at once.
 */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const setLocale = useCallback((locale: Locale) => {
    document.documentElement.lang = locale;
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
      // storage unavailable (private mode) — language still applies this session
    }
    window.dispatchEvent(new Event(LOCALE_EVENT));
  }, []);

  const toggleLocale = useCallback(() => {
    const current: Locale = document.documentElement.lang === "id" ? "id" : "en";
    setLocale(current === "id" ? "en" : "id");
  }, [setLocale]);

  return (
    <LocaleContext.Provider value={{ setLocale, toggleLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used inside <LocaleProvider>");
  return context;
}

/**
 * Reactive read of the active language for the narrow cases that must resolve to
 * a single string in JS — form placeholders, a mailto subject. Starts at "en"
 * (matching SSR) and syncs to the real value after mount, so it never causes a
 * hydration mismatch. Prefer <T> for anything that renders as visible text.
 */
export function useCurrentLocale(): Locale {
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    const sync = () =>
      setLocale(document.documentElement.lang === "id" ? "id" : "en");
    sync();
    window.addEventListener(LOCALE_EVENT, sync);
    return () => window.removeEventListener(LOCALE_EVENT, sync);
  }, []);

  return locale;
}
