import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";

type SectionProps = {
  id: string;
  eyebrow?: string;
  title?: string;
  lead?: string;
  children: ReactNode;
  /** `tint` sections carry a faint navy wash; alternating them sets the page rhythm. */
  tone?: "base" | "tint";
  className?: string;
  contentClassName?: string;
};

export function Section({
  id,
  eyebrow,
  title,
  lead,
  children,
  tone = "base",
  className,
  contentClassName,
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        // overflow-x-clip, not hidden: a horizontally-offset <Reveal> sits
        // translated sideways until it scrolls into view, which pushed the page
        // 8px wider than the viewport on mobile. `clip` contains that without
        // making the section a scroll container the way `hidden` would.
        "relative scroll-mt-24 overflow-x-clip py-20 md:py-28",
        tone === "tint" && "bg-tint",
        className,
      )}
    >
      {/* Hairline divider, brightest at the centre so it reads as a seam not a box */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent"
      />

      <div className="container-page">
        {(eyebrow || title || lead) && (
          <Reveal className="mb-12 max-w-2xl md:mb-16">
            {eyebrow && (
              <p className="mb-3 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.22em] text-accent-strong dark:text-accent">
                <span className="h-px w-8 bg-accent" aria-hidden />
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 className="text-balance text-3xl tracking-[-0.028em] md:text-[2.6rem] md:leading-[1.1]">
                {title}
              </h2>
            )}
            {lead && <p className="mt-4 text-base leading-relaxed text-muted">{lead}</p>}
          </Reveal>
        )}
        <div className={contentClassName}>{children}</div>
      </div>
    </section>
  );
}
