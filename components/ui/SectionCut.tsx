"use client";

import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type AnimationPlaybackControls,
  type MotionValue,
} from "framer-motion";
import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { useLenisRef } from "@/components/providers/SmoothScrollProvider";
import { EASE } from "@/lib/motion";

/**
 * A cut between two sections, in place of a scroll between them.
 *
 * Everywhere else on this page a boundary is something you scroll through: the
 * ground changes while the wheel keeps turning. Here it is a cut. Reaching the
 * foot of the hero and pushing down does not move the page — it plays a
 * transition. The hero racks out of focus and pulls away, the screen blooms,
 * the scroll is moved underneath that bloom, and the experience page resolves
 * out of a radial smear. One gesture, one cut, like turning a page rather than
 * sliding one out from under another.
 *
 * `cut` is the only state, and it is a position rather than a progress: 0 means
 * the hero holds the screen, 1 means the experience page does. Everything else
 * is derived from it — the hero's blur, the bloom, and the `arrival` the
 * lattice's zoom-blur pass reads. That matters for the ways in that are not a
 * scroll at all: a navbar anchor, a deep link, a dragged scrollbar. None of
 * those play the cut, so a scroll listener simply sets `cut` to whichever end
 * the position implies, and the page is in the right state without having
 * animated into it.
 *
 * The scroll is moved at the midpoint, while the bloom is at full. There is no
 * moment where both pages have to be on screen at once, which is what keeps
 * this from needing either half pinned or snapshotted — the two are 1,200px
 * apart in the document and never seen together.
 *
 * Off entirely under reduced motion. Taking the scroll away from someone is a
 * strong thing to do, and it is exactly what that setting is asking us not to
 * do; the boundary goes back to being an ordinary scroll.
 */

/** How far through `cut` the outgoing page has finished leaving. The scroll is
 *  moved here, and the incoming page owns everything after it. */
const MIDPOINT = 0.45;

const LEAVE_SECONDS = 0.42;
const ARRIVE_SECONDS = 0.62;

/**
 * How close the *painted* scroll has to be to a boundary before the cut will
 * claim a gesture.
 *
 * Deliberately tiny, and deliberately measured against the painted position
 * rather than the one the scroll is heading for. An earlier version claimed the
 * gesture 130px out, so that a fast scroll could not step over the boundary —
 * and the price was that the foot of the hero was never reached: the tech
 * marquee was cut away mid-read. Overshoot is now handled by landing on the
 * boundary instead of by firing early (see `onWheel`), which means this can be
 * strict, and being strict is what guarantees the last screen of the hero is
 * fully seen and can be sat on for as long as you like before anything moves.
 *
 * Painted, not target, so a hard flick cannot carry through: the page has to
 * have actually arrived at the foot of the hero, not merely be on its way.
 */
const ARRIVED = 8;

/** Touch has no notches to land on and its own momentum underneath, so it gets
 *  a looser idea of "at the boundary" than the wheel does. */
const TOUCH_EDGE = 56;

/** Mirrors `scroll-padding-top` and Lenis's anchor offset — the fixed navbar's
 *  clearance, so the cut lands the heading below the bar rather than behind it. */
const LANDING_OFFSET = 96;

/** How close to either end counts as being settled at it. Small — this only has
 *  to absorb the fractional scroll positions smooth scrolling lands on. */
const SETTLE_SLACK = 24;

const ArrivalContext = createContext<MotionValue<number> | null>(null);

/**
 * How far the incoming page has arrived: 0 is a full radial smear, 1 is sharp.
 * Null when there is no cut above — under reduced motion, or in any tree that
 * does not use one — so callers can fall back to simply being here already.
 */
export function useSectionArrival() {
  return useContext(ArrivalContext);
}

export function SectionCut({
  fromId,
  toId,
  children,
}: {
  /** The section that holds the screen first. */
  fromId: string;
  /** The section the cut lands on. */
  toId: string;
  children: ReactNode;
}) {
  const prefersReducedMotion = useReducedMotion();
  const lenisRef = useLenisRef();

  const cut = useMotionValue(0);

  // The bloom peaks across the midpoint and is gone before the arrival ends, so
  // the lattice is still resolving in the open rather than behind a curtain.
  const bloom = useTransform(cut, [0, 0.4, 0.55, 0.9], [0, 1, 1, 0]);
  const bloomVisibility = useTransform(cut, (value) =>
    value > 0.001 && value < 0.999 ? "visible" : "hidden",
  );

  // The incoming page owns the back half of the timeline.
  const arrival = useTransform(cut, [MIDPOINT, 1], [0, 1]);

  const phase = useRef<"idle" | "playing">("idle");
  const playing = useRef<AnimationPlaybackControls | null>(null);

  /**
   * The outgoing page, driven imperatively.
   *
   * The hero is rendered by a server component two levels up, so there is no
   * motion value to hand it and no way to hand it one without making the whole
   * page a client tree. Writing three properties on one element from the
   * controller that owns the cut is the smaller cost — and the hero is not a
   * participant here so much as one of the two things being cut between.
   */
  useEffect(() => {
    if (prefersReducedMotion) return;
    const outgoing = document.getElementById(fromId);
    if (!outgoing) return;

    const apply = (value: number) => {
      const progress = Math.min(1, value / MIDPOINT);
      if (progress <= 0) {
        // Cleared rather than set back to their identity values, so the element
        // goes back to being an ordinary section — a lingering `filter` would
        // keep it a composited layer and a containing block for good.
        outgoing.style.filter = "";
        outgoing.style.transform = "";
        outgoing.style.opacity = "";
        outgoing.style.willChange = "";
        return;
      }
      outgoing.style.filter = `blur(${(progress * 14).toFixed(2)}px)`;
      /**
       * The hero recedes rather than pushing toward the viewer, and that is a
       * correctness fix before it is a compositional one.
       *
       * Scaling a full-width section *up* makes its painted box wider than the
       * viewport, and painted overflow to the right is scrollable overflow —
       * `opacity: 0` does not exempt it. So the old `scale(1.12)` left the page
       * 76px wider than the window for as long as the cut was on the experience
       * side, which is to say a horizontal scrollbar under experience, projects
       * and contact, and a flicker of one during every crossing. Scaling down
       * cannot overflow anything.
       *
       * It also reads better with what it is cut against: the lattice arrives by
       * resolving toward you, so the hero leaving by falling away is one
       * movement in each direction rather than two forward.
       */
      outgoing.style.transform = `scale(${(1 - progress * 0.08).toFixed(4)})`;
      outgoing.style.opacity = (1 - progress).toFixed(3);
      // Only while it is actually moving: holding a layer this size promoted
      // for the life of the page costs memory for nothing.
      outgoing.style.willChange = value < 1 ? "transform, filter, opacity" : "";
    };

    apply(cut.get());
    return cut.on("change", apply);
  }, [cut, fromId, prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion) return;

    // Captured inside the effect so the cleanup below is reaching a handle this
    // effect owns. It is the ref object, not the instance: the point of the
    // cleanup is to hand the scroll back to whichever Lenis is live at the time.
    const scroller = lenisRef;

    /**
     * Layout position, walked up the offset chain — deliberately not
     * `getBoundingClientRect`.
     *
     * A rect includes transforms, and the hero spends the whole back half of
     * the timeline scaled to 1.12. Measuring the gate off a rect would move
     * the gate by ~35px depending on how far through the cut we happen to be,
     * so the reverse cut would land somewhere slightly different every time.
     * `offsetTop`/`offsetHeight` are layout values and ignore transforms
     * entirely, which is the whole reason to prefer them here.
     *
     * The walk is what makes them usable: `offsetTop` is relative to the
     * nearest positioned ancestor, and the experience section sits inside a
     * `relative` zone, so read on its own it would measure from the wrong
     * origin.
     */
    const documentTop = (element: HTMLElement) => {
      let total = 0;
      let node: HTMLElement | null = element;
      while (node) {
        total += node.offsetTop;
        node = node.offsetParent as HTMLElement | null;
      }
      return total;
    };

    const measure = () => {
      const outgoing = document.getElementById(fromId);
      const incoming = document.getElementById(toId);
      if (!outgoing || !incoming) return null;
      return {
        // Where the hero has nothing left to show: its foot at the viewport's.
        gate: Math.max(0, documentTop(outgoing) + outgoing.offsetHeight - window.innerHeight),
        land: Math.max(0, documentTop(incoming) - LANDING_OFFSET),
      };
    };

    const jumpTo = (position: number) => {
      const lenis = scroller?.current;
      // `force`, because the instance is stopped for the length of the cut and
      // an ordinary scrollTo would be ignored.
      if (lenis) lenis.scrollTo(position, { immediate: true, force: true });
      else window.scrollTo(0, position);
    };

    const play = async (to: number, landing: number) => {
      phase.current = "playing";
      scroller?.current?.stop();

      try {
        // Two segments rather than one, so the scroll moves at a point the
        // timeline defines instead of at whichever frame happens to cross it.
        playing.current = animate(cut, MIDPOINT, {
          duration: LEAVE_SECONDS,
          ease: "easeIn",
        });
        await playing.current.finished;

        jumpTo(landing);

        playing.current = animate(cut, to, { duration: ARRIVE_SECONDS, ease: EASE });
        await playing.current.finished;
      } catch {
        // An interrupted animation rejects. Nothing to repair — the finally
        // below hands the scroll back either way.
      } finally {
        playing.current = null;
        scroller?.current?.start();
        phase.current = "idle";
      }
    };

    /**
     * Spends the current notch arriving exactly at a boundary.
     *
     * It has to be a real `scrollTo`. Lenis's own wheel handling ends in
     * `this.scrollTo(this.targetScroll + delta)`, and it is `scrollTo` that
     * starts the animation — assigning `targetScroll` on its own only sets a
     * number that the animation already in flight never reads. Worse, this
     * handler stops propagation, so on a real wheel event Lenis usually never
     * sees it at all: there was no animation to correct, and the page simply
     * stopped moving a little short of the foot of the hero, with the cut
     * unable to arm because the scroll never arrived at it.
     *
     * Queued as a microtask so it lands after the whole dispatch. That makes it
     * the last word whether or not Lenis also saw this event — it supplies the
     * movement when Lenis did not, and replaces Lenis's own destination when it
     * did.
     *
     * No options: the instance's own `lerp` carries it, so landing on the
     * boundary travels at exactly the speed everything else on the page does.
     */
    const glideTo = (position: number) => {
      const lenis = scroller?.current;
      if (!lenis) {
        window.scrollTo({ top: position, behavior: "smooth" });
        return;
      }
      queueMicrotask(() => lenis.scrollTo(position));
    };

    const claim = (event: Event) => {
      event.preventDefault();
      // Keeps the event from reaching Lenis's own window listener, which would
      // otherwise add this notch to a scroll the cut has just taken over.
      event.stopPropagation();
    };

    /**
     * A wheel notch, in pixels.
     *
     * `deltaMode` is not always pixels: a classic mouse wheel reports lines,
     * and reading its `deltaY` of 3 as three pixels would mean never noticing
     * that the notch is about to cross the boundary.
     */
    const notch = (event: WheelEvent) => {
      if (event.deltaMode === 1) return event.deltaY * 16;
      if (event.deltaMode === 2) return event.deltaY * window.innerHeight;
      return event.deltaY;
    };

    /**
     * The boundary is landed on, then cut across — never both at once.
     *
     * A notch that would carry the page past the boundary is spent arriving at
     * it exactly instead, so the foot of the hero always gets its own moment on
     * screen. Only once the page has actually settled there does the next push
     * play the cut. That is both the fix for the marquee being cut away and a
     * better answer to overshoot than firing early was: nothing can step over a
     * boundary that absorbs the step.
     */
    const onWheel = (event: WheelEvent) => {
      if (phase.current === "playing") {
        event.preventDefault();
        return;
      }
      const points = measure();
      if (!points) return;

      const lenis = scroller?.current;
      // Two positions, two jobs: where the scroll is heading decides whether
      // this notch would overshoot, where it has actually reached decides
      // whether the cut may claim it.
      const heading = lenis ? lenis.targetScroll : window.scrollY;
      const painted = lenis ? lenis.animatedScroll : window.scrollY;
      const delta = notch(event);

      if (delta > 0 && cut.get() < 0.5) {
        if (painted >= points.gate - ARRIVED) {
          claim(event);
          void play(1, points.land);
        } else if (heading + delta > points.gate) {
          claim(event);
          glideTo(points.gate);
        }
        return;
      }

      if (delta < 0 && cut.get() > 0.5) {
        if (painted <= points.land + ARRIVED) {
          claim(event);
          void play(0, points.gate);
        } else if (heading + delta < points.land) {
          claim(event);
          glideTo(points.land);
        }
      }
    };

    let touchOrigin = 0;
    const onTouchStart = (event: TouchEvent) => {
      touchOrigin = event.touches[0]?.clientY ?? 0;
    };

    /**
     * Touch keeps the simpler rule. Lenis leaves touch to the OS, so there is
     * no target to read and no notch to spend on landing — the page is already
     * moving under its own momentum by the time this fires. So the cut only
     * claims a swipe that starts within reach of the boundary, and a fling that
     * sails past is left to the position sync below, which puts the page in the
     * right state without the animation.
     */
    const onTouchMove = (event: TouchEvent) => {
      if (phase.current === "playing") {
        event.preventDefault();
        return;
      }
      const y = event.touches[0]?.clientY;
      if (y === undefined) return;
      // Swiping up drags the page down, so the sign matches a wheel's deltaY.
      const delta = touchOrigin - y;
      if (Math.abs(delta) < 8) return;

      const points = measure();
      if (!points) return;
      const position = window.scrollY;

      if (delta > 0 && cut.get() < 0.5 && position >= points.gate - TOUCH_EDGE) {
        claim(event);
        void play(1, points.land);
      } else if (delta < 0 && cut.get() > 0.5 && position <= points.land + TOUCH_EDGE) {
        claim(event);
        void play(0, points.gate);
      }
    };

    /**
     * The ways in that are not a gesture: an anchor from the navbar, a deep
     * link, a dragged scrollbar, a restored position on reload. None of them
     * play the cut, so the position has to decide the state instead.
     *
     * Keyed to the two ends rather than to a band around them, because an
     * anchor lands *exactly* on `land` — a rule that only fired well past it
     * would leave a visitor who clicked "Experience" looking at an invisible
     * lattice. And keyed to the ends rather than to a midpoint, because
     * between them the hero is still partly on screen, and snapping it to
     * blurred-and-gone while it is visible is worse than leaving the ground
     * unlit for the few hundred pixels only a dragged scrollbar can reach.
     */
    const onScroll = () => {
      if (phase.current === "playing") return;
      const points = measure();
      if (!points) return;
      const position = window.scrollY;
      if (position >= points.land - SETTLE_SLACK) {
        if (cut.get() !== 1) cut.set(1);
      } else if (position <= points.gate + SETTLE_SLACK) {
        if (cut.get() !== 0) cut.set(0);
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false, capture: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false, capture: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("wheel", onWheel, { capture: true });
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove, { capture: true });
      window.removeEventListener("scroll", onScroll);
      playing.current?.stop();
      // Whatever happens to this component, the scroll goes back to the visitor.
      scroller?.current?.start();
    };
  }, [cut, fromId, toId, lenisRef, prefersReducedMotion]);

  return (
    <ArrivalContext.Provider value={prefersReducedMotion ? null : arrival}>
      {children}

      {/* The bloom the scroll moves under. Not a flat wipe: the page's own
          background with a warm centre, so the moment between the two pages
          reads as light rather than as a blank frame.

          Below the grain (z 60) and the navbar, so the site's own chrome stays
          on top of the cut the way it stays on top of everything else. */}
      {!prefersReducedMotion && (
        <motion.div
          aria-hidden
          style={{ opacity: bloom, visibility: bloomVisibility }}
          className="pointer-events-none fixed inset-0 z-40 bg-background"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,color-mix(in_srgb,var(--accent-500)_26%,transparent),transparent_62%)]" />
        </motion.div>
      )}
    </ArrivalContext.Provider>
  );
}
