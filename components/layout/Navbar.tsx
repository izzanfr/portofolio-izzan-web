"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageToggle } from "./LanguageToggle";
import { T } from "@/components/ui/T";
import { navLinks, sectionIds } from "@/lib/content";
import { useActiveSection } from "@/lib/useActiveSection";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();
  const pathname = usePathname();
  // Sections only exist on the homepage
  const active = useActiveSection(sectionIds, pathname === "/");

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 24);
  });

  // Lock body scroll while the mobile sheet is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <nav className="container-page flex h-20 items-center justify-center md:h-24">
        {/* Floating capsule: the links, the primary CTA and the theme toggle
            read as one grouped control rather than a flat bar. It carries its
            own glass surface, so the header stays transparent and the pill
            appears to hover, firming up a touch once the page is scrolled. */}
        <ul
          className={cn(
            "hidden items-center gap-2 rounded-full border p-2 backdrop-blur-xl backdrop-saturate-150 transition-all duration-300 md:flex",
            scrolled
              ? "border-border/80 bg-surface/85 shadow-[0_16px_44px_-20px_rgba(10,26,47,0.5)] dark:bg-surface/60"
              : "border-border/60 bg-surface/55 shadow-[0_12px_40px_-24px_rgba(10,26,47,0.4)] dark:bg-surface/40",
          )}
        >
          {navLinks.map((link) => {
            const isActive = active === link.id;
            return (
              <li key={link.href} className="relative">
                <Link
                  href={link.href}
                  aria-current={isActive ? "true" : undefined}
                  style={isActive ? { color: `var(${link.tone})` } : undefined}
                  className={cn(
                    "relative block rounded-full px-5 py-2.5 text-sm transition-colors duration-200",
                    isActive ? "" : "text-muted hover:text-foreground",
                  )}
                >
                  {isActive && (
                    // Fill and ring are inline rather than utility classes: the
                    // pill is one shared element that slides between links, so
                    // its colour has to follow whichever link it landed on.
                    <motion.span
                      layoutId="nav-pill"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      style={{
                        backgroundColor: `color-mix(in srgb, var(${link.tone}) 14%, transparent)`,
                        boxShadow: `inset 0 0 0 1px color-mix(in srgb, var(${link.tone}) 32%, transparent)`,
                      }}
                      className="absolute inset-0 -z-10 rounded-full"
                    />
                  )}
                  <span className="relative">
                    <T en={link.label.en} id={link.label.id} />
                  </span>
                </Link>
              </li>
            );
          })}

          {/* Divider, then the utility controls: language switch and theme toggle.
              The talk CTA lived here but was dropped — the Contact section below
              already carries it, so the nav stays purely navigational. */}
          <li aria-hidden className="mx-0.5 h-6 w-px shrink-0 bg-border/70" />
          <li>
            <LanguageToggle />
          </li>
          <li>
            <ThemeToggle className="h-9 w-9 text-muted hover:bg-accent/10 hover:text-accent-strong dark:hover:text-accent" />
          </li>
        </ul>

        {/* Mobile controls, pushed to the right since the logo is gone */}
        <div className="ml-auto flex items-center gap-2 md:hidden">
          <LanguageToggle />
          <ThemeToggle className="h-10 w-10 border border-border bg-surface/70 hover:border-accent hover:text-accent-strong dark:hover:text-accent" />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="grid h-10 w-10 place-items-center rounded-full border border-border bg-surface/70 md:hidden"
          >
            <AnimatePresence initial={false} mode="wait">
              <motion.span
                key={open ? "close" : "menu"}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.18 }}
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
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-border bg-background/95 backdrop-blur-xl md:hidden"
          >
            <ul className="container-page flex flex-col py-4">
              {navLinks.map((link, index) => (
                <motion.li
                  key={link.href}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + index * 0.05, duration: 0.3 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    aria-current={active === link.id ? "true" : undefined}
                    style={
                      active === link.id ? { color: `var(${link.tone})` } : undefined
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
    </header>
  );
}
