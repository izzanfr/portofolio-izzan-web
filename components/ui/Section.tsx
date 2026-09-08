import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";
import { SectionBackdrop, SectionSeam } from "./SectionBackdrop";
import { SectionWipe } from "./SectionWipe";

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
  /**
   * Where the heading block sits. The page reads left-aligned throughout; the
   * exception is a section whose content is full-bleed, where a heading pinned
   * to the left of a centred band looks like it belongs to something else.
   */
  align?: "left" | "center";
  /**
   * `tight` trades the page's standard vertical rhythm for room inside the
   * section. A full-screen section is the case that needs it: the padding that
   * separates ordinary sections from each other is, here, padding competing
   * with the content for the one screenful it has to fit in.
   */
  spacing?: "default" | "tight";
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
  align = "left",
  spacing = "default",
  className,
  contentClassName,
}: SectionProps) {
  const centred = align === "center";
  const tight = spacing === "tight";
  return (
    <section
      id={id}
      className={cn(
        // overflow-x-clip, not hidden: a horizontally-offset <Reveal> sits
        // translated sideways until it scrolls into view, which pushed the page
        // 8px wider than the viewport on mobile. `clip` contains that without
        // making the section a scroll container the way `hidden` would.
        "relative scroll-mt-24 overflow-x-clip",
        tight ? "py-12 md:py-16" : "py-20 md:py-28",
        className,
      )}
    >
      {/* The tint and the ambient wash are wiped in together, so the section's
          whole ground arrives as one movement. The seam stays outside the clip:
          it marks the join to the previous section and should already be there
          when the curtain starts. */}
      <SectionWipe tinted={tone === "tint"}>
        {/* Soft band instead of a hairline: against a drifting wash a 1px rule
            reads as a hard edge cutting through it. */}
        <SectionSeam />
        <SectionBackdrop index={index} />
      </SectionWipe>

      <div className="container-page relative">
        {(eyebrow || title || lead) && (
          <Reveal
            className={cn(
              "max-w-2xl",
              tight ? "mb-8 md:mb-10" : "mb-12 md:mb-16",
              centred && "mx-auto text-center",
            )}
          >
            {eyebrow && (
              <p
                className={cn(
                  "mb-3 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.22em] text-accent-strong dark:text-accent",
                  centred && "justify-center",
                )}
              >
                <span className="h-px w-8 bg-accent" aria-hidden />
                {eyebrow}
                {/* The second rule only when centred: it is what closes the
                    label symmetrically. Left-aligned, a trailing rule would
                    point at nothing. */}
                {centred && <span className="h-px w-8 bg-accent" aria-hidden />}
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
