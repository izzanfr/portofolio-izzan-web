"use client";

import {
  AnimatePresence,
  motion,
  useIsPresent,
  useReducedMotion,
} from "framer-motion";
import { useState } from "react";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { ExperienceGallery } from "@/components/ui/ExperienceGallery";
import { T } from "@/components/ui/T";
import type { BiRole } from "@/lib/experience";
import { cn } from "@/lib/utils";
import { EASE, RoleBullets, useHasFinePointer, useTilt } from "./experienceShared";

/**
 * A company's roles as master–detail: the list of roles on a rail, the selected
 * role's content in a panel beside it.
 *
 * The two-column split is done in CSS (`md:flex-row`), not by measuring the
 * viewport in JS. That matters — a JS breakpoint would have to guess a value
 * during SSR and then correct itself on the first client frame, which is a
 * visible re-layout. Below `md` the same rail simply becomes a horizontal strip
 * of tabs above the panel.
 *
 * Every label reads horizontally in both layouts; nothing here is rotated.
 */

function RailItem({
  role,
  isActive,
  onSelect,
  reduceMotion,
}: {
  role: BiRole;
  isActive: boolean;
  onSelect: () => void;
  reduceMotion: boolean;
}) {
  /**
   * False while this row is playing its exit after being filtered out.
   * AnimatePresence keeps an exiting child rendered with its *last* props, so a
   * row that was selected when the filter removed it would go on drawing the
   * marker — leaving two elements claiming the same layoutId at once, which
   * makes the marker animate to the wrong place.
   */
  const isPresent = useIsPresent();

  return (
    <motion.li
      // `position` only: the item's own box never changes size, so this animates
      // the reflow after a filter without ever scaling — and so without the
      // blurring that a size layout animation would put on the label.
      layout="position"
      exit={{ opacity: 0, scale: 0.95 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.35, ease: EASE }}
      className="shrink-0 md:shrink"
    >
      <button
        type="button"
        onClick={onSelect}
        aria-current={isActive ? "true" : undefined}
        className={cn(
          "relative flex w-full items-center gap-2.5 whitespace-nowrap rounded-full px-4 py-2.5 text-left transition-colors duration-200",
          "md:gap-3 md:rounded-lg md:px-4 md:py-3.5 md:whitespace-normal",
          isActive ? "text-foreground" : "text-muted hover:text-foreground",
        )}
      >
        {isActive && isPresent && (
          // One shared element across all rows, so the marker flows from the
          // old row to the new one instead of blinking out and back in.
          <motion.span
            layoutId="rail-active-marker"
            transition={reduceMotion ? { duration: 0 } : { duration: 0.35, ease: EASE }}
            className={cn(
              "absolute inset-0 -z-10 rounded-full bg-accent/12",
              "md:rounded-lg md:border-l-[3px] md:border-accent",
            )}
          />
        )}

        <DynamicIcon
          name={role.icon}
          size={16}
          className={cn(
            "shrink-0 transition-colors duration-200",
            isActive ? "text-accent-strong dark:text-accent" : "text-muted",
          )}
        />
        <span
          className={cn(
            "font-display text-sm leading-snug tracking-[-0.012em] md:text-[0.95rem]",
            isActive && "font-semibold",
          )}
        >
          <T en={role.title.en} id={role.title.id} />
        </span>
      </button>
    </motion.li>
  );
}

export function RoleSplitRail({ roles }: { roles: BiRole[] }) {
  const prefersReducedMotion = useReducedMotion();
  const hasFinePointer = useHasFinePointer();
  const [selectedSlug, setSelectedSlug] = useState<string | null>(
    roles[0]?.slug ?? null,
  );

  const reduceMotion = Boolean(prefersReducedMotion);
  const tiltEnabled = hasFinePointer && !reduceMotion;
  const tilt = useTilt(tiltEnabled);

  if (roles.length === 0) return null;

  // The filter can remove whatever was selected; falling through to the first
  // survivor is what keeps the panel from going blank.
  const activeSlug = roles.some((role) => role.slug === selectedSlug)
    ? selectedSlug
    : roles[0].slug;
  const activeRole = roles.find((role) => role.slug === activeSlug) ?? roles[0];

  const panelTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.3, ease: EASE };

  return (
    <div className="flex flex-col gap-5 md:flex-row md:gap-8">
      {/* Rail. A horizontal, swipeable strip of tabs on a phone; a column from
          md up. `data-lenis-prevent` so a sideways flick scrolls the rail
          rather than being taken over as page scroll. */}
      <motion.ul
        layout={!reduceMotion}
        data-lenis-prevent
        className={cn(
          "flex gap-2 overflow-x-auto pb-2",
          "md:w-[28%] md:shrink-0 md:flex-col md:gap-1 md:overflow-visible md:pb-0",
          // Hides the scrollbar on the mobile rail without hiding the page's.
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:[scrollbar-width:thin]",
        )}
      >
        <AnimatePresence initial={false}>
          {roles.map((role) => (
            <RailItem
              key={role.slug}
              role={role}
              isActive={role.slug === activeSlug}
              onSelect={() => setSelectedSlug(role.slug)}
              reduceMotion={reduceMotion}
            />
          ))}
        </AnimatePresence>
      </motion.ul>

      {/* Detail panel */}
      <div
        className="min-w-0 flex-1"
        onMouseMove={tilt.onMouseMove}
        onMouseLeave={tilt.onMouseLeave}
        style={tiltEnabled ? { perspective: 1200 } : undefined}
      >
        <motion.div
          style={
            tiltEnabled
              ? { rotateX: tilt.rotateX, rotateY: tilt.rotateY, willChange: "transform" }
              : undefined
          }
          className="rounded-card border border-border bg-surface/50 p-5 md:p-7"
        >
          {/* `wait`: the outgoing role clears before the incoming one arrives,
              so the two never overlap mid-air in the same panel. */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeRole.slug}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={panelTransition}
            >
              <h4 className="font-display text-lg tracking-[-0.02em] md:text-2xl">
                <T en={activeRole.title.en} id={activeRole.title.id} />
              </h4>

              <RoleBullets
                points={activeRole.points}
                open
                animateOnMount
                className="mt-5"
              />

              <ExperienceGallery
                photos={activeRole.photos}
                roleTitle={activeRole.title}
                className="mt-6"
              />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
