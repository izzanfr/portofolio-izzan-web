"use client";

import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
  type Variants,
} from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Section } from "@/components/ui/Section";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { ExperienceGallery } from "@/components/ui/ExperienceGallery";
import { T } from "@/components/ui/T";
import { cn } from "@/lib/utils";
import { getExperience, type BiJob, type BiRole } from "@/lib/experience";

const experience = getExperience();

/** The site's standard curve, shared with the reveals and the nav pill. */
const EASE = [0.22, 1, 0.36, 1] as const;

/* ---------------------------------------------------------------
   Role bullets — staggered reveal

   Variants rather than per-item delays: the list owns the rhythm, so
   adding a bullet to the content never means retuning a delay. Opening
   runs top-down and waits a beat for the panel to start expanding;
   closing runs bottom-up and quicker, so the list clears out of the way
   rather than lingering while the panel collapses over it.
--------------------------------------------------------------- */
const pointList: Variants = {
  hidden: { transition: { staggerChildren: 0.035, staggerDirection: -1 } },
  visible: { transition: { delayChildren: 0.08, staggerChildren: 0.07 } },
};

const pointItem: Variants = {
  hidden: { opacity: 0, x: -10, transition: { duration: 0.14, ease: "easeIn" } },
  visible: { opacity: 1, x: 0, transition: { duration: 0.24, ease: EASE } },
};

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
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors duration-200",
              isActive
                ? "border-accent bg-accent/12 text-accent-strong dark:text-accent"
                : "border-border text-muted hover:border-accent/40 hover:text-foreground",
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
   Role accordion
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

  return (
    // The gap between cards is padding *inside* the item, not a margin between
    // them, so collapsing the item's height on exit takes the spacing with it
    // and the remaining cards close up without a leftover gap.
    <motion.li
      layout
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.45, delay: index * 0.05, ease: EASE }}
      className="overflow-hidden"
    >
      <div className="pb-2.5">
        <div
          className={cn(
            "group rounded-card border transition-colors duration-300",
            open
              ? "border-accent/45 bg-surface"
              : "border-border bg-surface/50 hover:border-accent/35",
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
            {/* Variants live here rather than on the height wrapper above: that
                wrapper animates with an object, which does not propagate a
                variant label to children. */}
            <motion.ul
              initial={false}
              animate={open ? "visible" : "hidden"}
              variants={pointList}
              className="space-y-2.5 px-5 pb-5 pl-[4.25rem] text-sm leading-relaxed text-muted"
            >
              {role.points.map((point, pointIndex) => (
                <motion.li key={pointIndex} variants={pointItem} className="relative pl-4">
                  <span className="absolute left-0 top-[0.6em] h-1 w-1 rounded-full bg-accent" />
                  <T en={point.en} id={point.id} />
                </motion.li>
              ))}
            </motion.ul>

            <ExperienceGallery photos={role.photos} roleTitle={role.title} />
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
      tone="tint"
      index={1}
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

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.55, ease: EASE }}
        className="mb-6"
      >
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 className="text-xl tracking-[-0.024em] md:text-2xl">{job.company}</h3>
          {/* Tint is 10%, not 15%: the gold text on this pill is 10px, and the
              heavier fill dragged it to 4.45:1 — just under AA for text that
              small. */}
          {job.current && (
            <span className="rounded-full bg-accent/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-accent-strong dark:text-accent">
              <T en="Current" id="Saat ini" />
            </span>
          )}
        </div>
        <p className="mt-1.5 font-mono text-xs text-muted">
          <T en={job.period.en} id={job.period.id} /> ·{" "}
          <T en={job.duration.en} id={job.duration.id} /> ·{" "}
          <T en={job.location.en} id={job.location.id} />
        </p>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
          <T en={job.summary.en} id={job.summary.id} />
        </p>
      </motion.div>

      {filterable && <RoleFilter active={filter} onChange={setFilter} />}

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
    </>
  );
}
