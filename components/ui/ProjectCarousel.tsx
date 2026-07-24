"use client";

import useEmblaCarousel from "embla-carousel-react";
import type { EmblaCarouselType } from "embla-carousel";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCallback, useMemo, useSyncExternalStore } from "react";
import { ProjectCard } from "./ProjectCard";
import type { ProjectMeta } from "@/lib/projects";
import { cn } from "@/lib/utils";

/**
 * Embla is an external store: subscribe to its events and read scalar values on
 * demand, rather than mirroring them into state inside an effect.
 */
function useEmblaValue<T>(
  emblaApi: EmblaCarouselType | undefined,
  read: (api: EmblaCarouselType) => T,
  fallback: T,
) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!emblaApi) return () => {};
      emblaApi.on("select", onChange).on("reInit", onChange);
      return () => {
        emblaApi.off("select", onChange).off("reInit", onChange);
      };
    },
    [emblaApi],
  );

  const getSnapshot = useCallback(
    () => (emblaApi ? read(emblaApi) : fallback),
    [emblaApi, read, fallback],
  );

  const getServerSnapshot = useCallback(() => fallback, [fallback]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function ProjectCarousel({ projects }: { projects: ProjectMeta[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: false,
    containScroll: "trimSnaps",
  });

  const readSelected = useCallback((api: EmblaCarouselType) => api.selectedScrollSnap(), []);
  const readSnapCount = useCallback((api: EmblaCarouselType) => api.scrollSnapList().length, []);
  const readCanPrev = useCallback((api: EmblaCarouselType) => api.canScrollPrev(), []);
  const readCanNext = useCallback((api: EmblaCarouselType) => api.canScrollNext(), []);

  const selected = useEmblaValue(emblaApi, readSelected, 0);
  const snapCount = useEmblaValue(emblaApi, readSnapCount, 0);
  const canPrev = useEmblaValue(emblaApi, readCanPrev, false);
  const canNext = useEmblaValue(emblaApi, readCanNext, false);

  const snaps = useMemo(() => Array.from({ length: snapCount }), [snapCount]);

  return (
    <div>
      {/* Embla needs overflow hidden to hide the off-screen slides, which also
          clipped the top of a card while it was lifted on hover. The padding
          gives the lift somewhere to go inside the clip; the matching negative
          margin keeps the carousel sitting where it did in the layout. */}
      <div className="-my-3 overflow-hidden py-3" ref={emblaRef}>
        {/* Negative margin + per-slide padding is Embla's gap idiom */}
        <div className="-ml-5 flex touch-pan-y">
          {projects.map((project) => (
            <div
              key={project.slug}
              className="min-w-0 shrink-0 grow-0 basis-[85%] pl-5 sm:basis-[60%] lg:basis-1/3"
            >
              <ProjectCard project={project} />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between gap-6">
        <div className="flex items-center gap-1.5" role="tablist" aria-label="Project slides">
          {snaps.map((_, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              aria-selected={index === selected}
              aria-label={`Go to slide ${index + 1}`}
              onClick={() => emblaApi?.scrollTo(index)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                // accent-600, not the brand 500: this dot is the only thing
                // saying which slide you are on, so it has to clear 3:1 against
                // the light page — 500 manages 2.8:1.
                index === selected
                  ? "w-7 bg-accent-600 dark:bg-accent"
                  : "w-1.5 bg-border hover:bg-muted",
              )}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => emblaApi?.scrollPrev()}
            disabled={!canPrev}
            aria-label="Previous projects"
            className="grid h-11 w-11 place-items-center rounded-full border border-border bg-surface/60 transition-all duration-200 hover:border-accent hover:text-accent-strong disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-border disabled:hover:text-foreground dark:hover:text-accent"
          >
            <ArrowLeft size={17} />
          </button>
          <button
            type="button"
            onClick={() => emblaApi?.scrollNext()}
            disabled={!canNext}
            aria-label="Next projects"
            className="grid h-11 w-11 place-items-center rounded-full border border-border bg-surface/60 transition-all duration-200 hover:border-accent hover:text-accent-strong disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-border disabled:hover:text-foreground dark:hover:text-accent"
          >
            <ArrowRight size={17} />
          </button>
        </div>
      </div>

      <p className="mt-4 font-mono text-[11px] text-muted sm:hidden">Swipe to browse →</p>
    </div>
  );
}
