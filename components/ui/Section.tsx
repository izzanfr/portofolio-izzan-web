import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";

type SectionProps = {
  id: string;
  eyebrow?: string;
  title?: string;
  lead?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function Section({
  id,
  eyebrow,
  title,
  lead,
  children,
  className,
  contentClassName,
}: SectionProps) {
  return (
    <section id={id} className={cn("scroll-mt-24 py-20 md:py-28", className)}>
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
              <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
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
