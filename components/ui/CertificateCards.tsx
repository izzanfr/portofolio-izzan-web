"use client";

import Image from "next/image";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { BadgeCheck, Expand } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Modal } from "./Modal";
import { T } from "./T";
import { Scramble } from "./Scramble";
import { EASE, VIEWPORT } from "@/lib/motion";
import { useCurrentLocale } from "@/components/providers/LocaleProvider";
import { pick } from "@/lib/i18n";
import type { PublisherGroup } from "@/lib/certifications";
import { cn } from "@/lib/utils";

/**
 * The credentials, read sideways.
 *
 * The page holds still while the certificates travel across it: vertical
 * scrolling is mapped onto horizontal movement, one pixel for one pixel, for
 * exactly as long as there is rail left to cover. That mapping is the point.
 * The wheel does what it always did at the speed it always did, and the
 * section is tall by precisely the distance the rail must travel — so the
 * pinning releases the instant the last certificate lands, rather than holding
 * anyone for a round number of screens.
 *
 * Turning someone's scroll ninety degrees is a strong thing to do, so it is
 * opt-in twice over. Reduced motion gets a plain vertical grid and no pinning,
 * because this is exactly the kind of motion that setting asks us to drop. And
 * `.cert-stage` in globals.css unwinds the pinning when the page is unscripted,
 * so a failed chunk leaves a readable column rather than a tall empty section
 * with one card stranded in it.
 */

/** Rail card width. Wide enough that a certificate is legible in passing. */
const CARD = "w-[74vw] shrink-0 sm:w-[46vw] lg:w-[34vw] xl:w-[28vw]";

/**
 * Scroll room, in pixels, reserved at each end of the pinned stretch for the
 * page to arrive and to leave.
 *
 * The transitions have to happen while the stage is pinned, or they are not
 * transitions between pages — they are things happening to a section as it
 * scrolls past. Buying that room here is what lets the viewport stay locked on
 * this page for the whole of both movements.
 */
const LEAD = 460;

/** Pixels the mark shifts inside its tile from one edge of the screen to the
 *  other. The tile is padded and the mark is centred, so the shift always has
 *  margin to spend; the tile clips anyway as a backstop. */
const PARALLAX = 34;

/** Pixels a card rises as it crosses the middle of the screen. */
const LIFT = 16;

export function CertificateCards({ publishers }: { publishers: PublisherGroup[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const close = useCallback(() => setOpenIndex(null), []);
  const active = openIndex === null ? null : publishers[openIndex];
  const locale = useCurrentLocale();
  const reduceMotion = useReducedMotion();

  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);

  /**
   * The rail's geometry, measured rather than assumed — it depends on the
   * viewport, the card width and where the labels happen to wrap, none of
   * which are known until it is on screen.
   *
   * `pitch` and `base` are what let each card work out where it is on the
   * screen without measuring itself every frame: the cards are evenly spaced,
   * so card `i` sits at `base + i * pitch`, and adding the rail's current
   * offset gives its position live. Reading layout inside a transform would
   * force a reflow on every frame of the scroll; two numbers taken once do
   * not.
   */
  const [rail, setRail] = useState({ distance: 0, base: 0, pitch: 0, width: 0, viewport: 0 });
  const distance = rail.distance;

  useEffect(() => {
    const track = trackRef.current;
    if (!track || reduceMotion) return;

    // ResizeObserver fires once on observe, so the first measurement arrives
    // from the callback too — no synchronous setState in the effect body.
    const measure = () => {
      const viewport = document.documentElement.clientWidth;
      const first = track.children[0] as HTMLElement | undefined;
      const second = track.children[1] as HTMLElement | undefined;
      setRail({
        distance: Math.max(0, track.scrollWidth - viewport),
        base: first?.offsetLeft ?? 0,
        pitch: first && second ? second.offsetLeft - first.offsetLeft : 0,
        width: first?.offsetWidth ?? 0,
        viewport,
      });
    };

    const observer = new ResizeObserver(measure);
    observer.observe(track);
    window.addEventListener("resize", measure);

    /**
     * A second path to the first measurement, because the first one is
     * load-bearing: with `distance` still 0 the stage is exactly one viewport
     * tall, there is no travel, and the rail sits on its first card with no way
     * to reach the rest. ResizeObserver is delivered at the end of a rendering
     * cycle, so anything that delays the first frame — a tab that has not
     * painted yet, fonts still resolving — delays it too. A timeout owes
     * nothing to the frame loop, and `load` catches the case where images
     * settle late and change the track's width.
     */
    const timer = window.setTimeout(measure, 0);
    window.addEventListener("load", measure);

    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
      window.removeEventListener("resize", measure);
      window.removeEventListener("load", measure);
    };
  }, [reduceMotion]);

  // `start start` → `end end`: from the moment the section's top meets the
  // viewport's top to the moment its bottom does — exactly the stretch the
  // sticky stage is pinned for.
  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ["start start", "end end"],
  });

  /**
   * A spring between the scroll and everything it drives.
   *
   * Read raw, `scrollYProgress` is a step function: it changes only when a
   * scroll event lands, so the rail moved in the same discrete jumps the wheel
   * arrives in — covering a lot of ground and then stopping dead, over and
   * over. Reading through a spring gives the rail its own momentum, so it
   * chases the scroll rather than being teleported by it, and carries on for a
   * beat after the wheel stops instead of freezing mid-glide.
   *
   * Stiff on purpose. This is the difference between a rail that glides and
   * one that lags behind the hand pushing it, and lag on a scroll-driven
   * element reads as the page being broken, not as smoothness.
   */
  const glide = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 30,
    mass: 0.35,
    restDelta: 0.0005,
  });
  /**
   * The pinned stretch is three acts, and this is where they are cut.
   *
   * Enter: the page slides in from the right, because the direction it slides
   * from is the direction it is about to travel — the arrival and the rail are
   * the same gesture. Then the rail runs. Then it leaves to the left, carrying
   * the motion on rather than reversing it, which is what a page handing over
   * to the next one does.
   */
  const span = LEAD * 2 + distance;
  const enterEnds = LEAD / span;
  const exitBegins = (LEAD + distance) / span;

  const pageX = useTransform(
    glide,
    [0, enterEnds, exitBegins, 1],
    ["100%", "0%", "0%", "-100%"],
  );
  // Fades a little ahead of the slide at both ends, so the page is gone before
  // it reaches the edge rather than clipping against it.
  const pageOpacity = useTransform(
    glide,
    [0, enterEnds * 0.7, exitBegins + (1 - exitBegins) * 0.3, 1],
    [0, 1, 1, 0],
  );

  // Before the rail has been measured the two cut points coincide, and a
  // transform whose input range does not increase is invalid — so map over the
  // whole span instead, which travels nowhere because the distance is zero.
  const railX = useTransform(
    glide,
    distance > 0 ? [enterEnds, exitBegins] : [0, 1],
    [0, -distance],
  );

  /**
   * Marks the document while this page holds the screen — what the stylesheet
   * keys the quiet scrollbar to.
   *
   * Measured from the stage's own box on a plain scroll listener rather than
   * read off a motion value. The condition is the definition of pinned: the
   * stage's top at or above the viewport's, its bottom at or below. A scroll
   * listener fires whether or not anything is animating, so the scrollbar
   * cannot be left hidden by a frame that never came — and the cleanup returns
   * it however this page is left, including by a link out of it.
   */
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || reduceMotion) return;

    const update = () => {
      const box = stage.getBoundingClientRect();
      const pinned = box.top <= 0 && box.bottom >= window.innerHeight;
      document.documentElement.classList.toggle("credentials-open", pinned);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      document.documentElement.classList.remove("credentials-open");
    };
  }, [reduceMotion]);

  /**
   * Depth. The ground drifts at a fraction of the rail's speed and the title
   * at a fraction of that, so the three read as three distances from the eye
   * rather than as one sheet sliding past. It is the oldest trick there is,
   * and it is the whole difference between a rail that moves and a space you
   * are moving through.
   */
  const washX = useTransform(railX, (value) => value * 0.14);
  const headingX = useTransform(railX, (value) => value * 0.05);

  const cards = publishers.map((publisher, index) => (
    <RailCard
      key={publisher.name}
      publisher={publisher}
      index={index}
      railX={railX}
      rail={rail}
      reduceMotion={Boolean(reduceMotion)}
      onOpen={() => setOpenIndex(index)}
    />
  ));

  return (
    <>
      {reduceMotion ? (
        <div className="container-page py-24">
          <PageHeading />
          <ul className="mx-auto grid max-w-5xl gap-12 sm:grid-cols-2">{cards}</ul>
        </div>
      ) : (
        <div
          ref={stageRef}
          className="cert-stage relative"
          // Viewport plus travel: the section is tall by exactly the amount the
          // rail must move, which is what keeps the mapping one-to-one.
          style={{ height: `calc(100svh + ${span}px)` }}
        >
          <div className="sticky top-0 h-svh overflow-hidden">
            {/* Everything the page is made of travels together. The navy ground
                behind it belongs to the section and stays put, so this slides
                across it rather than dragging the background with it. */}
            <motion.div
              style={{ x: pageX, opacity: pageOpacity }}
              className="relative flex h-full flex-col justify-center bg-navy"
            >
              {/* The ground travels with the page rather than being painted on
                  the section behind it. Left behind, the navy outlived its own
                  content: the certificates slid away and the dark stayed,
                  handing Contact a strip of the previous section's background
                  to arrive on. A page that leaves takes its floor with it. */}
              <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
                {/* The ground drifts at a seventh of the rail's speed — far
                    enough behind to sit at a different distance, not so far
                    that it reads as a separate thing sliding on its own. The
                    vignette stays put: it belongs to the frame, not the view.
                    Wider than the stage so the drift never exposes an edge. */}
                <motion.div
                  style={reduceMotion ? undefined : { x: washX }}
                  className="absolute -inset-x-[15%] inset-y-0"
                >
                  <div className="panel-wash panel-wash-warm -left-[10%] top-[-15%] h-[55%] w-[55%] bg-accent-500/25" />
                  <div className="panel-wash panel-wash-cool bottom-[-20%] right-[-10%] h-[60%] w-[60%] bg-[#4d8fd6]/20" />
                </motion.div>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(7,15,28,0.8)_100%)]" />
              </div>

              <PageHeading x={reduceMotion ? undefined : headingX} />

              <motion.ul
                ref={trackRef}
                style={{ x: railX }}
                className="cert-track relative z-[1] flex w-max items-start gap-8 px-[13vw] md:gap-12"
              >
                {cards}
              </motion.ul>

                <ScrollHint progress={glide} enterEnds={enterEnds} exitBegins={exitBegins} />
            </motion.div>
          </div>
        </div>
      )}

      <Modal
        open={active !== null}
        onClose={close}
        label={
          active
            ? `${active.name} ${pick({ en: "certifications", id: "sertifikasi" }, locale)}`
            : pick({ en: "Certifications", id: "Sertifikasi" }, locale)
        }
        className="max-w-4xl"
      >
        {active && (
          <div>
            <div className="border-b border-border p-6 md:p-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent-strong dark:text-accent">
                <T
                  en={`${active.certificates.length} ${active.certificates.length > 1 ? "certifications" : "certification"}`}
                  id={`${active.certificates.length} sertifikasi`}
                />
              </p>
              <h3 className="mt-2 text-xl tracking-[-0.022em] md:text-2xl">{active.name}</h3>
            </div>

            {/* One block per credential from this body. Here the scan is the
                point — it is what the visitor came to look at — so it gets
                `object-contain` and its natural shape, which is exactly what
                made it the wrong thing to line up six of on the rail. */}
            <ul className="divide-y divide-border">
              {active.certificates.map((certificate) => (
                <li key={certificate.name}>
                  <div className="grid place-items-center bg-navy p-4 md:p-6">
                    <Image
                      src={certificate.image}
                      alt={`${certificate.name} ${pick({ en: "certificate", id: "sertifikat" }, locale)}`}
                      width={1600}
                      height={1131}
                      sizes="90vw"
                      className="max-h-[52vh] w-auto max-w-full rounded-md object-contain"
                    />
                  </div>

                  <div className="p-6 md:p-8">
                    {certificate.featured && (
                      <p className="mb-2 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-accent-strong dark:text-accent">
                        <BadgeCheck size={12} />
                        <T en="Flagship credential" id="Kredensial unggulan" />
                      </p>
                    )}
                    <h4 className="text-lg tracking-[-0.02em] md:text-xl">{certificate.name}</h4>
                    <p className="mt-2 text-sm text-muted">
                      {certificate.issuer}
                      {certificate.date.en && (
                        <span className="font-mono">
                          {" "}
                          · <T en={certificate.date.en} id={certificate.date.id} />
                        </span>
                      )}
                    </p>

                    <p className="mt-5 text-sm leading-[1.75] text-muted">
                      <T en={certificate.description.en} id={certificate.description.id} />
                    </p>

                    {certificate.covers.length > 0 && (
                      <div className="mt-6">
                        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                          <T en="What it covers" id="Yang dicakup" />
                        </p>
                        <ul className="flex flex-wrap gap-2">
                          {certificate.covers.map((item, i) => (
                            <li
                              key={i}
                              className="rounded-full border border-border bg-surface/60 px-3 py-1.5 text-xs"
                            >
                              <T en={item.en} id={item.id} />
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Modal>
    </>
  );
}


type RailMetrics = { distance: number; base: number; pitch: number; width: number; viewport: number };

/**
 * One awarding body on the rail, and its own small piece of depth.
 *
 * The gallery leads with publishers rather than with certificate scans, and
 * the reason is visible the moment you put the scans side by side: they arrive
 * at 16:9, at 4:3, at 3:4, at whatever the issuing portal happened to export,
 * so a row of them is a row of mismatched rectangles. The credential is the
 * content; the scan is just a photograph of it. A tile per body is uniform by
 * construction, and it is also the truer index — you hold two from RapidMiner,
 * and that is a fact about the shelf a list of six scans hides.
 *
 * The lettering is the mark. No official logo ships with the icon set this
 * project uses, and drawing a lookalike to sit beside a real credential would
 * be inventing a trademark — so the wordmark is set in the site's own display
 * face until a real file is supplied, at which point `publisher.logo` takes
 * over and this falls away.
 */
function RailCard({
  publisher,
  index,
  railX,
  rail,
  reduceMotion,
  onOpen,
}: {
  publisher: PublisherGroup;
  index: number;
  railX: MotionValue<number>;
  rail: RailMetrics;
  reduceMotion: boolean;
  onOpen: () => void;
}) {
  const locale = useCurrentLocale();

  /**
   * Where this card's centre sits across the viewport: 0 at the left edge, 1
   * at the right. Derived from the measured spacing plus the rail's live
   * offset — no per-frame layout reads.
   */
  const centre = useTransform(railX, (value) => {
    if (!rail.pitch || !rail.viewport) return 0.5;
    const left = rail.base + index * rail.pitch + value;
    return (left + rail.width / 2) / rail.viewport;
  });

  /**
   * A filled mark forgoes the shift. Its whole point is to reach the plate's
   * edges, and a shift needs margin there to move into — keeping both would
   * simply drag the logo's ends out of the tile.
   */
  const shift = publisher.logoFill ? 0 : PARALLAX;
  const markX = useTransform(centre, [0, 1], [shift, -shift]);
  const lift = useTransform(centre, [0.15, 0.5, 0.85], [0, -LIFT, 0]);

  const count = publisher.certificates.length;

  return (
    <li className={reduceMotion ? "w-full" : CARD}>
      <motion.button
        type="button"
        onClick={onOpen}
        style={reduceMotion ? undefined : { y: lift }}
        whileHover={reduceMotion ? undefined : { scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        aria-label={`${publisher.name} — ${count} ${pick({ en: count > 1 ? "certifications" : "certification", id: "sertifikasi" }, locale)}`}
        className="group block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-4 focus-visible:ring-offset-navy"
      >
        {/*
          Each mark gets the ground it was drawn for, and which ground that is
          comes from the file rather than from a preference.

          Most of these are dark ink meant for paper, so they sit on a white
          plate — on navy they would sink into it, and the alternatives are
          worse: recolouring a logo is the one thing brand guidelines uniformly
          forbid, and knocking one out white is a mark its owners never drew.

          But iTrain Asia's file is a mixed lockup: a solid dark icon beside a
          wordmark in pure white on transparent. There is no flat ground on
          which both halves are strong, so the plate is chosen by whichever
          half fares worst on it — the mark is only as legible as its faintest
          part. Measured as contrast ratios:

            plate              icon    wordmark   weakest
            white              10.16     1.00       1.00   (name invisible)
            navy-soft          1.43     14.57       1.43
            navy #0a1a2f       1.72     17.48       1.72   ← chosen

          On white the name simply was not there. Navy carries it at 17:1, and
          carries the white letterform inside the icon at the same ratio; only
          the icon's dark square softens against the plate. A wall of light
          plates with one dark among them is not an inconsistency — it is five
          logos each shown as its owner drew it.
        */}
        <span
          className={cn(
            "relative block aspect-[4/3] w-full overflow-hidden rounded-3xl border transition-colors duration-300",
            publisher.logoOnDark ? "bg-navy" : "bg-white",
            publisher.featured
              ? "border-accent-400/60 ring-1 ring-accent-400/25"
              : "border-white/15 group-hover:border-accent-400/50",
          )}
        >
          <motion.span
            style={reduceMotion ? undefined : { x: markX }}
            className="absolute inset-0 block"
          >
            {publisher.logo ? (
              <Image
                src={publisher.logo}
                alt={publisher.name}
                fill
                sizes="(max-width: 640px) 74vw, (max-width: 1024px) 46vw, 34vw"
                // Generous padding by default: these files are cropped
                // differently from one another, and the inset is what stops
                // one mark reading as louder than the next. A filled mark opts
                // out — see `logoFill`.
                className={cn(
                  "object-contain",
                  publisher.logoFill ? "p-4 md:p-5" : "p-10 md:p-12",
                )}
              />
            ) : (
              <span
                className={cn(
                  "font-display absolute inset-0 grid place-items-center px-8 text-center text-3xl leading-tight tracking-[-0.02em] sm:text-4xl",
                  publisher.logoOnDark ? "text-white" : "text-navy",
                )}
              >
                {publisher.short}
              </span>
            )}
          </motion.span>

          <span className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-center gap-1.5 bg-navy/90 p-4 text-xs font-medium text-white backdrop-blur transition-transform duration-300 group-hover:translate-y-0">
            <T en="View credentials" id="Lihat kredensial" />
            <Expand size={13} />
          </span>
        </span>

        <span className="mt-5 block text-center">
          {publisher.featured && (
            <span className="mb-1.5 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-accent-400">
              <BadgeCheck size={12} />
              <Scramble en="Flagship credential" id="Kredensial unggulan" />
            </span>
          )}
          <span className="block text-balance text-base font-medium leading-snug text-white">
            {publisher.name}
          </span>
          <span className="mt-1.5 block font-mono text-[11px] uppercase tracking-[0.16em] text-white/45">
            <Scramble
              en={`${count} ${count > 1 ? "certifications" : "certification"}`}
              id={`${count} sertifikasi`}
            />
          </span>
        </span>
      </motion.button>
    </li>
  );
}

/** The page's own title, held above the rail while it travels past. */
function PageHeading({ x }: { x?: MotionValue<number> }) {
  return (
    <motion.div
      data-reveal
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: 0.5, ease: EASE }}
      // The nearest layer to the eye moves least: a twentieth of the rail, just
      // enough that the title is not nailed to the glass while everything
      // behind it travels.
      style={x ? { x } : undefined}
      className="relative z-[1] mb-10 shrink-0 px-6 text-center md:mb-14"
    >
      <p className="mb-3 flex items-center justify-center gap-3 font-mono text-xs uppercase tracking-[0.22em] text-accent-400">
        <span className="h-px w-8 bg-accent-400/70" aria-hidden />
        <Scramble en="The credentials" id="Kredensial" />
        <span className="h-px w-8 bg-accent-400/70" aria-hidden />
      </p>
      <h2 className="text-balance text-3xl tracking-[-0.028em] text-white md:text-[2.6rem] md:leading-[1.1]">
        <T en="Certifications" id="Sertifikasi" />
      </h2>
    </motion.div>
  );
}

/**
 * Says which way this page moves, and how much of it is left.
 *
 * A section that turns scrolling sideways owes the visitor that before they
 * supply the input, not after — without it the first wheel notch is a
 * surprise. The bar doubles as the answer to "how long is this".
 */
function ScrollHint({
  progress,
  enterEnds,
  exitBegins,
}: {
  progress: MotionValue<number>;
  enterEnds: number;
  exitBegins: number;
}) {
  // Measures the rail, not the section: the lead-in and lead-out are the page
  // arriving and leaving, and counting them would show the bar moving while
  // the certificates stand still.
  const scaleX = useTransform(
    progress,
    exitBegins > enterEnds ? [enterEnds, exitBegins] : [0, 1],
    [0, 1],
  );

  return (
    <div className="relative z-[1] mt-10 shrink-0 px-6 md:mt-14">
      <div className="mx-auto flex max-w-xs flex-col items-center gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
          <Scramble en="Scroll to explore" id="Gulir untuk menjelajah" />
        </p>
        <div className="h-px w-full overflow-hidden bg-white/15">
          <motion.div style={{ scaleX }} className="h-full origin-left bg-accent-400" />
        </div>
      </div>
    </div>
  );
}
