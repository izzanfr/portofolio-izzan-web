"use client";

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type Variants,
} from "framer-motion";
import { useSyncExternalStore, type MouseEvent } from "react";
import { T } from "@/components/ui/T";
import type { BiText } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Pieces shared by the two Experience layouts — the vertical accordion used on
 * narrow screens and the horizontal strips used from `md` up. Kept in their own
 * module so neither layout has to import the other.
 */

/** The site's standard curve, shared with the reveals and the nav pill. */
export const EASE = [0.22, 1, 0.36, 1] as const;

/* ---------------------------------------------------------------
   Role bullets — staggered reveal

   Variants rather than per-item delays: the list owns the rhythm, so
   adding a bullet to the content never means retuning a delay. Opening
   runs top-down and waits a beat for the panel to start opening;
   closing runs bottom-up and quicker, so the list clears out of the way
   rather than lingering while the panel collapses over it.
--------------------------------------------------------------- */
export const pointList: Variants = {
  hidden: { transition: { staggerChildren: 0.035, staggerDirection: -1 } },
  visible: { transition: { delayChildren: 0.08, staggerChildren: 0.07 } },
};

export const pointItem: Variants = {
  hidden: { opacity: 0, x: -10, transition: { duration: 0.14, ease: "easeIn" } },
  visible: { opacity: 1, x: 0, transition: { duration: 0.24, ease: EASE } },
};

export function RoleBullets({
  points,
  open,
  className,
  animateOnMount = false,
}: {
  points: BiText[];
  open: boolean;
  className?: string;
  /**
   * Replay the stagger when this list first mounts. The accordion leaves it off
   * — its panel is already open on load and should not flicker — while the
   * split rail turns it on, because there a fresh mount *is* the role changing.
   */
  animateOnMount?: boolean;
}) {
  return (
    <motion.ul
      initial={animateOnMount ? "hidden" : false}
      animate={open ? "visible" : "hidden"}
      variants={pointList}
      className={cn("space-y-2.5 text-sm leading-relaxed text-muted", className)}
    >
      {points.map((point, index) => (
        <motion.li key={index} variants={pointItem} className="relative pl-4">
          <span className="absolute left-0 top-[0.6em] h-1 w-1 rounded-full bg-accent" />
          <T en={point.en} id={point.id} />
        </motion.li>
      ))}
    </motion.ul>
  );
}

/* ---------------------------------------------------------------
   Media queries as external stores

   Read through useSyncExternalStore rather than an effect: the server
   snapshot is explicit, the markup matches on both sides, and there is
   no setState-in-effect cascade.
--------------------------------------------------------------- */
const FINE_POINTER = "(hover: hover) and (pointer: fine)";

function subscribeFinePointer(onChange: () => void) {
  const media = window.matchMedia(FINE_POINTER);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/**
 * Whether there is a real cursor to follow.
 *
 * False during SSR, so a touch device never wires the tilt handlers up at all.
 * Note this is a *capability* query, not a width one: the two-column split is
 * decided in CSS, so nothing about the layout depends on JS measuring the
 * viewport and correcting itself after hydration.
 */
export function useHasFinePointer() {
  return useSyncExternalStore(
    subscribeFinePointer,
    () => window.matchMedia(FINE_POINTER).matches,
    () => false,
  );
}

/* ---------------------------------------------------------------
   Cursor tilt
--------------------------------------------------------------- */

/** Cap on the cursor tilt. Past roughly this the card stops reading as a solid
 *  object catching the light and starts reading as a toy. */
export const TILT_DEGREES = 7;
const TILT_SPRING = { stiffness: 220, damping: 22, mass: 0.5 } as const;

/**
 * Maps the cursor's position inside an element to a small 3D tilt. Returns the
 * springs plus the two handlers to spread onto whatever element should be
 * measured; when `enabled` is false the handlers do nothing and the springs stay
 * at rest, so callers can drop the effect without changing their markup.
 */
export function useTilt(enabled: boolean) {
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);

  const rotateX = useSpring(
    useTransform(pointerY, [-0.5, 0.5], [TILT_DEGREES, -TILT_DEGREES]),
    TILT_SPRING,
  );
  const rotateY = useSpring(
    useTransform(pointerX, [-0.5, 0.5], [-TILT_DEGREES, TILT_DEGREES]),
    TILT_SPRING,
  );

  const onMouseMove = (event: MouseEvent<HTMLElement>) => {
    if (!enabled) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX - bounds.left) / bounds.width - 0.5);
    pointerY.set((event.clientY - bounds.top) / bounds.height - 0.5);
  };

  // Releasing to 0 lets the springs carry it back rather than snapping.
  const onMouseLeave = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  return { rotateX, rotateY, onMouseMove, onMouseLeave };
}
