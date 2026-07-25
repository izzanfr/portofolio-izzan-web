import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Deterministic angle per project, so a generated cover is the same on every
 * render and no two neighbours in the coverflow land on the identical diagonal.
 * Hashing the slug rather than the index keeps it stable if the order changes.
 */
function gradientAngle(slug: string) {
  let hash = 0;
  for (let index = 0; index < slug.length; index += 1) {
    hash = (hash * 31 + slug.charCodeAt(index)) >>> 0;
  }
  return 110 + (hash % 5) * 18;
}

/**
 * Stand-in cover for a project with no documentation scans yet.
 *
 * Built from the theme ramp — navy through to raw gold — rather than a grey
 * placeholder, so a project without images reads as a designed tile instead of
 * a missing asset. The dot grid and the corner bloom are what stop the flat
 * gradient looking like an empty state.
 *
 * `children` lets the coverflow letter it like a real document cover, while the
 * smaller grid card leaves it abstract (its title already sits underneath).
 */
export function GeneratedCover({
  slug,
  className,
  children,
}: {
  slug: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn("absolute inset-0", className)}
      style={{
        backgroundImage: `linear-gradient(${gradientAngle(slug)}deg, var(--navy) 0%, var(--navy-soft) 48%, var(--accent-600) 100%)`,
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
          backgroundSize: "14px 14px",
        }}
      />
      {/* Warm bloom off the top-right corner, matching the ambient washes the
          sections use, so the tile belongs to the same visual family. */}
      <div
        aria-hidden
        className="absolute -right-10 -top-10 h-44 w-44 rounded-full"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--accent-400) 55%, transparent) 0%, transparent 70%)",
        }}
      />
      {children}
    </div>
  );
}
