import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Building2, CalendarDays } from "lucide-react";
import { T } from "./T";
import { GeneratedCover } from "./ProjectCoverArt";
import type { ProjectMeta } from "@/lib/projects";
import { cn } from "@/lib/utils";

export function ProjectCard({
  project,
  className,
}: {
  project: ProjectMeta;
  className?: string;
}) {
  return (
    // card-raise rather than a motion hover: it is the site's shared lift, so
    // the shadow comes with it and reduced-motion is already handled.
    <article className={cn("card-raise group h-full rounded-card", className)}>
      <Link
        href={`/projects/${project.slug}`}
        transitionTypes={["nav-forward"]}
        className="flex h-full flex-col overflow-hidden rounded-card border border-border bg-surface-raised transition-colors duration-300 hover:border-accent/55"
      >
        {/* 5:4 rather than a wider frame: it lands the media at ~58% of the
            card (the intended 60/40 split) and crops these portrait document
            scans far less than a landscape crop would. */}
        <div className="relative aspect-[5/4] shrink-0 overflow-hidden bg-navy">
          {project.cover ? (
            <Image
              src={project.cover.src}
              alt=""
              aria-hidden
              fill
              sizes="(max-width: 640px) 85vw, (max-width: 1024px) 60vw, 33vw"
              // object-top, not centre: these are scanned report covers, and the
              // half worth showing is the titled head of the document.
              className="object-cover object-top transition-transform duration-300 ease-out group-hover:scale-105"
            />
          ) : (
            <GeneratedCover
              slug={project.slug}
              className="transition-transform duration-300 ease-out group-hover:scale-105"
            />
          )}

          {/* Legibility wash under the badge row. Sits above the image so the
              zoom happens behind it and the gradient itself never scales. */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/20 to-transparent" />
          <div className="pointer-events-none absolute inset-0 bg-navy/0 transition-colors duration-300 group-hover:bg-navy/20" />

          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 transition-transform duration-300 ease-out group-hover:-translate-y-0.5">
            <span className="rounded-full border border-white/20 bg-navy/55 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white backdrop-blur-sm">
              <T en={project.role.en} id={project.role.id} />
            </span>
            <ArrowUpRight
              size={17}
              className="shrink-0 text-white/85 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <h3 className="text-balance text-base leading-snug tracking-[-0.018em] transition-transform duration-300 ease-out group-hover:-translate-y-0.5 md:text-lg">
            <T en={project.title.en} id={project.title.id} />
          </h3>

          <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
            <Building2 size={13} className="shrink-0" />
            <span className="min-w-0 truncate">
              <T en={project.client.en} id={project.client.id} />
            </span>
          </p>
          <p className="mt-1 flex items-center gap-1.5 font-mono text-xs text-muted">
            <CalendarDays size={13} className="shrink-0" />
            <T en={project.period.en} id={project.period.id} /> ·{" "}
            <T en={project.duration.en} id={project.duration.id} />
          </p>

          {/* Two lines then ellipsis — the card is a scan target, the detail
              page carries the full summary. */}
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted">
            <T en={project.summary.en} id={project.summary.id} />
          </p>
        </div>
      </Link>
    </article>
  );
}
