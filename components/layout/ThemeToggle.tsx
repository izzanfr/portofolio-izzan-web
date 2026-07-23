"use client";

import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { cn } from "@/lib/utils";

/**
 * Both icons are always mounted and crossfaded with `dark:` variants, so the
 * button renders identically on server and client — no hydration mismatch and
 * no theme flash.
 *
 * Chrome (size, border, background) is left to the caller so the same button can
 * be a bordered pill on its own or a bare icon nested inside the nav capsule.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { toggleTheme } = useTheme();

  return (
    <motion.button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle color theme"
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.92 }}
      className={cn(
        "relative grid place-items-center overflow-hidden rounded-full text-foreground transition-colors",
        className,
      )}
    >
      <span className="col-start-1 row-start-1 grid place-items-center transition-all duration-300 dark:-translate-y-3 dark:rotate-45 dark:opacity-0">
        <Sun size={17} />
      </span>
      <span className="col-start-1 row-start-1 grid translate-y-3 -rotate-45 place-items-center opacity-0 transition-all duration-300 dark:translate-y-0 dark:rotate-0 dark:opacity-100">
        <Moon size={17} />
      </span>
    </motion.button>
  );
}
