"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useState } from "react";
import { Reveal } from "./Reveal";
import type { DocumentationImage } from "@/lib/projects";
import { cn } from "@/lib/utils";
import { EASE } from "@/lib/motion";

/**
 * Project documentation, shown full-size in the page — no click-to-enlarge.
 *
 * One image: displayed as-is at a generous width. Several: a wide coverflow —
 * the active document sits centred and upright, its neighbours turned back in 3D
 * on either side, the rest carried by the dots. Arrows, a click on a side card,
 * and the dots move through it, looping both ways; the turn between positions is
 * the "rotating" motion. The centre document is the full view, so nothing here
 * opens a lightbox.
 *
 * The coverflow frames are fixed-aspect, which lets them use next/image; the
 * single-image case uses a plain <img> so it keeps its natural aspect ratio.
 */

// Pose per signed distance from the active card. Side cards turn away in 3D and
// fade; anything past a neighbour parks off to its side at zero opacity so it
// fades in/out from there rather than sliding across the whole stage.
function pose(distance: number) {
  if (distance === 0) return { x: "0%", scale: 1, rotateY: 0, opacity: 1, z: 30, shown: true };
  if (distance === 1) return { x: "50%", scale: 0.8, rotateY: -30, opacity: 0.55, z: 20, shown: true };
  if (distance === -1) return { x: "-50%", scale: 0.8, rotateY: 30, opacity: 0.55, z: 20, shown: true };
  const sign = distance > 0 ? 1 : -1;
  return { x: `${sign * 74}%`, scale: 0.68, rotateY: -sign * 34, opacity: 0, z: 10, shown: false };
}

export function ProjectDocumentation({
  images,
  title,
}: {
  images: DocumentationImage[];
  title: string;
}) {
  // Cover first, so it leads the coverflow.
  const ordered = [...images].sort((a, b) => Number(b.cover) - Number(a.cover));
  const count = ordered.length;

  const [active, setActive] = useState(0);
  const go = useCallback(
    (delta: number) => setActive((current) => (current + delta + count) % count),
    [count],
  );

  // Empty folder / no field — render nothing.
  if (count === 0) return null;

  const single = count === 1;

  // Shortest signed distance, so the coverflow wraps at both ends.
  const signedDistance = (index: number) => {
    let d = index - active;
    if (d > count / 2) d -= count;
    if (d < -count / 2) d += count;
    return d;
  };

  return (
    <Reveal delay={0.14}>
      <div className="container-page mt-12 md:mt-16">
        {single ? (
          <figure
            className="mx-auto max-w-[560px] overflow-hidden rounded-xl bg-surface-2"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ordered[0].src} alt={ordered[0].alt} className="block w-full" />
          </figure>
        ) : (
          <div
            className="mx-auto w-full max-w-[1000px]"
            role="group"
            aria-label={`${title} documentation`}
          >
            <div className="relative">
              {/* Clip and perspective are split across two elements: together on
                  one, Chrome flattens the 3D turn. */}
              <div className="overflow-hidden">
                <div className="relative h-[380px] [perspective:1600px] sm:h-[640px]">
                  {ordered.map((doc, index) => {
                    const distance = signedDistance(index);
                    const p = pose(distance);
                    const isCenter = distance === 0;
                    // Wider on phones (little room for peeks), the intended
                    // coverflow proportion from sm up.
                    const frame =
                      "relative block aspect-[5/7] w-[62%] overflow-hidden rounded-xl bg-surface-2 sm:w-[44%]";
                    return (
                      <motion.div
                        key={doc.src + index}
                        aria-hidden={!isCenter}
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ zIndex: p.z, pointerEvents: p.shown ? "auto" : "none" }}
                        initial={false}
                        animate={{ x: p.x, scale: p.scale, rotateY: p.rotateY, opacity: p.opacity }}
                        transition={{ duration: 0.5, ease: EASE }}
                      >
                        {isCenter ? (
                          <div className={frame} style={{ boxShadow: "var(--shadow-card)" }}>
                            <Image
                              src={doc.src}
                              alt={doc.alt}
                              fill
                              sizes="(max-width: 640px) 62vw, 460px"
                              className="object-contain"
                            />
                          </div>
                        ) : (
                          <button
                            type="button"
                            tabIndex={p.shown ? 0 : -1}
                            onClick={() => setActive(index)}
                            aria-label={`Show document ${index + 1} of ${count}`}
                            className={frame}
                            style={{ boxShadow: "var(--shadow-card)" }}
                          >
                            <Image
                              src={doc.src}
                              alt=""
                              fill
                              sizes="(max-width: 640px) 62vw, 460px"
                              className="object-contain"
                            />
                          </button>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous document"
                className="absolute left-0 top-1/2 z-40 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-border bg-background/85 text-foreground backdrop-blur transition-colors hover:border-accent hover:text-accent-strong dark:hover:text-accent"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next document"
                className="absolute right-0 top-1/2 z-40 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-border bg-background/85 text-foreground backdrop-blur transition-colors hover:border-accent hover:text-accent-strong dark:hover:text-accent"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="mt-6 flex justify-center gap-2">
              {ordered.map((doc, index) => (
                <button
                  key={doc.src + index}
                  type="button"
                  onClick={() => setActive(index)}
                  aria-label={`Show document ${index + 1} of ${count}`}
                  aria-current={index === active}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    index === active
                      ? "w-6 bg-accent-600 dark:bg-accent"
                      : "w-1.5 bg-border hover:bg-muted",
                  )}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </Reveal>
  );
}
