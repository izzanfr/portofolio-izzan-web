"use client";

import { motion, useMotionValue, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { useSectionArrival } from "./SectionCut";
import { VantaNet } from "./VantaNet";

/**
 * The experience section's ground.
 *
 * The model is the one the credentials page already uses and that this is meant
 * to sit alongside: a ground that belongs to the whole stretch rather than to a
 * box inside it, held still while the content travels over it. There it is a
 * pinned stage the rail slides across; here the ground is `sticky`, so it locks
 * to the viewport for the length of the section and is pushed back out when the
 * section ends. Scrolling through experience is scrolling through a space, not
 * past a panel.
 *
 * Layers, back to front:
 *
 *   · Two aurora ribbons, CSS-only. They carry the colour, and they are what is
 *     left when WebGL is not — no-script, no-GPU and reduced-motion visitors get
 *     a ground rather than a flat tint.
 *   · The Vanta NET lattice, loaded lazily on approach, resolving out of a
 *     radial zoom blur as the page arrives.
 *   · A veil, which is the legibility budget. It is thin while the page is
 *     arriving — the lattice is the thing being shown, so it gets to be seen —
 *     and thickens once the copy is what matters.
 *   · A reading scrim down the left, where all the type that is not on a card
 *     lives, and a vignette holding the edges down.
 *
 * How the page gets here is not this component's business any more. <SectionCut>
 * owns that: it plays the cut out of the hero and publishes how far the arrival
 * has come, and the lattice's zoom-blur pass reads that straight. With no cut
 * above — reduced motion, or any other tree — the fallback is simply "already
 * here", which is the right state for a section nobody transitioned into.
 */

export function ExperienceZone({ children }: { children: ReactNode }) {
  const zoneRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const still = Boolean(prefersReducedMotion);

  /* Hooks cannot be conditional, so the fallback is always built and only used
     when nothing above is publishing an arrival. 1 is "sharp, and here". */
  const cutArrival = useSectionArrival();
  const settled = useMotionValue(1);
  const arrival = cutArrival ?? settled;

  // Out of the way while the ground is being shown, drawn across once the
  // section's content is what matters.
  const veilOpacity = useTransform(arrival, [0.55, 1], [0.12, 0.62]);

  /**
   * The departure, and the reason the zone carries a tint of its own.
   *
   * A sticky element cannot leave its container, so once the zone's bottom is
   * closer than a viewport away the ground stops holding and travels up with
   * the content — which would drag the lattice off the last screenful of the
   * section and leave that copy sitting on bare page background. So the zone
   * paints the tint, the ground dissolves into it over exactly the stretch
   * where it stops holding, and what is left underneath is the same colour the
   * section was always on. The lattice settles out rather than sliding away.
   *
   * Still scroll-driven, unlike the arrival: leaving here really is a scroll.
   */
  const { scrollYProgress: departure } = useScroll({
    target: zoneRef,
    offset: ["end end", "end 25%"],
  });
  const groundOpacity = useTransform(departure, [0, 1], [1, 0]);

  return (
    <div ref={zoneRef} className="relative bg-tint">
      {/* Ground. `absolute inset-0` spans the zone; the sticky child inside it
          cannot escape that box, so the lattice is pushed back off screen when
          the section ends rather than bleeding into what follows.

          No `overflow-hidden` on any ancestor of this, deliberately: a clipped
          ancestor becomes the scroll container for anything sticky inside it,
          and a container that does not itself scroll cannot hold anything
          still. The clip belongs on the sticky element, where it works. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <motion.div
          style={{ opacity: groundOpacity }}
          className="sticky top-0 h-svh overflow-hidden bg-tint"
        >
          {/* Ribbons — the colour, and the fallback ground. */}
          <div className="absolute inset-x-0 -inset-y-[14%]">
            <span className="aurora-ribbon aurora-ribbon-a" />
            <span className="aurora-ribbon aurora-ribbon-b" />
          </div>

          {!still && <VantaNet arrival={arrival} />}

          {/* Legibility. A flat wash of the section's own tint, so thickening it
              changes how much lattice shows through without changing the colour
              anything sits on. */}
          <motion.div
            className="absolute inset-0 bg-tint"
            style={still ? { opacity: 0.62 } : { opacity: veilOpacity }}
          />

          {/* Reading scrim.

              Everything in the section that is not on a card is left-aligned
              inside the page container — the heading, the company header, the
              mono period line, the role rail — so the lattice only ever
              competes with type down the left. This calms exactly that side
              and leaves the right open, which is where the movement is worth
              watching anyway.

              Directional rather than a stronger veil: a uniform wash heavy
              enough to fix the left would have flattened the whole ground to
              do it, and the ground is the thing that was asked for. */}
          <div className="absolute inset-0 bg-gradient-to-r from-tint/70 from-0% via-tint/28 via-46% to-transparent to-80%" />

          {/* Holds the edges down: the lattice should not run into the navbar at
              the top or into the next section's boundary at the bottom. */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_28%,var(--tint)_92%)]" />
        </motion.div>
      </div>

      {/* The seam, and nothing but the seam.

          This band once carried a scroll-scrubbed curtain with an accent
          hairline and the site's diamond riding its edge, back when the
          boundary was something you scrolled through. The cut replaced that,
          and those marks outlived their reason: a cut lands *past* this band,
          so all they did was sit at the top of the arrival as a gold line and a
          gold dot behind the floating navbar — a leading edge for a movement
          that no longer happens.

          What is left is the join doing its one remaining job: fading the
          hero's ground into this section's tint, for the ways in that do not
          play the cut — a navbar anchor, a deep link, a dragged scrollbar —
          which would otherwise arrive on a hard colour change. */}
      <div
        aria-hidden
        className="pointer-events-none relative h-12 bg-gradient-to-b from-background to-transparent md:h-14"
      />

      {children}
    </div>
  );
}
