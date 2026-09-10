"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useLenisRef } from "@/components/providers/SmoothScrollProvider";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * A boundary where the next section arrives *over* the one above it.
 *
 * Everywhere else on this page a section's ground is uncovered in place — a
 * curtain rises, the tint changes, the wheel keeps turning (see <SectionWipe>).
 * Here the section above stops, and this one climbs over it: the experience
 * stage holds the screen while the projects page rises across it and takes it,
 * the way one sheet of paper slides over another.
 *
 * The rise itself is not animated, and that is the whole design. The experience
 * stage above is already pinned by its own ScrollTrigger, and that pin is simply
 * held open one viewport past its travel (see Experience.tsx).
 * While it is held the frame is `position: fixed` and does not move, so ordinary
 * page scroll is the only thing carrying this panel upward — one pixel of wheel,
 * one pixel of rise, with nothing to keep in step and nothing to interpolate.
 * The negative margin below is what lets the panel start inside that held
 * screen rather than a full viewport beneath it.
 *
 * So the only thing here that is animated is the light: a shade that deepens
 * over the held section as this one covers it, which is what turns "a panel
 * scrolled over a fixed element" into "a page going under another page".
 *
 * The two halves have to agree about how deep the overlap runs, and they agree
 * through one media query written twice — `.overlap-frame` in globals.css and
 * the matchMedia string in Experience.tsx. Either alone is a bug with a
 * specific shape: margin without hold covers live content permanently, hold
 * without margin is a screenful of scrolling where nothing happens.
 *
 * No radius, no accent hairline. Both were tried and both were wrong for what
 * this is: a rounded top corner reads as a card that starts here, and a gold
 * rule running the full width of the viewport reads as a divider between two
 * things. This is neither — it is one page in front of another, and what says
 * so is the shadow it casts and the shade underneath it.
 */

export function SectionOverlap({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const shadeRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const lenisRef = useLenisRef();

  useGSAP(
    () => {
      const frame = frameRef.current;
      const shade = shadeRef.current;
      const panel = panelRef.current;
      if (!frame || !shade || !panel) return;

      const mm = gsap.matchMedia();

      mm.add("(min-width: 1000px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)", () => {
        // Give the complete composition reading time before it leaves. This
        // begins only when Projects has fully covered the previous screen.
        const pin = ScrollTrigger.create({
          trigger: frame,
          start: "top top",
          end: () => `+=${window.innerHeight * 0.65}`,
          pin: panel,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          refreshPriority: 1,
        });

        // This page already reserves navbar space inside its composition.
        // Land on the pin's own start — the scroll position where Projects has
        // fully covered the screen. ScrollTrigger keeps it current on every
        // refresh, whereas measuring the element could run before the pins
        // above had been laid out and land midway through Experience.
        const landOnProjects = (immediate = false) => {
          const top = pin.start;
          if (lenisRef?.current) lenisRef.current.scrollTo(top, { immediate, force: true });
          else window.scrollTo({ top, behavior: immediate ? "auto" : "smooth" });
        };
        const onAnchor = (event: MouseEvent) => {
          if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
          if (!link || link.getAttribute("target") === "_blank") return;
          const url = new URL(link.getAttribute("href")!, window.location.href);
          if (url.origin !== location.origin || url.pathname !== location.pathname || url.hash !== "#projects") return;
          event.preventDefault();
          event.stopPropagation();
          if (location.hash !== "#projects") history.pushState(null, "", url);
          landOnProjects();
        };
        document.addEventListener("click", onAnchor, true);
        gsap.fromTo(
          shade,
          { opacity: 0 },
          {
            opacity: 1,
            ease: "none",
            scrollTrigger: {
              trigger: frame,
              /* Measured on this panel's own top edge crossing the screen,
                 which is exactly the edge doing the covering. It finishes while
                 that edge is still a third of the way down, so the section
                 behind is fully in shadow by the time most of it is hidden
                 rather than only once it has gone. */
              start: "top bottom",
              end: "top 30%",
              scrub: 0.4,
            },
          },
        );
        // Arriving on /#projects — the "All projects" link on a project page, or
        // a shared URL — lands straight on Projects rather than taking a smooth
        // trip down from the top. The pins above settle over several refreshes
        // as fonts and images load, so re-land after each one until the
        // visitor takes over the scroll or the page has had time to settle.
        let arriving = location.hash === "#projects";
        const settle = () => {
          if (arriving) landOnProjects(true);
        };
        const release = () => {
          arriving = false;
        };
        // Also at a few checkpoints and on load: the browser's own jump to the
        // fragment honours scroll-padding-top and can land after ours — a
        // navbar's height short, with Experience still showing above Projects.
        const first = requestAnimationFrame(settle);
        const checkpoints = [150, 400, 800, 1500, 2400].map((ms) => window.setTimeout(settle, ms));
        const settled = window.setTimeout(release, 2500);
        ScrollTrigger.addEventListener("refresh", settle);
        window.addEventListener("load", settle);
        window.addEventListener("wheel", release, { passive: true });
        window.addEventListener("touchstart", release, { passive: true });
        window.addEventListener("keydown", release);
        return () => {
          cancelAnimationFrame(first);
          checkpoints.forEach((id) => window.clearTimeout(id));
          window.clearTimeout(settled);
          ScrollTrigger.removeEventListener("refresh", settle);
          window.removeEventListener("load", settle);
          window.removeEventListener("wheel", release);
          window.removeEventListener("touchstart", release);
          window.removeEventListener("keydown", release);
          document.removeEventListener("click", onAnchor, true);
        };
      });
      return () => mm.revert();
    },
    { scope: frameRef },
  );

  return (
    <div ref={frameRef} className={cn("overlap-frame relative z-10", className)}>
      {/* The shade belongs to the section being covered, not to this one.
          `bottom-full` puts it entirely above this panel's top edge, so it
          travels with that edge and darkens whatever is currently behind it.
          Nothing clips it: the frame is `relative` with visible overflow. */}
      <div
        ref={shadeRef}
        aria-hidden
        className="overlap-shade pointer-events-none absolute inset-x-0 bottom-full h-[55vh] opacity-0"
      />

      <div ref={panelRef} className="overlap-panel relative bg-background">{children}</div>
    </div>
  );
}
