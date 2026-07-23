"use client";

import { useEffect } from "react";

/**
 * Raises the effort needed to grab an image: blocks the right-click menu and
 * drag-to-desktop on images only.
 *
 * This is a deterrent, not protection. The browser has already downloaded every
 * image it renders, so anyone willing to open DevTools, read the Network tab,
 * hit the image URL directly, or take a screenshot still gets the file. Treat
 * it as a speed bump for casual copying; watermarking is what actually limits
 * reuse.
 *
 * Scoped to images rather than the whole document on purpose: swallowing every
 * right-click would also take away "open link in new tab", copy, translate, and
 * the browser's own accessibility menus.
 */
export function ImageGuard() {
  useEffect(() => {
    const guarded = (target: EventTarget | null) =>
      target instanceof Element &&
      (target.tagName === "IMG" || target.closest("[data-guard-image]") !== null);

    const block = (event: Event) => {
      if (guarded(event.target)) event.preventDefault();
    };

    document.addEventListener("contextmenu", block);
    document.addEventListener("dragstart", block);

    return () => {
      document.removeEventListener("contextmenu", block);
      document.removeEventListener("dragstart", block);
    };
  }, []);

  return null;
}
