"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Building2, CalendarDays } from "lucide-react";
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
    <motion.article
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={cn("group h-full", className)}
    >
      <Link
        href={`/projects/${project.slug}`}
        className="flex h-full flex-col overflow-hidden rounded-card border border-border bg-surface/60 transition-colors duration-300 hover:border-accent/55"
      >
        {/* Accent rail that fills in on hover */}
        <span className="h-1 w-full bg-border">
          <span className="block h-full w-full origin-left scale-x-0 bg-accent transition-transform duration-500 group-hover:scale-x-100" />
        </span>

        <div className="flex flex-1 flex-col p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <span className="rounded-full bg-navy/8 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-accent-strong dark:bg-accent/12 dark:text-accent">
              {project.role}
            </span>
            <ArrowUpRight
              size={17}
              className="shrink-0 text-muted transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent-strong dark:group-hover:text-accent"
            />
          </div>

          <h3 className="text-lg font-semibold leading-snug tracking-tight text-balance">
            {project.title}
          </h3>

          <p className="mt-2.5 flex items-center gap-1.5 text-sm text-muted">
            <Building2 size={13} className="shrink-0" />
            {project.client}
          </p>
          <p className="mt-1 flex items-center gap-1.5 font-mono text-xs text-muted">
            <CalendarDays size={13} className="shrink-0" />
            {project.period} · {project.duration}
          </p>

          <p className="mt-4 flex-1 text-sm leading-relaxed text-muted">{project.summary}</p>

          {project.metrics.length > 0 && (
            <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-border pt-4">
              {project.metrics.slice(0, 3).map((metric) => (
                <div key={metric.label}>
                  <dt className="font-mono text-sm font-semibold text-accent-strong dark:text-accent">
                    {metric.value}
                  </dt>
                  <dd className="mt-0.5 text-[11px] leading-tight text-muted">{metric.label}</dd>
                </div>
              ))}
            </dl>
          )}

          <ul className="mt-5 flex flex-wrap gap-1.5">
            {project.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-md border border-border px-2 py-1 text-[11px] text-muted"
              >
                {tag}
              </li>
            ))}
          </ul>
        </div>
      </Link>
    </motion.article>
  );
}
