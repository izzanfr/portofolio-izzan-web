"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  useCurrentLocale,
  useLocale,
  type Locale,
} from "@/components/providers/LocaleProvider";
import { FlagGB, FlagID } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

/**
 * Language menu — a neumorphic trigger that presses in as a panel drops out of it.
 *
 * Two kinds of state here, and keeping them apart is the whole design.
 *
 * The *language* is not React state: it lives on `<html lang>`, an inline head
 * script sets it before first paint, and
 * anything derived in React would only catch up a beat later. So which flag the
 * trigger shows and which row reads as chosen are decided by CSS keyed on
 * `html[lang]` (see `.lang-menu*` in globals.css) — correct on the first frame,
 * identical on both sides of hydration.
 *
 * Whether the panel is *open* is ordinary React state. It starts closed on both
 * server and client, so there is nothing to mismatch, and it is the one thing
 * here CSS could not own.
 *
 * `useCurrentLocale` appears once, for `aria-checked` and the trigger's label —
 * attributes CSS cannot set. It reports English until it syncs after mount,
 * which is harmless precisely because nothing visible depends on it.
 */

const OPTIONS = [
  // Endonyms: a language is best named in itself, and neither of these needs
  // translating for the other's reader.
  { code: "en", label: "English", Flag: FlagGB },
  { code: "id", label: "Indonesia", Flag: FlagID },
] as const satisfies readonly { code: Locale; label: string; Flag: typeof FlagGB }[];

export function LanguageToggle({ className }: { className?: string }) {
  const { setLocale } = useLocale();
  const locale = useCurrentLocale();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Only while open: a menu that is shut has nothing to dismiss, and two
  // document-level listeners per language switcher is two too many to leave
  // running for the life of the page.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    // `pointerdown` rather than `click`, so the menu is already gone by the time
    // whatever was aimed at underneath it receives the press.
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} data-open={open} className={cn("lang-menu", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={
          locale === "id"
            ? "Bahasa: Indonesia. Ganti bahasa."
            : "Language: English. Change language."
        }
        className="lang-menu-trigger"
      >
        {/* Both flags and both codes are always in the markup; the stylesheet
            displays one pair. Ordered flag-flag-code-code rather than in pairs
            so that whichever survives lands in the right place in the flex row. */}
        <span className="lang-flag lang-swap lang-swap-en">
          <FlagGB />
        </span>
        <span className="lang-flag lang-swap lang-swap-id">
          <FlagID />
        </span>
        <span className="lang-menu-code lang-swap lang-swap-en">EN</span>
        <span className="lang-menu-code lang-swap lang-swap-id">ID</span>
        <ChevronDown size={12} aria-hidden className="lang-menu-chevron" />
      </button>

      {/* `inert` rather than hiding it: it takes the panel out of the tab order
          and the accessibility tree while still leaving it visible to CSS, so
          the close animation has something to play on. */}
      <div
        role="menu"
        aria-label="Language / Bahasa"
        inert={!open}
        className="lang-menu-panel"
      >
        {OPTIONS.map(({ code, label, Flag }, index) => (
          <button
            key={code}
            type="button"
            role="menuitemradio"
            aria-checked={locale === code}
            // What the stylesheet keys the pressed-in state to, via html[lang].
            data-set-locale={code}
            onClick={() => {
              setLocale(code);
              setOpen(false);
            }}
            style={{ "--item-delay": `${60 + index * 70}ms` } as CSSProperties}
            className="lang-menu-item"
          >
            <span className="lang-flag">
              <Flag />
            </span>
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
