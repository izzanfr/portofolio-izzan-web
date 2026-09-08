"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import {
  EASE,
  REVEAL_DISTANCE,
  REVEAL_DURATION,
  STAGGER_STEP,
  VIEWPORT,
} from "@/lib/motion";

/**
 * Runs when this chunk evaluates, which is the signal the head script's
 * watchdog waits for: the motion runtime is here, so the provisional `.js`
 * mark can stand and the reveals it hides will actually be animated open.
 */
if (typeof document !== "undefined") {
  document.documentElement.dataset.motionReady = "";
}

type Direction = "up" | "down" | "left" | "right" | "none";

const offset: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: REVEAL_DISTANCE },
  down: { x: 0, y: -REVEAL_DISTANCE },
  left: { x: REVEAL_DISTANCE, y: 0 },
  right: { x: -REVEAL_DISTANCE, y: 0 },
  none: { x: 0, y: 0 },
};

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: Direction;
  /** Stagger children that are themselves <Reveal.Item> elements. */
  as?: "div" | "section" | "li" | "article";
};

/**
 * The one entrance on the site: a short rise into place, once, when the element
 * is first seen.
 *
 * `data-reveal` is not decoration. It is the hook the stylesheet uses to force
 * this element visible when the page is unscripted or the visitor has asked for
 * reduced motion — see the `[data-reveal]` rules in globals.css. Framer's
 * `initial` writes `opacity: 0` into the server HTML, and those rules are what
 * make that state provisional rather than permanent.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  direction = "up",
  as = "div",
}: RevealProps) {
  const reduceMotion = useReducedMotion();
  const { x, y } = offset[direction];
  const MotionTag = motion[as];

  // Reduced motion is honoured twice over: here, so Framer never animates, and
  // in CSS, so the element is visible even before this component hydrates.
  if (reduceMotion) {
    return (
      <MotionTag data-reveal className={className}>
        {children}
      </MotionTag>
    );
  }

  return (
    <MotionTag
      data-reveal
      className={className}
      initial={{ opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: REVEAL_DURATION, delay, ease: EASE }}
    >
      {children}
    </MotionTag>
  );
}

export const staggerParent: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: STAGGER_STEP, delayChildren: 0.05 } },
};

export const staggerChild: Variants = {
  hidden: { opacity: 0, y: REVEAL_DISTANCE },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: REVEAL_DURATION, ease: EASE },
  },
};
