"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { indefiniteArticle } from "@/lib/utils";
import { EASE } from "@/lib/motion";

/** Number of `--role-N` tokens defined in globals.css. */
const ROLE_COLORS = 4;

export function RotatingText({
  items,
  interval = 2600,
  className,
  article = false,
}: {
  items: readonly string[];
  interval?: number;
  className?: string;
  /**
   * Prefix each role with a grammatically-correct "a"/"an" that swaps in step
   * with it, so the lead-in reads "I work as a/an …" rather than a fixed word.
   * The article is muted, matching the lead-in; only the role carries colour.
   */
  article?: boolean;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % items.length), interval);
    return () => clearInterval(id);
  }, [items.length, interval]);

  const current = items[index];
  // Reserve the width of the longest article+role pairing so the line never
  // reflows as they swap.
  const compose = (role: string) => (article ? `${indefiniteArticle(role)} ${role}` : role);
  const widest = items.reduce((a, b) => (compose(b).length > compose(a).length ? b : a), items[0] ?? "");

  return (
    <span className={className}>
      <span className="relative inline-grid align-bottom">
        <span aria-hidden className="invisible col-start-1 row-start-1 whitespace-nowrap">
          {compose(widest)}
        </span>
        <AnimatePresence mode="wait">
          <motion.span
            key={current}
            initial={{ y: "0.6em", opacity: 0, filter: "blur(6px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            exit={{ y: "-0.6em", opacity: 0, filter: "blur(6px)" }}
            transition={{ duration: 0.42, ease: EASE }}
            className="col-start-1 row-start-1 whitespace-nowrap"
          >
            {article && <span className="text-muted">{indefiniteArticle(current)} </span>}
            {/* Colour rides the same keyed swap as the text, so the two change
                together rather than the hue crossfading on its own. Each token
                resolves to a different hex in light vs dark. */}
            <span style={{ color: `var(--role-${(index % ROLE_COLORS) + 1})` }}>{current}</span>
          </motion.span>
        </AnimatePresence>
      </span>
    </span>
  );
}
