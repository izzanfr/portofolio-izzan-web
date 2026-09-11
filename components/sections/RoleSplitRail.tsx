"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { Scramble } from "@/components/ui/Scramble";
import { T } from "@/components/ui/T";
import type { BiRole } from "@/lib/experience";
import { cn } from "@/lib/utils";
import { EASE, INSET_SURFACE, MicroLabel, RolePanel } from "./experienceShared";

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
  index,
  isActive,
  onSelect,
  reduceMotion,
}: {
  role: BiRole;
  index: number;
  isActive: boolean;
  onSelect: () => void;
  reduceMotion: boolean;
}) {
  return (
    <li className="shrink-0 md:shrink">
      <button
        type="button"
        onClick={onSelect}
        aria-current={isActive ? "true" : undefined}
        // `isolate` matters because the active marker sits at -z-10: without a
        // stacking context here it would resolve against an ancestor and paint
        // behind the rail's own background instead of behind the label.
        className={cn(
          "exp-rail-item relative isolate flex w-full items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2.5 text-left transition-colors duration-200",
          "md:gap-3 md:whitespace-normal",
          isActive ? "text-foreground" : "text-muted hover:text-foreground",
        )}
      >
        {isActive && (
          // One shared element across all rows, so the marker flows from the
          // old row to the new one instead of blinking out and back in.
          <motion.span
            layoutId="rail-active-marker"
            transition={reduceMotion ? { duration: 0 } : { duration: 0.32, ease: EASE }}
            className="absolute inset-0 -z-10 rounded-lg bg-accent/12 ring-1 ring-inset ring-accent/25"
          />
        )}

        {/* The numeral is what makes the rail scannable: seven role titles of
            similar length are hard to keep a place in, and an index gives each
            one an address. Tabular so the column cannot ripple. */}
        <span
          className={cn(
            "w-4 shrink-0 font-mono text-[10px] leading-none tabular-nums transition-colors duration-200",
            isActive ? "text-accent-strong" : "text-muted/60",
          )}
        >
          {String(index + 1).padStart(2, "0")}
        </span>

        <DynamicIcon
          name={role.icon}
          size={15}
          className={cn(
            "shrink-0 transition-colors duration-200",
            isActive ? "text-accent-strong" : "text-muted",
          )}
        />

        <span
          className={cn(
            "font-display text-[0.8125rem] leading-snug tracking-[-0.012em] md:text-sm",
            isActive && "font-semibold",
          )}
        >
          <T en={role.title.en} id={role.title.id} />
        </span>
      </button>
    </li>
  );
}

export function RoleSplitRail({ roles }: { roles: BiRole[] }) {
  const prefersReducedMotion = useReducedMotion();
  const [selectedSlug, setSelectedSlug] = useState<string | null>(roles[0]?.slug ?? null);

  const reduceMotion = Boolean(prefersReducedMotion);

  if (roles.length === 0) return null;

  // Falling through to the first role keeps the panel from ever going blank if
  // the selected slug stops existing.
  const activeSlug = roles.some((role) => role.slug === selectedSlug)
    ? selectedSlug
    : roles[0].slug;
  const activeRole = roles.find((role) => role.slug === activeSlug) ?? roles[0];

  const panelTransition = reduceMotion ? { duration: 0 } : { duration: 0.3, ease: EASE };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:gap-6">
      {/* Rail. A horizontal, swipeable strip of tabs on a phone; a column from
          md up. `data-lenis-prevent` so a sideways flick scrolls the rail
          rather than being taken over as page scroll. */}
      <div
        data-lenis-prevent
        className={cn(
          INSET_SURFACE,
          "exp-rail min-w-0 p-2.5 md:w-[19.5rem] md:shrink-0 md:p-3",
        )}
      >
        <MicroLabel className="mb-2.5 hidden px-1.5 md:block">
          <Scramble en={`${roles.length} roles`} id={`${roles.length} peran`} />
        </MicroLabel>

        <ul
          className={cn(
            "flex gap-1.5 overflow-x-auto md:flex-col md:gap-0.5 md:overflow-visible",
            // Hides the scrollbar on the mobile rail without hiding the page's.
            "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          )}
        >
          {roles.map((role, index) => (
            <RailItem
              key={role.slug}
              role={role}
              index={index}
              isActive={role.slug === activeSlug}
              onSelect={() => setSelectedSlug(role.slug)}
              reduceMotion={reduceMotion}
            />
          ))}
        </ul>
      </div>

      {/* Detail panel.

          A keyed remount, deliberately not an <AnimatePresence mode="wait">.
          The presence version is what this replaced, and it wedged: the outgoing
          panel's exit never completed, so AnimatePresence went on rendering the
          first role's content forever while the rail underneath it correctly
          moved its selection — click any role and the marker travelled, the
          `aria-current` moved, and the panel stayed on "Information Technology
          Consultant". Verified as a React state problem it was not: a
          `data-active` attribute on this same element, outside the presence
          tree, tracked every click.

          Nothing here needs presence anyway. `mode="wait"` exists to stop two
          panels overlapping mid-air, and a remount cannot produce two panels:
          the key changes, the old subtree goes, the new one plays its entrance.
          What is lost is the outgoing slide, and losing it makes the swap read
          faster rather than poorer — the wait was 300ms of nothing before the
          content the visitor asked for appeared. */}
      <div className={cn(INSET_SURFACE, "exp-panel min-w-0 flex-1 p-4 md:p-5")}>
        <motion.div
          key={activeRole.slug}
          initial={{ opacity: 0, x: 14 }}
          animate={{ opacity: 1, x: 0 }}
          transition={panelTransition}
        >
          <RolePanel role={activeRole} />
        </motion.div>
      </div>
    </div>
  );
}
