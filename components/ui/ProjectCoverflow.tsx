"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useState } from "react";
import { T } from "./T";
import { Scramble } from "./Scramble";
import { GeneratedCover } from "./ProjectCoverArt";
import { useCurrentLocale } from "@/components/providers/LocaleProvider";
import { pick } from "@/lib/i18n";
import type { ProjectMeta } from "@/lib/projects";
import { cn } from "@/lib/utils";
import { EASE } from "@/lib/motion";

/**
 * The homepage project browser: a coverflow of the case-study document covers,
 * deliberately the same motion as the Documentation stack inside a project so
 * the two read as one idea — the cover you turn to here is the cover you land
 * on there.
 *
 * The image carries the browsing; only the active project's title and client
 * sit under the stage. Everything else (summary, metrics, tags) belongs to the
 * detail page, which is one click away on the centre cover.
 *
 * Arrows flank the stage rather than sitting on top of it, so they never cover
 * the artwork they are there to move.
 */

// Shared with ProjectDocumentation: side covers turn away in 3D and fade, and
// anything past a neighbour parks off to its side at zero opacity so it fades
// in from there instead of sliding the width of the stage.
function pose(distance: number) {
  if (distance === 0) return { x: "0%", scale: 1, rotateY: 0, opacity: 1, z: 30, shown: true };
  if (distance === 1) return { x: "50%", scale: 0.8, rotateY: -30, opacity: 0.55, z: 20, shown: true };
  if (distance === -1) return { x: "-50%", scale: 0.8, rotateY: 30, opacity: 0.55, z: 20, shown: true };
  const sign = distance > 0 ? 1 : -1;
  return { x: `${sign * 74}%`, scale: 0.68, rotateY: -sign * 34, opacity: 0, z: 10, shown: false };
}

const FRAME =
  "relative block aspect-[5/7] w-[74%] overflow-hidden rounded-xl bg-surface-2 sm:w-[46%] lg:w-[40%]";

function ArrowButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-surface/70 text-foreground transition-colors duration-200 hover:border-accent hover:text-accent-strong dark:hover:text-accent sm:h-12 sm:w-12"
    >
      {children}
    </button>
  );
}

export function ProjectCoverflow({ projects }: { projects: ProjectMeta[] }) {
  const [active, setActive] = useState(0);
  const locale = useCurrentLocale();
  const count = projects.length;

  const go = useCallback(
    (delta: number) => setActive((current) => (current + delta + count) % count),
    [count],
  );

  if (count === 0) return null;

  // Shortest signed distance, so the flow wraps at both ends.
  const signedDistance = (index: number) => {
    let d = index - active;
    if (d > count / 2) d -= count;
    if (d < -count / 2) d += count;
    return d;
  };

  const current = projects[active];

  return (
    <div>
      <div className="flex items-center justify-center gap-2 sm:gap-5">
        <ArrowButton
          onClick={() => go(-1)}
          label={pick({ en: "Previous project", id: "Proyek sebelumnya" }, locale)}
        >
          <ChevronLeft size={18} />
        </ArrowButton>

        {/* Clip and perspective are split across two elements: together on one,
            Chrome flattens the 3D turn. */}
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="relative h-[330px] [perspective:1600px] sm:h-[520px] lg:h-[600px]">
            {projects.map((project, index) => {
              const distance = signedDistance(index);
              const p = pose(distance);
              const isCenter = distance === 0;
              const title = pick(project.title, locale);

              const art = project.cover ? (
                // `motion-art` carries the hover zoom; the scale lives on the
                // image rather than the frame so the rounded corners and the
                // shadow stay put while the artwork alone grows into them.
                <Image
                  src={project.cover.src}
                  alt=""
                  aria-hidden
                  fill
                  sizes="(max-width: 640px) 74vw, (max-width: 1024px) 46vw, 400px"
                  className="motion-art object-contain"
                />
              ) : (
                // Lettered like a real document cover: a bare gradient in a
                // portrait frame this large would read as a missing scan.
                <GeneratedCover slug={project.slug} className="motion-art">
                  <div className="absolute inset-0 flex flex-col justify-end gap-2 p-5 sm:p-7">
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/70 sm:text-[10px]">
                      <T en={project.role.en} id={project.role.id} />
                    </span>
                    <span className="font-display text-lg leading-tight text-white sm:text-2xl">
                      <T en={project.title.en} id={project.title.id} />
                    </span>
                    <span className="text-xs text-white/80 sm:text-sm">
                      <T en={project.client.en} id={project.client.id} />
                    </span>
                  </div>
                </GeneratedCover>
              );

              return (
                <motion.div
                  key={project.slug}
                  aria-hidden={!isCenter}
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ zIndex: p.z, pointerEvents: p.shown ? "auto" : "none" }}
                  initial={false}
                  animate={{ x: p.x, scale: p.scale, rotateY: p.rotateY, opacity: p.opacity }}
                  transition={{ duration: 0.5, ease: EASE }}
                >
                  {isCenter ? (
                    <Link
                      href={`/projects/${project.slug}`}
                      transitionTypes={["nav-forward"]}
                      aria-label={`${title}, ${pick({ en: "open project", id: "buka proyek" }, locale)}`}
                      className={cn(FRAME, "group cursor-pointer")}
                      style={{ boxShadow: "var(--shadow-card)" }}
                    >
                      {art}
                      {/* Only on the centre cover, and only on hover: the tint
                          says the artwork itself is the way in. */}
                      <span className="absolute inset-0 bg-navy/0 transition-colors duration-300 group-hover:bg-navy/25" />
                      <span className="absolute inset-x-0 bottom-0 flex translate-y-2 items-center justify-center gap-1.5 p-4 text-xs font-medium text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                        <T en="View project" id="Lihat proyek" />
                        <ArrowUpRight size={14} />
                      </span>
                    </Link>
                  ) : (
                    <button
                      type="button"
                      tabIndex={p.shown ? 0 : -1}
                      onClick={() => setActive(index)}
                      aria-label={`${pick({ en: "Show", id: "Tampilkan" }, locale)} ${title}`}
                      className={FRAME}
                      style={{ boxShadow: "var(--shadow-card)" }}
                    >
                      {art}
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        <ArrowButton
          onClick={() => go(1)}
          label={pick({ en: "Next project", id: "Proyek berikutnya" }, locale)}
        >
          <ChevronRight size={18} />
        </ArrowButton>
      </div>

      {/* The only text at this level: what you are looking at, and whose it is.
          Keyed on the slug so it crossfades as the stage turns. */}
      <div className="mt-7 min-h-[104px] text-center sm:min-h-[112px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.slug}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: EASE }}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent-strong dark:text-accent">
              <Scramble en={current.role.en} id={current.role.id} />
            </p>
            <h3 className="mx-auto mt-2 max-w-xl text-balance text-lg tracking-[-0.02em] sm:text-xl">
              <Link
                href={`/projects/${current.slug}`}
                transitionTypes={["nav-forward"]}
                className="transition-colors hover:text-accent-strong dark:hover:text-accent"
              >
                <T en={current.title.en} id={current.title.id} />
              </Link>
            </h3>
            <p className="mt-1.5 text-sm text-muted">
              <T en={current.client.en} id={current.client.id} />
              <span className="mx-1.5 opacity-50">·</span>
              <span className="font-mono text-xs">
                <Scramble en={current.period.en} id={current.period.id} />
              </span>
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-6 flex justify-center gap-2">
        {projects.map((project, index) => (
          <button
            key={project.slug}
            type="button"
            onClick={() => setActive(index)}
            aria-label={`${pick({ en: "Go to", id: "Ke" }, locale)} ${pick(project.title, locale)}`}
            aria-current={index === active}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              index === active
                ? "w-6 bg-accent-600 dark:bg-accent"
                : "w-1.5 bg-border hover:bg-muted",
            )}
          />
        ))}
      </div>
    </div>
  );
}
