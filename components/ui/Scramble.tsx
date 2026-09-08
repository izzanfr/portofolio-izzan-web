"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { useCurrentLocale } from "@/components/providers/LocaleProvider";
import { SCRAMBLE_DURATION } from "@/lib/motion";

/**
 * A monospace label that resolves out of noise the first time it is seen.
 *
 * The effect belongs to the monospace face and nothing else: those labels are
 * the site's machine voice — dates, counters, badges — and a brief settle reads
 * as a readout locking on. Applied to the serif headings it would read as a
 * gimmick, which is why this is a component you opt into rather than a global
 * behaviour.
 *
 * Three properties make it safe to sprinkle around:
 *
 * 1. The real text is the initial state, so the server renders the finished
 *    label. No script, no in-view event, no animation — the words are still
 *    there. Nothing here is load-bearing for legibility.
 * 2. Every frame emits exactly as many characters as the final string, so a
 *    label mid-scramble occupies the same box as the label at rest. In a
 *    monospace face that means not one pixel of reflow.
 * 3. It runs once. `useInView(once)` never re-arms, so scrolling back past a
 *    label leaves it alone.
 */

// Deliberately not the full alphabet: uppercase, digits and a few operators
// read as machine noise, while lowercase letters read as words half-formed.
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&/<>*+=";

// Punctuation, spaces and separators hold still. They are the label's skeleton
// — scrambling them turns a settling readout into visual static.
const SCRAMBLES = /[A-Za-z0-9]/;

// ~30fps. At a full 60 the glyphs churn faster than the eye resolves them,
// which reads as a flicker rather than as characters being searched through.
const FRAME_MS = 33;

type ScrambleProps = {
  /** A plain string, for labels that are not translated. */
  text?: string;
  /** Or the same `{en, id}` pair `<T>` takes, so this drops straight in. */
  en?: string;
  id?: string;
  className?: string;
};

export function Scramble({ text, en, id, className }: ScrambleProps) {
  const locale = useCurrentLocale();
  const resolved = text ?? (locale === "id" ? (id ?? en ?? "") : (en ?? id ?? ""));

  const ref = useRef<HTMLSpanElement>(null);
  // `once`: the arming is one-way, so this stays true forever after the first
  // sighting and the effect below never re-runs on scroll.
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduceMotion = useReducedMotion();

  const [display, setDisplay] = useState(resolved);

  // Adjusting state during render rather than in an effect — the pattern React
  // documents for "a prop changed and derived state must follow it". Switching
  // language mid-page replaces the text under a label that may already have
  // played; without this it would keep showing the old language's characters.
  const [previous, setPrevious] = useState(resolved);
  if (previous !== resolved) {
    setPrevious(resolved);
    setDisplay(resolved);
  }

  useEffect(() => {
    // Not in view yet, or the visitor asked for less motion: `display` is
    // already the finished text, so there is nothing to do and nothing to undo.
    if (!inView || reduceMotion) return;

    const characters = [...resolved];
    const start = performance.now();
    let frame = 0;
    let lastPaint = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / SCRAMBLE_DURATION);

      if (progress >= 1) {
        setDisplay(resolved);
        return;
      }

      if (now - lastPaint >= FRAME_MS) {
        lastPaint = now;
        // Left to right: the settled prefix grows while the tail keeps
        // churning, so the label reads as being typed out rather than as a
        // block of noise fading into place.
        const settled = Math.floor(progress * progress * characters.length);
        setDisplay(
          characters
            .map((character, index) =>
              index < settled || !SCRAMBLES.test(character)
                ? character
                : GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
            )
            .join(""),
        );
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, reduceMotion, resolved]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
