"use client";

import Image from "next/image";
import { gsap } from "gsap";
import { useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useId, useMemo, useRef } from "react";

/**
 * A heading whose letters are windows onto a photo, adapted from React Bits'
 * Masked Heading (reactbits.dev/text-animations/masked-heading), built on GSAP.
 * The words are an SVG clip path laid exactly over the real text, and each word
 * rises into its window when the heading is shown.
 *
 * Changes from the original:
 *  - Driven by a `shown` prop instead of its own viewport trigger, so a
 *    scroll-scrubbed scene can decide the moment; it also hides again when
 *    `shown` goes false, for scrolling back.
 *  - The idle drift loop only runs while the heading is shown. The original
 *    ran a requestAnimationFrame loop for as long as it was mounted.
 *  - Image only, through next/image; the video option is gone.
 *  - Only the "rise" reveal is kept.
 *  - Styles live in app/interlude.css.
 */

type MaskedHeadingProps = {
  text: string;
  src: string;
  shown: boolean;
  fillScale?: number;
  parallax?: number;
  drift?: number;
  brightness?: number;
  saturation?: number;
  duration?: number;
  stagger?: number;
  textScale?: number;
  className?: string;
};

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

export function MaskedHeading({
  text,
  src,
  shown,
  fillScale = 1.25,
  parallax = 26,
  drift = 18,
  brightness = 1,
  saturation = 1,
  duration = 1.1,
  stagger = 0.09,
  textScale = 0.11,
  className,
}: MaskedHeadingProps) {
  const rootRef = useRef<HTMLHeadingElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const mediaRef = useRef<HTMLSpanElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const baseRefs = useRef<(HTMLElement | null)[]>([]);
  const glyphRefs = useRef<(SVGTextElement | null)[]>([]);
  const offsetRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const reduced = useReducedMotion() ?? false;

  const clipId = `mh-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const words = useMemo(() => text.split(/\s+/).filter(Boolean), [text]);

  const place = useCallback(() => {
    const root = rootRef.current;
    const media = mediaRef.current;
    if (!root || !media) return;
    const off = offsetRef.current;
    const maxX = Math.max(0, ((fillScale - 1) / 2) * root.clientWidth);
    const maxY = Math.max(0, ((fillScale - 1) / 2) * root.clientHeight);
    media.style.transform =
      `translate3d(${clamp(off.x, -maxX, maxX).toFixed(2)}px, ${clamp(off.y, -maxY, maxY).toFixed(2)}px, 0) scale(${fillScale})`;
  }, [fillScale]);

  // Lay each SVG word exactly over its real, transparent counterpart.
  const sync = useCallback(() => {
    const root = rootRef.current;
    const measure = measureRef.current;
    if (!root || !measure) return;
    root.style.fontSize = `${clamp(root.clientWidth * textScale, 20, 200).toFixed(1)}px`;
    const cs = window.getComputedStyle(measure);
    wordRefs.current.forEach((box, i) => {
      const base = baseRefs.current[i];
      const glyph = glyphRefs.current[i];
      if (!box || !base || !glyph) return;
      glyph.setAttribute("x", `${box.offsetLeft}`);
      glyph.setAttribute("y", `${base.offsetTop}`);
      glyph.style.fontFamily = cs.fontFamily;
      glyph.style.fontSize = cs.fontSize;
      glyph.style.fontWeight = cs.fontWeight;
      glyph.style.fontStyle = cs.fontStyle;
      glyph.style.letterSpacing = cs.letterSpacing;
    });
    place();
  }, [place, textScale]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(root);
    document.fonts?.ready.then(sync).catch(() => {});
    return () => ro.disconnect();
  }, [sync, words]);

  // Idle drift and pointer parallax — only while there is something to see.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !shown || reduced) return;
    let raf = 0;
    let last = performance.now();
    let clock = 0;
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      clock += dt;
      const off = offsetRef.current;
      const ease = 1 - Math.exp(-dt / 0.18);
      off.x += (off.tx + Math.sin(clock * 0.21) * drift - off.x) * ease;
      off.y += (off.ty + Math.cos(clock * 0.17) * drift * 0.6 - off.y) * ease;
      place();
      raf = requestAnimationFrame(frame);
    };
    const onMove = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      offsetRef.current.tx = clamp(((e.clientX - r.left) / (r.width || 1)) * 2 - 1, -1, 1) * -parallax;
      offsetRef.current.ty = clamp(((e.clientY - r.top) / (r.height || 1)) * 2 - 1, -1, 1) * -parallax;
    };
    const onLeave = () => { offsetRef.current.tx = 0; offsetRef.current.ty = 0; };
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
    };
  }, [shown, reduced, drift, parallax, place]);

  // The reveal: words rise into their windows on show, sink back on hide.
  // Until the first show they are simply placed below, without a tween.
  const playedRef = useRef(false);
  useEffect(() => {
    const root = rootRef.current;
    const glyphs = glyphRefs.current.filter((g): g is SVGTextElement => g !== null);
    if (!root || !glyphs.length) return;
    // While they wait, the words sit below their windows and are made
    // invisible: a hidden clip-path child adds nothing to the clip, so the
    // photo's overscan cannot show the tops of the letters as a strip.
    const rise = (parseFloat(window.getComputedStyle(root).fontSize) || 48) * 1.15;
    if (reduced || (!shown && !playedRef.current)) {
      gsap.set(glyphs, { y: shown ? 0 : rise, visibility: shown ? "visible" : "hidden" });
      return;
    }
    playedRef.current = true;
    const tween = shown
      ? gsap.to(glyphs, { y: 0, visibility: "visible", duration, stagger, ease: "power4.out", overwrite: "auto" })
      : gsap.to(glyphs, {
          y: rise,
          duration: 0.45,
          stagger: 0.03,
          ease: "power2.in",
          overwrite: "auto",
          onComplete: () => { gsap.set(glyphs, { visibility: "hidden" }); },
        });
    return () => { tween.kill(); };
  }, [shown, reduced, duration, stagger, words]);

  return (
    <h2
      ref={rootRef}
      className={["masked-heading", className].filter(Boolean).join(" ")}
      // Belt and braces for the CSS: a copy that starts elsewhere on the page
      // and runs across the heading still leaves it out.
      onCopy={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      <span ref={measureRef} className="masked-heading__measure">
        {words.map((word, i) => (
          <span key={`${word}-${i}`} ref={(el) => { wordRefs.current[i] = el; }} className="masked-heading__word">
            {word}
            <i ref={(el) => { baseRefs.current[i] = el; }} className="masked-heading__baseline" />
          </span>
        ))}
      </span>

      <svg className="masked-heading__defs" aria-hidden="true" focusable="false">
        <defs>
          <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
            {words.map((word, i) => (
              <text key={`${word}-${i}`} ref={(el) => { glyphRefs.current[i] = el; }}>
                {word}
              </text>
            ))}
          </clipPath>
        </defs>
      </svg>

      <span className="masked-heading__reveal" aria-hidden="true">
        <span className="masked-heading__clip" style={{ clipPath: `url(#${clipId})` }}>
          <span
            ref={mediaRef}
            className="masked-heading__media"
            style={{ filter: `brightness(${brightness}) saturate(${saturation})` }}
          >
            <Image src={src} alt="" fill sizes="100vw" draggable={false} />
          </span>
        </span>
      </span>
    </h2>
  );
}
