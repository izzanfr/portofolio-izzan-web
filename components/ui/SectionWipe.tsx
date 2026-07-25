"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * The signature transition at a section boundary: the section's ground — its
 * tint and its ambient wash — is uncovered by a curtain rising from the bottom,
 * with a thin amber line riding the leading edge.
 *
 * Only the backdrop wipes. The content inside keeps the fade-and-slide reveals
 * it already had, so this reads as the stage being set rather than as a second
 * animation competing with the copy.
 *
 * `inset(100% 0 0 0)` insets the top edge by the full height, leaving nothing
 * visible; animating that inset to 0 walks the top edge upward, so the visible
 * band grows from the bottom up. The seam is a separate transform-only layer
 * translated by the same proportion, which keeps it on the clip edge without
 * animating a layout property.
 *
 * Fires once — scrubbing up and down across the same boundary must not replay
 * it, or the page flickers every time the visitor changes their mind.
 */

const EASE = [0.22, 1, 0.36, 1] as const;
const DURATION = 0.7;

export function SectionWipe({
  tinted,
  children,
}: {
  /** Whether this section carries the alternating navy wash. */
  tinted?: boolean;
  /** The backdrop layers to reveal. */
  children: React.ReactNode;
}) {
  const prefersReducedMotion = useReducedMotion();

  // Reduced motion keeps the section's ground, just without the sweep.
  if (prefersReducedMotion) {
    return (
      <div aria-hidden className={cn("absolute inset-0", tinted && "bg-tint")}>
        {children}
      </div>
    );
  }

  return (
    <>
      <motion.div
        aria-hidden
        initial={{ clipPath: "inset(100% 0 0 0)" }}
        whileInView={{ clipPath: "inset(0% 0 0 0)" }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: DURATION, ease: EASE }}
        className={cn("absolute inset-0", tinted && "bg-tint")}
      >
        {children}
      </motion.div>

      {/* Rides the clip edge. Full-height layer translated from 100% to 0, so
          the hairline pinned to its top edge tracks the reveal exactly. */}
      <motion.div
        aria-hidden
        initial={{ y: "100%", opacity: 0 }}
        whileInView={{ y: "0%", opacity: [0, 1, 1, 0] }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{
          duration: DURATION,
          ease: EASE,
          opacity: { duration: DURATION, times: [0, 0.12, 0.65, 1] },
        }}
        style={{ willChange: "transform" }}
        className="pointer-events-none absolute inset-0 z-[1]"
      >
        <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent" />
      </motion.div>
    </>
  );
}
