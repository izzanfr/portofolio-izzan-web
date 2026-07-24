import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A single figure + label tile. Shared by the hero stat row and the project
 * detail metrics, so the two never drift: soft shadow with a hover lift
 * (`card-raise`), an inset amber hairline across the top, and the display serif
 * on the figure.
 *
 * Renders `<dt>`/`<dd>`, so it must sit inside a `<dl>`.
 */
export function StatCard({
  value,
  label,
  className,
}: {
  value: ReactNode;
  label: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "card-raise relative flex h-full flex-col items-center justify-center rounded-2xl bg-surface-raised px-5 py-7 text-center",
        className,
      )}
    >
      {/* Inset so it never meets the corner radius: a full-width bar under a
          16px corner shows as a clipped sliver at both ends. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-5 top-0 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent"
      />
      <dt className="font-display text-3xl font-semibold leading-none text-accent-strong dark:text-accent md:text-4xl">
        {value}
      </dt>
      <dd className="mt-3 text-xs leading-snug text-balance text-muted">{label}</dd>
    </div>
  );
}
