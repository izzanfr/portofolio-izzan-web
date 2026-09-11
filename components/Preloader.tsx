"use client";

import { AnimatePresence, motion, type Variants } from "framer-motion";
import { useEffect, useState } from "react";
import { EASE } from "@/lib/motion";

/**
 * Ends on "Halo": the local greeting closes the sequence, so the last thing on
 * screen before the reveal is the one that belongs to the site's owner.
 */
const GREETINGS = [
  "Hello",
  "Bonjour",
  "Ciao",
  "Hola",
  "こんにちは",
  "안녕하세요",
  "Hallo",
  "Olá",
  "Namaste",
  "Halo",
];

/** First word lingers so the intro reads as deliberate rather than a glitch. */
const FIRST_MS = 700;
/**
 * Middle cadence. Words cross-fade over ~0.28s, so at this step the outgoing
 * word is still clearing as the next arrives: the sequence never fully settles,
 * which is what stops it reading as a stack of hard cuts.
 */
const STEP_MS = 170;
/** "Halo" holds a beat longer as the closing note. */
const LAST_MS = 560;

const TOTAL_MS = FIRST_MS + (GREETINGS.length - 2) * STEP_MS + LAST_MS;

export const INTRO_ATTR = "data-preload";
export const INTRO_DONE_CLASS = "intro-done";
export const INTRO_DONE_EVENT = "izzan:intro-done";
export const INTRO_STORAGE_KEY = "izzan-intro";

/**
 * Inlined in <head> ahead of first paint, same pattern as the locale script.
 * Deciding here rather than in React means a returning visitor never sees a
 * frame of navy before hydration clears it. The flag is written up front, so a
 * refresh partway through the animation does not replay it either.
 *
 * Only an arrival on the homepage plays it. A deep link — a project opened in
 * a new tab, a shared URL — should land on what was asked for, not on a
 * greeting; and since sessionStorage is per tab, every new tab would otherwise
 * count as a first visit.
 */
export const preloaderInitScript = `(function(){try{if(location.pathname!=="/")return;var k="${INTRO_STORAGE_KEY}";if(sessionStorage.getItem(k))return;sessionStorage.setItem(k,"1");if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;document.documentElement.setAttribute("${INTRO_ATTR}","");}catch(e){}})();`;

/** Curtain length, and the grace period the safety net waits out. */
const EXIT_MS = 800;

/**
 * Variants rather than inline props: the panel's `exit` propagates to the
 * children, so the word drifts up as the curtain rises instead of vanishing
 * with it.
 */
const panelVariants: Variants = {
  // Stated explicitly: computed `clip-path` is `none`, which cannot interpolate
  // to an inset(), so the curtain would jump instead of sliding.
  visible: { clipPath: "inset(0 0 0% 0)" },
  exit: {
    clipPath: "inset(0 0 100% 0)",
    transition: { duration: EXIT_MS / 1000, ease: EASE },
  },
};

const wordVariants: Variants = {
  hidden: { opacity: 0, y: 20, filter: "blur(7px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.28, ease: EASE },
  },
  out: {
    opacity: 0,
    y: -20,
    filter: "blur(7px)",
    transition: { duration: 0.24, ease: EASE },
  },
  exit: { y: -70, opacity: 0, transition: { duration: 0.5, ease: EASE } },
};

export function Preloader() {
  const [running, setRunning] = useState(true);
  const [gone, setGone] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const root = document.documentElement;

    // The head script is the single source of truth for whether this visit
    // animates. No attribute means the overlay is already display:none.
    if (!root.hasAttribute(INTRO_ATTR)) {
      setRunning(false);
      return;
    }

    const timers = GREETINGS.slice(1).map((_, i) =>
      window.setTimeout(() => setIndex(i + 1), FIRST_MS + i * STEP_MS),
    );

    const finish = window.setTimeout(() => {
      setRunning(false);
      root.classList.add(INTRO_DONE_CLASS);
      window.dispatchEvent(new Event(INTRO_DONE_EVENT));
    }, TOTAL_MS);

    // Safety net. The exit animation runs on requestAnimationFrame, which a
    // background tab pauses outright, so an overlay left mid-exit would still
    // be covering the page when the visitor came back. Timers are only
    // throttled, not paused, so this one still lands and tears the panel out
    // of the tree regardless of what the animation is doing.
    const safety = window.setTimeout(() => setGone(true), TOTAL_MS + EXIT_MS + 400);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(finish);
      clearTimeout(safety);
    };
  }, []);

  // Unmounting AnimatePresence itself is what makes the safety net absolute:
  // removing only its child would leave the exit animation in charge.
  if (gone) return null;

  const isLast = index === GREETINGS.length - 1;

  return (
    // initial={false} so the panel never animates in: it is server-rendered and
    // already covering the page on the first frame.
    <AnimatePresence initial={false}>
      {running && (
        <motion.div
          key="preloader"
          aria-hidden
          // aria-hidden plus no focusable children: the page underneath stays
          // fully available to screen readers and keyboard tabbing throughout.
          className="preloader-root fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-navy"
          variants={panelVariants}
          animate="visible"
          exit="exit"
        >
          {/* Every word lands in the same grid cell, so the outgoing and
              incoming words overlap and cross-fade in place. Stacking this way
              rather than with absolute positioning leaves `transform` free for
              the animation to own. */}
          <motion.div variants={wordVariants} className="grid place-items-center">
            <AnimatePresence>
              <motion.p
                key={index}
                variants={wordVariants}
                initial="hidden"
                animate="visible"
                exit="out"
                className={`col-start-1 row-start-1 whitespace-nowrap font-display text-5xl tracking-display md:text-7xl ${
                  isLast ? "text-accent" : "text-white"
                }`}
              >
                {GREETINGS[index]}
              </motion.p>
            </AnimatePresence>
          </motion.div>

          <motion.span
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-px origin-left bg-accent/70"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: TOTAL_MS / 1000, ease: "linear" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * True once the intro has finished, or immediately when this visit skips it.
 * Lets the hero hold its entrance until the curtain is actually rising.
 */
export function useIntroDone() {
  const [done, setDone] = useState(true);

  useEffect(() => {
    const root = document.documentElement;
    if (!root.hasAttribute(INTRO_ATTR)) return;
    if (root.classList.contains(INTRO_DONE_CLASS)) return;

    setDone(false);
    const onDone = () => setDone(true);
    window.addEventListener(INTRO_DONE_EVENT, onDone);
    return () => window.removeEventListener(INTRO_DONE_EVENT, onDone);
  }, []);

  return done;
}
