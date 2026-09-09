"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { cn } from "@/lib/utils";

/**
 * A neumorphic theme switch: a track pressed into the surface, a knob raised out
 * of it, and the knob sliding between the two with a little overshoot.
 *
 * Everything here is driven by the `.dark` class on <html> and nothing by React
 * state, which is the same constraint the icon button before it worked under and
 * the reason both icons stay mounted. The theme is applied by an inline head
 * script before first paint (see ThemeProvider), so by the time React hydrates
 * the document already knows which side the knob belongs on. State would only
 * re-derive that a beat later and flip the knob after the fact — a visible
 * flash, and worse on a control whose whole job is to be at one end or the
 * other. The markup is identical on both sides of hydration; only the stylesheet
 * knows the difference.
 *
 * The accessible name is done the same way. Two spans, one displayed per theme,
 * so the button announces the action it will perform ("Switch to dark theme")
 * rather than a static label — with `hidden` rather than a screen-reader clip on
 * the inactive one, since only `display: none` actually keeps text out of the
 * accessible name.
 *
 * Geometry, depth and motion all live in globals.css (`.theme-switch*`): a
 * neumorphic surface is four layered shadows that swap with the theme, and
 * expressing that as utilities would be less legible than the CSS it compiles
 * to. `className` is left for the caller's spacing only.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn("theme-switch", className)}
    >
      <span className="sr-only dark:hidden">Switch to dark theme</span>
      <span className="sr-only hidden dark:inline">Switch to light theme</span>

      {/* Only on the side the knob has left behind, so they read as sky rather
          than as decoration on the control. Staggered, so they arrive after the
          knob has passed instead of with it. */}
      <span aria-hidden className="theme-switch-star" style={{ left: 9, top: 8, ["--star-size" as string]: "2.5px", ["--star-delay" as string]: "140ms" }} />
      <span aria-hidden className="theme-switch-star" style={{ left: 16, top: 16, ["--star-size" as string]: "1.8px", ["--star-delay" as string]: "220ms" }} />
      <span aria-hidden className="theme-switch-star" style={{ left: 21, top: 7, ["--star-size" as string]: "1.5px", ["--star-delay" as string]: "300ms" }} />

      <span aria-hidden className="theme-switch-knob">
        <span className="theme-switch-icon theme-switch-icon-sun">
          <Sun size={12} strokeWidth={2.4} />
        </span>
        <span className="theme-switch-icon theme-switch-icon-moon">
          <Moon size={12} strokeWidth={2.4} />
        </span>
      </span>
    </button>
  );
}
