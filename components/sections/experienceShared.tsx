"use client";

import { motion, type Variants } from "framer-motion";
import { useSyncExternalStore, type MouseEvent, type ReactNode } from "react";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { ExperienceGallery } from "@/components/ui/ExperienceGallery";
import { T } from "@/components/ui/T";
import type { BiRole } from "@/lib/experience";
import type { BiText } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Pieces shared by the two Experience layouts — the vertical column used on
 * narrow screens and under reduced motion, and the pinned horizontal stage from
 * `md` up. Kept in their own module so neither layout has to import the other.
 */

/** The site's standard curve, shared with the reveals and the nav pill. */
import { EASE } from "@/lib/motion";

/** Re-exported so the Experience components keep importing their motion
 *  vocabulary from one neighbouring module rather than reaching past it. */
export { EASE };

/* ---------------------------------------------------------------
   Two surfaces, one card

   A stop used to be three floating panels stacked on the lattice — a
   header card, a rail card and a detail card, each with its own border
   and its own 92% fill. Three borders inside one another is what read
   as clutter: nothing said which box owned which, and the rhythm of
   the section was decided by whichever panel happened to be tallest.

   So a stop is now exactly one card, and everything inside it is an
   *inset* rather than a peer: no shadow of its own, a lighter fill
   than the card it sits in, and a hairline instead of a full border.
   Elevation runs one way — page, card, inset — and the eye can follow
   it.

   STOP_SURFACE is nearly opaque on purpose. It sits over a moving
   WebGL lattice, and small muted type with lines crossing it is what
   made this section hard to read before the fill went up. Not fully
   opaque, and deliberately not `backdrop-blur`: a hair of translucency
   keeps the card sitting *on* the ground rather than punched out of
   it. `lattice-card` switches the per-glyph halo back off (see
   `.on-lattice` in globals.css) — inside a card the type has a surface
   of its own and does not need one.
--------------------------------------------------------------- */
export const STOP_SURFACE =
  "lattice-card rounded-card border border-border bg-surface/94 shadow-[var(--shadow-card)]";

export const INSET_SURFACE = "rounded-xl border border-border/70 bg-surface-2/55";

/* ---------------------------------------------------------------
   A section label

   The mono, letter-spaced, uppercase micro-heading used above the role
   rail, in the eyebrow under the section heading, and inside the
   gallery. Small enough to be furniture, consistent enough to read as
   one system rather than three near-misses.
--------------------------------------------------------------- */
export function MicroLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "font-mono text-[10px] uppercase leading-none tracking-[0.16em] text-muted",
        className,
      )}
    >
      {children}
    </p>
  );
}

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
  hidden: {
    opacity: 0,
    x: -10,
    transition: { duration: 0.14, ease: "easeIn" },
  },
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
  /** Replay the stagger when this list first mounts — in the split rail a fresh
   *  mount *is* the role changing, which is exactly what the stagger is for. */
  animateOnMount?: boolean;
}) {
  return (
    <motion.ul
      initial={animateOnMount ? "hidden" : false}
      animate={open ? "visible" : "hidden"}
      variants={pointList}
      className={cn("space-y-2 text-sm leading-relaxed text-muted", className)}
    >
      {points.map((point, index) => (
        <motion.li key={index} variants={pointItem} className="relative pl-5">
          {/* A hairline rule rather than a dot. At four or five bullets a
              column of dots reads as texture; a short rule reads as an indent,
              and it lines the copy up with the panel heading above it. */}
          <span className="absolute left-0 top-[0.72em] h-px w-2.5 bg-accent/70" />
          <T en={point.en} id={point.id} />
        </motion.li>
      ))}
    </motion.ul>
  );
}

/* ---------------------------------------------------------------
   Role detail panel

   One component for both cases. A company with seven roles picks which
   one fills it; a company with one has no rail at all and renders
   straight into it — which is what replaced the single-item accordion.
   An accordion whose only row is permanently open is a chevron that
   does nothing, and it made the two companies look like different
   components rather than two instances of one.
--------------------------------------------------------------- */
export function RolePanel({ role, className }: { role: BiRole; className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex items-center gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent/12 text-accent-strong">
          <DynamicIcon name={role.icon} size={16} />
        </span>
        <h4 className="min-w-0 font-display text-base tracking-[-0.02em] md:text-xl">
          <T en={role.title.en} id={role.title.id} />
        </h4>
      </div>

      <RoleBullets points={role.points} open animateOnMount className="mt-4" />

      <ExperienceGallery photos={role.photos} roleTitle={role.title} className="mt-5" />
    </div>
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
 * False during SSR, so a touch device never wires the pointer handlers up at
 * all. Note this is a *capability* query, not a width one: the two-column split
 * is decided in CSS, so nothing about the layout depends on JS measuring the
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
   Cursor sheen

   What replaced the 3D tilt on these cards, and the reason is the
   stage rather than the effect. A tilt is a transform, and a card 1100
   pixels wide turning 7° under `perspective` overhangs its own layout
   box by roughly 30px a side — which had to be bought with padding and
   a matching negative margin on a stage that is already fighting for
   height, and which put a second transform on elements GSAP is
   scrubbing.

   A sheen costs no layout at all: two custom properties on the card and
   a radial highlight painted in `::after` (see `.exp-stop` in
   globals.css). It reads as a surface catching light, which is what the
   tilt was actually for, and it cannot collide with anything.

   Written straight to `style` rather than through React state: this
   fires on every pointer move, and a re-render per frame for a value
   nothing renders from is the one thing that would make it expensive.
   The handlers are inert when `enabled` is false, so a touch device
   keeps identical markup and simply never lights up.
--------------------------------------------------------------- */
export function useSheen(enabled: boolean) {
  const onMouseMove = (event: MouseEvent<HTMLElement>) => {
    if (!enabled) return;
    const card = event.currentTarget;
    const bounds = card.getBoundingClientRect();
    card.style.setProperty("--sheen-x", `${event.clientX - bounds.left}px`);
    card.style.setProperty("--sheen-y", `${event.clientY - bounds.top}px`);
    card.style.setProperty("--sheen-opacity", "1");
  };

  const onMouseLeave = (event: MouseEvent<HTMLElement>) => {
    event.currentTarget.style.setProperty("--sheen-opacity", "0");
  };

  return { onMouseMove, onMouseLeave };
}
