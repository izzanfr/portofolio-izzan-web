"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { navLinks, profile, sectionIds } from "@/lib/content";
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
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-border/80 bg-background/72 shadow-[0_10px_30px_-24px_rgba(10,26,47,0.55)] backdrop-blur-xl backdrop-saturate-150"
          : "border-b border-transparent bg-transparent",
      )}
    >
      {/* Texture: a faint navy-to-transparent wash plus grain, so the scrolled bar
          reads as a surface rather than flat white */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 -z-10 transition-opacity duration-300",
          scrolled ? "opacity-100" : "opacity-0",
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-navy/[0.055] to-transparent dark:from-white/[0.045]" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent/35 to-transparent" />
      </div>

      <nav className="container-page flex h-16 items-center justify-between md:h-20">
        <Link
          href="/"
          className="group flex items-center gap-2.5 font-display text-base tracking-[-0.02em]"
          onClick={() => setOpen(false)}
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-navy font-mono text-[13px] text-white transition-transform duration-300 group-hover:-rotate-6 dark:bg-accent dark:text-accent-contrast">
            IF
          </span>
          <span className="hidden sm:inline">
            {profile.shortName} Faikar
            <span className="text-accent-strong dark:text-accent">.</span>
          </span>
        </Link>

        <ul className="hidden items-center gap-0.5 md:flex">
          {navLinks.map((link) => {
            const isActive = active === link.id;
            return (
              <li key={link.href} className="relative">
                <Link
                  href={link.href}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "group relative block px-3.5 py-2 text-sm transition-colors duration-200",
                    isActive
                      ? "text-accent-strong dark:text-accent"
                      : "text-muted hover:text-foreground",
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      className="absolute inset-0 -z-10 rounded-full bg-accent/12 ring-1 ring-inset ring-accent/25"
                    />
                  )}
                  <span className="relative">{link.label}</span>
                  {/* Hover underline stays available for inactive items */}
                  <span
                    className={cn(
                      "absolute inset-x-3.5 bottom-1 h-px origin-left scale-x-0 bg-border transition-transform duration-300",
                      !isActive && "group-hover:scale-x-100",
                    )}
                  />
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <a
            href={`mailto:${profile.email}`}
            className="hidden rounded-full bg-navy px-4 py-2 text-sm font-medium text-white transition-all duration-300 hover:bg-navy-soft hover:shadow-lg hover:shadow-navy/20 md:inline-block dark:bg-accent dark:text-accent-contrast dark:hover:bg-accent-strong"
          >
            Get in touch
          </a>
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
                    className={cn(
                      "flex items-center justify-between border-b border-border/60 py-3.5 text-base transition-colors",
                      active === link.id
                        ? "text-accent-strong dark:text-accent"
                        : "text-foreground",
                    )}
                  >
                    {link.label}
                    {active === link.id && (
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    )}
                  </Link>
                </motion.li>
              ))}
              <motion.a
                href={`mailto:${profile.email}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                onClick={() => setOpen(false)}
                className="mt-5 rounded-full bg-navy px-5 py-3 text-center text-sm font-medium text-white dark:bg-accent dark:text-accent-contrast"
              >
                Get in touch
              </motion.a>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
