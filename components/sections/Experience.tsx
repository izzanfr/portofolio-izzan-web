"use client";

import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Section } from "@/components/ui/Section";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { ExperienceGallery } from "@/components/ui/ExperienceGallery";
import { T } from "@/components/ui/T";
import { Scramble } from "@/components/ui/Scramble";
import { cn } from "@/lib/utils";
import { getExperience, type BiJob, type BiRole } from "@/lib/experience";
import { RoleSplitRail } from "./RoleSplitRail";
import {
  EASE,
  ROLE_SURFACE,
  RoleBullets,
  useHasFinePointer,
  useTilt,
} from "./experienceShared";

const experience = getExperience();

/* ---------------------------------------------------------------
   Timeline dot

   Tied to the same spring that fills the spine rather than to a
   viewport trigger of its own, so the dot lights the instant the line
   reaches it instead of drifting in and out of step with it.

   `threshold` is the dot's centre expressed as a fraction of the spine,
   measured from the DOM — the accordions and the category filter both
   change the column's height, so a hardcoded fraction would go stale
   the moment anything expanded.

   Only scale is animated; the colours are classes so each theme keeps
   its own pair without a motion value having to know about the theme.
--------------------------------------------------------------- */
function TimelineDot({
  progress,
  threshold,
}: {
  progress: MotionValue<number>;
  threshold: number;
}) {
  const [reached, setReached] = useState(false);

  useMotionValueEvent(progress, "change", (value) => {
    setReached(value >= threshold);
  });

  return (
    <motion.span
      aria-hidden
      initial={false}
      animate={{ scale: reached ? 1 : 0.55 }}
      // Underdamped on purpose: the overshoot is the "pop", so it comes from
      // the spring itself rather than a scripted 1.3 keyframe.
      transition={{ type: "spring", stiffness: 520, damping: 13, mass: 0.6 }}
      className={cn(
        "absolute -left-10 top-2 hidden h-[15px] w-[15px] rounded-full border-2 transition-colors duration-300 md:block",
        reached
          ? "border-background bg-navy dark:bg-accent"
          : "border-border bg-background",
      )}
    />
  );
}

/* ---------------------------------------------------------------
   Category filter
--------------------------------------------------------------- */
const CATEGORIES = [
  { id: "all", label: { en: "All", id: "Semua" } },
  { id: "consulting", label: { en: "Consulting", id: "Konsultasi" } },
  { id: "instructor", label: { en: "Instructor", id: "Instruktur" } },
] as const;

type CategoryId = (typeof CATEGORIES)[number]["id"];

function RoleFilter({
  active,
  onChange,
}: {
  active: CategoryId;
  onChange: (id: CategoryId) => void;
}) {
  return (
    <div className="mb-5 flex flex-wrap gap-2">
      {CATEGORIES.map((category) => {
        const isActive = category.id === active;
        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onChange(category.id)}
            aria-pressed={isActive}
            // Both states carry a fill, and both fills are opaque. A pill is a
            // control: an outline with the lattice running through it reads as
            // a shape drawn on the background rather than as something to
            // press. The active fill is mixed into the surface rather than
            // laid over it at 12%, which is the only way to tint it without
            // reopening the hole the tint was covering.
            className={cn(
              "lattice-card rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors duration-200",
              isActive
                ? "border-accent bg-[color-mix(in_srgb,var(--accent)_13%,var(--surface))] text-accent-strong dark:text-accent"
                : "border-border bg-surface/92 text-muted hover:border-accent/40 hover:text-foreground",
            )}
          >
            <T en={category.label.en} id={category.label.id} />
          </button>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------
   Role accordion — the narrow-screen layout

   Kept as-is from before the strips were added: on a phone there is no
   horizontal room for a row of panels, and no cursor to drive a tilt,
   so this stays the layout below `md`.
--------------------------------------------------------------- */
function RoleAccordion({
  role,
  index,
  defaultOpen,
}: {
  role: BiRole;
  index: number;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const prefersReducedMotion = useReducedMotion();
  const hasFinePointer = useHasFinePointer();

  const depthEnabled = !prefersReducedMotion;
  const tiltEnabled = depthEnabled && hasFinePointer;

  /**
   * The stage carries the perspective and is what the scroll is measured
   * against. It is deliberately never transformed: `useScroll` measures its
   * target with getBoundingClientRect, which includes transforms, so measuring
   * the scaled card would feed its own scale back into the progress driving it.
   */
  const stageRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: stageRef,
    // Completes shortly after the card clears the fold. A range that only
    // finished near the top of the viewport would leave the last card in a
    // list stranded at partial scale, since nothing scrolls past it.
    offset: ["start end", "start 70%"],
  });
  const depth = useSpring(scrollYProgress, { stiffness: 120, damping: 26, mass: 0.4 });
  const scale = useTransform(depth, [0, 1], [0.94, 1]);
  const depthOpacity = useTransform(depth, [0, 1], [0.65, 1]);

  const tilt = useTilt(tiltEnabled);

  return (
    // The gap between cards is padding *inside* the item, not a margin between
    // them, so collapsing the item's height on exit takes the spacing with it
    // and the remaining cards close up without a leftover gap.
    //
    // The negative margin cancels the padding, so the card sits exactly where
    // it did while the clip box around it grows — room for a tilted corner to
    // project into without being sheared by the overflow-hidden that the
    // filter's height collapse depends on.
    //
    // The room needed is not symmetric, and 8px all round was not enough
    // horizontally. Under `perspective: 1000px` a 7° turn swings the near edge
    // of a 1048px-wide card toward the viewer, and perspective magnifies what
    // comes closer: measured, the card's painted box overhangs its layout box
    // by 31px at the sides but only 5px top and bottom, because the same angle
    // acts on a height a quarter of the width. 64px across and 24px down —
    // comfortably past the measured need rather than sized to it, since the
    // overhang grows with the card and a card grows with its content.
    //
    // Padding collapses with the height on exit. Left standing it would hold a
    // filtered-out card's slot open by its own padding after the height had
    // gone, so the list would close up to a gap instead of closing up.
    <motion.li
      layout
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ duration: 0.45, delay: index * 0.05, ease: EASE }}
      className="-mx-16 -my-6 overflow-hidden px-16 py-6"
    >
      <div className="pb-2.5">
        <div
          ref={stageRef}
          onMouseMove={tilt.onMouseMove}
          onMouseLeave={tilt.onMouseLeave}
          style={tiltEnabled ? { perspective: 1000 } : undefined}
        >
          <motion.div
            style={
              depthEnabled
                ? {
                    scale,
                    opacity: depthOpacity,
                    ...(tiltEnabled
                      ? { rotateX: tilt.rotateX, rotateY: tilt.rotateY }
                      : {}),
                    willChange: "transform",
                  }
                : undefined
            }
            // The same border and ground as the split rail's panel. Which of
            // the two layouts a company gets depends only on how many roles it
            // has, so a card that changed colour on open made a one-role
            // company look like a different kind of thing from a seven-role
            // one. Open is already said by the chevron and by the content
            // being there; it does not also need its own palette.
            className={cn(
              ROLE_SURFACE,
              "group transition-colors duration-300 hover:border-accent/35",
            )}
          >
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              className="flex w-full items-center gap-4 px-5 py-4 text-left"
            >
              <span
                className={cn(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-colors duration-300",
                  open
                    ? "bg-accent text-accent-contrast"
                    : "bg-surface-2 text-muted group-hover:text-accent-strong dark:group-hover:text-accent",
                )}
              >
                <DynamicIcon name={role.icon} size={17} />
              </span>
              <span className="flex-1 text-sm font-medium md:text-base">
                <T en={role.title.en} id={role.title.id} />
              </span>
              <motion.span
                animate={{ rotate: open ? 180 : 0 }}
                transition={{ duration: 0.25 }}
                className="shrink-0 text-muted"
              >
                <ChevronDown size={17} />
              </motion.span>
            </button>

            <motion.div
              initial={false}
              animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
              transition={{ duration: 0.32, ease: EASE }}
              className="overflow-hidden"
            >
              <RoleBullets
                points={role.points}
                open={open}
                className="px-5 pb-5 pl-[4.25rem]"
              />

              <ExperienceGallery photos={role.photos} roleTitle={role.title} />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.li>
  );
}

export function Experience() {
  const trackRef = useRef<HTMLDivElement>(null);
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [thresholds, setThresholds] = useState<number[]>(() => experience.map(() => 1));

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start 65%", "end 60%"],
  });
  // Spring the timeline fill so it trails the scroll slightly instead of snapping
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.4 });
  const scaleY = useTransform(progress, (v) => Math.max(v, 0.02));

  /**
   * Each dot's centre as a fraction of the spine. Re-measured whenever the
   * column resizes, which is what keeps the dots honest as accordions open and
   * the filter adds or removes cards.
   */
  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const bounds = track.getBoundingClientRect();
    // Mirrors the spine's own geometry: top-2 and h-[calc(100%-1rem)].
    const spineTop = bounds.top + 8;
    const spineHeight = bounds.height - 16;
    if (spineHeight <= 0) return;

    const next = dotRefs.current.map((dot) => {
      if (!dot) return 1;
      const rect = dot.getBoundingClientRect();
      const centre = rect.top + rect.height / 2;
      return Math.min(1, Math.max(0, (centre - spineTop) / spineHeight));
    });

    setThresholds((previous) =>
      previous.length === next.length && previous.every((v, i) => Math.abs(v - next[i]) < 0.001)
        ? previous
        : next,
    );
  }, []);

  useEffect(() => {
    measure();
    const track = trackRef.current;
    if (!track) return;
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  return (
    <Section
      id="experience"
      title={<T en="Experience" id="Pengalaman" />}
      index={1}
      // Both the ground and the arrival belong to <ExperienceZone>, which wraps
      // this section: the lattice behind it is sticky and spans the whole zone,
      // so it cannot be painted by anything that scrolls with the content. The
      // section itself stays transparent and carries no reveal of its own —
      // the zone's curtain is already answering that boundary.
      backdrop={null}
      transition="none"
      // The halo that keeps type legible over the lattice. On the section
      // rather than on each block because text-shadow inherits, so one
      // declaration covers the heading, the company header and the role rail
      // alike — and the cards inside turn it back off for themselves.
      className="on-lattice"
    >
      <div ref={trackRef} className="relative">
        {/* Scroll-linked timeline spine */}
        <div className="absolute left-[7px] top-2 hidden h-[calc(100%-1rem)] w-px bg-border md:block">
          {/* Navy in light mode, amber in dark: the amber fill was near
              invisible against the light tint, and navy would sink into the
              dark background the same way. */}
          <motion.div
            style={{ scaleY, originY: 0 }}
            className="h-full w-full bg-gradient-to-b from-navy to-navy/30 dark:from-accent dark:to-accent/30"
          />
        </div>

        <div className="space-y-14 md:space-y-20 md:pl-10">
          {experience.map((job, jobIndex) => (
            <JobBlockWithDot
              key={job.company}
              job={job}
              progress={progress}
              threshold={thresholds[jobIndex] ?? 1}
              registerDot={(node) => {
                dotRefs.current[jobIndex] = node;
              }}
            />
          ))}
        </div>
      </div>
    </Section>
  );
}

/**
 * Pairs the measured anchor with the animated dot: the anchor is what the
 * measurement reads, the dot is what pops, and keeping them separate means the
 * spring never feeds its own scale back into the threshold.
 */
function JobBlockWithDot({
  job,
  progress,
  threshold,
  registerDot,
}: {
  job: BiJob;
  progress: MotionValue<number>;
  threshold: number;
  registerDot: (node: HTMLSpanElement | null) => void;
}) {
  return (
    <div className="relative">
      <span
        ref={registerDot}
        aria-hidden
        className="pointer-events-none absolute -left-10 top-2 hidden h-[15px] w-[15px] md:block"
      />
      <TimelineDot progress={progress} threshold={threshold} />
      <JobBlockBody job={job} />
    </div>
  );
}

/**
 * Depth-scale for the split rail.
 *
 * Applied to the rail and the panel together as one object rather than to each
 * role: the panel already runs its own transition on every selection, and a
 * second transform underneath it would fight that. The measured stage is again
 * separate from the layer that scales, so the transform cannot feed back into
 * the scroll progress driving it.
 */
function RoleBoard({ roles }: { roles: BiRole[] }) {
  const prefersReducedMotion = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ["start end", "start 70%"],
  });
  const depth = useSpring(scrollYProgress, { stiffness: 120, damping: 26, mass: 0.4 });
  const scale = useTransform(depth, [0, 1], [0.94, 1]);
  const depthOpacity = useTransform(depth, [0, 1], [0.65, 1]);

  return (
    <div ref={stageRef}>
      <motion.div
        style={
          prefersReducedMotion
            ? undefined
            : { scale, opacity: depthOpacity, willChange: "transform" }
        }
      >
        <RoleSplitRail roles={roles} />
      </motion.div>
    </div>
  );
}

function JobBlockBody({ job }: { job: BiJob }) {
  const [filter, setFilter] = useState<CategoryId>("all");
  const filterable = job.roles.some((role) => role.category);

  const visibleRoles = useMemo(
    () =>
      filter === "all" || !filterable
        ? job.roles
        : job.roles.filter((role) => role.category === filter),
    [job.roles, filter, filterable],
  );

  /**
   * Master–detail only earns its place when there is a list to choose from. The
   * second company has a single role, so it stays the plain expandable card
   * rather than a rail with one permanently-selected entry.
   */
  const useSplitRail = job.roles.length > 1;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.55, ease: EASE }}
        // The same surface the role content sits on. This block — company,
        // period, location, summary — was the last text in the section still
        // floating directly on the lattice, and the mono period line is the
        // smallest type on the page, so it was where lines crossing strokes
        // cost the most. A header that reads as a header still needs a floor.
        className={cn(ROLE_SURFACE, "mb-6 p-5 md:p-6")}
      >
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 className="text-xl tracking-[-0.024em] md:text-2xl">{job.company}</h3>
          {/* Tint is 10%, not 15%: the gold text on this pill is 10px, and the
              heavier fill dragged it to 4.45:1 — just under AA for text that
              small. */}
          {job.current && (
            <span className="rounded-full bg-accent/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-accent-strong dark:text-accent">
              <Scramble en="Current" id="Saat ini" />
            </span>
          )}
        </div>
        <p className="mt-1.5 font-mono text-xs text-muted">
          <Scramble en={job.period.en} id={job.period.id} /> ·{" "}
          <Scramble en={job.duration.en} id={job.duration.id} /> ·{" "}
          <Scramble en={job.location.en} id={job.location.id} />
        </p>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
          <T en={job.summary.en} id={job.summary.id} />
        </p>
      </motion.div>

      {filterable && <RoleFilter active={filter} onChange={setFilter} />}

      {useSplitRail ? (
        <RoleBoard roles={visibleRoles} />
      ) : (
        <motion.ul layout className="flex flex-col">
          {/* No `initial={false}`: it would suppress the scroll reveal the cards
              play on first sight. Cards that re-enter after a filter change mount
              fresh, are already in view, and so reveal immediately. */}
          <AnimatePresence>
            {visibleRoles.map((role, index) => (
              <RoleAccordion
                key={role.slug}
                role={role}
                index={index}
                defaultOpen={index === 0 && filter === "all"}
              />
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
    </>
  );
}
