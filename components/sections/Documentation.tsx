"use client";

import { useState } from "react";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { T } from "@/components/ui/T";
import { DriftWall } from "@/components/ui/DriftWall";
import { AccordionGallery } from "@/components/ui/AccordionGallery";
import { PhotoLightbox } from "@/components/ui/PhotoLightbox";
import { useCurrentLocale } from "@/components/providers/LocaleProvider";
import { getDocumentationHighlights, getDocumentationPhotos } from "@/lib/documentation";
import { pick } from "@/lib/i18n";

const photos = getDocumentationPhotos();
const highlights = getDocumentationHighlights();
// The lightbox steps through the whole collection whichever gallery opened it,
// so a highlight opens at its place in the full list.
const highlightIndex = highlights.map((photo) => photos.indexOf(photo));
// The page colour (--background) as a literal: the drift wall takes it as a prop.
const PAGE = "#f8f9fa";

/**
 * Photos from the training rooms and client sites, on their own rather than
 * tucked under each role in Experience. Two ways in: a drifting wall that
 * shows everything at once, and below it an accordion of one lead photo per
 * role for the events worth stopping on. Both open the same lightbox.
 */
export function Documentation() {
  const [open, setOpen] = useState<number | null>(null);
  const locale = useCurrentLocale();

  if (photos.length === 0) return null;

  return (
    // The page's own light ground and ambient wash, like every other section.
    // No top padding: the full-bleed wall starts where the section does, and
    // its edges dissolve into that ground rather than meeting it at a line.
    <Section id="documentation" index={4} className="documentation-section pt-0! md:pt-0!">
      <div className="documentation-stage">
        <DriftWall
          items={photos.map((photo) => ({ src: photo.src, alt: pick(photo.alt, locale) }))}
          onSelect={setOpen}
          // Enough columns to still reach the edges of a wide screen once
          // the wall is tilted away from the viewer.
          columns={8}
          tileWidth={230}
          tileHeight={156}
          gap={18}
          radius={14}
          speed={34}
          // Photos near full strength with only a whisper of the page's white
          // over them at rest, so faces and rooms read without hovering.
          dim={0.96}
          fade={0.55}
          overlayColor={PAGE}
          label={pick({ en: "Wall of documentation photos", id: "Dinding foto dokumentasi" }, locale)}
        />
        <div className="documentation-stage__shade" aria-hidden="true" />
        <div className="documentation-stage__heading">
          <h2>
            <T en="Documentation" id="Dokumentasi" />
          </h2>
          <p className="documentation-lead">
            <T
              en="Classrooms, workshops and client sessions across Indonesia. Hover a column to hold it still, and click any photo to see it full size."
              id="Ruang kelas, workshop, dan sesi bersama klien di berbagai daerah di Indonesia. Arahkan kursor ke satu kolom untuk menahannya, lalu klik foto mana pun untuk melihatnya penuh."
            />
          </p>
        </div>
      </div>

      <div className="mt-16 md:mt-24">
        <Reveal className="mb-8 md:mb-10">
          <h3 className="text-balance text-2xl tracking-[-0.028em] md:text-[2rem] md:leading-[1.15]">
            <T en="Top events" id="Acara unggulan" />
          </h3>
        </Reveal>

        <AccordionGallery
          items={highlights.map((photo) => ({
            src: photo.src,
            alt: pick(photo.alt, locale),
            label: pick(photo.caption ?? photo.alt, locale),
            sublabel: pick(photo.role, locale),
          }))}
          onOpen={(i) => setOpen(highlightIndex[i])}
          height={480}
          label={pick({ en: "Top event highlights", id: "Sorotan acara unggulan" }, locale)}
        />
      </div>

      <PhotoLightbox
        photos={photos}
        index={open}
        onChange={setOpen}
        label={{ en: "Documentation", id: "Dokumentasi" }}
        context={(photo) => photo.role}
      />
    </Section>
  );
}
