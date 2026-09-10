"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useAnimationFrame, useMotionValue, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useRef, type PointerEvent as ReactPointerEvent, type FocusEvent } from "react";
import { T } from "./T";
import { Scramble } from "./Scramble";
import { GeneratedCover } from "./ProjectCoverArt";
import { useCurrentLocale } from "@/components/providers/LocaleProvider";
import { pick } from "@/lib/i18n";
import type { ProjectMeta } from "@/lib/projects";
import { cn } from "@/lib/utils";

/**
 * The project shelf: a band of covers that drifts on its own and can be thrown
 * by hand.
 *
 * It replaces a coverflow that showed one project at a time behind two cropped
 * neighbours. That framing was the problem it was built to solve — with nine
 * case studies, seeing one of them is not a browse, it is a slideshow, and the
 * arrows made the visitor ask for each next thing. A band that is already
 * moving says the opposite: there is more here, and it is yours to push.
 *
 * Three mechanisms, one position value:
 *
 * - The drift is the resting state, slow enough to read a cover as it passes.
 * - A drag adds to the same value directly, so the covers track the finger with
 *   no lag and no rubber band.
 * - Releasing hands the pointer's own velocity to a decaying momentum term that
 *   dies back into the drift, so a throw ends by rejoining the ambient motion
 *   rather than by stopping dead.
 *
 * Everything is one `transform` on one element. Nothing here reflows.
 */

/** Pixels per millisecond, ~50px/s: a cover crosses a laptop screen in about
 *  half a minute. Fast enough to notice, slow enough to ignore. */
const DRIFT = 0.05;

/** How long a throw takes to fade back into the drift. Milliseconds; the decay
 *  is exponential, so this is the time to fall to ~37% of the release speed. */
const MOMENTUM_TAU = 380;

/**
 * Ceiling on a flick, in px/ms — and the number that matters is not the speed
 * but what it adds up to. Momentum decays exponentially, so a throw travels
 * `velocity × MOMENTUM_TAU` before it rejoins the drift. At the old ceiling of
 * 4 that was 4 × 380 = 1520px, better than half the loop and five covers gone
 * by in under half a second: the throw read as a jump cut rather than as a
 * push. A hard drag on a 120Hz trackpad genuinely reports 3–5px/ms, so that
 * ceiling was doing almost no limiting at all.
 *
 * 1.6 puts the longest possible throw at ~610px — two covers at desktop size.
 * Far enough to feel thrown, short enough to watch.
 */
const MAX_FLICK = 1.6;

/** Past this much travel, the gesture was a drag and the click that ends it is
 *  not meant to open anything. */
const DRAG_SLOP = 6;

/**
 * Weight of the newest sample in the running velocity estimate.
 *
 * A single pair of pointer events is a bad measurement: the browser coalesces
 * moves, so one event can carry 60px of travel and report a millisecond of
 * elapsed time, which reads as 60px/ms. Averaging over the last few moves is
 * what turns that into the speed the hand is actually going.
 */
const VELOCITY_SMOOTHING = 0.3;

/**
 * A finger that has been still this long is not throwing anything.
 *
 * Velocity is only sampled when the pointer moves, so holding the shelf still
 * before letting go leaves the last real movement sitting in the estimate.
 * Without this the shelf flies off on release from a hand that had already
 * stopped — the worst kind of surprise, because the visitor did nothing to ask
 * for it.
 */
const IDLE_BEFORE_RELEASE = 80;

/**
 * Three passes of the list, not two.
 *
 * The loop works by resetting position every time one full copy has gone by, so
 * the covers on screen at that instant must be able to come from the copies
 * that remain. Two copies hold up only while one copy is wider than the
 * viewport; on a display wide enough to see a whole copy at once, the reset
 * would expose the gap behind it. Three copies keep the band unbroken to well
 * past 4K, and cost nothing in bandwidth — the duplicates are the same image
 * URLs, so the browser fetches each cover once.
 */
const COPIES = 3;

/** Keep the offset inside one period, so the number never grows without bound
 *  and the seam always lands where a copy begins. */
function wrapOffset(value: number, period: number) {
  if (period <= 0) return value;
  const wrapped = value % period;
  return wrapped > 0 ? wrapped - period : wrapped;
}

export function ProjectMarquee({ projects }: { projects: ProjectMeta[] }) {
  const locale = useCurrentLocale();
  const reduceMotion = useReducedMotion();

  const x = useMotionValue(0);
  /** One copy's width, including its trailing gap — the loop's period. */
  const copyRef = useRef<HTMLUListElement>(null);

  const isDragging = useRef(false);
  const isPaused = useRef(false);
  /** px per ms; positive is rightward. What the frame loop spends down. */
  const momentum = useRef(0);
  /** px per ms; the smoothed estimate of how fast the pointer is going. */
  const velocity = useRef(0);
  const lastPointerX = useRef(0);
  const lastPointerTime = useRef(0);
  const travelled = useRef(0);

  useAnimationFrame((_, delta) => {
    if (isDragging.current) return;

    const period = copyRef.current?.offsetWidth ?? 0;
    if (period <= 0) return;

    if (momentum.current !== 0) {
      momentum.current *= Math.exp(-delta / MOMENTUM_TAU);
      if (Math.abs(momentum.current) < 0.002) momentum.current = 0;
    }

    const drift = isPaused.current || reduceMotion ? 0 : -DRIFT;
    const moved = (drift + momentum.current) * delta;
    if (moved !== 0) x.set(wrapOffset(x.get() + moved, period));
  });

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    // Let a middle- or right-click through untouched; only a primary press is
    // a drag, and swallowing the others would break open-in-new-tab.
    if (event.button !== 0) return;
    isDragging.current = true;
    travelled.current = 0;
    momentum.current = 0;
    velocity.current = 0;
    lastPointerX.current = event.clientX;
    lastPointerTime.current = performance.now();
    // Capture keeps the gesture alive when the finger leaves the band, so a
    // drag that strays upward does not simply stop. It is an enhancement, not
    // a requirement: a pointer id the browser no longer considers active
    // throws, and the drag works fine without it, so a failure here must not
    // take the gesture down with it.
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* no capture available — the drag still tracks while over the band */
    }
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;

    const now = performance.now();
    const dx = event.clientX - lastPointerX.current;
    // Guard the divide: two moves inside the same millisecond would otherwise
    // report an infinite velocity and fire the shelf off the screen.
    const dt = Math.max(now - lastPointerTime.current, 1);

    lastPointerX.current = event.clientX;
    lastPointerTime.current = now;
    travelled.current += Math.abs(dx);
    velocity.current =
      velocity.current * (1 - VELOCITY_SMOOTHING) + (dx / dt) * VELOCITY_SMOOTHING;

    x.set(wrapOffset(x.get() + dx, copyRef.current?.offsetWidth ?? 0));
  };

  const onPointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const wentStill = performance.now() - lastPointerTime.current > IDLE_BEFORE_RELEASE;
    momentum.current =
      reduceMotion || wentStill
        ? 0
        : Math.max(-MAX_FLICK, Math.min(MAX_FLICK, velocity.current));
    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      /* nothing to release */
    }
  };

  // A drag that finishes over a cover must not open it. Capture phase, so this
  // runs before the link's own handler.
  const onClickCapture = (event: React.MouseEvent) => {
    if (travelled.current > DRAG_SLOP) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  /**
   * Keyboard access. The band is positioned by transform inside a clipped box,
   * so the browser has nothing to scroll when focus lands on a cover that is
   * currently off to one side — the focus ring would simply be invisible.
   * Moving the band to the focused cover is what keeps tabbing usable.
   *
   * `:focus-visible` is load-bearing, not a nicety. Browsers focus a link on
   * mousedown, so without this guard every grab of a cover was also a focus of
   * it, and this handler teleported the band to put that cover at the left
   * edge — the shelf jumping to whatever you had just taken hold of, on every
   * single drag. The guard keeps the jump for the case it was written for, the
   * keyboard, where focus moving to something you cannot see is the actual
   * problem. The drag check is a second line for browsers whose focus-visible
   * heuristics let a pointer through.
   */
  const onCardFocus = (event: FocusEvent<HTMLElement>) => {
    const card = event.currentTarget;
    if (isDragging.current || !card.matches(":focus-visible")) return;
    const period = copyRef.current?.offsetWidth ?? 0;
    x.set(wrapOffset(-card.offsetLeft + 32, period));
  };

  if (projects.length === 0) return null;

  const shelf = Array.from({ length: COPIES }, (_, copy) => (
    <ul
      key={copy}
      // Only the first pass is the real list. The duplicates exist to make the
      // loop seamless and are hidden from assistive tech and from the tab
      // order, so nine projects are announced once rather than twenty-seven.
      ref={copy === 0 ? copyRef : undefined}
      aria-hidden={copy > 0}
      // `relative` so a card's offsetLeft is measured against its own copy,
      // which is what the focus handler above assumes.
      className="relative flex shrink-0 gap-5 pr-5 md:gap-7 md:pr-7"
    >
      {projects.map((project) => {
        const title = pick(project.title, locale);

        return (
          // No width of its own: the cover below is sized from the viewport
          // height, and the card takes its width from that.
          <li key={project.slug} className="shrink-0">
            <Link
              href={`/projects/${project.slug}`}
              transitionTypes={["nav-forward"]}
              tabIndex={copy > 0 ? -1 : undefined}
              onFocus={copy === 0 ? onCardFocus : undefined}
              aria-label={`${title}, ${pick({ en: "open project", id: "buka proyek" }, locale)}`}
              className="group block"
              draggable={false}
            >
              {/*
                Height first, width from the ratio — the section is meant to be
                one screenful, and a cover measured in pixels cannot promise
                that. On a short laptop the band shrinks to fit rather than
                pushing the heading or the footer line off the bottom; the cap
                stops it growing silly on a tall display, and the floor keeps a
                cover legible on a phone in landscape.
              */}
              <span
                className="project-marquee-cover relative block aspect-[5/7] h-[min(380px,40svh)] min-h-[250px] overflow-hidden rounded-xl bg-surface-2 md:h-[min(520px,48svh)] md:rounded-2xl"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                {project.cover ? (
                  <Image
                    src={project.cover.src}
                    alt=""
                    aria-hidden
                    fill
                    sizes="(max-width: 640px) 280px, 400px"
                    draggable={false}
                    className="motion-art object-contain"
                  />
                ) : (
                  <GeneratedCover slug={project.slug} className="motion-art">
                    <span className="absolute inset-0 flex flex-col justify-end gap-1.5 p-5">
                      <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/70">
                        <T en={project.role.en} id={project.role.id} />
                      </span>
                      <span className="font-display text-lg leading-tight text-white">
                        <T en={project.title.en} id={project.title.id} />
                      </span>
                    </span>
                  </GeneratedCover>
                )}

                <span className="absolute inset-0 bg-navy/0 transition-colors duration-300 group-hover:bg-navy/25" />
                <span className="absolute inset-x-0 bottom-0 flex translate-y-2 items-center justify-center gap-1.5 p-4 text-xs font-medium text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  <T en="View project" id="Lihat proyek" />
                  <ArrowUpRight size={14} />
                </span>
              </span>

              {/* `w-0 min-w-full` keeps the caption out of the card's width
                  calculation, so a long project title cannot make one card
                  wider than the rest — the cover decides the column, the text
                  wraps inside it. */}
              <span className="project-marquee-caption mt-4 block w-0 min-w-full px-0.5">
                <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-accent-strong dark:text-accent">
                  {copy === 0 ? (
                    <Scramble en={project.role.en} id={project.role.id} />
                  ) : (
                    <T en={project.role.en} id={project.role.id} />
                  )}
                </span>
                <span className="mt-1.5 block text-balance text-sm leading-snug tracking-[-0.012em] transition-colors group-hover:text-accent-strong dark:group-hover:text-accent md:text-base">
                  <T en={project.title.en} id={project.title.id} />
                </span>
                <span className="mt-1 block truncate text-xs text-muted">
                  <T en={project.client.en} id={project.client.id} />
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  ));

  return (
    <div
      // Full-bleed: the band belongs to the screen, not to the text column it
      // sits under. The section clips horizontally, so widening past the
      // container cannot push the page sideways.
      className="relative left-1/2 w-screen -translate-x-1/2"
    >
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onPointerEnter={() => (isPaused.current = true)}
        onPointerLeave={() => (isPaused.current = false)}
        onFocusCapture={() => (isPaused.current = true)}
        onBlurCapture={() => (isPaused.current = false)}
        onClickCapture={onClickCapture}
        className={cn(
          "overflow-hidden py-2",
          // `pan-y`: horizontal drags belong to this component, vertical ones
          // stay with the page, so a thumb swiping down a phone still scrolls.
          "cursor-grab select-none touch-pan-y active:cursor-grabbing",
        )}
      >
        <motion.div style={{ x }} className="flex w-max">
          {shelf}
        </motion.div>
      </div>

      {/* The band runs off both edges rather than stopping at them — a hard cut
          would read as the end of the list, which is the one thing an endless
          loop is not. Hidden below md, where the fade would eat most of a card. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 hidden w-[8vw] bg-gradient-to-r from-background to-transparent md:block"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-[8vw] bg-gradient-to-l from-background to-transparent md:block"
      />
    </div>
  );
}
