"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ImageIcon } from "lucide-react";
import { useState } from "react";
import { PhotoLightbox } from "./PhotoLightbox";
import { Scramble } from "./Scramble";
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

  // Nothing uploaded for this role yet — render nothing rather than an empty frame
  if (photos.length === 0) return null;

  return (
    <div className={cn(className ?? "px-5 pb-5 pl-5 md:pl-[4.25rem]")}>
      <p className="mb-3 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
        <ImageIcon size={12} />
        <Scramble
          en={`Documentation · ${photos.length} photo${photos.length > 1 ? "s" : ""}`}
          id={`Dokumentasi · ${photos.length} foto`}
        />
      </p>

      {/* `data-lenis-prevent` because inside the Experience stage this grid is
          re-laid-out as a single scrollable filmstrip (see `.exp-stop ul.grid`
          in globals.css); without it a sideways flick over the thumbnails is
          taken over as page scroll and travels the timeline instead. */}
      <ul data-lenis-prevent className="grid grid-cols-3 gap-2 sm:grid-cols-4">
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

      <PhotoLightbox photos={photos} index={openIndex} onChange={setOpenIndex} label={roleTitle} />
    </div>
  );
}
