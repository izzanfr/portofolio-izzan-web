"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/**
 * Thin reading-progress bar pinned to the very top edge of the viewport,
 * above the navbar. It reads document scroll from 0 at the top of the page
 * to 1 at the bottom, so its width is proportional to how far through the
 * page you are — long project pages fill slowly, short pages quickly.
 *
 * Implemented with Framer Motion's `useScroll` (a passive, rAF-batched
 * scroll subscription) feeding a `scaleX` transform, so nothing re-renders
 * on scroll and the animation stays on the compositor. A light spring takes
 * the edge off fast flicks without lagging behind the thumb.
 *
 * Sits at z-[65]: above the navbar (z-50) and grain (z-60), below modals
 * (z-[70]). It lives on the top edge, clearly separated from the navbar's
 * own scroll-spy underline lower down, so the two indicators don't read as
 * one control.
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[65] h-[3px] origin-left bg-[linear-gradient(90deg,var(--accent-400),var(--accent-500),var(--accent-600))]"
    />
  );
}
