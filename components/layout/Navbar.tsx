"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
import { LanguageToggle } from "./LanguageToggle";
import { useLenisRef } from "@/components/providers/SmoothScrollProvider";
import { T } from "@/components/ui/T";
import { navLinks, sectionIds } from "@/lib/content";
import { useActiveSection } from "@/lib/useActiveSection";
import { cn } from "@/lib/utils";
import { EASE } from "@/lib/motion";

/**
 * True while an element marked `data-nav-hide` covers the top of the screen —
 * the strip the bar floats in. Used by the held scene before Contact.
 */
function useOverNavHide(pathname: string) {
  const [over, setOver] = useState(false);

  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>("[data-nav-hide]");
    if (targets.length === 0) return;
    const covering = new Set<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) covering.add(entry.target);
          else covering.delete(entry.target);
        }
        setOver(covering.size > 0);
      },
      // Only the top tenth of the viewport counts: the bar hides once the
      // stage reaches it, not as soon as the stage peeks up from below.
      { rootMargin: "0px 0px -90% 0px", threshold: 0 },
    );
    targets.forEach((target) => observer.observe(target));
    return () => {
      observer.disconnect();
      setOver(false);
    };
  }, [pathname]);

  return over;
}

export function Navbar() {
  const reducedMotion = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();
  const pathname = usePathname();
  const lenisRef = useLenisRef();
  // Sections only exist on the homepage
  const active = useActiveSection(sectionIds, pathname === "/");

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 24);
  });

  // Lock body scroll while the mobile sheet is open. `overflow: hidden` alone
  // no longer holds the page: Lenis drives scrolling itself, so it has to be
  // stopped too or the page keeps moving behind the open sheet.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    if (open) lenisRef?.current?.stop();
    else lenisRef?.current?.start();
    return () => {
      document.body.style.overflow = "";
      // Read fresh rather than capturing: this is a Lenis instance, not a DOM
      // node, and if the provider replaced it we must restart the current one.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      lenisRef?.current?.start();
    };
  }, [open, lenisRef]);

  // The bar only steps aside for a held full-screen scene that asks for it
  // (`data-nav-hide`); every section, Certifications and Documentation
  // included, keeps it in reach.
  const overStage = useOverNavHide(pathname);
  const hidden = overStage && !open;

  return (
    // The name keeps the bar out of the page's view-transition group, so it
    // stays put while the content slides underneath it (see globals.css).
    <motion.header
      style={{ viewTransitionName: "site-header" }}
      animate={{ y: hidden ? -120 : 0, opacity: hidden ? 0 : 1 }}
      transition={{ duration: reducedMotion ? 0 : 0.45, ease: EASE }}
      inert={hidden}
      // Out of the way for the pointer as well as the eye — a bar faded to
      // zero still swallows clicks aimed at what is behind it.
      className={cn("fixed inset-x-0 top-0 z-50", hidden && "pointer-events-none")}
    >
      <nav className="container-page flex h-20 items-center justify-center md:h-24">
        {/* A beveled glass shell; overflow stays visible for the language menu. */}
        <ul
          data-scrolled={scrolled}
          className="floating-nav hidden items-center gap-1 p-2 md:flex"
        >
          {navLinks.map((link) => {
            const isActive = active === link.id;
            return (
              <li key={link.href} className="relative">
                <Link
                  href={link.href}
                  aria-current={isActive ? "true" : undefined}
                  style={{ "--nav-tone": `var(${link.tone})` } as CSSProperties}
                  className="floating-nav-link"
                >
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill"
                      transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 32 }}
                      className="floating-nav-active"
                    />
                  )}
                  <span className="relative">
                    <T en={link.label.en} id={link.label.id} />
                  </span>
                </Link>
              </li>
            );
          })}

          {/* Divider, then the one utility control: the language switch.
              The talk CTA lived here but was dropped — the Contact section below
              already carries it, so the nav stays purely navigational. */}
          <li aria-hidden className="floating-nav-divider" />
          <li>
            <LanguageToggle />
          </li>
        </ul>

        {/* Mobile controls, pushed to the right since the logo is gone */}
        <div data-scrolled={scrolled} className="floating-nav ml-auto flex items-center gap-2 p-2 md:hidden">
          <LanguageToggle />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            className="floating-nav-menu grid h-11 w-11 place-items-center rounded-full"
          >
            <AnimatePresence initial={false} mode="wait">
              <motion.span
                key={open ? "close" : "menu"}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: reducedMotion ? 0 : 0.18 }}
                className="grid place-items-center"
              >
                {open ? <X size={18} /> : <Menu size={18} />}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.32, ease: EASE }}
            id="mobile-navigation"
            className="floating-nav-sheet overflow-hidden md:hidden"
          >
            <ul className="container-page flex flex-col py-4">
              {navLinks.map((link, index) => (
                <motion.li
                  key={link.href}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: reducedMotion ? 0 : 0.05 + index * 0.05, duration: reducedMotion ? 0 : 0.3 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    aria-current={active === link.id ? "true" : undefined}
                    style={
                      active === link.id ? { color: `color-mix(in srgb, var(${link.tone}) 65%, var(--navy))` } : undefined
                    }
                    className={cn(
                      "flex items-center justify-between border-b border-border/60 py-3.5 text-base transition-colors",
                      active === link.id ? "" : "text-foreground",
                    )}
                  >
                    <T en={link.label.en} id={link.label.id} />
                    {active === link.id && (
                      <span
                        style={{ backgroundColor: `var(${link.tone})` }}
                        className="h-1.5 w-1.5 rounded-full"
                      />
                    )}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
