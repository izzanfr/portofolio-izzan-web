"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { Modal } from "./Modal";
import { T } from "./T";
import { useCurrentLocale } from "@/components/providers/LocaleProvider";
import { pick, type BiText } from "@/lib/i18n";
import type { BiPhoto } from "@/lib/experience";
import { cn } from "@/lib/utils";

export type ExperiencePhoto = BiPhoto;

export function ExperienceGallery({
  photos,
  roleTitle,
  className,
}: {
  photos: BiPhoto[];
  roleTitle: BiText;
  /** Replaces the default padding. The accordion needs the deep left indent
   *  that lines the grid up under the role title; the strip layout does not. */
  className?: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const locale = useCurrentLocale();

  const close = useCallback(() => setOpenIndex(null), []);
  const step = useCallback(
    (delta: number) =>
      setOpenIndex((current) =>
        current === null ? null : (current + delta + photos.length) % photos.length,
      ),
    [photos.length],
  );

  // Nothing uploaded for this role yet — render nothing rather than an empty frame
  if (photos.length === 0) return null;

  const active = openIndex === null ? null : photos[openIndex];

  return (
    <div className={cn(className ?? "px-5 pb-5 pl-5 md:pl-[4.25rem]")}>
      <p className="mb-3 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
        <ImageIcon size={12} />
        <T
          en={`Documentation · ${photos.length} photo${photos.length > 1 ? "s" : ""}`}
          id={`Dokumentasi · ${photos.length} foto`}
        />
      </p>

      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {photos.map((photo, index) => (
          <li key={photo.src + index}>
            <motion.button
              type="button"
              onClick={() => setOpenIndex(index)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              aria-label={`${pick({ en: "Open photo", id: "Buka foto" }, locale)} ${index + 1}: ${pick(photo.alt, locale)}`}
              className="group relative block aspect-[4/3] w-full overflow-hidden rounded-lg border border-border bg-surface-2"
            >
              <Image
                src={photo.src}
                alt={pick(photo.alt, locale)}
                fill
                sizes="(max-width: 640px) 30vw, 160px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-navy/0 transition-colors duration-300 group-hover:bg-navy/15" />
            </motion.button>
          </li>
        ))}
      </ul>

      <Modal
        open={active !== null}
        onClose={close}
        label={`${pick(roleTitle, locale)} ${pick({ en: "photo viewer", id: "penampil foto" }, locale)}`}
        className="max-w-5xl"
      >
        {active && (
          <div>
            <div className="relative bg-navy">
              {/* Intrinsic sizing keeps portrait and landscape shots both fully visible */}
              <Image
                src={active.src}
                alt={pick(active.alt, locale)}
                width={1600}
                height={1200}
                sizes="90vw"
                className="max-h-[72vh] w-full object-contain"
              />

              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => step(-1)}
                    aria-label={pick({ en: "Previous photo", id: "Foto sebelumnya" }, locale)}
                    className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-navy/70 text-white backdrop-blur transition-colors hover:border-accent hover:text-accent"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => step(1)}
                    aria-label={pick({ en: "Next photo", id: "Foto berikutnya" }, locale)}
                    className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-navy/70 text-white backdrop-blur transition-colors hover:border-accent hover:text-accent"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-baseline justify-between gap-3 p-5">
              <div>
                <p className="text-sm font-medium">
                  {pick(active.caption ?? active.alt, locale)}
                </p>
                <p className="mt-1 text-xs text-muted">{pick(roleTitle, locale)}</p>
              </div>
              <p className="font-mono text-xs text-muted">
                {(openIndex ?? 0) + 1} / {photos.length}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
