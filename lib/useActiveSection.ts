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

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        // Keep document order so overlapping sections resolve predictably
        setActive(ids.find((id) => visible.has(id)) ?? "");
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    );

    for (const element of elements) observer.observe(element);
    return () => observer.disconnect();
  }, [ids, enabled]);

  // Derived rather than stored, so leaving the homepage clears the highlight
  // without a second render pass.
  return enabled ? active : "";
}
