"use client";

import Lenis from "lenis";
import { cancelFrame, frame, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";

/**
 * Smooth scrolling, and the single source of truth for scroll position.
 *
 * Lenis is driven from Framer Motion's own frame loop rather than its built-in
 * `requestAnimationFrame` (`autoRaf: false`). That matters here: the scroll
 * progress bar, the Experience timeline and the backdrop parallax all read
 * scroll through `useScroll`, and if Lenis ran on a separate rAF those readings
 * would land a frame behind the position actually painted — the classic
 * "scroll-linked animation lags the page" symptom. One loop, one frame.
 *
 * Disabled outright under `prefers-reduced-motion`: hijacking the scroll is
 * exactly the kind of motion that setting asks us to drop, and native scrolling
 * is the right fallback rather than a quicker easing.
 *
 * Touch is left native (Lenis does not sync touch by default), so phones keep
 * the momentum scrolling the OS gives them and nothing is re-simulated in JS on
 * low-end hardware.
 *
 * The instance is shared as a ref, not as state: it is an external system, and
 * publishing it through state would re-render the entire tree the moment
 * scrolling initialises, for a value nothing renders from.
 */

const LenisContext = createContext<RefObject<Lenis | null> | null>(null);

/**
 * A ref to the live Lenis instance. Read `.current` at the moment you need it —
 * inside an effect or a handler — never during render: it is null until the
 * provider's effect runs, and stays null when smooth scrolling is off.
 */
export function useLenisRef() {
  return useContext(LenisContext);
}

/** Matches `scroll-padding-top` in globals.css — the fixed navbar's clearance,
 *  so an anchored section lands below the bar instead of behind it. */
const ANCHOR_OFFSET = -96;

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const prefersReducedMotion = useReducedMotion();
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (prefersReducedMotion) return;

    const instance = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      // Framer's loop drives it; see the note above.
      autoRaf: false,
      // Lenis takes over in-page anchors, which is what keeps the navbar links
      // smooth now that `scroll-behavior: smooth` is gone from the stylesheet.
      anchors: { offset: ANCHOR_OFFSET },
    });

    lenisRef.current = instance;

    const update = ({ timestamp }: { timestamp: number }) => instance.raf(timestamp);
    frame.update(update, true);

    return () => {
      cancelFrame(update);
      instance.destroy();
      lenisRef.current = null;
    };
  }, [prefersReducedMotion]);

  // On a route change the router jumps to the top; tell Lenis so it agrees with
  // the new position instead of easing back from the old one. Skipped when the
  // URL carries a hash, since that navigation is meant to land on a section.
  useEffect(() => {
    if (!lenisRef.current) return;
    if (window.location.hash) return;
    lenisRef.current.scrollTo(0, { immediate: true });
  }, [pathname]);

  return <LenisContext.Provider value={lenisRef}>{children}</LenisContext.Provider>;
}
