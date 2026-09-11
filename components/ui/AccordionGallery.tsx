"use client";

import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";

gsap.registerPlugin(ScrollTrigger);

/**
 * A row of photo panels where one stands open and the rest fold back in
 * perspective, adapted from React Bits' Accordion Gallery
 * (reactbits.dev/components/accordion-gallery), which is built on GSAP.
 *
 * Changes from the original:
 *  - Panels are buttons. Hover or focus opens a panel; clicking the panel that
 *    is already open calls `onOpen`, which the section uses for the lightbox.
 *  - Labels are nodes rather than strings, so they can carry both languages
 *    and a second line of context.
 *  - Photos go through next/image.
 *  - Reduced motion is read when the layout runs rather than once on first
 *    render, where SSR would always have seen "no preference".
 *  - An entrance: the panels rise into place in sequence the first time the
 *    gallery scrolls into view. (Autoplay was tried and taken out: every turn
 *    re-runs the panel widths and the greyscale filter across six large
 *    photos, and doing that on a timer made the page feel heavy.)
 *  - The open panel carries its number, "01 / 06".
 *  - Styles live in app/documentation.css.
 */

export type AccordionGalleryItem = {
  src: string;
  alt: string;
  label?: ReactNode;
  sublabel?: ReactNode;
};

type AccordionGalleryProps = {
  items: AccordionGalleryItem[];
  onOpen?: (index: number) => void;
  defaultIndex?: number;
  height?: number;
  gap?: number;
  radius?: number;
  expandRatio?: number;
  duration?: number;
  ease?: string;
  parallax?: number;
  tilt?: number;
  stagger?: number;
  grayscale?: boolean;
  label?: string;
  className?: string;
};

const pad = (n: number) => String(n).padStart(2, "0");

export function AccordionGallery({
  items,
  onOpen,
  defaultIndex = 0,
  height = 460,
  gap = 10,
  radius = 16,
  expandRatio = 0.52,
  duration = 0.6,
  ease = "power3.out",
  parallax = 0.5,
  tilt = 8,
  stagger = 0.06,
  grayscale = true,
  label = "Photo highlights",
  className,
}: AccordionGalleryProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const slotRefs = useRef<(HTMLElement | null)[]>([]);
  const panelRefs = useRef<(HTMLElement | null)[]>([]);
  const mediaRefs = useRef<(HTMLElement | null)[]>([]);
  const captionRefs = useRef<(HTMLElement | null)[]>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const firstRunRef = useRef(true);
  const mediaSizeRef = useRef(320);

  const reduced = useReducedMotion() ?? false;
  const count = items.length;
  const [active, setActive] = useState(Math.min(Math.max(defaultIndex, 0), count - 1));

  const applyLayout = useCallback(
    (animate: boolean) => {
      // The slot is the flex item, so it is what grows and folds; the button
      // inside it only fills it.
      const panels = slotRefs.current;
      if (!panels.length) return;
      const reducedNow = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      // Stacked on narrow screens (see the CSS): panels keep their height and
      // lose the fold, so only the colour and the caption change.
      const stacked = window.matchMedia("(max-width: 640px)").matches;

      const r = Math.min(Math.max(expandRatio, 0.2), 0.9);
      const grow = count > 1 ? (r * (count - 1)) / (1 - r) : 1;
      const dur = animate && !reducedNow ? duration : 0;

      tlRef.current?.kill();
      const tl = gsap.timeline();

      panels.forEach((panel, i) => {
        if (!panel) return;
        const isActive = i === active;
        const rot = stacked || isActive ? 0 : i < active ? tilt : -tilt;
        tl.to(panel, { flexGrow: stacked ? 1 : isActive ? grow : 1, rotateY: rot, duration: dur, ease }, 0);

        const media = mediaRefs.current[i];
        if (media) {
          const drift = Math.max(-1.5, Math.min(1.5, active - i));
          tl.to(media, {
            xPercent: -50,
            yPercent: -50,
            x: stacked || isActive ? 0 : drift * parallax * mediaSizeRef.current * 0.06,
            "--ag-gray": grayscale && !isActive ? 1 : 0,
            "--ag-dim": isActive ? 0 : 0.35,
            duration: dur,
            ease,
          }, 0);
        }

        const caption = captionRefs.current[i];
        if (caption) {
          const parts = caption.children;
          if (isActive) tl.to(parts, { opacity: 1, x: 0, duration: dur, ease, stagger: reducedNow ? 0 : stagger }, 0);
          else tl.to(parts, { opacity: 0, x: -14, duration: dur * 0.6, ease }, 0);
        }
      });

      tlRef.current = tl;
    },
    [active, count, expandRatio, duration, ease, tilt, parallax, grayscale, stagger],
  );

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const measure = () => {
      const usable = Math.max(el.getBoundingClientRect().width - gap * (count - 1), 120);
      const size = Math.max(140, usable * Math.min(Math.max(expandRatio, 0.2), 0.9) * 1.22);
      mediaSizeRef.current = size;
      el.style.setProperty("--ag-media-size", `${size}px`);
      applyLayout(!firstRunRef.current);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [applyLayout, gap, count, expandRatio]);

  useEffect(() => {
    applyLayout(!firstRunRef.current);
    firstRunRef.current = false;
  }, [applyLayout]);

  useEffect(() => () => { tlRef.current?.kill(); }, []);

  // Entrance: the panels rise into place one after another, once.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduced) return;
    const ctx = gsap.context(() => {
      gsap.from(slotRefs.current, {
        yPercent: 16,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: { trigger: root, start: "top 85%", once: true },
      });
    }, root);
    return () => ctx.revert();
  }, [reduced]);

  const handleKeyDown = (i: number, e: KeyboardEvent) => {
    const next = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!next) return;
    e.preventDefault();
    const target = (i + next + count) % count;
    setActive(target);
    panelRefs.current[target]?.focus();
  };

  const rootStyle = {
    "--ag-gap": `${gap}px`,
    "--ag-radius": `${radius}px`,
    "--ag-height": `${height}px`,
  } as CSSProperties;

  return (
    <div
      ref={rootRef}
      className={["accordion-gallery", className].filter(Boolean).join(" ")}
      style={rootStyle}
      role="list"
      aria-label={label}
    >
      {items.map((item, i) => {
        const isActive = i === active;
        return (
          <div role="listitem" key={item.src + i} className="ag-slot" ref={(el) => { slotRefs.current[i] = el; }}>
            <button
              type="button"
              ref={(el) => { panelRefs.current[i] = el; }}
              className={`ag-panel${isActive ? " ag-panel--active" : ""}`}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => (isActive ? onOpen?.(i) : setActive(i))}
              onKeyDown={(e) => handleKeyDown(i, e)}
              aria-current={isActive ? "true" : undefined}
              aria-label={item.alt}
            >
              <span className="ag-panel__frame">
                <span className="ag-panel__media" ref={(el) => { mediaRefs.current[i] = el; }}>
                  <Image
                    src={item.src}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, 640px"
                    draggable={false}
                  />
                </span>
                <span className="ag-panel__overlay" aria-hidden="true" />
              </span>
              <span className="ag-panel__index" aria-hidden="true">
                {pad(i + 1)}<span> / {pad(count)}</span>
              </span>
              {(item.label || item.sublabel) && (
                <span className="ag-panel__label" aria-hidden="true" ref={(el) => { captionRefs.current[i] = el; }}>
                  <span className="ag-panel__bar" />
                  <span className="ag-panel__text">
                    {item.sublabel && <span className="ag-panel__sub">{item.sublabel}</span>}
                    {item.label && <span className="ag-panel__title">{item.label}</span>}
                  </span>
                </span>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
