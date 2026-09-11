"use client";

import Image from "next/image";
import { useReducedMotion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
} from "react";

/**
 * A tilted wall of photo columns drifting past each other, adapted from React
 * Bits' Drift Wall (reactbits.dev/components/drift-wall). GSAP has no stock
 * equivalent, so this keeps the original's own requestAnimationFrame loop.
 *
 * Changes from the original:
 *  - Tiles go through next/image, so the wall pulls small thumbnails rather
 *    than the full-size originals.
 *  - The loop only runs while the wall is on screen. The original spun forever,
 *    which on a long single page meant animating something nobody could see.
 *  - Only the first copy of each column is in the tab order and the
 *    accessibility tree; the rest are visual repeats that exist to make the
 *    loop seamless, and would otherwise make keyboard users tab through every
 *    photo three or four times.
 *  - A tile reports its index through `onSelect` instead of following a link.
 *  - Styles live in app/documentation.css with the rest of the section.
 */

export type DriftWallItem = { src: string; alt: string };

type DriftWallProps = {
  items: DriftWallItem[];
  onSelect?: (index: number) => void;
  columns?: number;
  tileWidth?: number;
  tileHeight?: number;
  gap?: number;
  radius?: number;
  tilt?: number;
  turn?: number;
  roll?: number;
  perspective?: number;
  depth?: number;
  speed?: number;
  direction?: "up" | "down";
  variance?: number;
  parallax?: number;
  lift?: number;
  fade?: number;
  dim?: number;
  overlayColor?: string;
  label?: string;
  className?: string;
};

type Entry = { item: DriftWallItem; index: number };

// Golden-ratio scatter: columns get distinct but stable speeds.
const columnFactor = (index: number, variance: number) =>
  1 + variance * ((((index * 0.6180339887 + 0.35) % 1) * 2) - 1);

export function DriftWall({
  items,
  onSelect,
  columns = 5,
  tileWidth = 200,
  tileHeight = 132,
  gap = 18,
  radius = 14,
  tilt = 16,
  turn = -14,
  roll = 0,
  perspective = 1200,
  depth = 120,
  speed = 42,
  direction = "up",
  variance = 0.45,
  parallax = 0.6,
  lift = 64,
  fade = 0.6,
  dim = 0.55,
  overlayColor = "#060010",
  label = "Drifting wall of photos",
  className,
}: DriftWallProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);
  const trackRefs = useRef<(HTMLDivElement | null)[]>([]);
  const offsetsRef = useRef<number[]>([]);
  const velocitiesRef = useRef<number[]>([]);
  const hoveredColRef = useRef(-1);
  const pointerRef = useRef({ x: 0, y: 0 });
  const dampedRef = useRef({ x: 0, y: 0 });
  const activeIdRef = useRef<string | null>(null);

  const [containerHeight, setContainerHeight] = useState(600);
  const [activeId, setActiveId] = useState<string | null>(null);
  const reduced = useReducedMotion() ?? false;
  const [onScreen, setOnScreen] = useState(false);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), {
      rootMargin: "120px 0px",
    });
    // Native lazy loading cannot be trusted in here: the tiles sit on a
    // tilted, masked plane and reach the viewport by being translated, which
    // the browser's lazy-load check does not notice — photos that drifted
    // into view stayed blank. So nothing loads until the wall is near, and
    // then every tile loads at once (the repeats share URLs, so that is one
    // request per photo).
    const near = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setArmed(true);
      near.disconnect();
    }, { rootMargin: "800px 0px" });
    io.observe(el);
    near.observe(el);
    return () => { io.disconnect(); near.disconnect(); };
  }, []);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setContainerHeight(entry.contentRect.height || 600));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const columnItems = useMemo<Entry[][]>(() => {
    const cols: Entry[][] = Array.from({ length: columns }, () => []);
    items.forEach((item, index) => cols[index % columns].push({ item, index }));
    // A column with nothing of its own borrows from the start, so the wall
    // never shows an empty lane when there are fewer photos than columns.
    return cols.map((col, c) => (col.length ? col : [{ item: items[c % items.length], index: c % items.length }]));
  }, [items, columns]);

  const columnMeta = useMemo(() => {
    const unit = tileHeight + gap;
    return columnItems.map((col) => {
      const copyHeight = Math.max(unit, col.length * unit);
      const copies = Math.max(2, Math.ceil((containerHeight * 1.6) / copyHeight) + 1);
      return { copyHeight, copies };
    });
  }, [columnItems, tileHeight, gap, containerHeight]);

  const baseVelocities = useMemo(() => {
    const dirSign = direction === "up" ? 1 : -1;
    return columnItems.map((_, c) => speed * columnFactor(c, variance) * dirSign * (c % 2 === 0 ? 1 : -1));
  }, [columnItems, speed, direction, variance]);

  useEffect(() => {
    offsetsRef.current = columnMeta.map((meta, c) => meta.copyHeight * ((c * 0.37) % 1));
    velocitiesRef.current = columnItems.map(() => 0);
  }, [columnMeta, columnItems]);

  const applyPlane = useCallback(
    (px: number, py: number) => {
      const plane = planeRef.current;
      if (!plane) return;
      plane.style.transform =
        `translate(-50%, -50%) scale(1.18) ` +
        `rotateX(${tilt + py}deg) rotateY(${turn + px}deg) rotateZ(${roll}deg) translateZ(${-depth}px)`;
    },
    [tilt, turn, roll, depth],
  );

  useEffect(() => {
    const placeTracks = () => {
      trackRefs.current.forEach((el, c) => {
        if (el) el.style.transform = `translate3d(0, ${-(offsetsRef.current[c] ?? 0)}px, 0)`;
      });
    };

    // Off screen or reduced motion: set the pose once and stop there.
    if (!onScreen || reduced) {
      applyPlane(0, 0);
      placeTracks();
      return;
    }

    let raf = 0;
    let last: number | null = null;
    const animate = (ts: number) => {
      const dt = Math.min(0.05, Math.max(0, ts - (last ?? ts)) / 1000);
      last = ts;

      const maxTilt = parallax * 8;
      const damp = 1 - Math.exp(-dt / 0.12);
      const damped = dampedRef.current;
      damped.x += (pointerRef.current.x * maxTilt - damped.x) * damp;
      damped.y += (-pointerRef.current.y * maxTilt - damped.y) * damp;
      applyPlane(damped.x, damped.y);

      for (let c = 0; c < columnMeta.length; c++) {
        const meta = columnMeta[c];
        // The column under the pointer eases to a stop so its tile can be read.
        const target = hoveredColRef.current === c ? 0 : baseVelocities[c];
        const ease = 1 - Math.exp(-dt / (target === 0 ? 0.16 : 0.28));
        velocitiesRef.current[c] += (target - velocitiesRef.current[c]) * ease;
        const next = (offsetsRef.current[c] ?? 0) + velocitiesRef.current[c] * dt;
        offsetsRef.current[c] = ((next % meta.copyHeight) + meta.copyHeight) % meta.copyHeight;
      }
      placeTracks();
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [onScreen, reduced, parallax, applyPlane, baseVelocities, columnMeta]);

  const activate = useCallback((id: string | null, col: number) => {
    activeIdRef.current = id;
    hoveredColRef.current = col;
    setActiveId(id);
  }, []);

  const handlePointerMove = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (e.pointerType !== "mouse") return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      if (parallax > 0 && !reduced) {
        pointerRef.current = {
          x: (e.clientX - rect.left) / rect.width - 0.5,
          y: (e.clientY - rect.top) / rect.height - 0.5,
        };
      }
      // Hit-tested rather than per-tile enter/leave: the tiles move under a
      // still pointer, and only a lookup at the pointer notices that.
      const tile = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>("[data-tile-id]");
      const id = tile?.dataset.tileId ?? null;
      if (id === activeIdRef.current) return;
      activate(id, tile ? Number(tile.dataset.col) : -1);
    },
    [parallax, reduced, activate],
  );

  // The columns keep moving under a pressed pointer — always on touch, and
  // for the moment a hovered column takes to ease to a stop. Press and
  // release can then land on different tiles, and the browser sends the click
  // to their common ancestor instead of either. So the tile is taken at press
  // time, and a click that arrives without a tile of its own uses that one as
  // long as the pointer has not travelled far enough to be a drag.
  const pressRef = useRef<{ tile: HTMLElement; x: number; y: number } | null>(null);

  const handlePointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const tile = (e.target as HTMLElement).closest<HTMLElement>("[data-tile-id]");
    pressRef.current = tile ? { tile, x: e.clientX, y: e.clientY } : null;
  }, []);

  const handleClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      const press = pressRef.current;
      pressRef.current = null;
      let tile = (e.target as HTMLElement).closest<HTMLElement>("[data-tile-id]");
      if (!tile && press && Math.hypot(e.clientX - press.x, e.clientY - press.y) < 10) tile = press.tile;
      if (tile) onSelect?.(Number(tile.dataset.index));
    },
    [onSelect],
  );

  const handlePointerLeave = useCallback(() => {
    pointerRef.current = { x: 0, y: 0 };
    activate(null, -1);
  }, [activate]);

  const cssVars = {
    "--dw-tile-w": `${tileWidth}px`,
    "--dw-tile-h": `${tileHeight}px`,
    "--dw-gap": `${gap}px`,
    "--dw-radius": `${radius}px`,
    "--dw-perspective": `${perspective}px`,
    "--dw-lift": `${lift}px`,
    "--dw-dim": dim,
    "--dw-overlay": overlayColor,
    "--dw-edge": `${Math.max(0, (1 - fade) * 100)}%`,
  } as CSSProperties;

  return (
    <div
      ref={containerRef}
      className={["drift-wall", reduced && "drift-wall--reduced", className].filter(Boolean).join(" ")}
      style={cssVars}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      onPointerLeave={handlePointerLeave}
      role="group"
      aria-label={label}
    >
      <div ref={planeRef} className="drift-wall__plane">
        {columnItems.map((col, c) => (
          <div className="drift-wall__col" key={c}>
            <div className="drift-wall__track" ref={(el) => { trackRefs.current[c] = el; }}>
              {Array.from({ length: columnMeta[c].copies }, (_, copy) =>
                col.map(({ item, index }, i) => {
                  const id = `${c}-${copy}-${i}`;
                  const primary = copy === 0;
                  return (
                    <button
                      key={id}
                      type="button"
                      className={`drift-wall__tile${activeId === id ? " is-active" : ""}`}
                      data-tile-id={id}
                      data-col={c}
                      data-index={index}
                      tabIndex={primary ? 0 : -1}
                      aria-hidden={primary ? undefined : true}
                      aria-label={item.alt}
                      onFocus={() => activate(id, c)}
                      onBlur={() => activate(null, -1)}
                    >
                      <span className="drift-wall__inner">
                        {armed && (
                          <Image
                            src={item.src}
                            alt=""
                            fill
                            loading="eager"
                            sizes={`${Math.round(tileWidth * 1.6)}px`}
                            draggable={false}
                          />
                        )}
                        <span className="drift-wall__overlay" aria-hidden="true" />
                      </span>
                    </button>
                  );
                }),
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
