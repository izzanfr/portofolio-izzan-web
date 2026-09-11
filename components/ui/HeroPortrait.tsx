"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { FlipHorizontal2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { profile } from "@/lib/content";
import { EASE } from "@/lib/motion";

const SIZES = "(max-width: 640px) 15rem, (max-width: 1024px) 17rem, 30rem";

/**
 * Hero portrait: a borderless photo with an ambient glow (styled in globals.css)
 * that flips on click to a second photo. Front is the profile photo, back is a
 * public-speaking shot.
 *
 * The flip is a real 3D turn, not a crossfade: both faces stay mounted inside a
 * preserve-3d parent, each with its backface hidden, and the parent's rotateY
 * animates between them. AnimatePresence would swap one face for the other and
 * lose the sense of a single card turning over — hence the two-face approach the
 * flip-card idiom is built on.
 *
 * The rounded clip lives on a STATIC wrapper, not on the rotating faces. A
 * rounded overflow-clip that is itself rotated in 3D leaves an anti-aliased
 * light fringe along one edge of the turned face; clipping with a flat, unrotated
 * mask keeps that edge clean. Perspective sits on its own layer so it never
 * shares an element with the clip — the two together flatten the 3D in Chrome.
 *
 * The whole card is a <button>, so a tap flips it on touch devices where there
 * is no hover. Hover only drives the ambient extras (glow, scale).
 */
function Face({
  src,
  alt,
  priority,
  className,
}: {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("absolute inset-0 [backface-visibility:hidden]", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={SIZES}
        priority={priority}
        // The optimizer refuses SVG without dangerouslyAllowSVG; a placeholder
        // SVG is served as-is. A real JPG drops straight in and gets optimised.
        unoptimized={src.endsWith(".svg")}
        className="portrait-img object-cover object-center"
      />
    </div>
  );
}

export function HeroPortrait() {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="portrait-stage relative w-full">
      {/* Ambient glow, matched to the card's shape and sitting behind it so it
          reads as a halo the photo floats in — not a frame around it. Static, so
          it holds still while the card flips. */}
      <div
        aria-hidden
        className="portrait-glow-layer pointer-events-none absolute inset-0 -z-10 rounded-card"
      />

      <button
        type="button"
        onClick={() => setFlipped((value) => !value)}
        aria-pressed={flipped}
        aria-label={flipped ? "Show profile photo" : "Flip to public speaking photo"}
        className="relative block w-full"
      >
        {/* Static rounded clip — never rotated, so its edge stays clean. */}
        <div className="relative aspect-square w-full overflow-hidden rounded-card bg-surface">
          {/* Perspective on its own layer, apart from the clip above. */}
          <div className="absolute inset-0 [perspective:1200px]">
            <motion.div
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: 0.6, ease: EASE }}
              style={{ transformStyle: "preserve-3d" }}
              className="relative h-full w-full"
            >
              <Face src={profile.avatar} alt={profile.name} priority />
              <Face
                src={profile.avatarBack}
                alt={`${profile.name} speaking to an audience`}
                className="[transform:rotateY(180deg)]"
              />
            </motion.div>
          </div>
        </div>
      </button>

      {/* Affordance: says the photo is interactive without stealing the click —
          the button underneath owns it. Sits over both faces, so it stays put
          while the card turns. */}
      <span
        aria-hidden
        className="portrait-chip pointer-events-none absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full border border-border/70 bg-background/70 text-accent-strong backdrop-blur-md transition-all duration-300"
      >
        <FlipHorizontal2 size={15} />
      </span>
    </div>
  );
}
