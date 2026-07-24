"use client";

import { useLocale } from "@/components/providers/LocaleProvider";
import { cn } from "@/lib/utils";

/**
 * Two-option EN / ID switch. Like the theme toggle, both options are always
 * rendered and which one reads as active is decided by CSS keyed on <html lang>
 * (see `.lang-opt` in globals.css) — so it never mismatches the dual-rendered
 * content and carries no hydration flash.
 */
export function LanguageToggle({ className }: { className?: string }) {
  const { setLocale } = useLocale();

  return (
    <div
      role="group"
      aria-label="Language / Bahasa"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-border/70 p-0.5",
        className,
      )}
    >
      <button
        type="button"
        data-set-locale="en"
        onClick={() => setLocale("en")}
        aria-label="Switch to English"
        className="lang-opt rounded-full px-2.5 py-1 font-mono text-[11px] font-medium tracking-wide"
      >
        EN
      </button>
      <button
        type="button"
        data-set-locale="id"
        onClick={() => setLocale("id")}
        aria-label="Ganti ke Bahasa Indonesia"
        className="lang-opt rounded-full px-2.5 py-1 font-mono text-[11px] font-medium tracking-wide"
      >
        ID
      </button>
    </div>
  );
}
