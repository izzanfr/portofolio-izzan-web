"use client";

import type { MotionValue } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { VantaEffect } from "vanta/dist/vanta.net.min";
import { cn } from "@/lib/utils";
import {
  installZoomBlurPass,
  type ZoomBlurPass,
  type ZoomBlurRenderer,
  type ZoomBlurThree,
} from "./zoomBlurPass";

/**
 * The Vanta NET ground — a drifting point lattice, rendered with three.js.
 *
 * Three things this has to get right beyond calling the library:
 *
 * 1. **It must not cost anything until it is nearly needed.** three plus the
 *    effect is the largest thing on the site by a wide margin, so both are
 *    behind a dynamic import that an IntersectionObserver fires ~700px before
 *    the layer reaches the viewport. Nothing ships in the initial bundle.
 *
 * 2. **It must fade in.** WebGL's first frame arrives whenever it arrives; a
 *    lattice that simply appears mid-scroll reads as a bug. So the canvas is
 *    held at zero opacity until the effect exists, then crossfades over the
 *    layers underneath, which are already drawing something.
 *
 * 3. **It has to follow the theme.** The theme is a class on <html> rather than
 *    React state (see ThemeProvider), so there is nothing to re-render on — a
 *    MutationObserver watches the class and re-tints through `setOptions`,
 *    which recolours the existing scene instead of rebuilding it.
 *
 * Vanta throttles its own render loop when the element is off screen, so no
 * teardown-on-scroll is needed; the effect is only destroyed on unmount.
 *
 * Never mounted at all under reduced motion or without a WebGL context — the
 * caller keeps a CSS-only ground underneath for exactly those cases.
 *
 * `arrival` is how the lattice gets here: 0 is a full radial smear, 1 is sharp.
 * It is fed straight into the zoom-blur pass rather than being animated in CSS,
 * so the fade and the defocus are one movement instead of two stacked ones —
 * see zoomBlurPass.ts.
 */

/**
 * Vanta wants numeric hex, so these cannot be `var(--…)`. They mirror tokens
 * rather than inventing colours: the lines are --navy-soft on the light page
 * and --accent-500 on the dark one, which is the same flip --accent-strong
 * makes, and for the same reason — navy disappears into a navy background.
 */
const NET_THEME = {
  light: { color: 0x12294a, backgroundColor: 0xeceff4 },
  dark: { color: 0xc68a3b, backgroundColor: 0x0a1524 },
} as const;

/**
 * Sparser and wider than Vanta's defaults (10 / 20 / 15). The default lattice is
 * dense enough to read as a texture, and a texture behind body copy is noise;
 * these settings leave it as a structure you can see individual edges in.
 */
const NET_SHAPE = {
  points: 9,
  maxDistance: 23,
  spacing: 18,
  showDots: true,
} as const;

/* Shapes narrow enough to walk a scene's materials without pretending to type
   three. Blending is `number | null` precisely because null is the value that
   should not be possible and is. */
type BlendableMaterial = { blending?: number | null };
type SceneNode = { material?: BlendableMaterial | BlendableMaterial[] };
type TraversableScene = { traverse: (visit: (node: SceneNode) => void) => void };

/**
 * Repairs the blending mode Vanta's NET effect asks for but never defines.
 *
 * vanta.net.js builds its line material as
 *
 *     blending: this.blending === 'additive' ? THREE.AdditiveBlending : null
 *
 * and picks `additive` only when the line colour is brighter than the
 * background. Ours is not, and deliberately so: navy lines on the light page,
 * because bright lines on a light ground would be invisible. So the effect
 * hands three a literal `null`, three has no case for it, and every single
 * frame logs `THREE.WebGLState: Invalid blending: null` — with the lines drawn
 * on whatever blend state the previous draw call happened to leave behind.
 *
 * Normal is the right answer, not a guess at what "subtractive" meant: that
 * branch of the effect already lerps each line's colour from the background
 * toward the line colour, so the fade is baked into the vertex colours and the
 * material only has to paint them.
 */
function repairLineBlending(scene: unknown, normalBlending: number) {
  const traversable = scene as TraversableScene | null;
  if (!traversable?.traverse) return;
  traversable.traverse((node) => {
    if (!node.material) return;
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    for (const material of materials) {
      if (material.blending === null) material.blending = normalBlending;
    }
  });
}

function currentTheme() {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/** Cheap probe: if the browser cannot give us a context, there is no point
 *  loading three at all. */
function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      canvas.getContext("webgl2") ??
        canvas.getContext("webgl") ??
        canvas.getContext("experimental-webgl"),
    );
  } catch {
    return false;
  }
}

export function VantaNet({
  arrival,
  className,
}: {
  /** 0 → fully smeared and invisible, 1 → sharp. */
  arrival?: MotionValue<number>;
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const effectRef = useRef<VantaEffect | null>(null);
  const passRef = useRef<ZoomBlurPass | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !supportsWebGL()) return;

    let cancelled = false;

    const start = async () => {
      // Loaded together and only once: `vanta.net.min` expects a THREE to be
      // handed to it, so there is no useful order in which one arrives first.
      const [THREE, { default: NET }] = await Promise.all([
        import("three"),
        import("vanta/dist/vanta.net.min"),
      ]);
      // The observer can fire again, and React can unmount, while the import is
      // still in flight — either would otherwise leave a second effect running
      // against a detached element.
      if (cancelled || effectRef.current) return;

      effectRef.current = NET({
        el: host,
        THREE,
        // Vanta binds this to window, not to the element, so the lattice still
        // answers the cursor from behind the content sitting on top of it.
        mouseControls: true,
        // Off on purpose: on a touch device the gesture that would drive this
        // is the same one that scrolls the page, and the net tugging under a
        // scroll reads as the page having lost the gesture.
        touchControls: false,
        gyroControls: false,
        minHeight: 200,
        minWidth: 200,
        scale: 1,
        scaleMobile: 1,
        // Transparent, so the washes painted underneath still carry the colour.
        // Without this the canvas would paint its own opaque ground over them.
        backgroundAlpha: 0,
        ...NET_THEME[currentTheme()],
        ...NET_SHAPE,
      });
      repairLineBlending(effectRef.current.scene, THREE.NormalBlending);

      // Borrowing Vanta's renderer is the one place three's untyped surface
      // has to be pinned down; the pass declares the shape it needs.
      passRef.current = installZoomBlurPass(
        effectRef.current.renderer as ZoomBlurRenderer,
        THREE as unknown as ZoomBlurThree,
      );

      if (!cancelled) setReady(true);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        void start();
      },
      { rootMargin: "700px 0px" },
    );
    observer.observe(host);

    return () => {
      cancelled = true;
      observer.disconnect();
      // The pass first: it has to hand the renderer back before Vanta tears it
      // down, or `destroy` runs through a wrapper whose target is already gone.
      passRef.current?.dispose();
      passRef.current = null;
      effectRef.current?.destroy();
      effectRef.current = null;
    };
  }, []);

  /**
   * Scroll drives the smear.
   *
   * Subscribed rather than rendered: this writes a uniform that is read by
   * Vanta's own animation loop, so putting it through React state would mean a
   * re-render per frame to change a number the GPU reads anyway. Clamped
   * because the spring feeding it overshoots at both ends, and a strength past
   * -1 walks the samples far enough outside the texture to smear the clamped
   * edge across the screen.
   */
  useEffect(() => {
    if (!ready || !arrival) return;
    const apply = (value: number) => {
      const progress = Math.min(1, Math.max(0, value));
      passRef.current?.setStrength(-(1 - progress));
    };
    apply(arrival.get());
    return arrival.on("change", apply);
  }, [ready, arrival]);

  // Re-tint in place on a theme flip. Watching the attribute rather than a
  // context value because <html class="dark"> is where the theme actually
  // lives; a provider would only be re-describing it.
  useEffect(() => {
    if (!ready) return;
    const observer = new MutationObserver(() => {
      effectRef.current?.setOptions(NET_THEME[currentTheme()]);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, [ready]);

  return (
    <div
      ref={hostRef}
      aria-hidden
      className={cn(
        "vanta-canvas absolute inset-0 transition-opacity duration-1000 ease-out",
        ready ? "opacity-100" : "opacity-0",
        className,
      )}
    />
  );
}
