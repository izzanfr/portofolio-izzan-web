"use client";

import { animate, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useIntroDone } from "@/components/Preloader";

/**
 * A stat that counts up from zero the first time it is seen.
 *
 * The number is found inside the string ("10+", "1000+", "4 yrs"), so the prefix
 * and suffix stay as written and only the digits run. Waits for the intro
 * curtain as well as for the viewport: the hero stats sit on the first screen,
 * and counting behind the overlay would finish before anyone sees it.
 *
 * - The finished value is reserved invisibly underneath, so the card never
 *   changes width while "0" grows into "1000+".
 * - Screen readers get the finished value once, never the intermediate numbers.
 * - Reduced motion shows the finished value straight away.
 * - It plays once; a language switch afterwards just swaps the suffix.
 */

const NUMBER = /^(\D*)(\d+)(.*)$/;
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

export function CountUp({ value, delay = 0, duration = 1.2 }: { value: string; delay?: number; duration?: number }) {
  const match = NUMBER.exec(value);
  // Primitives for the effect: `match` is a fresh object every render, and
  // depending on it would restart the count on each frame it paints.
  const hasNumber = match !== null;
  const target = match ? Number(match[2]) : 0;

  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const introDone = useIntroDone();
  const reduceMotion = useReducedMotion();
  const [current, setCurrent] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!hasNumber || done || !inView || !introDone || reduceMotion) return;
    const controls = animate(0, target, {
      duration,
      delay,
      ease: EASE_OUT_EXPO,
      onUpdate: (latest) => setCurrent(Math.round(latest)),
      onComplete: () => setDone(true),
    });
    return () => controls.stop();
  }, [hasNumber, done, inView, introDone, reduceMotion, target, duration, delay]);

  const shown = !match || done || reduceMotion ? value : `${match[1]}${current}${match[3]}`;

  return (
    <span ref={ref} className="relative inline-grid">
      <span className="sr-only">{value}</span>
      <span aria-hidden className="invisible [grid-area:1/1]">{value}</span>
      <span aria-hidden className="tabular-nums [grid-area:1/1]">{shown}</span>
    </span>
  );
}
