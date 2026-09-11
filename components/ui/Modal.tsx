"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useLenisRef } from "@/components/providers/SmoothScrollProvider";
import { cn } from "@/lib/utils";
import { EASE } from "@/lib/motion";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Accessible name for the dialog. */
  label: string;
  /**
   * Fits the panel to the viewport instead of letting it scroll. The photo
   * lightbox wants this: a scrollbar there means the image is taller than its
   * frame, which reads as broken rather than as more content. Children become
   * flex rows, so one of them can take the leftover height.
   */
  fit?: boolean;
  className?: string;
};

/**
 * Shared overlay for the experience lightbox and the certificate viewer.
 * Closes on Escape, on backdrop click, and on the close button; locks page
 * scroll and returns focus to whatever opened it.
 *
 * Rendered through a portal into `document.body`, and that is load-bearing
 * rather than tidiness. Both callers sit inside the Experience section's depth
 * and tilt effects, and a `perspective`, a `transform` or a `will-change:
 * transform` on any ancestor makes that ancestor the containing block for
 * `position: fixed` descendants. Left in place, `fixed inset-0` resolved
 * against the role card instead of the screen: the backdrop covered only that
 * card, the panel inherited the card's rotation, and the viewport-height
 * budget the lightbox sizes itself with was measured against a box a fraction
 * of the viewport — so the photo overflowed and the caption was clipped.
 */
export function Modal({
  open,
  onClose,
  children,
  label,
  fit = false,
  className,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const lenisRef = useLenisRef();

  useEffect(() => {
    if (!open) return;

    returnFocusRef.current = document.activeElement as HTMLElement | null;

    /**
     * The page is held still by refusing the input, not by clamping the body's
     * overflow — and that distinction is load-bearing.
     *
     * `document.body.style.overflow = "hidden"` was the old lock, and it made
     * the body a scroll container. Anything `position: sticky` inside a scroll
     * container that does not itself scroll cannot stick, so opening a dialog
     * from the credentials page unpinned it: the dark page dropped away and
     * the site's own off-white showed through behind the dialog. Refusing
     * wheel, touch and the scrolling keys leaves the layout untouched, so
     * whatever was on screen when the dialog opened is still there behind it.
     *
     * Every guard lets the dialog's own panel through — a long certificate has
     * to stay scrollable while the page behind it does not.
     */
    lenisRef?.current?.stop();
    panelRef.current?.focus();

    const insidePanel = (target: EventTarget | null) =>
      target instanceof Node && Boolean(panelRef.current?.contains(target));

    const refuseScroll = (event: Event) => {
      if (insidePanel(event.target)) return;
      if (event.cancelable) event.preventDefault();
    };

    // Space, Page Up/Down, Home/End and the arrows all scroll a document.
    const SCROLL_KEYS = new Set([
      " ",
      "PageUp",
      "PageDown",
      "Home",
      "End",
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
    ]);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (SCROLL_KEYS.has(event.key) && !insidePanel(event.target)) {
        event.preventDefault();
      }
    };

    // Non-passive, or preventDefault is ignored on these two.
    const wheelOptions = { passive: false } as const;
    window.addEventListener("wheel", refuseScroll, wheelOptions);
    window.addEventListener("touchmove", refuseScroll, wheelOptions);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("wheel", refuseScroll);
      window.removeEventListener("touchmove", refuseScroll);
      document.removeEventListener("keydown", onKeyDown);
      // Read fresh rather than capturing above: this points at a Lenis
      // instance, not a DOM node, and if the provider replaced it while the
      // dialog was open we must restart the current one, not a destroyed one.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      lenisRef?.current?.start();
      returnFocusRef.current?.focus();
    };
  }, [open, onClose, lenisRef]);

  const overlay = (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 md:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="absolute inset-0 bg-navy/70 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            tabIndex={-1}
            // The panel scrolls on its own; this tells Lenis to leave wheel and
            // touch inside it alone so a tall certificate scrolls natively.
            data-lenis-prevent
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.26, ease: EASE }}
            className={cn(
              "relative max-h-full rounded-card border border-border bg-background shadow-2xl outline-none",
              // `w-fit` in fit mode: the panel takes its width from the image
              // rather than from the viewport, so a photo scaled down to fit a
              // short screen is framed tight instead of stranded between two
              // bars of backdrop.
              fit ? "flex w-fit flex-col overflow-hidden" : "w-full overflow-y-auto",
              className,
            )}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full border border-border bg-background/85 text-foreground backdrop-blur transition-colors hover:border-accent hover:text-accent-strong"
            >
              <X size={16} />
            </button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // No portal target during SSR. Both branches render nothing while the dialog
  // is closed, so the client's first pass matches the server's.
  if (typeof document === "undefined") return null;
  return createPortal(overlay, document.body);
}
