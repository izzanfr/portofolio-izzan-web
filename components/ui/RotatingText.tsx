"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

/** Number of `--role-N` tokens defined in globals.css. */
const ROLE_COLORS = 4;

export function RotatingText({
  items,
  interval = 2600,
  className,
}: {
  items: readonly string[];
  interval?: number;
  className?: string;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % items.length), interval);
    return () => clearInterval(id);
  }, [items.length, interval]);

  return (
    <span className={className}>
      {/* Reserve the width of the longest role so the line never reflows */}
      <span className="relative inline-grid align-bottom">
        <span aria-hidden className="invisible col-start-1 row-start-1 whitespace-nowrap">
          {items.reduce((a, b) => (b.length > a.length ? b : a), "")}
        </span>
        <AnimatePresence mode="wait">
          <motion.span
            key={items[index]}
            initial={{ y: "0.6em", opacity: 0, filter: "blur(6px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            exit={{ y: "-0.6em", opacity: 0, filter: "blur(6px)" }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            // Colour rides the same keyed swap as the text, so the two change
            // together rather than the hue crossfading on its own. Each token
            // resolves to a different hex in light vs dark.
            style={{ color: `var(--role-${(index % ROLE_COLORS) + 1})` }}
            className="col-start-1 row-start-1 whitespace-nowrap"
          >
            {items[index]}
          </motion.span>
        </AnimatePresence>
      </span>
    </span>
  );
}
