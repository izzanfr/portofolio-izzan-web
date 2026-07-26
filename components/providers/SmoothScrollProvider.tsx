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
      /**
       * `lerp`, not `duration` + `easing`. Passing both was a silent
       * misconfiguration: Lenis takes duration whenever both are set, so the
       * lerp knob was dead.
       *
       * 0.2 rather than the 0.1 default, chosen from a recording of the real
       * problem. A mouse wheel adds 100px to the target per notch, and a burst
       * of seven notches in ~60ms puts the target ~600px ahead of the painted
       * position. Closing that gap takes ln(600)/(lerp*60) seconds — about
       * 880ms at 0.12, which matched the measured 845ms of coasting after the
       * page had already reached the bottom. That coast, with further wheel
       * input doing nothing because the target is already clamped, is what
       * feels like being shoved into the end of the page. At 0.2 the same gap
       * closes in ~530ms, and no scroll distance is discarded to get there.
       */
      lerp: 0.2,
      // Framer's loop drives it; see the note above.
      autoRaf: false,
      // Lenis takes over in-page anchors, which is what keeps the navbar links
      // smooth now that `scroll-behavior: smooth` is gone from the stylesheet.
      anchors: { offset: ANCHOR_OFFSET },
      /**
       * Drop the queued distance the moment the wheel changes direction.
       *
       * Lenis accumulates onto `targetScroll`, not onto the painted position,
       * and adds each notch to wherever the target already is. Scrolling down
       * hard leaves the target hundreds of pixels ahead of the page, so the
       * first flicks of the wheel back up only eat into that backlog: the
       * target falls while the page, still chasing it, keeps travelling *down*.
       * A recording of the real thing showed the target drop 4400 → 4200 while
       * the page carried on downward from 3985 to 4113 for another 123ms. That
       * is the pause before the scroll "unsticks".
       *
       * Collapsing the backlog onto the current position makes a reversal take
       * effect on the very next frame. Nothing is lost that the visitor still
       * wanted: they have just asked to go the other way, and this is how a
       * native scroller behaves, since it has no queue to unwind at all.
       *
       * Lenis calls this hook before it reads `targetScroll` to add the delta,
       * so assigning here lands in the same event.
       */
      virtualScroll: ({ deltaY }) => {
        const lenis = lenisRef.current;
        if (!lenis) return true;
        const backlog = lenis.targetScroll - lenis.animatedScroll;
        if (deltaY * backlog < 0) lenis.targetScroll = lenis.animatedScroll;
        return true;
      },
    });

    lenisRef.current = instance;

    // Dev-only handle for diagnosing scroll behaviour from the console. Never
    // shipped, and nothing in the app reads it.
    if (process.env.NODE_ENV !== "production") {
      (window as unknown as { lenis?: Lenis }).lenis = instance;
    }

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
