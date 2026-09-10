"use client";

import { useEffect, useState } from "react";

/**
 * Scroll-spy. Watches a thin horizontal band across the middle of the viewport;
 * whichever section overlaps it is "active". Returns the section id, or an empty
 * string when none qualifies (e.g. while the hero is filling the screen).
 */
export function useActiveSection(ids: readonly string[], enabled = true) {
  const [active, setActive] = useState("");

  useEffect(() => {
    if (!enabled) return;

    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const visible = new Set<string>();

    let observer: IntersectionObserver;
    const observe = () => {
      observer?.disconnect();
      visible.clear();
      observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        // A later section is painted over the earlier pinned section during
        // an overlap. Its navigation state should take over with that surface.
        setActive([...ids].reverse().find((id) => visible.has(id)) ?? "");
      },
      { rootMargin: `-${window.innerHeight * 0.45}px 0px -${window.innerHeight * 0.5}px 0px`, threshold: 0 },
    );

    for (const element of elements) observer.observe(element);
    };
    observe();
    window.addEventListener("resize", observe);
    return () => { observer.disconnect(); window.removeEventListener("resize", observe); };
  }, [ids, enabled]);

  // Derived rather than stored, so leaving the homepage clears the highlight
  // without a second render pass.
  return enabled ? active : "";
}
