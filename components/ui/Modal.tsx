"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { useLenisRef } from "@/components/providers/SmoothScrollProvider";
import { cn } from "@/lib/utils";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Accessible name for the dialog. */
  label: string;
  className?: string;
};

/**
 * Shared overlay for the experience lightbox and the certificate viewer.
 * Closes on Escape, on backdrop click, and on the close button; locks page
 * scroll and returns focus to whatever opened it.
 */
export function Modal({ open, onClose, children, label, className }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const lenisRef = useLenisRef();

  useEffect(() => {
    if (!open) return;

    returnFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // `overflow: hidden` alone no longer holds the page still: Lenis drives
    // scrolling itself and would keep easing the page behind the dialog.
    lenisRef?.current?.stop();
    panelRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      // Read fresh rather than capturing above: this points at a Lenis
      // instance, not a DOM node, and if the provider replaced it while the
      // dialog was open we must restart the current one, not a destroyed one.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      lenisRef?.current?.start();
      returnFocusRef.current?.focus();
    };
  }, [open, onClose, lenisRef]);

  return (
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
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "relative max-h-full w-full overflow-y-auto rounded-card border border-border bg-background shadow-2xl outline-none",
              className,
            )}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full border border-border bg-background/85 text-foreground backdrop-blur transition-colors hover:border-accent hover:text-accent-strong dark:hover:text-accent"
            >
              <X size={16} />
            </button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
