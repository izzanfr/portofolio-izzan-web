"use client";

import { useReducedMotion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useCallback, useRef, useState } from "react";
import { useLenisRef } from "@/components/providers/SmoothScrollProvider";
import { T } from "@/components/ui/T";
import { Scramble } from "@/components/ui/Scramble";
import { cn } from "@/lib/utils";
import { getExperience, type BiJob } from "@/lib/experience";
import { RoleSplitRail } from "./RoleSplitRail";
import {
  MicroLabel,
  RolePanel,
  STOP_SURFACE,
  useHasFinePointer,
  useSheen,
} from "./experienceShared";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Oldest first. The JSON is authored newest-first, the way a CV is; a timeline
 * reads the other way. Reversed here rather than in `lib/experience` because
 * reading order is a presentation decision, and the résumé order is the right
 * one for anything else that consumes this data.
 */
const experience = [...getExperience()].reverse();

/** Summary figures for the eyebrow, counted rather than typed. A hardcoded
 *  "8 roles" is a number that goes stale the first time the JSON changes and
 *  nothing tells you it has. */
const TOTAL_ROLES = experience.reduce((total, job) => total + job.roles.length, 0);
const START_YEAR = experience[0]?.period.en.match(/\d{4}/)?.[0] ?? "";
const IS_ONGOING = experience.some((job) => job.current);

/* ---------------------------------------------------------------
   Experience, read sideways

   A full page rather than a section: no content column, no site
   padding, and its own heading travelling inside the pin — the shape
   the credentials page takes, and for the same reason. A company with
   seven parallel roles is a place you stop at, not a block you scroll
   past.

   The geometry, which is the thing this file gets wrong most easily.

   There are two horizontal bands and they never overlap. The upper one
   is the spine: a dotted rule, the accent progress that fills along it,
   and one node per company. It is fixed inside the pin and does not
   travel. The lower band is the track, which is the only thing that
   moves. An earlier version ran the spine through the vertical centre
   of the stage and staggered the cards onto either side of it, which
   meant the rule crossed every card it was supposed to be threading —
   and the numbered badges, pinned to the cell rather than to the card
   they labelled, ended up on top of the card borders. Bands that cannot
   intersect is what fixes both, permanently: there is no card geometry
   that puts a card in the spine's row.

   The division of labour between the two animation engines is a line,
   not a mixture:

     GSAP owns anything scroll drives — the track's horizontal position,
     the progress line and its head, and each node's and card's focus
     state. All of them are tweens on one timeline, so a single
     ScrollTrigger is the source of truth and nothing can report a
     position the cards are not at.

     Framer owns everything inside a stop — choosing a role, the panel
     swapping, the bullet stagger. None of it is scroll-driven, so none
     of it competes with the pin.

   No DOM element is touched by both. The track, the spine and the nodes
   are plain elements held by refs or found by class; everything inside
   a card is `motion.*`.

   Lenis is already wired to ScrollTrigger in SmoothScrollProvider,
   where the instance lives — one subscription for the whole app.
--------------------------------------------------------------- */

/** Where a card rests when it is not the one being read. Small numbers: this is
 *  depth, not a transition, and the far card is still legible enough to be
 *  worth scrolling toward. */
const CARD_IDLE = { opacity: 0.38, y: 16 };
const CARD_ACTIVE = { opacity: 1, y: 0 };

/* ---------------------------------------------------------------
   One stop
--------------------------------------------------------------- */
function JobStop({ job, index }: { job: BiJob; index: number }) {
  /**
   * Master–detail only earns its place when there is a list to choose from. A
   * company with one role renders straight into the panel — the rail would be
   * a single permanently-selected row, which is furniture rather than
   * navigation.
   */
  const hasRail = job.roles.length > 1;

  const hasFinePointer = useHasFinePointer();
  const prefersReducedMotion = useReducedMotion();
  const sheen = useSheen(hasFinePointer && !prefersReducedMotion);

  return (
    <article
      data-index={index}
      onMouseMove={sheen.onMouseMove}
      onMouseLeave={sheen.onMouseLeave}
      className={cn(
        STOP_SURFACE,
        "exp-stop relative overflow-hidden p-5 md:px-7 md:py-6 stage:w-[min(88vw,1320px)] stage:shrink-0",
      )}
    >
      {/* Company header. The index, the name and the period sit in one column;
          the summary sits in a second, left-aligned behind a hairline. It used
          to be right-aligned, which gave a two-line sentence a ragged left edge
          floating in the middle of the card with nothing to align to. */}
      <header className="md:flex md:items-start md:gap-7">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-[11px] leading-none tabular-nums text-accent-strong dark:text-accent">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span aria-hidden className="h-px w-6 shrink-0 translate-y-[-3px] bg-border" />
            <MicroLabel>
              <Scramble en={job.location.en} id={job.location.id} />
            </MicroLabel>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <h3 className="text-xl tracking-[-0.024em] md:text-[1.625rem]">
              {job.company}
            </h3>
            {/* Tint is 10%, not 15%: the gold text on this pill is 10px, and
                the heavier fill dragged it to 4.45:1 — just under AA for text
                that small. */}
            {job.current && (
              <span className="rounded-full bg-accent/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-accent-strong dark:text-accent">
                <Scramble en="Current" id="Saat ini" />
              </span>
            )}
          </div>

          <p className="mt-1.5 font-mono text-xs text-muted">
            <Scramble en={job.period.en} id={job.period.id} /> ·{" "}
            <Scramble en={job.duration.en} id={job.duration.id} />
          </p>
        </div>

        <p className="mt-4 max-w-[46ch] text-sm leading-relaxed text-muted md:mt-0 md:w-[30%] md:shrink-0 md:border-l md:border-border md:pl-7">
          <T en={job.summary.en} id={job.summary.id} />
        </p>
      </header>

      <div className="mt-5 border-t border-border/70 pt-5">
        {hasRail ? <RoleSplitRail roles={job.roles} /> : <RolePanel role={job.roles[0]} />}
      </div>
    </article>
  );
}

/* ---------------------------------------------------------------
   The page
--------------------------------------------------------------- */
function ExperienceStage() {
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const spineRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<ScrollTrigger | null>(null);
  const reduceMotion = useReducedMotion();
  const lenisRef = useLenisRef();

  /**
   * Which stop the spine is currently pointing at. This is the one piece of
   * scroll-derived state React is allowed to hold, and only because it carries
   * `aria-current`: the lit node is otherwise a purely visual fact and a screen
   * reader would have no way to read the stepper. Set through the functional
   * form so an unchanged index bails out before a render — the handler runs on
   * every scrubbed frame, and the value actually changes at most once per
   * company.
   */
  const [activeStop, setActiveStop] = useState(0);

  const count = experience.length;

  /**
   * Jump to a company. The stepper is the only way to skip a stop — a pinned
   * horizontal track has no scrollbar of its own, so before this the seventh
   * role of the last company was over a thousand pixels of wheel away with
   * nothing on screen offering a shortcut.
   *
   * The target is read off the live ScrollTrigger rather than recomputed:
   * `start` and `end` already account for the pin spacer, the navbar offset and
   * whatever the track measured on the last refresh. Lenis owns the travel when
   * it is there — it is the thing that knows where the page actually is — and
   * the native smooth scroll covers the reduced-motion case, where there is no
   * Lenis instance at all.
   */
  const goToStop = useCallback(
    (index: number) => {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const ratio = count > 1 ? index / (count - 1) : 0;
      const target = trigger.start + ratio * (trigger.end - trigger.start);
      const lenis = lenisRef?.current;

      if (lenis) lenis.scrollTo(target);
      else window.scrollTo({ top: target, behavior: "smooth" });
    },
    [count, lenisRef],
  );

  useGSAP(
    () => {
      const stage = stageRef.current;
      const frame = frameRef.current;
      const track = trackRef.current;
      const spine = spineRef.current;
      const progress = progressRef.current;
      const head = headRef.current;
      if (!stage || !frame || !track || !spine || !progress || !head) return;

      const mm = gsap.matchMedia();

      /* The same condition as the `stage:` variant in globals.css, plus the
         reduced-motion clause. Outside it the stops are a plain column and
         there is nothing to travel — and turning someone's scroll ninety
         degrees is exactly what that setting is about, so the branch simply
         never runs. The two strings must stay in step: if CSS lays the track
         out as a row and this does not pin it, the section scrolls sideways
         off the page. */
      mm.add(
        "(min-width: 1200px) and (min-height: 860px) and (prefers-reduced-motion: no-preference)",
        () => {
          /**
           * How far the track has to move, measured rather than assumed — it
           * depends on the viewport, on how wide a stop settles, and on where the
           * labels happen to wrap. A function, because `invalidateOnRefresh`
           * re-reads it on every refresh.
           */
          const travel = () => Math.max(0, track.scrollWidth - frame.clientWidth);
          /** The spine's own width, which the progress head rides along. Read the
           *  same way and for the same reason. */
          const spineWidth = () => spine.clientWidth;

          const cards = gsap.utils.toArray<HTMLElement>(
            stage.querySelectorAll(".exp-stop"),
          );
          const nodes = gsap.utils.toArray<HTMLElement>(
            stage.querySelectorAll(".exp-node"),
          );

          /**
           * The timeline is one unit long, so every position below is a fraction
           * of the scroll distance and reads as one. `end` equals the travel, so
           * a pixel of wheel buys a pixel of sideways movement and the pin
           * releases the instant the last stop lands.
           */
          const timeline = gsap.timeline({
            defaults: { ease: "none", duration: 1 },
            scrollTrigger: {
              trigger: stage,
              start: "top top",
              end: () => `+=${travel()}`,
              pin: frame,
              /**
               * A number, not `true`. `true` is exactly 1:1 with the scrollbar,
               * which sounds like the honest choice and reads as a stutter: every
               * jitter in the wheel lands on the track unfiltered. Half a second
               * of catch-up is enough to smooth that without the track ever
               * feeling like it is lagging behind the input.
               */
              scrub: 0.5,
              invalidateOnRefresh: true,
              // Pins a frame early, which is what stops the jump some browsers
              // make when a fixed position is applied mid-scroll.
              anticipatePin: 1,
              onUpdate: (self) => {
                const index = Math.round(self.progress * (count - 1));
                setActiveStop((current) => (current === index ? current : index));
              },
            },
          });

          triggerRef.current = timeline.scrollTrigger ?? null;

          gsap.set(progress, { transformOrigin: "left center", scaleX: 0 });
          gsap.set(head, { x: 0 });

          timeline
            .to(track, { x: () => -travel() }, 0)
            .to(progress, { scaleX: 1 }, 0)
            .to(head, { x: () => spineWidth() }, 0);

          /**
           * The handover, written once for any number of companies rather than
           * as a pair of hand-placed tweens for the two that exist today.
           *
           * Each stop owns a point on the timeline — stop `i` of `n` is fully lit
           * at `i / (n - 1)` — and lights on the way in and dims on the way out
           * over a window either side of it. The windows overlap by design: the
           * ramps are longer than the gap between them, so two cards cross rather
           * than both sitting flat in the middle of the travel.
           *
           * The two ramps are deliberately not the same curve. Linear on both
           * put the crossing point at half-lit for each, which is the one frame
           * where neither card is readable — measured mid-travel, both sat at
           * 0.52 opacity. `power2.out` on the way in and `power2.in` on the way
           * out moves that crossing up: the arriving card is most of the way lit
           * while the leaving one is most of the way gone, which is what "the
           * next thing is arriving" is supposed to look like.
           */
          const segment = count > 1 ? 1 / (count - 1) : 1;
          const ramp = segment * 0.54;
          const hold = segment * 0.08;
          const EASE_IN = "power2.out";
          const EASE_OUT = "power2.in";

          cards.forEach((card, index) => {
            const node = nodes[index];
            const dot = node?.querySelector<HTMLElement>(".exp-node-dot");
            const focus = index * segment;
            const isFirst = index === 0;
            const isLast = index === count - 1;

            gsap.set(card, isFirst ? CARD_ACTIVE : CARD_IDLE);
            if (node) gsap.set(node, { opacity: isFirst ? 1 : 0.45 });
            if (dot) gsap.set(dot, { scale: isFirst ? 1 : 0.3 });

            if (!isFirst) {
              const at = Math.max(0, focus - hold - ramp);
              timeline.to(card, { ...CARD_ACTIVE, duration: ramp, ease: EASE_IN }, at);
              if (node)
                timeline.to(node, { opacity: 1, duration: ramp, ease: EASE_IN }, at);
              if (dot) timeline.to(dot, { scale: 1, duration: ramp, ease: EASE_IN }, at);
            }

            if (!isLast) {
              const at = focus + hold;
              timeline.to(card, { ...CARD_IDLE, duration: ramp, ease: EASE_OUT }, at);
              if (node)
                timeline.to(node, { opacity: 0.45, duration: ramp, ease: EASE_OUT }, at);
              if (dot) timeline.to(dot, { scale: 0.3, duration: ramp, ease: EASE_OUT }, at);
            }
          });

          /**
           * A stop's height changes when a role is selected. Refreshing is
           * expensive, so it waits for the layout to settle rather than running
           * through the 300ms the panel takes to swap.
           */
          let pending: number | undefined;
          const settle = () => {
            window.clearTimeout(pending);
            pending = window.setTimeout(() => ScrollTrigger.refresh(), 180);
          };
          const observer = new ResizeObserver(settle);
          observer.observe(track);

          /**
           * The first measurement is load-bearing, and it is the one most likely
           * to be wrong.
           *
           * `travel()` reads the track's width against the frame's, and if the
           * stylesheet has not landed when this runs — which is the normal case
           * in development, where CSS arrives through script — the track has not
           * been told to be `w-max` yet and measures exactly one viewport. Travel
           * comes out 0, the pin is given no distance, and the stage scrolls past
           * instead of holding. Observed: a pin-spacer with `padding: 0`.
           *
           * ResizeObserver would catch it, but it is delivered at the end of a
           * rendering cycle, so anything that delays the first frame delays the
           * correction with it. A frame and a `load` are two more paths to the
           * same refresh, owing nothing to each other: `load` is the one that
           * also catches late images changing the track's width.
           */
          const raf = requestAnimationFrame(settle);
          window.addEventListener("load", settle);
          /* And a plain timeout, which is the only one of the four that owes
             nothing to the page being rendered or to `load` still being ahead
             of us. Both of those assumptions fail somewhere: `load` has usually
             already fired by the time hydration attaches this listener, and a
             frame callback does not run at all in a backgrounded tab — which is
             exactly where a stage measured at zero travel would sit until the
             visitor came back to it. */
          const timeout = window.setTimeout(settle, 0);

          return () => {
            cancelAnimationFrame(raf);
            window.clearTimeout(timeout);
            window.removeEventListener("load", settle);
            window.clearTimeout(pending);
            observer.disconnect();
            triggerRef.current = null;
          };
        },
      );
    },
    { scope: stageRef },
  );

  const heading = (
    <div className="shrink-0 px-5 text-center">
      <h2 className="text-balance text-3xl tracking-[-0.028em] md:text-[2.5rem] md:leading-[1.08]">
        <T en="Experience" id="Pengalaman" />
      </h2>
      <MicroLabel className="mt-3 tracking-[0.2em]">
        <Scramble
          en={`${START_YEAR} — ${IS_ONGOING ? "Present" : ""} · ${count} companies · ${TOTAL_ROLES} roles`}
          id={`${START_YEAR} — ${IS_ONGOING ? "Sekarang" : ""} · ${count} perusahaan · ${TOTAL_ROLES} peran`}
        />
      </MicroLabel>
    </div>
  );

  /**
   * The spine.
   *
   * A stepper first and a decoration second: it says how many stops there are,
   * which one is being read, and — because the nodes are buttons — it is the
   * only way to reach the far one without scrolling through everything between.
   * Hidden below md, where the stops are a column and the page's own scrollbar
   * already does this job.
   */
  const spine = (
    <nav
      aria-label="Experience timeline"
      className="exp-spine hidden shrink-0 justify-center px-[6vw] stage:flex"
    >
      <div ref={spineRef} className="relative w-[min(88vw,1320px)]">
        {/* The rule and its progress share one row, and the nodes sit on top of
            it with a ground-coloured fill, so the line is cut cleanly where a
            node lands instead of running visibly beneath the label. */}
        <div aria-hidden className="absolute inset-x-0 top-1/2 -translate-y-1/2">
          <div className="border-t border-dashed border-border" />
          <div
            ref={progressRef}
            className="absolute inset-x-0 top-0 origin-left border-t-2 border-accent/70"
          />
          <span
            ref={headRef}
            className="exp-spine-head absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2"
          />
        </div>

        <ol className="relative flex items-center justify-between">
          {experience.map((job, index) => (
            <li key={job.company} className="min-w-0 max-w-[45%]">
              <button
                type="button"
                onClick={() => goToStop(index)}
                aria-current={activeStop === index ? "step" : undefined}
                className="exp-node group flex items-center gap-2.5"
              >
                <span className="exp-node-mark">
                  <span className="exp-node-dot" />
                </span>
                <span className="flex min-w-0 flex-col items-start gap-1 text-left">
                  <span className="font-mono text-[10px] leading-none tabular-nums text-accent-strong dark:text-accent">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="max-w-full truncate font-display text-[0.8125rem] leading-none tracking-[-0.01em]">
                    {job.company}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );

  const stops = experience.map((job, index) => (
    <JobStop key={job.company} job={job} index={index} />
  ));

  /* Reduced motion gets the column outright rather than markup that only
     behaves like one because a media query did not match. */
  if (reduceMotion) {
    return (
      <div className="container-page flex flex-col gap-10 py-20">
        {heading}
        {stops}
      </div>
    );
  }

  return (
    <div ref={stageRef}>
      {/* Two boxes, and the inner one is not redundant: ScrollTrigger moves a
          pinned element's padding onto the spacer it creates and writes
          `padding: 0` inline on the element itself, so any clearance declared on
          `.exp-frame` is silently thrown away the moment the pin engages. The
          navbar is fixed and floats over this stage, so that clearance is the
          difference between a section heading and a section heading with a
          navigation pill sitting on it. It lives one level in, where the pin
          cannot reach it. */}
      <div ref={frameRef} className="exp-frame stage:h-svh stage:overflow-hidden">
        <div className="flex h-full flex-col justify-center gap-8 py-16 stage:gap-6 stage:pb-6 stage:pt-20">
          {heading}
          {spine}

          {/* The track's own row. `overflow-hidden` from md up so a card leaving
              the frame is clipped at the edge of the stage rather than widening
              the document — the pin is fixed-position, and a fixed element that
              overflows still counts. */}
          <div className="min-h-0 stage:overflow-hidden">
            <div
              ref={trackRef}
              className="exp-track flex flex-col gap-12 px-5 stage:w-max stage:flex-row stage:items-start stage:gap-14 stage:px-[6vw]"
            >
              {stops}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Experience() {
  return (
    // A page, not a section: no padding, no content column, nothing that would
    // draw the edge of a component. The ground underneath belongs to
    // <ExperienceZone> — the lattice is already full-bleed and already this
    // section's own, so painting another background here would only hide it.
    <section id="experience" className="on-lattice relative scroll-mt-24">
      <ExperienceStage />
    </section>
  );
}
