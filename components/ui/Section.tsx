import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";
import { SectionBackdrop, SectionSeam } from "./SectionBackdrop";

type SectionProps = {
  id: string;
  eyebrow?: ReactNode;
  title?: ReactNode;
  lead?: ReactNode;
  children: ReactNode;
  /** `tint` sections carry a faint navy wash; alternating them sets the page rhythm. */
  tone?: "base" | "tint";
  /**
   * Position on the page, counting the hero as 0. Shifts the ambient wash so no
   * two sections in a row are composed the same way.
   */
  index?: number;
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
  index = 0,
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
      {/* Soft band instead of a hairline: against a drifting wash a 1px rule
          reads as a hard edge cutting through it. */}
      <SectionSeam />
      <SectionBackdrop index={index} />

      <div className="container-page relative">
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
