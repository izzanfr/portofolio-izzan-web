"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * A hairline that draws itself in from the centre — the amber accent line
 * carried over from the hero stat card, made animated. Decorative, so it is
 * aria-hidden; `delay` lets a pair (top and bottom of a block) stagger.
 */
export function HairRule({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.span
      aria-hidden
      className={cn(
        "block h-px w-full origin-center bg-gradient-to-r from-transparent via-accent/70 to-transparent",
        className,
      )}
      initial={{ scaleX: 0, opacity: 0 }}
      whileInView={{ scaleX: 1, opacity: 1 }}
      viewport={{ once: true, amount: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }}
    />
  );
}
